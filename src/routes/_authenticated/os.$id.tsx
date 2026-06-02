import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/os/$id")({
  component: OsDetalhe,
});

function OsDetalhe() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const { data: os } = useQuery({
    queryKey: ["os", id],
    queryFn: async () => {
      const { data } = await supabase.from("ordens_servico")
        .select("*, paciente:paciente_id(nome_completo, telefone, endereco)")
        .eq("id", id).maybeSingle();
      return data;
    },
  });

  const concluir = async () => {
    const { error } = await supabase.from("ordens_servico")
      .update({ status: "concluida", data_conclusao: new Date().toISOString() })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("OS concluída");
    qc.invalidateQueries({ queryKey: ["os", id] });
  };

  if (!os) return <div className="text-muted-foreground">Carregando...</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/agenda" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Ordem de Serviço #{os.numero}</div>
          <h1 className="font-display text-3xl font-bold">{os.titulo}</h1>
        </div>
        <div className="flex gap-2">
          <Badge variant={os.prioridade === "urgente" ? "destructive" : "secondary"}>{os.prioridade}</Badge>
          <Badge variant="outline">{os.status}</Badge>
        </div>
      </div>

      <Card className="shadow-soft">
        <CardHeader><CardTitle>Detalhes</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Descrição">{os.descricao ?? "—"}</Row>
          <Row label="Paciente">{(os as any).paciente?.nome_completo ?? "—"}</Row>
          <Row label="Endereço">{os.endereco_visita ?? (os as any).paciente?.endereco ?? "—"}</Row>
          <Row label="Telefone">{(os as any).paciente?.telefone ?? "—"}</Row>
          <Row label="Prazo">{os.prazo ? format(new Date(os.prazo), "dd/MM/yyyy HH:mm") : "—"}</Row>
        </CardContent>
      </Card>

      {os.status !== "concluida" && (
        <div className="flex justify-end">
          <Button onClick={concluir}><CheckCircle2 className="mr-2 h-4 w-4" />Marcar como concluída</Button>
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 border-b border-border pb-2 last:border-0">
      <div className="text-muted-foreground">{label}</div>
      <div className="col-span-2 font-medium">{children}</div>
    </div>
  );
}
