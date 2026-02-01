-- Migration 013: Create Learning System Tables
-- Description: Comprehensive learning system for student mode with modules, progress tracking, exercises, assessments, and adaptive learning

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums for learning system
CREATE TYPE legal_domain AS ENUM (
  'civil_law', 'criminal_law', 'commercial_law', 'administrative_law',
  'family_law', 'labor_law', 'real_estate_law', 'intellectual_property',
  'tax_law', 'constitutional_law', 'international_law', 'procedural_law'
);

CREATE TYPE study_level AS ENUM (
  'l1', 'l2', 'l3', 'm1', 'm2', 'professional', 'continuing'
);

CREATE TYPE difficulty_level AS ENUM (
  'beginner', 'intermediate', 'advanced', 'expert'
);

CREATE TYPE objective_type AS ENUM (
  'knowledge', 'comprehension', 'application', 'analysis', 'synthesis', 'evaluation'
);

CREATE TYPE content_type AS ENUM (
  'text', 'video', 'audio', 'image', 'document', 'interactive',
  'case_study', 'legal_text', 'jurisprudence'
);

CREATE TYPE exercise_type AS ENUM (
  'multiple_choice', 'true_false', 'fill_blank', 'short_answer',
  'essay', 'case_analysis', 'legal_drafting', 'matching', 'ordering', 'simulation'
);

CREATE TYPE assessment_type AS ENUM (
  'quiz', 'exam', 'project', 'presentation', 'practical', 'continuous'
);

CREATE TYPE progress_status AS ENUM (
  'not_started', 'in_progress', 'completed', 'paused', 'failed'
);

CREATE TYPE achievement_type AS ENUM (
  'completion', 'performance', 'consistency', 'improvement', 'participation', 'mastery'
);

CREATE TYPE learning_style AS ENUM (
  'visual', 'auditory', 'kinesthetic', 'reading_writing', 'mixed'
);

CREATE TYPE priority_level AS ENUM (
  'low', 'medium', 'high', 'urgent'
);

CREATE TYPE goal_status AS ENUM (
  'active', 'completed', 'paused', 'cancelled'
);

CREATE TYPE reminder_frequency AS ENUM (
  'daily', 'weekly', 'biweekly', 'monthly', 'never'
);

CREATE TYPE difficulty_progression AS ENUM (
  'gradual', 'adaptive', 'fixed', 'challenge'
);

CREATE TYPE feedback_type AS ENUM (
  'immediate', 'delayed', 'summary', 'detailed'
);

CREATE TYPE recommendation_type AS ENUM (
  'module', 'exercise', 'path', 'review', 'practice', 'challenge'
);

CREATE TYPE analytics_period AS ENUM (
  'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
);

CREATE TYPE insight_type AS ENUM (
  'performance', 'behavior', 'preference', 'difficulty', 'engagement', 'progress'
);

CREATE TYPE restriction_type AS ENUM (
  'module_access', 'exercise_attempts', 'time_limit', 'content_type', 'feature_access'
);

CREATE TYPE help_type AS ENUM (
  'tooltip', 'guide', 'tutorial', 'faq', 'video', 'interactive'
);

-- 1. Learning Modules Table
CREATE TABLE learning_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  domain legal_domain NOT NULL,
  level study_level NOT NULL,
  prerequisites JSONB DEFAULT '[]',
  objectives JSONB NOT NULL,
  estimated_duration INTEGER NOT NULL, -- in minutes
  difficulty difficulty_level NOT NULL,
  tags JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Module Content Table
CREATE TABLE module_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
  type content_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  media_url VARCHAR(500),
  duration INTEGER, -- in minutes
  order_index INTEGER NOT NULL,
  is_interactive BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Exercises Table
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
  type exercise_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  question TEXT NOT NULL,
  options JSONB, -- for multiple choice, matching, etc.
  correct_answer JSONB NOT NULL,
  explanation TEXT NOT NULL,
  hints JSONB DEFAULT '[]',
  difficulty difficulty_level NOT NULL,
  points INTEGER DEFAULT 10,
  time_limit INTEGER, -- in minutes
  attempts INTEGER DEFAULT 3,
  feedback JSONB NOT NULL,
  tags JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Assessments Table
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type assessment_type NOT NULL,
  exercises JSONB NOT NULL, -- Array of exercise IDs
  passing_score INTEGER NOT NULL,
  max_attempts INTEGER DEFAULT 3,
  time_limit INTEGER, -- in minutes
  is_proctored BOOLEAN DEFAULT false,
  available_from TIMESTAMP WITH TIME ZONE NOT NULL,
  available_until TIMESTAMP WITH TIME ZONE,
  weight DECIMAL(3,2) DEFAULT 1.0,
  instructions TEXT,
  resources JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Student Profiles Table
CREATE TABLE student_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  study_level study_level NOT NULL,
  specialization VARCHAR(255),
  university VARCHAR(255),
  year_of_study INTEGER DEFAULT 1,
  preferred_language VARCHAR(10) DEFAULT 'fr',
  learning_style learning_style DEFAULT 'mixed',
  goals JSONB DEFAULT '[]',
  interests JSONB DEFAULT '[]', -- Array of legal_domain
  strengths JSONB DEFAULT '[]',
  weaknesses JSONB DEFAULT '[]',
  preferences JSONB DEFAULT '{}',
  statistics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Student Progress Table
CREATE TABLE student_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
  status progress_status DEFAULT 'not_started',
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  current_content_id UUID,
  time_spent INTEGER DEFAULT 0, -- in minutes
  exercises_completed INTEGER DEFAULT 0,
  exercises_total INTEGER DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  bookmarks JSONB DEFAULT '[]', -- Array of content IDs
  achievements JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, module_id)
);

-- 7. Exercise Attempts Table
CREATE TABLE exercise_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  attempt INTEGER NOT NULL,
  answers JSONB NOT NULL,
  score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  time_spent INTEGER NOT NULL, -- in seconds
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  feedback JSONB NOT NULL,
  is_correct BOOLEAN NOT NULL,
  hints_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, exercise_id, attempt)
);

-- 8. Learning Paths Table
CREATE TABLE learning_paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  level study_level NOT NULL,
  modules JSONB NOT NULL, -- Array of module IDs in order
  prerequisites JSONB DEFAULT '[]',
  estimated_duration INTEGER NOT NULL, -- in hours
  difficulty difficulty_level NOT NULL,
  tags JSONB DEFAULT '[]',
  is_recommended BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Achievements Table
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type achievement_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  points INTEGER DEFAULT 0,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  criteria JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, type, criteria)
);

-- 10. Recommendations Table
CREATE TABLE recommendations (
  id VARCHAR(255) PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type recommendation_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_id UUID NOT NULL,
  reason TEXT,
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  priority priority_level NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE,
  is_viewed BOOLEAN DEFAULT false,
  is_accepted BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Study Sessions Table
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id UUID REFERENCES learning_modules(id) ON DELETE SET NULL,
  exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER DEFAULT 0, -- in minutes
  activities_completed INTEGER DEFAULT 0,
  score INTEGER,
  notes TEXT,
  interruptions INTEGER DEFAULT 0,
  focus_score INTEGER DEFAULT 100 CHECK (focus_score >= 0 AND focus_score <= 100),
  satisfaction INTEGER CHECK (satisfaction >= 1 AND satisfaction <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Learning Statistics Table
CREATE TABLE learning_statistics (
  student_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_time_spent INTEGER DEFAULT 0, -- in minutes
  modules_completed INTEGER DEFAULT 0,
  exercises_completed INTEGER DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 0,
  achievements INTEGER DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  weekly_goal INTEGER DEFAULT 120, -- minutes per week
  weekly_progress INTEGER DEFAULT 0, -- minutes this week
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Adaptive Engines Table
CREATE TABLE adaptive_engines (
  student_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_level difficulty_level DEFAULT 'beginner',
  mastery_threshold DECIMAL(3,2) DEFAULT 0.8,
  adaptation_rate DECIMAL(3,2) DEFAULT 0.1,
  performance_history JSONB DEFAULT '[]',
  next_recommendations JSONB DEFAULT '[]',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Learning Restrictions Table
CREATE TABLE learning_restrictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type restriction_type NOT NULL,
  resource VARCHAR(255) NOT NULL,
  reason TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Error Explanations Table
CREATE TABLE error_explanations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  error_type VARCHAR(100) NOT NULL,
  common_mistake TEXT NOT NULL,
  explanation TEXT NOT NULL,
  correct_approach TEXT NOT NULL,
  examples JSONB DEFAULT '[]',
  related_concepts JSONB DEFAULT '[]',
  additional_resources JSONB DEFAULT '[]',
  language VARCHAR(10) DEFAULT 'fr',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. Contextual Help Table
CREATE TABLE contextual_help (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  context VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  type help_type NOT NULL,
  level study_level,
  examples JSONB DEFAULT '[]',
  related_topics JSONB DEFAULT '[]',
  is_interactive BOOLEAN DEFAULT false,
  media_url VARCHAR(500),
  language VARCHAR(10) DEFAULT 'fr',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_learning_modules_domain_level ON learning_modules(domain, level);
CREATE INDEX idx_learning_modules_active ON learning_modules(is_active);
CREATE INDEX idx_module_content_module_order ON module_content(module_id, order_index);
CREATE INDEX idx_exercises_module_active ON exercises(module_id, is_active);
CREATE INDEX idx_student_progress_student ON student_progress(student_id);
CREATE INDEX idx_student_progress_status ON student_progress(status);
CREATE INDEX idx_exercise_attempts_student_exercise ON exercise_attempts(student_id, exercise_id);
CREATE INDEX idx_recommendations_student_viewed ON recommendations(student_id, is_viewed);
CREATE INDEX idx_study_sessions_student_time ON study_sessions(student_id, start_time);
CREATE INDEX idx_achievements_student_unlocked ON achievements(student_id, unlocked_at);
CREATE INDEX idx_contextual_help_context_level ON contextual_help(context, level);
CREATE INDEX idx_error_explanations_exercise_type ON error_explanations(exercise_id, error_type);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_learning_modules_updated_at BEFORE UPDATE ON learning_modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_module_content_updated_at BEFORE UPDATE ON module_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON exercises FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_profiles_updated_at BEFORE UPDATE ON student_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_progress_updated_at BEFORE UPDATE ON student_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_learning_paths_updated_at BEFORE UPDATE ON learning_paths FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_learning_statistics_updated_at BEFORE UPDATE ON learning_statistics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_error_explanations_updated_at BEFORE UPDATE ON error_explanations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contextual_help_updated_at BEFORE UPDATE ON contextual_help FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- PostgreSQL functions for learning system

-- Function to calculate student streak
CREATE OR REPLACE FUNCTION calculate_student_streak(p_student_id UUID)
RETURNS INTEGER AS $$
DECLARE
    current_streak INTEGER := 0;
    check_date DATE := CURRENT_DATE;
    has_activity BOOLEAN;
BEGIN
    LOOP
        SELECT EXISTS(
            SELECT 1 FROM study_sessions 
            WHERE student_id = p_student_id 
            AND DATE(start_time) = check_date
        ) INTO has_activity;
        
        IF NOT has_activity THEN
            EXIT;
        END IF;
        
        current_streak := current_streak + 1;
        check_date := check_date - INTERVAL '1 day';
    END LOOP;
    
    RETURN current_streak;
END;
$$ LANGUAGE plpgsql;

-- Function to update learning statistics
CREATE OR REPLACE FUNCTION update_learning_stats(
    p_student_id UUID,
    p_time_spent INTEGER DEFAULT 0,
    p_exercises_completed INTEGER DEFAULT 0,
    p_score DECIMAL DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    current_streak INTEGER;
BEGIN
    -- Calculate current streak
    current_streak := calculate_student_streak(p_student_id);
    
    INSERT INTO learning_statistics (
        student_id, total_time_spent, exercises_completed, 
        average_score, streak_days, last_activity
    ) VALUES (
        p_student_id, p_time_spent, p_exercises_completed,
        COALESCE(p_score, 0), current_streak, CURRENT_TIMESTAMP
    )
    ON CONFLICT (student_id) DO UPDATE SET
        total_time_spent = learning_statistics.total_time_spent + p_time_spent,
        exercises_completed = learning_statistics.exercises_completed + p_exercises_completed,
        average_score = CASE 
            WHEN p_score IS NOT NULL AND learning_statistics.exercises_completed > 0 THEN
                (learning_statistics.average_score * learning_statistics.exercises_completed + p_score) / 
                (learning_statistics.exercises_completed + p_exercises_completed)
            WHEN p_score IS NOT NULL AND learning_statistics.exercises_completed = 0 THEN p_score
            ELSE learning_statistics.average_score
        END,
        streak_days = current_streak,
        longest_streak = GREATEST(learning_statistics.longest_streak, current_streak),
        last_activity = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to get adaptive difficulty level
CREATE OR REPLACE FUNCTION get_adaptive_difficulty(p_student_id UUID, p_domain legal_domain)
RETURNS difficulty_level AS $$
DECLARE
    avg_score DECIMAL;
    attempt_count INTEGER;
    result_difficulty difficulty_level;
BEGIN
    -- Get average score and attempt count for the domain
    SELECT 
        AVG(ea.score::DECIMAL / ea.max_score * 100),
        COUNT(*)
    INTO avg_score, attempt_count
    FROM exercise_attempts ea
    JOIN exercises e ON ea.exercise_id = e.id
    JOIN learning_modules lm ON e.module_id = lm.id
    WHERE ea.student_id = p_student_id 
    AND lm.domain = p_domain
    AND ea.submitted_at > CURRENT_TIMESTAMP - INTERVAL '30 days';
    
    -- Determine difficulty based on performance
    IF attempt_count < 5 THEN
        result_difficulty := 'beginner';
    ELSIF avg_score >= 90 THEN
        result_difficulty := 'advanced';
    ELSIF avg_score >= 75 THEN
        result_difficulty := 'intermediate';
    ELSE
        result_difficulty := 'beginner';
    END IF;
    
    RETURN result_difficulty;
END;
$$ LANGUAGE plpgsql;

-- Insert default learning modules for Algerian legal system
INSERT INTO learning_modules (title, description, domain, level, objectives, estimated_duration, difficulty, tags, created_by) VALUES
('Introduction au Droit Civil Algérien', 'Module d''introduction aux principes fondamentaux du droit civil algérien', 'civil_law', 'l1', '[{"id": "1", "description": "Comprendre les sources du droit civil", "type": "comprehension", "measurable": true, "assessmentCriteria": ["Identifier les sources", "Expliquer la hiérarchie"]}]', 120, 'beginner', '["introduction", "droit civil", "algérie"]', (SELECT id FROM users WHERE role = 'Administrateur_Plateforme' LIMIT 1)),
('Droit Pénal - Infractions et Sanctions', 'Étude des infractions pénales et du système de sanctions en Algérie', 'criminal_law', 'l2', '[{"id": "1", "description": "Maîtriser la classification des infractions", "type": "application", "measurable": true, "assessmentCriteria": ["Classer les infractions", "Calculer les peines"]}]', 180, 'intermediate', '["droit pénal", "infractions", "sanctions"]', (SELECT id FROM users WHERE role = 'Administrateur_Plateforme' LIMIT 1)),
('Droit Commercial - Sociétés', 'Formation et gestion des sociétés commerciales selon le droit algérien', 'commercial_law', 'l3', '[{"id": "1", "description": "Analyser les formes de sociétés", "type": "analysis", "measurable": true, "assessmentCriteria": ["Comparer les formes", "Proposer des solutions"]}]', 150, 'intermediate', '["droit commercial", "sociétés", "entreprises"]', (SELECT id FROM users WHERE role = 'Administrateur_Plateforme' LIMIT 1));

-- Insert sample contextual help
INSERT INTO contextual_help (context, title, content, type, level, examples, language) VALUES
('module_navigation', 'Navigation dans les modules', 'Utilisez la barre de progression pour suivre votre avancement. Cliquez sur les sections pour naviguer directement.', 'tooltip', 'l1', '["Cliquez sur \"Suivant\" pour continuer", "Utilisez les signets pour marquer les sections importantes"]', 'fr'),
('exercise_submission', 'Soumission d''exercices', 'Vérifiez vos réponses avant de soumettre. Vous avez un nombre limité de tentatives.', 'guide', null, '["Relisez la question", "Utilisez les indices si nécessaire", "Gérez votre temps"]', 'fr'),
('legal_terminology', 'Terminologie juridique', 'Consultez le glossaire pour les termes juridiques spécialisés. Chaque terme est expliqué dans le contexte du droit algérien.', 'faq', null, '["Cliquez sur un terme surligné", "Utilisez la recherche du glossaire"]', 'fr');

COMMENT ON TABLE learning_modules IS 'Modules d''apprentissage avec contenu pédagogique structuré';
COMMENT ON TABLE student_progress IS 'Suivi de progression individuel des étudiants par module';
COMMENT ON TABLE exercise_attempts IS 'Historique des tentatives d''exercices avec scoring détaillé';
COMMENT ON TABLE adaptive_engines IS 'Moteur d''apprentissage adaptatif personnalisé par étudiant';
COMMENT ON TABLE contextual_help IS 'Aide contextuelle multilingue pour l''interface d''apprentissage';