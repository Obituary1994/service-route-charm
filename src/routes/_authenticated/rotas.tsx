import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Route as RouteIcon, ArrowUp, ArrowDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/rotas")({
  component: RotasPage,
});

function RotasPage() {
  const { userId, role } = useProfile();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: visitas } = useQuery({
    queryKey: ["rota-hoje", userId, role],
    enabled: !!userId,
    queryFn: async () => {
      const q = supabase.from("agendamentos")
        .select("id, data_hora, observacoes, paciente:paciente_id(nome_completo, endereco, bairro)")
        .gte("data_hora", today.toISOString()).lt("data_hora", tomorrow.toISOString())
        .order("data_hora");
      if (role === "agente") q.eq("agente_id", userId!);
      const { data } = await q;
      return data ?? [];
    },
  });

  const [ordem, setOrdem] = useState<string[]>([]);
  const lista = ordem.length ? ordem.map(id => (visitas ?? []).find((v: any) => v.id === id)).filter(Boolean) : (visitas ?? []);

  const mover = (id: string, dir: -1 | 1) => {
    const atual = ordem.length ? [...ordem] : (visitas ?? []).map((v: any) => v.id);
    const i = atual.indexOf(id);
    const j = i + dir;
    if (j < 0 || j >= atual.length) return;
    [atual[i], atual[j]] = [atual[j], atual[i]];
    setOrdem(atual);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Modelador de rotas</h1>
        <p className="text-sm text-muted-foreground">Ordene as visitas do dia conforme sua melhor rota.</p>
      </div>

      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle><RouteIcon className="mr-2 inline h-4 w-4" />Visitas de hoje ({lista.length})</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setOrdem([])}>Resetar ordem</Button>
        </CardHeader>
        <CardContent>
          {lista.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">Nenhuma visita agendada para hoje.</div>
          ) : (
            <ol className="space-y-2">
              {lista.map((v: any, idx) => (
                <li key={v.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-soft">
                  <Badge variant="secondary" className="h-7 w-7 justify-center rounded-full font-display text-base">{idx + 1}</Badge>
                  <div className="flex-1">
                    <div className="font-medium">{v.paciente?.nome_completo ?? "—"}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {v.paciente?.endereco ?? "Endereço não informado"}
                      {v.paciente?.bairro && ` · ${v.paciente.bairro}`}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">{format(new Date(v.data_hora), "HH:mm")}</div>
                  <div className="flex flex-col">
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => mover(v.id, -1)}><ArrowUp className="h-3 w-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => mover(v.id, 1)}><ArrowDown className="h-3 w-3" /></Button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
