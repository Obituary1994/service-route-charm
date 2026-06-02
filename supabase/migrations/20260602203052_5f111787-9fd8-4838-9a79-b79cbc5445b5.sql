
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('agente', 'coordenador', 'auditor');
CREATE TYPE public.ficha_status AS ENUM ('rascunho', 'enviada', 'validada');
CREATE TYPE public.os_status AS ENUM ('pendente', 'em_andamento', 'concluida', 'cancelada');
CREATE TYPE public.os_prioridade AS ENUM ('baixa', 'media', 'alta', 'urgente');
CREATE TYPE public.ponto_tipo AS ENUM ('entrada', 'saida', 'intervalo_inicio', 'intervalo_fim');
CREATE TYPE public.falta_status AS ENUM ('pendente', 'aprovada', 'rejeitada');

-- UTIL: updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- UBS
CREATE TABLE public.ubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  endereco TEXT,
  cnes TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ubs TO authenticated;
GRANT ALL ON public.ubs TO service_role;
ALTER TABLE public.ubs ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER ubs_set_updated_at BEFORE UPDATE ON public.ubs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  matricula TEXT,
  ubs_id UUID REFERENCES public.ubs(id) ON DELETE SET NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.current_user_ubs()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ubs_id FROM public.profiles WHERE id = auth.uid()
$$;

-- HANDLE NEW USER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_completo, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  -- Default role: agente
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'agente');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PACIENTES
CREATE TABLE public.pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo TEXT NOT NULL,
  cns TEXT,
  cpf TEXT,
  data_nascimento DATE,
  telefone TEXT,
  endereco TEXT,
  bairro TEXT,
  ubs_id UUID REFERENCES public.ubs(id) ON DELETE SET NULL,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.pacientes TO authenticated;
GRANT ALL ON public.pacientes TO service_role;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER pacientes_set_updated_at BEFORE UPDATE ON public.pacientes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ORDENS DE SERVIÇO
CREATE TABLE public.ordens_servico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero SERIAL UNIQUE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  paciente_id UUID REFERENCES public.pacientes(id) ON DELETE SET NULL,
  agente_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ubs_id UUID REFERENCES public.ubs(id) ON DELETE SET NULL,
  status public.os_status NOT NULL DEFAULT 'pendente',
  prioridade public.os_prioridade NOT NULL DEFAULT 'media',
  prazo TIMESTAMPTZ,
  data_conclusao TIMESTAMPTZ,
  endereco_visita TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.ordens_servico TO authenticated;
GRANT ALL ON public.ordens_servico TO service_role;
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER os_set_updated_at BEFORE UPDATE ON public.ordens_servico FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_os_agente ON public.ordens_servico(agente_id);
CREATE INDEX idx_os_status ON public.ordens_servico(status);
CREATE INDEX idx_os_ubs ON public.ordens_servico(ubs_id);

-- AGENDAMENTOS
CREATE TABLE public.agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  paciente_id UUID REFERENCES public.pacientes(id) ON DELETE SET NULL,
  agente_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ubs_id UUID REFERENCES public.ubs(id) ON DELETE SET NULL,
  data_hora TIMESTAMPTZ NOT NULL,
  duracao_minutos INTEGER NOT NULL DEFAULT 30,
  recorrente BOOLEAN NOT NULL DEFAULT false,
  recorrencia_regra JSONB,
  notificado BOOLEAN NOT NULL DEFAULT false,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agendamentos TO authenticated;
GRANT ALL ON public.agendamentos TO service_role;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER agend_set_updated_at BEFORE UPDATE ON public.agendamentos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_agend_agente_data ON public.agendamentos(agente_id, data_hora);

-- FICHAS DE VISITA
CREATE TABLE public.fichas_visita (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID REFERENCES public.ordens_servico(id) ON DELETE SET NULL,
  paciente_id UUID REFERENCES public.pacientes(id) ON DELETE SET NULL,
  agente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ubs_id UUID REFERENCES public.ubs(id) ON DELETE SET NULL,
  status public.ficha_status NOT NULL DEFAULT 'rascunho',
  data_visita DATE,
  hora_visita TIME,
  motivo_visita TEXT,
  pressao_arterial TEXT,
  temperatura NUMERIC(4,1),
  peso NUMERIC(5,2),
  altura NUMERIC(4,2),
  glicemia NUMERIC(5,1),
  observacoes TEXT,
  encaminhamentos TEXT,
  dados_extras JSONB DEFAULT '{}'::jsonb,
  enviada_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fichas_visita TO authenticated;
GRANT ALL ON public.fichas_visita TO service_role;
ALTER TABLE public.fichas_visita ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER fichas_set_updated_at BEFORE UPDATE ON public.fichas_visita FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_fichas_agente ON public.fichas_visita(agente_id);

-- REGISTROS DE PONTO
CREATE TABLE public.registros_ponto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ubs_id UUID REFERENCES public.ubs(id) ON DELETE SET NULL,
  tipo public.ponto_tipo NOT NULL,
  registrado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.registros_ponto TO authenticated;
GRANT ALL ON public.registros_ponto TO service_role;
ALTER TABLE public.registros_ponto ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_ponto_agente_data ON public.registros_ponto(agente_id, registrado_em);

-- FALTAS / JUSTIFICATIVAS
CREATE TABLE public.faltas_justificativas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ubs_id UUID REFERENCES public.ubs(id) ON DELETE SET NULL,
  data_falta DATE NOT NULL,
  motivo TEXT NOT NULL,
  anexo_url TEXT,
  status public.falta_status NOT NULL DEFAULT 'pendente',
  revisado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  revisado_em TIMESTAMPTZ,
  observacao_revisor TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.faltas_justificativas TO authenticated;
GRANT ALL ON public.faltas_justificativas TO service_role;
ALTER TABLE public.faltas_justificativas ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER faltas_set_updated_at BEFORE UPDATE ON public.faltas_justificativas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ASSINATURAS
CREATE TABLE public.assinaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ficha_id UUID REFERENCES public.fichas_visita(id) ON DELETE CASCADE,
  os_id UUID REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  assinante_nome TEXT NOT NULL,
  assinante_documento TEXT,
  assinatura_data_url TEXT NOT NULL,
  assinado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.assinaturas TO authenticated;
GRANT ALL ON public.assinaturas TO service_role;
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;

-- NOTIFICACOES
CREATE TABLE public.notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'info',
  lida BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notificacoes TO authenticated;
GRANT ALL ON public.notificacoes TO service_role;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_notif_user ON public.notificacoes(user_id, lida);

-- RLS POLICIES

-- profiles
CREATE POLICY "profiles_select_self_or_staff" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'coordenador') OR public.has_role(auth.uid(), 'auditor'));
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- user_roles (read-only for self + staff)
CREATE POLICY "roles_select_self_or_staff" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'coordenador') OR public.has_role(auth.uid(), 'auditor'));

-- ubs
CREATE POLICY "ubs_select_all_auth" ON public.ubs FOR SELECT TO authenticated USING (true);

-- pacientes
CREATE POLICY "pacientes_select_ubs" ON public.pacientes FOR SELECT TO authenticated
  USING (ubs_id = public.current_user_ubs() OR public.has_role(auth.uid(), 'auditor'));
CREATE POLICY "pacientes_insert_staff" ON public.pacientes FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'agente') OR public.has_role(auth.uid(), 'coordenador'));
CREATE POLICY "pacientes_update_staff" ON public.pacientes FOR UPDATE TO authenticated
  USING (ubs_id = public.current_user_ubs() AND (public.has_role(auth.uid(), 'agente') OR public.has_role(auth.uid(), 'coordenador')));

-- ordens_servico
CREATE POLICY "os_select_scope" ON public.ordens_servico FOR SELECT TO authenticated
  USING (agente_id = auth.uid()
         OR (ubs_id = public.current_user_ubs() AND public.has_role(auth.uid(), 'coordenador'))
         OR public.has_role(auth.uid(), 'auditor'));
CREATE POLICY "os_insert_coord" ON public.ordens_servico FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'coordenador') OR public.has_role(auth.uid(), 'agente'));
CREATE POLICY "os_update_scope" ON public.ordens_servico FOR UPDATE TO authenticated
  USING (agente_id = auth.uid() OR (ubs_id = public.current_user_ubs() AND public.has_role(auth.uid(), 'coordenador')));

-- agendamentos
CREATE POLICY "agend_select_scope" ON public.agendamentos FOR SELECT TO authenticated
  USING (agente_id = auth.uid()
         OR (ubs_id = public.current_user_ubs() AND public.has_role(auth.uid(), 'coordenador'))
         OR public.has_role(auth.uid(), 'auditor'));
CREATE POLICY "agend_insert_staff" ON public.agendamentos FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'coordenador') OR public.has_role(auth.uid(), 'agente'));
CREATE POLICY "agend_update_scope" ON public.agendamentos FOR UPDATE TO authenticated
  USING (agente_id = auth.uid() OR (ubs_id = public.current_user_ubs() AND public.has_role(auth.uid(), 'coordenador')));
CREATE POLICY "agend_delete_coord" ON public.agendamentos FOR DELETE TO authenticated
  USING (ubs_id = public.current_user_ubs() AND public.has_role(auth.uid(), 'coordenador'));

-- fichas_visita
CREATE POLICY "fichas_select_scope" ON public.fichas_visita FOR SELECT TO authenticated
  USING (agente_id = auth.uid()
         OR (ubs_id = public.current_user_ubs() AND public.has_role(auth.uid(), 'coordenador'))
         OR public.has_role(auth.uid(), 'auditor'));
CREATE POLICY "fichas_insert_self" ON public.fichas_visita FOR INSERT TO authenticated
  WITH CHECK (agente_id = auth.uid());
CREATE POLICY "fichas_update_self_or_coord" ON public.fichas_visita FOR UPDATE TO authenticated
  USING (agente_id = auth.uid() OR (ubs_id = public.current_user_ubs() AND public.has_role(auth.uid(), 'coordenador')));
CREATE POLICY "fichas_delete_self_rascunho" ON public.fichas_visita FOR DELETE TO authenticated
  USING (agente_id = auth.uid() AND status = 'rascunho');

-- registros_ponto
CREATE POLICY "ponto_select_scope" ON public.registros_ponto FOR SELECT TO authenticated
  USING (agente_id = auth.uid()
         OR (ubs_id = public.current_user_ubs() AND public.has_role(auth.uid(), 'coordenador'))
         OR public.has_role(auth.uid(), 'auditor'));
CREATE POLICY "ponto_insert_self" ON public.registros_ponto FOR INSERT TO authenticated
  WITH CHECK (agente_id = auth.uid());

-- faltas
CREATE POLICY "faltas_select_scope" ON public.faltas_justificativas FOR SELECT TO authenticated
  USING (agente_id = auth.uid()
         OR (ubs_id = public.current_user_ubs() AND public.has_role(auth.uid(), 'coordenador'))
         OR public.has_role(auth.uid(), 'auditor'));
CREATE POLICY "faltas_insert_self" ON public.faltas_justificativas FOR INSERT TO authenticated
  WITH CHECK (agente_id = auth.uid());
CREATE POLICY "faltas_update_scope" ON public.faltas_justificativas FOR UPDATE TO authenticated
  USING (agente_id = auth.uid() OR (ubs_id = public.current_user_ubs() AND public.has_role(auth.uid(), 'coordenador')));

-- assinaturas
CREATE POLICY "assin_select_scope" ON public.assinaturas FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.fichas_visita f WHERE f.id = ficha_id AND (f.agente_id = auth.uid() OR (f.ubs_id = public.current_user_ubs() AND public.has_role(auth.uid(), 'coordenador')) OR public.has_role(auth.uid(), 'auditor')))
    OR EXISTS (SELECT 1 FROM public.ordens_servico o WHERE o.id = os_id AND (o.agente_id = auth.uid() OR (o.ubs_id = public.current_user_ubs() AND public.has_role(auth.uid(), 'coordenador')) OR public.has_role(auth.uid(), 'auditor')))
  );
CREATE POLICY "assin_insert_auth" ON public.assinaturas FOR INSERT TO authenticated WITH CHECK (true);

-- notificacoes
CREATE POLICY "notif_select_own" ON public.notificacoes FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notif_update_own" ON public.notificacoes FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- SEED UBS
INSERT INTO public.ubs (nome, endereco, cnes) VALUES
  ('UBS Central', 'Rua Principal, 100 - Centro', '0000001'),
  ('UBS Jardim das Flores', 'Av. das Flores, 250 - Jd. das Flores', '0000002'),
  ('UBS Vila Nova', 'Rua das Acácias, 50 - Vila Nova', '0000003');
