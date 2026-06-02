import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "agente" | "coordenador" | "auditor";

export function useProfile() {
  const { data } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*, ubs:ubs_id(id, nome)").eq("id", u.user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", u.user.id),
      ]);
      const roleOrder: AppRole[] = ["auditor", "coordenador", "agente"];
      const userRoles = (roles ?? []).map(r => r.role as AppRole);
      const role = roleOrder.find(r => userRoles.includes(r)) ?? "agente";
      return {
        userId: u.user.id,
        profile,
        role,
        roles: userRoles,
        ubs: profile?.ubs as { id: string; nome: string } | null,
      };
    },
    staleTime: 60_000,
  });

  return {
    userId: data?.userId,
    profile: data?.profile,
    role: data?.role as AppRole | undefined,
    roles: data?.roles ?? [],
    ubs: data?.ubs ?? null,
  };
}
