import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Activity, AlertTriangle, CheckCircle2, ClipboardList, Clock, Calendar,
  TrendingUp, Users, Briefcase, ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { profile, role, userId } = useProfile();

  const { data: kpis } = useQuery({
    queryKey: ["dashboard-kpis", userId, role],
    enabled: !!userId,
    queryFn: async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const isAgent = role === "agente";

      const osQuery = supabase.from("ordens_servico").select("id, status, prazo", { count: "exact", head: false });
      if (isAgent) osQuery.eq("agente_id", userId!);
      const { data: os } = await osQuery;

      const fichasQuery = supabase.from("fichas_visita").select("id, status, created_at", { head: false });
      if (isAgent) fichasQuery.eq("agente_id", userId!);
      const { data: fichas } = await fichasQuery.gte("created_at", today.toISOString());

      const faltasQuery = supabase.from("faltas_justificativas").select("id, status", { head: false });
      if (isAgent) faltasQuery.eq("agente_id", userId!);
      const { data: faltas } = await faltasQuery.eq("status", "pendente");

      const pendentes = (os ?? []).filter(o => o.status === "pendente").length;
      const concluidas = (os ?? []).filter(o => o.status === "concluida").length;
      const prazoVencendo = (os ?? []).filter(o => o.prazo && new Date(o.prazo).getTime() - Date.now() < 24 * 3600 * 1000 && o.status !== "concluida").length;

      return {
        totalOS: (os ?? []).length,
        pendentes,
        concluidas,
        prazoVencendo,
        fichasHoje: (fichas ?? []).length,
        faltasPendentes: (faltas ?? []).length,
      };
    },
  });

  const { data: proximas } = useQuery({
    queryKey: ["agendamentos-proximos", userId, role],
    enabled: !!userId,
    queryFn: async () => {
      const q = supabase.from("agendamentos")
        .select("id, data_hora, observacoes, paciente:paciente_id(nome_completo)")
        .gte("data_hora", new Date().toISOString())
        .order("data_hora", { ascending: true })
        .limit(5);
      if (role === "agente") q.eq("agente_id", userId!);
      const { data } = await q;
      return data ?? [];
    },
  });

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  })();

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {greeting}, {profile?.nome_completo?.split(" ")[0] ?? "agente"}.
          </h1>
        </div>
        <div className="flex gap-2">
          <Link to="/ponto"><Button variant="outline"><Clock className="mr-2 h-4 w-4" />Bater ponto</Button></Link>
          <Link to="/ficha/nova"><Button><ClipboardList className="mr-2 h-4 w-4" />Nova ficha</Button></Link>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="OS ativas" value={kpis?.totalOS ?? 0} icon={Briefcase} tone="primary" />
        <KpiCard label="Pendentes" value={kpis?.pendentes ?? 0} icon={Activity} tone="warning" />
        <KpiCard label="Concluídas" value={kpis?.concluidas ?? 0} icon={CheckCircle2} tone="success" />
        <KpiCard label="Prazos críticos" value={kpis?.prazoVencendo ?? 0} icon={AlertTriangle} tone="accent" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Próximas visitas</CardTitle>
              <p className="text-sm text-muted-foreground">Agendamentos das próximas horas/dias</p>
            </div>
            <Link to="/agenda"><Button variant="ghost" size="sm">Ver agenda<ArrowRight className="ml-1 h-4 w-4"/></Button></Link>
          </CardHeader>
          <CardContent>
            {(!proximas || proximas.length === 0) ? (
              <EmptyState icon={Calendar} title="Sem visitas agendadas" desc="Novos agendamentos aparecerão aqui." />
            ) : (
              <div className="divide-y divide-border">
                {proximas.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary-soft text-primary">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium">{a.paciente?.nome_completo ?? "Paciente"}</div>
                        <div className="text-xs text-muted-foreground">{a.observacoes ?? "Visita domiciliar"}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-foreground">
                        {format(new Date(a.data_hora), "dd/MM HH:mm")}
                      </div>
                      <Badge variant="secondary" className="mt-1 text-[10px]">agendado</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Resumo do dia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatRow icon={ClipboardList} label="Fichas hoje" value={kpis?.fichasHoje ?? 0} />
            <StatRow icon={AlertTriangle} label="Faltas pendentes" value={kpis?.faltasPendentes ?? 0} />
            <StatRow icon={TrendingUp} label="Taxa de conclusão" value={`${kpis && kpis.totalOS > 0 ? Math.round((kpis.concluidas / kpis.totalOS) * 100) : 0}%`} />
            {role !== "agente" && (
              <div className="mt-4 rounded-lg border border-dashed border-border p-4 text-sm">
                <Users className="mb-2 h-4 w-4 text-primary" />
                <div className="font-medium">Visão de {role === "coordenador" ? "coordenação" : "auditoria"}</div>
                <div className="text-muted-foreground">Acesso ampliado a OS, agendas e fichas da UBS.</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: any; tone: "primary" | "warning" | "success" | "accent" }) {
  const styles = {
    primary: "bg-primary-soft text-primary",
    warning: "bg-warning/15 text-warning-foreground",
    success: "bg-success/15 text-success",
    accent: "bg-accent/15 text-accent",
  }[tone];
  return (
    <Card className="shadow-soft">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-1 font-display text-3xl font-bold">{value}</div>
        </div>
        <div className={`grid h-12 w-12 place-items-center rounded-xl ${styles}`}>
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
}

function StatRow({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <div className="font-display text-lg font-semibold">{value}</div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="grid place-items-center gap-2 py-10 text-center text-muted-foreground">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-muted">
        <Icon className="h-5 w-5" />
      </div>
      <div className="font-medium text-foreground">{title}</div>
      <div className="text-sm">{desc}</div>
    </div>
  );
}
