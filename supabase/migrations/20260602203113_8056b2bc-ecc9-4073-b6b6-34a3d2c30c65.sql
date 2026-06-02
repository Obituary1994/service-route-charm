
-- Fix search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Restrict EXECUTE on security definer helpers
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.current_user_ubs() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_ubs() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Tighten assinaturas insert: require link to a ficha/OS accessible by user
DROP POLICY IF EXISTS "assin_insert_auth" ON public.assinaturas;
CREATE POLICY "assin_insert_scope" ON public.assinaturas FOR INSERT TO authenticated
WITH CHECK (
  (ficha_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.fichas_visita f WHERE f.id = ficha_id
    AND (f.agente_id = auth.uid() OR (f.ubs_id = public.current_user_ubs() AND public.has_role(auth.uid(), 'coordenador')))
  ))
  OR
  (os_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.ordens_servico o WHERE o.id = os_id
    AND (o.agente_id = auth.uid() OR (o.ubs_id = public.current_user_ubs() AND public.has_role(auth.uid(), 'coordenador')))
  ))
);
