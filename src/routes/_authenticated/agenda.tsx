import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/agenda")({
  component: AgendaPage,
});

function AgendaPage() {
  const { userId, role } = useProfile();

  const { data: agendamentos } = useQuery({
    queryKey: ["agenda-semana", userId, role],
    enabled: !!userId,
    queryFn: async () => {
      const start = startOfWeek(new Date(), { weekStartsOn: 1 });
      const end = addDays(start, 7);
      const q = supabase.from("agendamentos")
        .select("id, data_hora, observacoes, paciente:paciente_id(nome_completo), os_id")
        .gte("data_hora", start.toISOString()).lt("data_hora", end.toISOString())
        .order("data_hora");
      if (role === "agente") q.eq("agente_id", userId!);
      const { data } = await q;
      return data ?? [];
    },
  });

  const { data: osHoje } = useQuery({
    queryKey: ["os-hoje", userId, role],
    enabled: !!userId,
    queryFn: async () => {
      const q = supabase.from("ordens_servico")
        .select("id, numero, titulo, status, prioridade, prazo")
        .neq("status", "concluida")
        .order("prazo", { ascending: true, nullsFirst: false })
        .limit(10);
      if (role === "agente") q.eq("agente_id", userId!);
      const { data } = await q;
      return data ?? [];
    },
  });

  const semana = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Agenda & Ordens de Serviço</h1>
          <p className="text-sm text-muted-foreground">Semana de {format(semana[0], "dd/MM")} a {format(semana[6], "dd/MM")}</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" />Novo agendamento</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        {semana.map(dia => {
          const itens = (agendamentos ?? []).filter(a => isSameDay(new Date(a.data_hora), dia));
          const isHoje = isSameDay(dia, new Date());
          return (
            <Card key={dia.toISOString()} className={`shadow-soft ${isHoje ? "border-primary" : ""}`}>
              <CardHeader className="pb-2">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{format(dia, "EEE", { locale: ptBR })}</div>
                <CardTitle className={`font-display text-2xl ${isHoje ? "text-primary" : ""}`}>{format(dia, "dd")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {itens.length === 0 ? (
                  <div className="text-xs text-muted-foreground">—</div>
                ) : itens.map((a: any) => (
                  <div key={a.id} className="rounded-md bg-primary-soft p-2 text-xs">
                    <div className="font-semibold text-primary">{format(new Date(a.data_hora), "HH:mm")}</div>
                    <div className="line-clamp-2 text-foreground">{a.paciente?.nome_completo ?? "—"}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Ordens de serviço ativas</CardTitle>
        </CardHeader>
        <CardContent>
          {(!osHoje || osHoje.length === 0) ? (
            <div className="grid place-items-center gap-2 py-10 text-center text-muted-foreground">
              <Calendar className="h-8 w-8" />
              Sem OS pendentes no momento.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {osHoje.map(os => (
                <Link key={os.id} to="/os/$id" params={{ id: os.id }} className="flex items-center justify-between gap-4 py-3 hover:bg-muted/40 -mx-2 px-2 rounded">
                  <div>
                    <div className="text-xs text-muted-foreground">OS #{os.numero}</div>
                    <div className="font-medium">{os.titulo}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={os.prioridade === "urgente" ? "destructive" : "secondary"}>{os.prioridade}</Badge>
                    <Badge variant="outline">{os.status}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
