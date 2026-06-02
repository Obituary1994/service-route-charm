import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Check, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/faltas")({
  component: FaltasPage,
});

function FaltasPage() {
  const { userId, role, profile } = useProfile();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [motivo, setMotivo] = useState("");

  const { data: faltas } = useQuery({
    queryKey: ["faltas", userId, role],
    enabled: !!userId,
    queryFn: async () => {
      const q = supabase.from("faltas_justificativas")
        .select("*, agente:agente_id(nome_completo)")
        .order("created_at", { ascending: false });
      if (role === "agente") q.eq("agente_id", userId!);
      const { data } = await q;
      return data ?? [];
    },
  });

  const submit = async () => {
    if (!motivo.trim()) return toast.error("Informe o motivo.");
    const { error } = await supabase.from("faltas_justificativas").insert({
      agente_id: userId!,
      ubs_id: profile?.ubs_id,
      data_falta: data,
      motivo,
    });
    if (error) return toast.error(error.message);
    toast.success("Justificativa enviada");
    setOpen(false); setMotivo("");
    qc.invalidateQueries({ queryKey: ["faltas"] });
  };

  const revisar = async (id: string, status: "aprovada" | "rejeitada") => {
    const { error } = await supabase.from("faltas_justificativas").update({
      status, revisado_por: userId!, revisado_em: new Date().toISOString(),
    }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["faltas"] });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Faltas & Justificativas</h1>
          <p className="text-sm text-muted-foreground">Registre faltas e acompanhe aprovações.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Nova justificativa</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Justificar falta</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Data da falta</Label><Input type="date" value={data} onChange={e => setData(e.target.value)} /></div>
              <div><Label>Motivo</Label><Textarea rows={4} value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Descreva o motivo da ausência" /></div>
            </div>
            <DialogFooter><Button onClick={submit}>Enviar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-soft">
        <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
        <CardContent>
          {(!faltas || faltas.length === 0) ? (
            <div className="py-10 text-center text-muted-foreground">Nenhuma falta registrada.</div>
          ) : (
            <div className="divide-y divide-border">
              {faltas.map((f: any) => (
                <div key={f.id} className="flex items-start justify-between gap-4 py-4">
                  <div className="flex-1">
                    {role !== "agente" && <div className="text-xs text-muted-foreground">{f.agente?.nome_completo}</div>}
                    <div className="font-medium">{format(new Date(f.data_falta), "dd/MM/yyyy")}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{f.motivo}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={f.status === "aprovada" ? "default" : f.status === "rejeitada" ? "destructive" : "secondary"}>
                      {f.status}
                    </Badge>
                    {role === "coordenador" && f.status === "pendente" && (
                      <div className="flex gap-1">
                        <Button size="icon" variant="outline" onClick={() => revisar(f.id, "aprovada")}><Check className="h-4 w-4 text-success" /></Button>
                        <Button size="icon" variant="outline" onClick={() => revisar(f.id, "rejeitada")}><X className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
