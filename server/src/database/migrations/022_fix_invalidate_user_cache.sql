-- 022_fix_invalidate_user_cache.sql
-- Corrige le trigger de cache RBAC : il est posé sur role_permissions,
-- table qui ne possède pas de colonne user_id (l'ancienne fonction plantait
-- avec "record new has no field user_id" et bloquait tout seed RBAC).

CREATE OR REPLACE FUNCTION public.invalidate_user_cache()
RETURNS TRIGGER AS $$
DECLARE
  affected_user UUID;
BEGIN
  IF TG_TABLE_NAME = 'user_role_assignments' THEN
    IF TG_OP = 'DELETE' THEN
      affected_user := OLD.user_id;
    ELSE
      affected_user := NEW.user_id;
    END IF;
    DELETE FROM public.access_control_cache WHERE user_id = affected_user;
  ELSE
    -- Changement de permissions d'un rôle : on purge le cache global.
    DELETE FROM public.access_control_cache;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
