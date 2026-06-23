
-- 1) Move SECURITY DEFINER helpers out of the API schema so signed-in users
--    cannot invoke them via PostgREST RPC. Policies keep working because they
--    reference functions by OID.
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

ALTER FUNCTION public.has_role(uuid, public.app_role) SET SCHEMA private;
ALTER FUNCTION public.current_user_ubs() SET SCHEMA private;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.current_user_ubs() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.current_user_ubs() TO authenticated, service_role;

-- 2) agendamentos: agentes can only insert for their own UBS
DROP POLICY IF EXISTS agend_insert_staff ON public.agendamentos;
CREATE POLICY agend_insert_staff ON public.agendamentos
FOR INSERT TO authenticated
WITH CHECK (
  private.has_role(auth.uid(), 'coordenador'::public.app_role)
  OR (
    private.has_role(auth.uid(), 'agente'::public.app_role)
    AND ubs_id = private.current_user_ubs()
  )
);

-- 3) ordens_servico: agentes can only insert for their own UBS
DROP POLICY IF EXISTS os_insert_coord ON public.ordens_servico;
CREATE POLICY os_insert_coord ON public.ordens_servico
FOR INSERT TO authenticated
WITH CHECK (
  private.has_role(auth.uid(), 'coordenador'::public.app_role)
  OR (
    private.has_role(auth.uid(), 'agente'::public.app_role)
    AND ubs_id = private.current_user_ubs()
  )
);

-- 4) assinaturas: forbid rows orphaned with both ficha_id and os_id null
ALTER TABLE public.assinaturas
  ADD CONSTRAINT assinaturas_ficha_or_os_required
  CHECK (ficha_id IS NOT NULL OR os_id IS NOT NULL);

-- 5) registros_ponto: make immutability explicit with restrictive deny policies
CREATE POLICY ponto_no_update ON public.registros_ponto
  AS RESTRICTIVE FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY ponto_no_delete ON public.registros_ponto
  AS RESTRICTIVE FOR DELETE TO authenticated USING (false);
