import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, FileSearch, Clock, AlertOctagon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/auditoria")({
  component: AuditoriaPage,
});

function AuditoriaPage() {
  const { role } = useProfile();

  const { data: fichas } = useQuery({
    queryKey: ["audit-fichas"],
    queryFn: async () => {
      const { data } = await supabase.from("fichas_visita")
        .select("id, status, created_at, agente:agente_id(nome_completo), paciente:paciente_id(nome_completo)")
        .order("created_at", { ascending: false }).limit(20);
      return data ?? [];
    },
  });

  if (role !== "auditor" && role !== "coordenador") {
    return (
      <Card className="shadow-soft">
        <CardContent className="flex items-center gap-3 p-8">
          <AlertOctagon className="h-6 w-6 text-warning-foreground" />
          <div>
            <div className="font-semibold">Acesso restrito</div>
            <div className="text-sm text-muted-foreground">Este portal é disponível apenas para coordenadores e auditores.</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Portal de Auditoria UBS</h1>
          <p className="text-sm text-muted-foreground">Trilha de eventos, fichas e registros para revisão.</p>
        </div>
      </div>

      <Card className="shadow-soft">
        <CardHeader><CardTitle><FileSearch className="mr-2 inline h-4 w-4" />Últimas fichas enviadas</CardTitle></CardHeader>
        <CardContent>
          {(!fichas || fichas.length === 0) ? (
            <div className="py-10 text-center text-muted-foreground">Sem fichas para revisar.</div>
          ) : (
            <div className="divide-y divide-border">
              {fichas.map((f: any) => (
                <div key={f.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium">{f.paciente?.nome_completo ?? "Sem paciente"}</div>
                    <div className="text-xs text-muted-foreground">
                      Por {f.agente?.nome_completo ?? "—"} · <Clock className="inline h-3 w-3" /> {format(new Date(f.created_at), "dd/MM HH:mm")}
                    </div>
                  </div>
                  <Badge variant={f.status === "enviada" ? "default" : f.status === "validada" ? "secondary" : "outline"}>{f.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
