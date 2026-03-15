-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE NOTIFICATIONS - Système de notifications intelligent
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Créer la table notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Type de notification
  type TEXT NOT NULL, -- 'deadline', 'hearing', 'task', 'document', 'event', 'reminder'
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  
  -- Contenu
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Lien vers l'entité concernée
  related_type TEXT, -- 'case', 'client', 'document', 'event'
  related_id UUID,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Statut
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Dates
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ -- Optionnel: date d'expiration de la notification
);

-- 2. Index pour performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority);

-- 3. Activer RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 4. Politiques RLS
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications
  FOR DELETE
  USING (user_id = auth.uid());

-- 5. Fonction pour créer une notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_priority TEXT DEFAULT 'normal',
  p_related_type TEXT DEFAULT NULL,
  p_related_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    priority,
    related_type,
    related_id,
    metadata
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_priority,
    p_related_type,
    p_related_id,
    p_metadata
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- 6. Fonction pour marquer comme lu
CREATE OR REPLACE FUNCTION mark_notification_as_read(p_notification_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true, read_at = NOW()
  WHERE id = p_notification_id AND user_id = auth.uid();
END;
$$;

-- 7. Fonction pour marquer toutes comme lues
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true, read_at = NOW()
  WHERE user_id = p_user_id AND is_read = false;
END;
$$;

-- 8. Fonction pour nettoyer les anciennes notifications (à exécuter périodiquement)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Supprimer les notifications lues de plus de 30 jours
  DELETE FROM public.notifications
  WHERE is_read = true 
    AND read_at < NOW() - INTERVAL '30 days';
  
  -- Supprimer les notifications expirées
  DELETE FROM public.notifications
  WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGERS AUTOMATIQUES POUR CRÉER DES NOTIFICATIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Trigger: Notification pour échéance proche (3 jours avant)
CREATE OR REPLACE FUNCTION notify_upcoming_deadline()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si une échéance est dans 3 jours, créer une notification
  IF NEW.deadline IS NOT NULL 
     AND NEW.deadline::date = (CURRENT_DATE + INTERVAL '3 days')::date THEN
    
    PERFORM create_notification(
      NEW.user_id,
      'deadline',
      'Échéance dans 3 jours',
      'Le dossier "' || NEW.title || '" a une échéance le ' || NEW.deadline::date,
      'high',
      'case',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Appliquer le trigger sur les cases
DROP TRIGGER IF EXISTS trigger_notify_deadline ON public.cases;
CREATE TRIGGER trigger_notify_deadline
  AFTER INSERT OR UPDATE OF deadline ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION notify_upcoming_deadline();

-- ═══════════════════════════════════════════════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 'Table notifications créée avec succès!' as status;
SELECT COUNT(*) as total_notifications FROM public.notifications;
