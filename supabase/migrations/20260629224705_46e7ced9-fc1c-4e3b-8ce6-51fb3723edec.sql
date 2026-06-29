INSERT INTO public.user_roles (user_id, role)
SELECT id, 'auditor'::app_role FROM public.profiles
WHERE email IN ('anavictorianeves37@gmail.com','12345@gmail.com','123@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;