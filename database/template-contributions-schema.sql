-- Schema pour la collecte des templates réels des cabinets algériens

-- Table des contributions de templates
CREATE TABLE IF NOT EXISTS template_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_role TEXT NOT NULL CHECK (user_role IN ('avocat', 'notaire', 'huissier', 'magistrat', 'juriste_entreprise')),
  
  -- Informations du template
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_fr TEXT,
  description_ar TEXT,
  category TEXT NOT NULL,
  
  -- Localisation
  wilaya TEXT,
  tribunal TEXT,
  
  -- Source et visibilité
  source TEXT NOT NULL DEFAULT 'cabinet' CHECK (source IN ('cabinet', 'tribunal', 'notaire', 'huissier', 'autre')),
  is_public BOOLEAN DEFAULT false,
  
  -- Contenu du template
  template_content TEXT NOT NULL,
  template_format TEXT DEFAULT 'text' CHECK (template_format IN ('text', 'docx', 'pdf')),
  
  -- Structure des champs
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Métadonnées
  usage_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  
  -- Statut de validation
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected', 'needs_revision')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des évaluations de templates
CREATE TABLE IF NOT EXISTS template_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES template_contributions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(template_id, user_id)
);

-- Table des utilisations de templates
CREATE TABLE IF NOT EXISTS template_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES template_contributions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN DEFAULT true,
  feedback TEXT
);

-- Table des suggestions d'amélioration
CREATE TABLE IF NOT EXISTS template_improvement_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES template_contributions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('correction', 'addition', 'clarification', 'autre')),
  suggestion_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes pour performance
CREATE INDEX idx_template_contributions_user ON template_contributions(user_id);
CREATE INDEX idx_template_contributions_status ON template_contributions(status);
CREATE INDEX idx_template_contributions_category ON template_contributions(category);
CREATE INDEX idx_template_contributions_wilaya ON template_contributions(wilaya);
CREATE INDEX idx_template_contributions_role ON template_contributions(user_role);
CREATE INDEX idx_template_ratings_template ON template_ratings(template_id);
CREATE INDEX idx_template_usage_template ON template_usage_logs(template_id);

-- Fonction pour mettre à jour le rating moyen
CREATE OR REPLACE FUNCTION update_template_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE template_contributions
  SET rating = (
    SELECT AVG(rating)::DECIMAL(3,2)
    FROM template_ratings
    WHERE template_id = NEW.template_id
  )
  WHERE id = NEW.template_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le rating
CREATE TRIGGER trigger_update_template_rating
AFTER INSERT OR UPDATE ON template_ratings
FOR EACH ROW
EXECUTE FUNCTION update_template_rating();

-- Fonction pour incrémenter le compteur d'utilisation
CREATE OR REPLACE FUNCTION increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE template_contributions
  SET usage_count = usage_count + 1
  WHERE id = NEW.template_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour incrémenter l'utilisation
CREATE TRIGGER trigger_increment_template_usage
AFTER INSERT ON template_usage_logs
FOR EACH ROW
EXECUTE FUNCTION increment_template_usage();

-- RLS Policies
ALTER TABLE template_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_improvement_suggestions ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leurs propres contributions
CREATE POLICY "Users can view own contributions"
ON template_contributions FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent voir les templates publics approuvés
CREATE POLICY "Users can view public approved templates"
ON template_contributions FOR SELECT
USING (status = 'approved' AND is_public = true);

-- Policy: Les utilisateurs peuvent créer des contributions
CREATE POLICY "Users can create contributions"
ON template_contributions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent modifier leurs propres contributions en attente
CREATE POLICY "Users can update own pending contributions"
ON template_contributions FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending_review');

-- Policy: Les admins peuvent tout voir et modifier
CREATE POLICY "Admins can manage all contributions"
ON template_contributions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policies pour les ratings
CREATE POLICY "Users can view all ratings"
ON template_ratings FOR SELECT
USING (true);

CREATE POLICY "Users can create ratings"
ON template_ratings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings"
ON template_ratings FOR UPDATE
USING (auth.uid() = user_id);

-- Policies pour les logs d'utilisation
CREATE POLICY "Users can create usage logs"
ON template_usage_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own usage logs"
ON template_usage_logs FOR SELECT
USING (auth.uid() = user_id);

-- Policies pour les suggestions
CREATE POLICY "Users can create suggestions"
ON template_improvement_suggestions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all suggestions"
ON template_improvement_suggestions FOR SELECT
USING (true);

-- Vue pour les statistiques des templates
CREATE OR REPLACE VIEW template_statistics AS
SELECT 
  tc.id,
  tc.name_fr,
  tc.name_ar,
  tc.category,
  tc.wilaya,
  tc.user_role,
  tc.usage_count,
  tc.rating,
  COUNT(DISTINCT tr.id) as rating_count,
  COUNT(DISTINCT tul.id) as total_uses,
  COUNT(DISTINCT tis.id) as suggestion_count,
  tc.created_at,
  tc.status
FROM template_contributions tc
LEFT JOIN template_ratings tr ON tc.id = tr.template_id
LEFT JOIN template_usage_logs tul ON tc.id = tul.template_id
LEFT JOIN template_improvement_suggestions tis ON tc.id = tis.template_id
GROUP BY tc.id;

-- Fonction pour rechercher des templates
CREATE OR REPLACE FUNCTION search_templates(
  search_query TEXT,
  filter_category TEXT DEFAULT NULL,
  filter_wilaya TEXT DEFAULT NULL,
  filter_role TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name_fr TEXT,
  name_ar TEXT,
  description_fr TEXT,
  description_ar TEXT,
  category TEXT,
  wilaya TEXT,
  rating DECIMAL,
  usage_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tc.id,
    tc.name_fr,
    tc.name_ar,
    tc.description_fr,
    tc.description_ar,
    tc.category,
    tc.wilaya,
    tc.rating,
    tc.usage_count
  FROM template_contributions tc
  WHERE tc.status = 'approved'
    AND tc.is_public = true
    AND (
      search_query IS NULL 
      OR tc.name_fr ILIKE '%' || search_query || '%'
      OR tc.name_ar ILIKE '%' || search_query || '%'
      OR tc.description_fr ILIKE '%' || search_query || '%'
      OR tc.description_ar ILIKE '%' || search_query || '%'
    )
    AND (filter_category IS NULL OR tc.category = filter_category)
    AND (filter_wilaya IS NULL OR tc.wilaya = filter_wilaya)
    AND (filter_role IS NULL OR tc.user_role = filter_role)
  ORDER BY tc.rating DESC, tc.usage_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Commentaires
COMMENT ON TABLE template_contributions IS 'Contributions de templates réels par les professionnels du droit algérien';
COMMENT ON TABLE template_ratings IS 'Évaluations des templates par les utilisateurs';
COMMENT ON TABLE template_usage_logs IS 'Logs d''utilisation des templates pour statistiques';
COMMENT ON TABLE template_improvement_suggestions IS 'Suggestions d''amélioration des templates';
