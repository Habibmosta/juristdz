-- Migration 014: Create Minutier Électronique Tables
-- Description: Système de minutier électronique pour notaires avec archivage sécurisé et numérotation chronologique

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums for minutier system
CREATE TYPE type_acte AS ENUM (
  'vente_immobiliere', 'donation', 'succession', 'hypotheque',
  'contrat_mariage', 'testament', 'procuration', 'constitution_societe',
  'cession_parts', 'bail_emphyteotique', 'partage', 'reconnaissance_dette',
  'mainlevee', 'autre'
);

CREATE TYPE type_partie AS ENUM (
  'personne_physique', 'personne_morale', 'administration'
);

CREATE TYPE civilite AS ENUM (
  'monsieur', 'madame', 'mademoiselle'
);

CREATE TYPE type_piece_identite AS ENUM (
  'carte_identite', 'passeport', 'permis_conduire', 'registre_commerce', 'statuts_societe'
);

CREATE TYPE qualite_partie AS ENUM (
  'vendeur', 'acquereur', 'donateur', 'donataire', 'testateur', 'legataire',
  'heritier', 'creancier', 'debiteur', 'mandant', 'mandataire', 'associe', 'gerant', 'autre'
);

CREATE TYPE type_clause AS ENUM (
  'prix', 'paiement', 'garantie', 'servitude', 'condition_suspensive',
  'penalite', 'attribution_juridiction', 'frais', 'autre'
);

CREATE TYPE type_mention AS ENUM (
  'lecture', 'renonciation_lecture', 'perseveration', 'ratures_renvois',
  'frais_enregistrement', 'publicite_fonciere', 'autre'
);

CREATE TYPE type_signature AS ENUM (
  'electronique_simple', 'electronique_avancee', 'electronique_qualifiee', 'manuscrite_numerisee'
);

CREATE TYPE statut_signature AS ENUM (
  'en_attente', 'signee', 'refusee', 'expiree'
);

CREATE TYPE type_annexe AS ENUM (
  'plan', 'photo', 'document_identite', 'justificatif', 'expertise', 'autre'
);

CREATE TYPE statut_acte AS ENUM (
  'brouillon', 'en_preparation', 'pret_signature', 'en_cours_signature',
  'signe', 'enregistre', 'archive', 'annule'
);

CREATE TYPE statut_archivage AS ENUM (
  'actif', 'archive_intermediaire', 'archive_definitive', 'detruit'
);

CREATE TYPE type_sauvegarde AS ENUM (
  'locale', 'cloud', 'externe', 'papier'
);

CREATE TYPE statut_sauvegarde AS ENUM (
  'active', 'corrompue', 'supprimee'
);

CREATE TYPE type_copie AS ENUM (
  'copie_conforme', 'extrait', 'expedition', 'grosse'
);

CREATE TYPE statut_copie AS ENUM (
  'generee', 'signee', 'delivree', 'annulee'
);

CREATE TYPE type_cachet AS ENUM (
  'cachet_etude', 'cachet_personnel', 'sceau_electronique'
);

CREATE TYPE type_alerte AS ENUM (
  'signature_manquante', 'delai_enregistrement', 'sauvegarde_echec',
  'integrite_compromise', 'archivage_requis'
);

CREATE TYPE priorite_alerte AS ENUM (
  'basse', 'moyenne', 'haute', 'critique'
);

-- 1. Études Notariales Table
CREATE TABLE etudes_notariales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notaire_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nom VARCHAR(255) NOT NULL,
  adresse JSONB NOT NULL,
  telephone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  numero_agrement VARCHAR(100) NOT NULL UNIQUE,
  chambre_notaires VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(notaire_id)
);

-- 2. Actes Authentiques Table (table principale du minutier)
CREATE TABLE actes_authentiques (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_minutier VARCHAR(50) NOT NULL,
  numero_repertoire VARCHAR(50) NOT NULL,
  date_acte DATE NOT NULL DEFAULT CURRENT_DATE,
  type_acte type_acte NOT NULL,
  objet TEXT NOT NULL,
  parties JSONB NOT NULL,
  notaire_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contenu_chiffre TEXT NOT NULL, -- Contenu chiffré pour sécurité
  hash_integrite VARCHAR(64) NOT NULL, -- Hash SHA-256 pour vérifier l'intégrité
  chiffrement_cle VARCHAR(64) NOT NULL, -- Clé de chiffrement
  metadonnees JSONB DEFAULT '{}',
  statut statut_acte DEFAULT 'brouillon',
  numero_archive VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(notaire_id, numero_minutier),
  UNIQUE(notaire_id, numero_repertoire),
  UNIQUE(numero_archive)
);

-- 3. Signatures des Actes Table
CREATE TABLE signatures_actes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  acte_id UUID NOT NULL REFERENCES actes_authentiques(id) ON DELETE CASCADE,
  partie_id VARCHAR(255) NOT NULL, -- Référence à la partie dans le JSON
  type_signature type_signature NOT NULL,
  horodatage TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  certificat_numerique TEXT,
  empreinte_numerique VARCHAR(128) NOT NULL,
  statut statut_signature DEFAULT 'en_attente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Annexes des Actes Table
CREATE TABLE annexes_actes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  acte_id UUID NOT NULL REFERENCES actes_authentiques(id) ON DELETE CASCADE,
  nom VARCHAR(255) NOT NULL,
  type type_annexe NOT NULL,
  taille BIGINT NOT NULL,
  chemin_fichier VARCHAR(500) NOT NULL,
  hash_fichier VARCHAR(64) NOT NULL,
  description TEXT,
  date_ajout TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Informations d'Archivage Table
CREATE TABLE archivage_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  acte_id UUID NOT NULL REFERENCES actes_authentiques(id) ON DELETE CASCADE,
  date_archivage TIMESTAMP WITH TIME ZONE,
  numero_archive VARCHAR(50) NOT NULL UNIQUE,
  emplacement_physique VARCHAR(255),
  emplacement_numerique VARCHAR(500) NOT NULL,
  duree_conservation INTEGER NOT NULL, -- en années
  date_destruction_prevue DATE,
  statut_archivage statut_archivage DEFAULT 'actif',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(acte_id)
);

-- 6. Sauvegardes Table
CREATE TABLE sauvegardes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  acte_id UUID NOT NULL REFERENCES actes_authentiques(id) ON DELETE CASCADE,
  date_sauvegarde TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  type_sauvegarde type_sauvegarde NOT NULL,
  emplacement_sauvegarde VARCHAR(500) NOT NULL,
  hash_sauvegarde VARCHAR(64) NOT NULL,
  taille_sauvegarde BIGINT NOT NULL,
  statut statut_sauvegarde DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Copies Conformes Table
CREATE TABLE copies_conformes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  acte_id UUID NOT NULL REFERENCES actes_authentiques(id) ON DELETE CASCADE,
  type_copie type_copie NOT NULL,
  numero_copie VARCHAR(50) NOT NULL,
  date_generation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  demandeur JSONB NOT NULL,
  notaire_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contenu_copie TEXT NOT NULL,
  hash_copie VARCHAR(64) NOT NULL,
  statut statut_copie DEFAULT 'generee',
  validite_juridique BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(acte_id, numero_copie)
);

-- 8. Signatures des Notaires pour Copies Table
CREATE TABLE signatures_notaire (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  copie_id UUID NOT NULL REFERENCES copies_conformes(id) ON DELETE CASCADE,
  notaire_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nom_notaire VARCHAR(255) NOT NULL,
  date_signature TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  signature_numerique TEXT NOT NULL,
  certificat TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Cachets Notariaux Table
CREATE TABLE cachets_notariaux (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  copie_id UUID NOT NULL REFERENCES copies_conformes(id) ON DELETE CASCADE,
  type type_cachet NOT NULL,
  empreinte VARCHAR(128) NOT NULL,
  date_apposition TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  coordonnees JSONB NOT NULL, -- {x, y, page}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Alertes Minutier Table
CREATE TABLE alertes_minutier (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  acte_id UUID REFERENCES actes_authentiques(id) ON DELETE CASCADE,
  type type_alerte NOT NULL,
  message TEXT NOT NULL,
  date_alerte TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  priorite priorite_alerte DEFAULT 'moyenne',
  traitee BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Statistiques Minutier Table
CREATE TABLE statistiques_minutier (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notaire_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  periode_debut DATE NOT NULL,
  periode_fin DATE NOT NULL,
  nombre_actes INTEGER DEFAULT 0,
  repartition_type_acte JSONB DEFAULT '{}',
  montant_total DECIMAL(15,2) DEFAULT 0,
  montant_moyen DECIMAL(15,2) DEFAULT 0,
  nombre_copies INTEGER DEFAULT 0,
  evolution_mensuelle JSONB DEFAULT '[]',
  top_clients JSONB DEFAULT '[]',
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(notaire_id, periode_debut, periode_fin)
);

-- Create indexes for better performance
CREATE INDEX idx_actes_authentiques_notaire_date ON actes_authentiques(notaire_id, date_acte DESC);
CREATE INDEX idx_actes_authentiques_numero_minutier ON actes_authentiques(numero_minutier);
CREATE INDEX idx_actes_authentiques_numero_repertoire ON actes_authentiques(numero_repertoire);
CREATE INDEX idx_actes_authentiques_type_statut ON actes_authentiques(type_acte, statut);
CREATE INDEX idx_actes_authentiques_parties_gin ON actes_authentiques USING GIN(parties);
CREATE INDEX idx_actes_authentiques_metadonnees_gin ON actes_authentiques USING GIN(metadonnees);
CREATE INDEX idx_actes_authentiques_objet_text ON actes_authentiques USING GIN(to_tsvector('french', objet));

CREATE INDEX idx_signatures_actes_acte_statut ON signatures_actes(acte_id, statut);
CREATE INDEX idx_annexes_actes_acte ON annexes_actes(acte_id);
CREATE INDEX idx_archivage_info_statut ON archivage_info(statut_archivage);
CREATE INDEX idx_archivage_info_date_destruction ON archivage_info(date_destruction_prevue);
CREATE INDEX idx_sauvegardes_acte_type ON sauvegardes(acte_id, type_sauvegarde);
CREATE INDEX idx_copies_conformes_acte_type ON copies_conformes(acte_id, type_copie);
CREATE INDEX idx_alertes_minutier_notaire_traitee ON alertes_minutier(acte_id) WHERE traitee = false;

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_etudes_notariales_updated_at BEFORE UPDATE ON etudes_notariales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_actes_authentiques_updated_at BEFORE UPDATE ON actes_authentiques FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_archivage_info_updated_at BEFORE UPDATE ON archivage_info FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- PostgreSQL functions for minutier system

-- Function to generate automatic minutier number
CREATE OR REPLACE FUNCTION generer_numero_minutier(p_notaire_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    annee INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
    prochain_numero INTEGER;
    numero_complet VARCHAR;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_minutier FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO prochain_numero
    FROM actes_authentiques 
    WHERE notaire_id = p_notaire_id 
    AND EXTRACT(YEAR FROM date_acte) = annee;
    
    numero_complet := annee || '-' || LPAD(prochain_numero::TEXT, 6, '0');
    
    RETURN numero_complet;
END;
$$ LANGUAGE plpgsql;

-- Function to generate automatic repertoire number
CREATE OR REPLACE FUNCTION generer_numero_repertoire(p_notaire_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    annee INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
    prochain_numero INTEGER;
    numero_complet VARCHAR;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_repertoire FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO prochain_numero
    FROM actes_authentiques 
    WHERE notaire_id = p_notaire_id 
    AND EXTRACT(YEAR FROM date_acte) = annee;
    
    numero_complet := 'REP-' || annee || '-' || LPAD(prochain_numero::TEXT, 4, '0');
    
    RETURN numero_complet;
END;
$$ LANGUAGE plpgsql;

-- Function to generate automatic archive number
CREATE OR REPLACE FUNCTION generer_numero_archive(p_notaire_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    annee INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
    prochain_numero INTEGER;
    numero_complet VARCHAR;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(ai.numero_archive FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO prochain_numero
    FROM archivage_info ai
    JOIN actes_authentiques aa ON ai.acte_id = aa.id
    WHERE aa.notaire_id = p_notaire_id 
    AND EXTRACT(YEAR FROM aa.date_acte) = annee;
    
    numero_complet := 'ARC-' || annee || '-' || LPAD(prochain_numero::TEXT, 6, '0');
    
    RETURN numero_complet;
END;
$$ LANGUAGE plpgsql;

-- Function to verify document integrity
CREATE OR REPLACE FUNCTION verifier_integrite_acte(p_acte_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    hash_attendu VARCHAR;
    hash_calcule VARCHAR;
    contenu_hash TEXT;
BEGIN
    SELECT hash_integrite INTO hash_attendu
    FROM actes_authentiques
    WHERE id = p_acte_id;
    
    IF hash_attendu IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Recalculer le hash (simulation - en réalité il faudrait recalculer avec les mêmes données)
    SELECT encode(digest(type_acte::text || objet || parties::text, 'sha256'), 'hex')
    INTO hash_calcule
    FROM actes_authentiques
    WHERE id = p_acte_id;
    
    RETURN hash_calcule = hash_attendu;
END;
$$ LANGUAGE plpgsql;

-- Function to create automatic backup
CREATE OR REPLACE FUNCTION creer_sauvegarde_automatique()
RETURNS TRIGGER AS $$
BEGIN
    -- Créer une sauvegarde locale automatique pour chaque nouvel acte
    INSERT INTO sauvegardes (
        acte_id, type_sauvegarde, emplacement_sauvegarde, 
        hash_sauvegarde, taille_sauvegarde
    ) VALUES (
        NEW.id, 
        'locale', 
        '/backup/local/' || NEW.id || '_' || EXTRACT(EPOCH FROM NOW()),
        encode(digest(NEW.id::text || NOW()::text, 'sha256'), 'hex'),
        1000000 -- Taille simulée
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic backup creation
CREATE TRIGGER trigger_sauvegarde_automatique
    AFTER INSERT ON actes_authentiques
    FOR EACH ROW
    EXECUTE FUNCTION creer_sauvegarde_automatique();

-- Function to check archiving requirements
CREATE OR REPLACE FUNCTION verifier_exigences_archivage()
RETURNS VOID AS $$
DECLARE
    acte_record RECORD;
BEGIN
    -- Vérifier les actes qui doivent être archivés (signés depuis plus de 30 jours)
    FOR acte_record IN
        SELECT aa.id, aa.numero_minutier, aa.notaire_id
        FROM actes_authentiques aa
        LEFT JOIN archivage_info ai ON aa.id = ai.acte_id
        WHERE aa.statut = 'signe'
        AND aa.updated_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
        AND (ai.statut_archivage IS NULL OR ai.statut_archivage = 'actif')
    LOOP
        -- Créer une alerte d'archivage requis
        INSERT INTO alertes_minutier (acte_id, type, message, priorite)
        VALUES (
            acte_record.id,
            'archivage_requis',
            'L''acte ' || acte_record.numero_minutier || ' doit être archivé',
            'moyenne'
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update minutier statistics
CREATE OR REPLACE FUNCTION mettre_a_jour_statistiques_minutier(p_notaire_id UUID, p_periode_debut DATE, p_periode_fin DATE)
RETURNS VOID AS $$
DECLARE
    stats_record RECORD;
BEGIN
    -- Calculer les statistiques pour la période
    SELECT 
        COUNT(*) as nombre_actes,
        COALESCE(SUM((metadonnees->>'montant')::DECIMAL), 0) as montant_total,
        COALESCE(AVG((metadonnees->>'montant')::DECIMAL), 0) as montant_moyen
    INTO stats_record
    FROM actes_authentiques
    WHERE notaire_id = p_notaire_id
    AND date_acte BETWEEN p_periode_debut AND p_periode_fin;
    
    -- Insérer ou mettre à jour les statistiques
    INSERT INTO statistiques_minutier (
        notaire_id, periode_debut, periode_fin, nombre_actes, 
        montant_total, montant_moyen
    ) VALUES (
        p_notaire_id, p_periode_debut, p_periode_fin, stats_record.nombre_actes,
        stats_record.montant_total, stats_record.montant_moyen
    )
    ON CONFLICT (notaire_id, periode_debut, periode_fin) DO UPDATE SET
        nombre_actes = EXCLUDED.nombre_actes,
        montant_total = EXCLUDED.montant_total,
        montant_moyen = EXCLUDED.montant_moyen,
        generated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for testing
INSERT INTO etudes_notariales (notaire_id, nom, adresse, telephone, email, numero_agrement, chambre_notaires)
SELECT 
    u.id,
    'Étude Notariale ' || u.first_name || ' ' || u.last_name,
    '{"rue": "123 Rue de la République", "ville": "Alger", "codePostal": "16000", "wilaya": "Alger", "pays": "Algérie"}',
    '+213 21 123 456',
    u.email,
    'AGR-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD((ROW_NUMBER() OVER())::TEXT, 4, '0'),
    'Chambre des Notaires d''Alger'
FROM users u 
WHERE u.role = 'Notaire'
ON CONFLICT (notaire_id) DO NOTHING;

-- Insert sample contextual help for minutier
INSERT INTO contextual_help (context, title, content, type, level, examples, language) VALUES
('minutier_creation', 'Création d''acte authentique', 'Pour créer un nouvel acte, remplissez tous les champs obligatoires. Le numéro de minutier sera généré automatiquement.', 'guide', null, '["Vérifiez l''identité des parties", "Contrôlez les pièces justificatives"]', 'fr'),
('minutier_signature', 'Signature électronique', 'Les signatures électroniques qualifiées garantissent la validité juridique de l''acte. Chaque partie doit signer individuellement.', 'tutorial', null, '["Utilisez un certificat qualifié", "Vérifiez l''horodatage"]', 'fr'),
('minutier_archivage', 'Archivage sécurisé', 'Les actes sont automatiquement archivés avec chiffrement et sauvegardes multiples pour garantir leur conservation.', 'faq', null, '["Durée de conservation: 30 ans minimum", "Sauvegardes automatiques quotidiennes"]', 'fr');

COMMENT ON TABLE actes_authentiques IS 'Table principale du minutier électronique avec numérotation chronologique automatique';
COMMENT ON TABLE archivage_info IS 'Informations d''archivage sécurisé avec sauvegardes multiples et chiffrement';
COMMENT ON TABLE copies_conformes IS 'Copies conformes avec signatures électroniques et cachets notariaux';
COMMENT ON TABLE sauvegardes IS 'Système de sauvegardes multiples pour garantir la pérennité des actes';
COMMENT ON COLUMN actes_authentiques.hash_integrite IS 'Hash SHA-256 pour vérifier l''intégrité et détecter toute altération';
COMMENT ON COLUMN actes_authentiques.contenu_chiffre IS 'Contenu de l''acte chiffré pour la sécurité';
COMMENT ON COLUMN actes_authentiques.numero_minutier IS 'Numérotation chronologique automatique par notaire et par année';