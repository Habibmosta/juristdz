CREATE OR REPLACE FUNCTION get_next_version_number(p_user_id UUID, p_document_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
    INTO v_next
    FROM document_versions
   WHERE user_id = p_user_id
     AND document_id = p_document_id;
  RETURN v_next;
END;
$$;
