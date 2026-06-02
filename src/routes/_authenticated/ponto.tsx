import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, MapPin, LogIn, LogOut, Coffee, CoffeeIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/ponto")({
  component: PontoPage,
});

type Tipo = "entrada" | "saida" | "intervalo_inicio" | "intervalo_fim";

function PontoPage() {
  const { userId, profile } = useProfile();
  const qc = useQueryClient();
  const [loading, setLoading] = useState<Tipo | null>(null);

  const { data: registros } = useQuery({
    queryKey: ["registros-ponto", userId],
    enabled: !!userId,
    queryFn: async () => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const { data } = await supabase.from("registros_ponto")
        .select("*").eq("agente_id", userId!)
        .gte("registrado_em", start.toISOString())
        .order("registrado_em", { ascending: false });
      return data ?? [];
    },
  });

  const bater = async (tipo: Tipo) => {
    if (!userId) return;
    setLoading(tipo);
    let coords: { latitude: number | null; longitude: number | null } = { latitude: null, longitude: null };
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
      );
      coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    } catch { /* sem geolocalização tudo bem */ }

    const { error } = await supabase.from("registros_ponto").insert({
      agente_id: userId,
      ubs_id: profile?.ubs_id,
      tipo,
      ...coords,
    });
    setLoading(null);
    if (error) return toast.error(error.message);
    toast.success("Ponto registrado");
    qc.invalidateQueries({ queryKey: ["registros-ponto"] });
  };

  const tipoMap: Record<Tipo, { label: string; icon: any; tone: string }> = {
    entrada: { label: "Entrada", icon: LogIn, tone: "bg-success/15 text-success" },
    intervalo_inicio: { label: "Início intervalo", icon: Coffee, tone: "bg-warning/15 text-warning-foreground" },
    intervalo_fim: { label: "Fim intervalo", icon: CoffeeIcon, tone: "bg-primary-soft text-primary" },
    saida: { label: "Saída", icon: LogOut, tone: "bg-accent/15 text-accent" },
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Registro de ponto</h1>
        <p className="text-sm text-muted-foreground">
          {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      <Card className="shadow-soft">
        <CardContent className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(tipoMap) as Tipo[]).map(t => (
            <Button
              key={t}
              variant="outline"
              className="h-24 flex-col gap-2"
              disabled={loading === t}
              onClick={() => bater(t)}
            >
              <div className={`grid h-10 w-10 place-items-center rounded-lg ${tipoMap[t].tone}`}>
                {(() => { const I = tipoMap[t].icon; return <I className="h-5 w-5" />; })()}
              </div>
              <span className="font-medium">{tipoMap[t].label}</span>
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader><CardTitle>Hoje</CardTitle></CardHeader>
        <CardContent>
          {(!registros || registros.length === 0) ? (
            <div className="py-10 text-center text-muted-foreground">Nenhum registro hoje ainda.</div>
          ) : (
            <div className="divide-y divide-border">
              {registros.map(r => {
                const info = tipoMap[r.tipo as Tipo];
                return (
                  <div key={r.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`grid h-10 w-10 place-items-center rounded-lg ${info.tone}`}>
                        {(() => { const I = info.icon; return <I className="h-4 w-4" />; })()}
                      </div>
                      <div>
                        <div className="font-medium">{info.label}</div>
                        {r.latitude && r.longitude && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" /> {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(r.registrado_em), "HH:mm")}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
