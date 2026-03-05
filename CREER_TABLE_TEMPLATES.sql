-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE DOCUMENT_TEMPLATES - Système de templates de documents
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Créer la table document_templates
CREATE TABLE IF NOT EXISTS public.document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- NULL = template global, sinon template personnel
  
  -- Informations du template
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'contract', 'pleading', 'letter', 'procedure', 'other'
  profession TEXT NOT NULL, -- 'avocat', 'notaire', 'huissier', 'magistrat', 'juriste', 'all'
  case_type TEXT, -- Type de dossier concerné (optionnel)
  
  -- Contenu
  content TEXT NOT NULL, -- Contenu du template avec variables {{variable}}
  variables JSONB DEFAULT '[]'::jsonb, -- Liste des variables disponibles
  
  -- Métadonnées
  is_public BOOLEAN DEFAULT false, -- Template partagé avec tous les utilisateurs
  is_official BOOLEAN DEFAULT false, -- Template officiel (créé par admin)
  language TEXT DEFAULT 'fr', -- 'fr' ou 'ar'
  
  -- Statistiques
  usage_count INTEGER DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- 2. Index pour performance
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON public.document_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_category ON public.document_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_profession ON public.document_templates(profession);
CREATE INDEX IF NOT EXISTS idx_templates_is_public ON public.document_templates(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_templates_language ON public.document_templates(language);

-- 3. Activer RLS
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

-- 4. Politiques RLS
CREATE POLICY "Users can view public templates"
  ON public.document_templates
  FOR SELECT
  USING (is_public = true OR user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can create their own templates"
  ON public.document_templates
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own templates"
  ON public.document_templates
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own templates"
  ON public.document_templates
  FOR DELETE
  USING (user_id = auth.uid());

-- 5. Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_templates_updated_at ON public.document_templates;
CREATE TRIGGER trigger_update_templates_updated_at
  BEFORE UPDATE ON public.document_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_templates_updated_at();

-- 6. Fonction pour générer un document depuis un template
CREATE OR REPLACE FUNCTION generate_document_from_template(
  p_template_id UUID,
  p_variables JSONB
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_content TEXT;
  v_key TEXT;
  v_value TEXT;
BEGIN
  -- Récupérer le contenu du template
  SELECT content INTO v_content
  FROM document_templates
  WHERE id = p_template_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found';
  END IF;
  
  -- Remplacer les variables
  FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_variables)
  LOOP
    v_content := REPLACE(v_content, '{{' || v_key || '}}', v_value);
  END LOOP;
  
  -- Incrémenter le compteur d'utilisation
  UPDATE document_templates
  SET usage_count = usage_count + 1
  WHERE id = p_template_id;
  
  RETURN v_content;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- TEMPLATES OFFICIELS - AVOCAT
-- ═══════════════════════════════════════════════════════════════════════════

-- Template: Lettre de mise en demeure
INSERT INTO public.document_templates (
  name, description, category, profession, content, variables, is_public, is_official, language
) VALUES (
  'Lettre de mise en demeure',
  'Lettre formelle de mise en demeure pour recouvrement de créances',
  'letter',
  'avocat',
  E'{{ville}}, le {{date}}

Maître {{nom_avocat}}
Avocat au Barreau de {{barreau}}
{{adresse_cabinet}}

LETTRE RECOMMANDÉE AVEC ACCUSÉ DE RÉCEPTION

À l''attention de :
{{nom_destinataire}}
{{adresse_destinataire}}

Objet : Mise en demeure de payer

Madame, Monsieur,

Je soussigné(e), Maître {{nom_avocat}}, Avocat au Barreau de {{barreau}}, agissant pour le compte de mon client {{nom_client}}, ai l''honneur de vous mettre en demeure de bien vouloir régler la somme de {{montant}} DZD ({{montant_lettres}} dinars algériens) au titre de {{objet_creance}}.

Cette somme est due depuis le {{date_echeance}} et reste impayée à ce jour malgré nos relances amiables.

En conséquence, je vous mets en demeure de procéder au règlement de cette somme dans un délai de {{delai}} jours à compter de la réception de la présente, faute de quoi nous serons contraints d''engager une procédure judiciaire à votre encontre, sans autre avis ni mise en demeure.

Dans cette hypothèse, vous seriez redevable, outre le principal, des intérêts de retard, des frais de justice et des honoraires d''avocat.

Je vous prie d''agréer, Madame, Monsieur, l''expression de mes salutations distinguées.

Maître {{nom_avocat}}
Avocat',
  '[
    {"name": "ville", "label": "Ville", "type": "text", "required": true},
    {"name": "date", "label": "Date", "type": "date", "required": true},
    {"name": "nom_avocat", "label": "Nom de l''avocat", "type": "text", "required": true},
    {"name": "barreau", "label": "Barreau", "type": "text", "required": true},
    {"name": "adresse_cabinet", "label": "Adresse du cabinet", "type": "textarea", "required": true},
    {"name": "nom_destinataire", "label": "Nom du destinataire", "type": "text", "required": true},
    {"name": "adresse_destinataire", "label": "Adresse du destinataire", "type": "textarea", "required": true},
    {"name": "nom_client", "label": "Nom du client", "type": "text", "required": true},
    {"name": "montant", "label": "Montant (chiffres)", "type": "number", "required": true},
    {"name": "montant_lettres", "label": "Montant (lettres)", "type": "text", "required": true},
    {"name": "objet_creance", "label": "Objet de la créance", "type": "text", "required": true},
    {"name": "date_echeance", "label": "Date d''échéance", "type": "date", "required": true},
    {"name": "delai", "label": "Délai (jours)", "type": "number", "required": true}
  ]'::jsonb,
  true,
  true,
  'fr'
) ON CONFLICT DO NOTHING;

-- Template: Assignation en justice
INSERT INTO public.document_templates (
  name, description, category, profession, content, variables, is_public, is_official, language
) VALUES (
  'Assignation en justice',
  'Acte d''assignation devant le tribunal',
  'procedure',
  'avocat',
  E'TRIBUNAL DE {{tribunal}}

ASSIGNATION

L''an {{annee}} et le {{date}}

À la requête de :
{{nom_demandeur}}
Demeurant à {{adresse_demandeur}}
Représenté par Maître {{nom_avocat}}, Avocat au Barreau de {{barreau}}

J''ai, {{nom_huissier}}, Huissier de Justice près le Tribunal de {{tribunal}}, soussigné, donné assignation à :

{{nom_defendeur}}
Demeurant à {{adresse_defendeur}}

D''avoir à comparaître devant le Tribunal de {{tribunal}}, le {{date_audience}} à {{heure_audience}}, pour s''entendre :

CONDAMNER à payer la somme de {{montant}} DZD au titre de {{objet}}.

CONDAMNER aux dépens.

MOTIFS :

{{motifs}}

PIÈCES :

{{pieces}}

Fait à {{ville}}, le {{date}}

Maître {{nom_avocat}}
Avocat',
  '[
    {"name": "tribunal", "label": "Tribunal", "type": "text", "required": true},
    {"name": "annee", "label": "Année", "type": "text", "required": true},
    {"name": "date", "label": "Date", "type": "date", "required": true},
    {"name": "nom_demandeur", "label": "Nom du demandeur", "type": "text", "required": true},
    {"name": "adresse_demandeur", "label": "Adresse du demandeur", "type": "textarea", "required": true},
    {"name": "nom_avocat", "label": "Nom de l''avocat", "type": "text", "required": true},
    {"name": "barreau", "label": "Barreau", "type": "text", "required": true},
    {"name": "nom_huissier", "label": "Nom de l''huissier", "type": "text", "required": true},
    {"name": "nom_defendeur", "label": "Nom du défendeur", "type": "text", "required": true},
    {"name": "adresse_defendeur", "label": "Adresse du défendeur", "type": "textarea", "required": true},
    {"name": "date_audience", "label": "Date d''audience", "type": "date", "required": true},
    {"name": "heure_audience", "label": "Heure d''audience", "type": "time", "required": true},
    {"name": "montant", "label": "Montant", "type": "number", "required": true},
    {"name": "objet", "label": "Objet", "type": "text", "required": true},
    {"name": "motifs", "label": "Motifs", "type": "textarea", "required": true},
    {"name": "pieces", "label": "Pièces", "type": "textarea", "required": true},
    {"name": "ville", "label": "Ville", "type": "text", "required": true}
  ]'::jsonb,
  true,
  true,
  'fr'
) ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- TEMPLATES OFFICIELS - NOTAIRE
-- ═══════════════════════════════════════════════════════════════════════════

-- Template: Acte de vente immobilière
INSERT INTO public.document_templates (
  name, description, category, profession, case_type, content, variables, is_public, is_official, language
) VALUES (
  'Acte de vente immobilière',
  'Acte authentique de vente d''un bien immobilier',
  'contract',
  'notaire',
  'vente',
  E'ACTE DE VENTE

L''an {{annee}} et le {{date}}

Par-devant Maître {{nom_notaire}}, Notaire à {{ville}}

ONT COMPARU :

LE VENDEUR :
{{nom_vendeur}}
Né(e) le {{date_naissance_vendeur}} à {{lieu_naissance_vendeur}}
Demeurant à {{adresse_vendeur}}

L''ACHETEUR :
{{nom_acheteur}}
Né(e) le {{date_naissance_acheteur}} à {{lieu_naissance_acheteur}}
Demeurant à {{adresse_acheteur}}

LESQUELS ONT DÉCLARÉ ET RECONNU :

Le vendeur vend à l''acheteur qui accepte :

DÉSIGNATION DU BIEN :
{{designation_bien}}

Situé à {{adresse_bien}}
Contenance : {{superficie}} m²
Titre de propriété : {{titre_propriete}}

PRIX :
Le présent bien est vendu et acquis moyennant le prix principal de {{prix}} DZD ({{prix_lettres}} dinars algériens).

Ce prix a été payé comptant avant la signature des présentes, dont quittance.

CHARGES ET CONDITIONS :
{{charges_conditions}}

DÉCLARATIONS FISCALES :
{{declarations_fiscales}}

Dont acte fait et passé à {{ville}}, le {{date}}

Après lecture, les parties ont signé avec Nous, Notaire.

Maître {{nom_notaire}}
Notaire',
  '[
    {"name": "annee", "label": "Année", "type": "text", "required": true},
    {"name": "date", "label": "Date", "type": "date", "required": true},
    {"name": "nom_notaire", "label": "Nom du notaire", "type": "text", "required": true},
    {"name": "ville", "label": "Ville", "type": "text", "required": true},
    {"name": "nom_vendeur", "label": "Nom du vendeur", "type": "text", "required": true},
    {"name": "date_naissance_vendeur", "label": "Date de naissance vendeur", "type": "date", "required": true},
    {"name": "lieu_naissance_vendeur", "label": "Lieu de naissance vendeur", "type": "text", "required": true},
    {"name": "adresse_vendeur", "label": "Adresse du vendeur", "type": "textarea", "required": true},
    {"name": "nom_acheteur", "label": "Nom de l''acheteur", "type": "text", "required": true},
    {"name": "date_naissance_acheteur", "label": "Date de naissance acheteur", "type": "date", "required": true},
    {"name": "lieu_naissance_acheteur", "label": "Lieu de naissance acheteur", "type": "text", "required": true},
    {"name": "adresse_acheteur", "label": "Adresse de l''acheteur", "type": "textarea", "required": true},
    {"name": "designation_bien", "label": "Désignation du bien", "type": "textarea", "required": true},
    {"name": "adresse_bien", "label": "Adresse du bien", "type": "textarea", "required": true},
    {"name": "superficie", "label": "Superficie (m²)", "type": "number", "required": true},
    {"name": "titre_propriete", "label": "Titre de propriété", "type": "text", "required": true},
    {"name": "prix", "label": "Prix (chiffres)", "type": "number", "required": true},
    {"name": "prix_lettres", "label": "Prix (lettres)", "type": "text", "required": true},
    {"name": "charges_conditions", "label": "Charges et conditions", "type": "textarea", "required": false},
    {"name": "declarations_fiscales", "label": "Déclarations fiscales", "type": "textarea", "required": false}
  ]'::jsonb,
  true,
  true,
  'fr'
) ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 'Table document_templates créée avec succès!' as status;
SELECT COUNT(*) as total_templates FROM public.document_templates;
SELECT name, profession, category FROM public.document_templates WHERE is_official = true;
