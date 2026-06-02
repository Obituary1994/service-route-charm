import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Save, Send, Loader2, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/ficha/nova")({
  component: FichaNova,
});

type FichaState = {
  id?: string;
  paciente_id?: string | null;
  data_visita: string;
  hora_visita: string;
  motivo_visita: string;
  pressao_arterial: string;
  temperatura: string;
  peso: string;
  altura: string;
  glicemia: string;
  observacoes: string;
  encaminhamentos: string;
};

const empty: FichaState = {
  data_visita: new Date().toISOString().slice(0, 10),
  hora_visita: new Date().toTimeString().slice(0, 5),
  motivo_visita: "",
  pressao_arterial: "",
  temperatura: "",
  peso: "",
  altura: "",
  glicemia: "",
  observacoes: "",
  encaminhamentos: "",
};

function FichaNova() {
  const { userId, profile } = useProfile();
  const navigate = useNavigate();
  const [state, setState] = useState<FichaState>(empty);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<number | null>(null);

  const { data: pacientes } = useQuery({
    queryKey: ["pacientes-list"],
    queryFn: async () => {
      const { data } = await supabase.from("pacientes").select("id, nome_completo").order("nome_completo").limit(100);
      return data ?? [];
    },
  });

  const update = <K extends keyof FichaState>(k: K, v: FichaState[K]) => {
    setState(prev => ({ ...prev, [k]: v }));
  };

  // Autosave (rascunho)
  useEffect(() => {
    if (!userId) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      setSaving(true);
      const payload = {
        agente_id: userId,
        ubs_id: profile?.ubs_id,
        status: "rascunho" as const,
        paciente_id: state.paciente_id || null,
        data_visita: state.data_visita || null,
        hora_visita: state.hora_visita || null,
        motivo_visita: state.motivo_visita || null,
        pressao_arterial: state.pressao_arterial || null,
        temperatura: state.temperatura ? Number(state.temperatura) : null,
        peso: state.peso ? Number(state.peso) : null,
        altura: state.altura ? Number(state.altura) : null,
        glicemia: state.glicemia ? Number(state.glicemia) : null,
        observacoes: state.observacoes || null,
        encaminhamentos: state.encaminhamentos || null,
      };
      let id = state.id;
      if (id) {
        await supabase.from("fichas_visita").update(payload).eq("id", id);
      } else {
        const { data } = await supabase.from("fichas_visita").insert(payload).select("id").maybeSingle();
        id = data?.id;
        if (id) setState(p => ({ ...p, id }));
      }
      setSaving(false);
      setSavedAt(new Date());
    }, 900);

    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [state, userId, profile?.ubs_id]);

  const handleSubmit = async () => {
    if (!state.id) return toast.error("Aguarde o salvamento do rascunho.");
    setSubmitting(true);
    const { error } = await supabase.from("fichas_visita")
      .update({ status: "enviada", enviada_em: new Date().toISOString() })
      .eq("id", state.id);
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Ficha enviada com sucesso!");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Nova ficha de visita</h1>
          <p className="text-sm text-muted-foreground">Rascunho salvo automaticamente a cada alteração.</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {saving ? (
            <Badge variant="secondary" className="gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Salvando</Badge>
          ) : savedAt ? (
            <Badge variant="secondary" className="gap-1 text-success"><CheckCheck className="h-3 w-3" /> Salvo {savedAt.toLocaleTimeString().slice(0, 5)}</Badge>
          ) : (
            <Badge variant="outline" className="gap-1"><Save className="h-3 w-3" /> Rascunho</Badge>
          )}
        </div>
      </div>

      <Card className="shadow-soft">
        <CardHeader><CardTitle>Identificação</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>Paciente</Label>
            <Select value={state.paciente_id ?? undefined} onValueChange={v => update("paciente_id", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione um paciente cadastrado" /></SelectTrigger>
              <SelectContent>
                {(pacientes ?? []).map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.nome_completo}</SelectItem>
                ))}
                {(!pacientes || pacientes.length === 0) && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Nenhum paciente cadastrado ainda.</div>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Data da visita</Label>
            <Input type="date" value={state.data_visita} onChange={e => update("data_visita", e.target.value)} />
          </div>
          <div>
            <Label>Hora</Label>
            <Input type="time" value={state.hora_visita} onChange={e => update("hora_visita", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>Motivo da visita</Label>
            <Input value={state.motivo_visita} onChange={e => update("motivo_visita", e.target.value)} placeholder="Ex: acompanhamento de hipertensão" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader><CardTitle>Sinais vitais</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div><Label>Pressão arterial</Label><Input value={state.pressao_arterial} onChange={e => update("pressao_arterial", e.target.value)} placeholder="120/80" /></div>
          <div><Label>Temperatura (°C)</Label><Input type="number" step="0.1" value={state.temperatura} onChange={e => update("temperatura", e.target.value)} /></div>
          <div><Label>Glicemia (mg/dL)</Label><Input type="number" value={state.glicemia} onChange={e => update("glicemia", e.target.value)} /></div>
          <div><Label>Peso (kg)</Label><Input type="number" step="0.1" value={state.peso} onChange={e => update("peso", e.target.value)} /></div>
          <div><Label>Altura (m)</Label><Input type="number" step="0.01" value={state.altura} onChange={e => update("altura", e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader><CardTitle>Observações</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Observações gerais</Label>
            <Textarea rows={4} value={state.observacoes} onChange={e => update("observacoes", e.target.value)} />
          </div>
          <div>
            <Label>Encaminhamentos</Label>
            <Textarea rows={3} value={state.encaminhamentos} onChange={e => update("encaminhamentos", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate({ to: "/dashboard" })}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={submitting || !state.id}>
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Enviar ficha
        </Button>
      </div>
    </div>
  );
}
