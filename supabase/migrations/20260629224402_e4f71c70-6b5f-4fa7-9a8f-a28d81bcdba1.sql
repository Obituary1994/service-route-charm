INSERT INTO public.user_roles (user_id, role) VALUES 
  ('05261af8-a6e4-45de-81d4-f14a5eb58b99', 'auditor'),
  ('05261af8-a6e4-45de-81d4-f14a5eb58b99', 'coordenador')
ON CONFLICT (user_id, role) DO NOTHING;