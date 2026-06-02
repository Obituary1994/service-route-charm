import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { format, subDays } from "date-fns";

export const Route = createFileRoute("/_authenticated/relatorios")({
  component: RelatoriosPage,
});

function RelatoriosPage() {
  const { data: chart } = useQuery({
    queryKey: ["relatorio-7d"],
    queryFn: async () => {
      const start = subDays(new Date(), 6); start.setHours(0, 0, 0, 0);
      const { data } = await supabase.from("fichas_visita").select("created_at").gte("created_at", start.toISOString());
      const buckets: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "dd/MM");
        buckets[d] = 0;
      }
      (data ?? []).forEach(f => {
        const d = format(new Date(f.created_at), "dd/MM");
        if (d in buckets) buckets[d]++;
      });
      return Object.entries(buckets).map(([dia, fichas]) => ({ dia, fichas }));
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Relatórios Analíticos</h1>
        <p className="text-sm text-muted-foreground">Indicadores gerenciais consolidados.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat icon={BarChart3} label="Fichas (7 dias)" value={(chart ?? []).reduce((a, b) => a + b.fichas, 0)} />
        <Stat icon={TrendingUp} label="Média diária" value={Math.round(((chart ?? []).reduce((a, b) => a + b.fichas, 0)) / 7)} />
        <Stat icon={Calendar} label="Período" value="7 dias" small />
      </div>

      <Card className="shadow-soft">
        <CardHeader><CardTitle>Fichas enviadas — últimos 7 dias</CardTitle></CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="dia" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="fichas" fill="oklch(0.45 0.09 180)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value, small }: { icon: any; label: string; value: any; small?: boolean }) {
  return (
    <Card className="shadow-soft">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className={`mt-1 font-display font-bold ${small ? "text-xl" : "text-3xl"}`}>{value}</div>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary">
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
}
