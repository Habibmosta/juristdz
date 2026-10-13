-- Migration: Create RAG (Retrieval-Augmented Generation) tables
-- Description: Vector store for Algerian legal corpus using pgvector
-- Dependencies: 003_create_legal_database.sql, 006_create_ai_service_tables.sql

-- Enable pgvector extension (idempotent)
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents indexés dans la base vectorielle
-- Chaque chunk = un fragment d'un document source (article, jurisprudence, etc.)
CREATE TABLE IF NOT EXISTS rag_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Identification de la source
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN (
        'jurisprudence_case', 'legal_article', 'jora_publication',
        'legal_reference', 'document_template', 'compliance_rule'
    )),
    source_id UUID NOT NULL,
    -- Métadonnées
    title TEXT NOT NULL,
    domain VARCHAR(50) NOT NULL,          -- civil, penal, commercial, etc.
    jurisdiction VARCHAR(100) DEFAULT 'Algeria',
    language VARCHAR(5) DEFAULT 'fr' CHECK (language IN ('fr', 'ar')),
    reference_code VARCHAR(255),          -- ex: "Article 124 du Code civil"
    keywords TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    -- Chunk
    chunk_index INTEGER DEFAULT 0,        -- position dans le document source
    chunk_text TEXT NOT NULL,             -- texte du chunk
    chunk_tokens INTEGER,                 -- tokens approximatifs
    -- Embedding (Gemini text-embedding-004 = 768 dimensions)
    embedding vector(768),
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Un même chunk est unique par source+index
    UNIQUE (source_type, source_id, chunk_index)
);

-- Index IVFFlat pour la recherche par similarité cosinus
-- lists=100 convient pour ~10k chunks; ajuster à sqrt(total_chunks)
CREATE INDEX IF NOT EXISTS idx_rag_documents_embedding
    ON rag_documents
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Index pour filtres fréquents
CREATE INDEX IF NOT EXISTS idx_rag_documents_source_type ON rag_documents(source_type);
CREATE INDEX IF NOT EXISTS idx_rag_documents_domain ON rag_documents(domain);
CREATE INDEX IF NOT EXISTS idx_rag_documents_jurisdiction ON rag_documents(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_rag_documents_language ON rag_documents(language);
CREATE INDEX IF NOT EXISTS idx_rag_documents_keywords ON rag_documents USING GIN(keywords);

-- Index full-text hybride (BM25) en complément du vectoriel
CREATE INDEX IF NOT EXISTS idx_rag_documents_fts
    ON rag_documents
    USING GIN(to_tsvector('french', chunk_text || ' ' || COALESCE(title, '') || ' ' || COALESCE(reference_code, '')));

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_rag_documents_updated_at ON rag_documents;
CREATE TRIGGER update_rag_documents_updated_at
    BEFORE UPDATE ON rag_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table de log pour les requêtes RAG (observabilité, coûts, latence)
CREATE TABLE IF NOT EXISTS rag_query_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    query_text TEXT NOT NULL,
    query_embedding_time_ms INTEGER,
    retrieval_time_ms INTEGER,
    total_results INTEGER,
    top_score REAL,
    avg_score REAL,
    filters JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rag_query_logs_user_id ON rag_query_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_rag_query_logs_created_at ON rag_query_logs(created_at);
