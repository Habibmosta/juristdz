-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE CASE_TASKS - Système de gestion des tâches par dossier
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Créer la table case_tasks
CREATE TABLE IF NOT EXISTS public.case_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Contenu
  title TEXT NOT NULL,
  description TEXT,
  
  -- Statut et priorité
  status TEXT DEFAULT 'todo', -- 'todo', 'in_progress', 'done'
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  
  -- Dates
  due_date DATE,
  completed_at TIMESTAMPTZ,
  
  -- Assignation
  assigned_to UUID, -- user_id du collaborateur assigné
  assigned_by UUID, -- user_id de celui qui a assigné
  
  -- Métadonnées
  order_index INTEGER DEFAULT 0,
  is_checklist_item BOOLEAN DEFAULT false, -- Si c'est un item de checklist procédurale
  checklist_template TEXT, -- Nom du template de checklist (ex: 'divorce', 'vente_immobiliere')
  
  -- Tags et catégories
  tags TEXT[], -- Tags personnalisés
  category TEXT, -- Catégorie (ex: 'procedure', 'document', 'client', 'tribunal')
  
  -- Rappels
  reminder_date TIMESTAMPTZ,
  reminder_sent BOOLEAN DEFAULT false,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- 2. Index pour performance
CREATE INDEX IF NOT EXISTS idx_case_tasks_case_id ON public.case_tasks(case_id);
CREATE INDEX IF NOT EXISTS idx_case_tasks_user_id ON public.case_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_case_tasks_status ON public.case_tasks(status);
CREATE INDEX IF NOT EXISTS idx_case_tasks_priority ON public.case_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_case_tasks_due_date ON public.case_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_case_tasks_assigned_to ON public.case_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_case_tasks_order ON public.case_tasks(case_id, order_index);

-- 3. Activer RLS
ALTER TABLE public.case_tasks ENABLE ROW LEVEL SECURITY;

-- 4. Politiques RLS
CREATE POLICY "Users can view tasks for their cases"
  ON public.case_tasks
  FOR SELECT
  USING (
    user_id = auth.uid() 
    OR assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM cases 
      WHERE cases.id = case_tasks.case_id 
      AND cases.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks for their cases"
  ON public.case_tasks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cases 
      WHERE cases.id = case_id 
      AND cases.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their tasks"
  ON public.case_tasks
  FOR UPDATE
  USING (
    user_id = auth.uid() 
    OR assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM cases 
      WHERE cases.id = case_tasks.case_id 
      AND cases.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their tasks"
  ON public.case_tasks
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM cases 
      WHERE cases.id = case_tasks.case_id 
      AND cases.user_id = auth.uid()
    )
  );

-- 5. Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_case_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_case_tasks_updated_at ON public.case_tasks;
CREATE TRIGGER trigger_update_case_tasks_updated_at
  BEFORE UPDATE ON public.case_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_case_tasks_updated_at();

-- 6. Fonction pour créer une tâche
CREATE OR REPLACE FUNCTION create_task(
  p_case_id UUID,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_priority TEXT DEFAULT 'normal',
  p_due_date DATE DEFAULT NULL,
  p_assigned_to UUID DEFAULT NULL,
  p_category TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_task_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  INSERT INTO public.case_tasks (
    case_id,
    user_id,
    title,
    description,
    priority,
    due_date,
    assigned_to,
    assigned_by,
    category,
    created_by
  ) VALUES (
    p_case_id,
    v_user_id,
    p_title,
    p_description,
    p_priority,
    p_due_date,
    p_assigned_to,
    v_user_id,
    p_category,
    v_user_id
  )
  RETURNING id INTO v_task_id;
  
  -- Créer une notification si assigné à quelqu'un
  IF p_assigned_to IS NOT NULL AND p_assigned_to != v_user_id THEN
    PERFORM create_notification(
      p_assigned_to,
      'task',
      'Nouvelle tâche assignée',
      'Vous avez été assigné à la tâche: ' || p_title,
      p_priority,
      'case',
      p_case_id
    );
  END IF;
  
  RETURN v_task_id;
END;
$$;

-- 7. Fonction pour marquer une tâche comme terminée
CREATE OR REPLACE FUNCTION complete_task(p_task_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.case_tasks
  SET 
    status = 'done',
    completed_at = NOW()
  WHERE id = p_task_id;
END;
$$;

-- 8. Fonction pour obtenir les statistiques de tâches d'un dossier
CREATE OR REPLACE FUNCTION get_case_task_stats(p_case_id UUID)
RETURNS TABLE(
  total INTEGER,
  todo INTEGER,
  in_progress INTEGER,
  done INTEGER,
  overdue INTEGER,
  completion_rate NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total,
    COUNT(*) FILTER (WHERE status = 'todo')::INTEGER as todo,
    COUNT(*) FILTER (WHERE status = 'in_progress')::INTEGER as in_progress,
    COUNT(*) FILTER (WHERE status = 'done')::INTEGER as done,
    COUNT(*) FILTER (WHERE status != 'done' AND due_date < CURRENT_DATE)::INTEGER as overdue,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE status = 'done')::NUMERIC / COUNT(*)::NUMERIC) * 100, 1)
      ELSE 0
    END as completion_rate
  FROM public.case_tasks
  WHERE case_id = p_case_id;
END;
$$;

-- 9. Trigger pour notification de tâche en retard
CREATE OR REPLACE FUNCTION notify_overdue_tasks()
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  task_record RECORD;
BEGIN
  FOR task_record IN 
    SELECT t.id, t.title, t.case_id, t.user_id, t.assigned_to, c.title as case_title
    FROM case_tasks t
    JOIN cases c ON c.id = t.case_id
    WHERE t.status != 'done'
      AND t.due_date = CURRENT_DATE
      AND t.reminder_sent = false
  LOOP
    -- Notifier le propriétaire
    PERFORM create_notification(
      task_record.user_id,
      'task',
      'Tâche à échéance aujourd''hui',
      'La tâche "' || task_record.title || '" du dossier "' || task_record.case_title || '" est à échéance aujourd''hui',
      'high',
      'case',
      task_record.case_id
    );
    
    -- Notifier l'assigné si différent
    IF task_record.assigned_to IS NOT NULL AND task_record.assigned_to != task_record.user_id THEN
      PERFORM create_notification(
        task_record.assigned_to,
        'task',
        'Tâche à échéance aujourd''hui',
        'La tâche "' || task_record.title || '" est à échéance aujourd''hui',
        'high',
        'case',
        task_record.case_id
      );
    END IF;
    
    -- Marquer le rappel comme envoyé
    UPDATE case_tasks SET reminder_sent = true WHERE id = task_record.id;
  END LOOP;
END;
$$;

-- 10. Templates de checklist procédurale
CREATE TABLE IF NOT EXISTS public.task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- Ex: 'divorce', 'vente_immobiliere'
  profession TEXT NOT NULL, -- 'avocat', 'notaire', 'huissier'
  case_type TEXT, -- Type de dossier concerné
  tasks JSONB NOT NULL, -- Array de tâches avec ordre, titre, description, priorité
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exemple de template pour divorce (Avocat)
INSERT INTO public.task_templates (name, profession, case_type, tasks)
VALUES (
  'divorce',
  'avocat',
  'divorce',
  '[
    {"order": 1, "title": "Réunir les documents d''état civil", "priority": "high", "category": "document"},
    {"order": 2, "title": "Établir la liste des biens communs", "priority": "high", "category": "document"},
    {"order": 3, "title": "Rédiger la requête en divorce", "priority": "urgent", "category": "procedure"},
    {"order": 4, "title": "Déposer la requête au tribunal", "priority": "urgent", "category": "tribunal"},
    {"order": 5, "title": "Préparer l''audience de conciliation", "priority": "high", "category": "procedure"},
    {"order": 6, "title": "Négocier la convention de divorce", "priority": "normal", "category": "client"},
    {"order": 7, "title": "Finaliser le jugement de divorce", "priority": "high", "category": "procedure"}
  ]'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- Exemple de template pour vente immobilière (Notaire)
INSERT INTO public.task_templates (name, profession, case_type, tasks)
VALUES (
  'vente_immobiliere',
  'notaire',
  'vente',
  '[
    {"order": 1, "title": "Vérifier le titre de propriété", "priority": "urgent", "category": "document"},
    {"order": 2, "title": "Demander l''état hypothécaire", "priority": "high", "category": "document"},
    {"order": 3, "title": "Obtenir le certificat d''urbanisme", "priority": "high", "category": "document"},
    {"order": 4, "title": "Rédiger l''avant-contrat", "priority": "high", "category": "procedure"},
    {"order": 5, "title": "Organiser la signature de l''avant-contrat", "priority": "normal", "category": "client"},
    {"order": 6, "title": "Calculer les droits d''enregistrement", "priority": "normal", "category": "procedure"},
    {"order": 7, "title": "Rédiger l''acte de vente définitif", "priority": "urgent", "category": "procedure"},
    {"order": 8, "title": "Organiser la signature de l''acte", "priority": "high", "category": "client"},
    {"order": 9, "title": "Enregistrer l''acte", "priority": "urgent", "category": "procedure"}
  ]'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- 11. Fonction pour appliquer un template de checklist
CREATE OR REPLACE FUNCTION apply_task_template(
  p_case_id UUID,
  p_template_name TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_template RECORD;
  v_task JSONB;
  v_count INTEGER := 0;
BEGIN
  -- Récupérer le template
  SELECT * INTO v_template
  FROM task_templates
  WHERE name = p_template_name;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template % not found', p_template_name;
  END IF;
  
  -- Créer les tâches du template
  FOR v_task IN SELECT * FROM jsonb_array_elements(v_template.tasks)
  LOOP
    INSERT INTO case_tasks (
      case_id,
      user_id,
      title,
      description,
      priority,
      category,
      is_checklist_item,
      checklist_template,
      order_index,
      created_by
    ) VALUES (
      p_case_id,
      auth.uid(),
      v_task->>'title',
      v_task->>'description',
      COALESCE(v_task->>'priority', 'normal'),
      v_task->>'category',
      true,
      p_template_name,
      (v_task->>'order')::INTEGER,
      auth.uid()
    );
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 'Table case_tasks créée avec succès!' as status;
SELECT COUNT(*) as total_tasks FROM public.case_tasks;
SELECT COUNT(*) as total_templates FROM public.task_templates;

