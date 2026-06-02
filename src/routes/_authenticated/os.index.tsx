import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/os/")({
  component: OsListPage,
});

function OsListPage() {
  const { userId, role } = useProfile();
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<string>("todos");

  const { data: lista } = useQuery({
    queryKey: ["os-list", userId, role, status],
    enabled: !!userId,
    queryFn: async () => {
      const q = supabase.from("ordens_servico")
        .select("*, paciente:paciente_id(nome_completo)")
        .order("created_at", { ascending: false }).limit(100);
      if (role === "agente") q.eq("agente_id", userId!);
      if (status !== "todos") q.eq("status", status as any);
      const { data } = await q;
      return data ?? [];
    },
  });

  const filtered = (lista ?? []).filter((o: any) =>
    !busca || o.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
    o.paciente?.nome_completo?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Ordens de Serviço</h1>
        <p className="text-sm text-muted-foreground">Filtros avançados de busca por título, paciente e status.</p>
      </div>

      <Card className="shadow-soft">
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar..." className="pl-9" value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="md:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="em_andamento">Em andamento</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader><CardTitle>{filtered.length} ordens encontradas</CardTitle></CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">Nenhuma OS encontrada com os filtros atuais.</div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((os: any) => (
                <Link key={os.id} to="/os/$id" params={{ id: os.id }} className="flex items-center justify-between gap-4 py-3 -mx-2 px-2 rounded hover:bg-muted/40">
                  <div>
                    <div className="text-xs text-muted-foreground">OS #{os.numero} · {format(new Date(os.created_at), "dd/MM/yy")}</div>
                    <div className="font-medium">{os.titulo}</div>
                    <div className="text-sm text-muted-foreground">{os.paciente?.nome_completo ?? "—"}</div>
                  </div>
                  <div className="flex gap-2">
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
