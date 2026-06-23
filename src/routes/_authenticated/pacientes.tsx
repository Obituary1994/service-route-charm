import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, UserPlus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/pacientes")({
  component: PacientesPage,
});

type FormState = {
  nome_completo: string;
  cns: string;
  cpf: string;
  data_nascimento: string;
  telefone: string;
  endereco: string;
  bairro: string;
  observacoes: string;
};

const emptyForm: FormState = {
  nome_completo: "",
  cns: "",
  cpf: "",
  data_nascimento: "",
  telefone: "",
  endereco: "",
  bairro: "",
  observacoes: "",
};

function PacientesPage() {
  const { profile, role } = useProfile();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [search, setSearch] = useState("");

  const canCreate = role === "agente" || role === "coordenador";

  const { data: pacientes, isLoading } = useQuery({
    queryKey: ["pacientes", search],
    queryFn: async () => {
      let q = supabase.from("pacientes").select("*").order("nome_completo");
      if (search.trim()) q = q.ilike("nome_completo", `%${search.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.nome_completo.trim()) {
      toast.error("Informe o nome completo do paciente.");
      return;
    }
    if (!profile?.ubs_id) {
      toast.error("Seu perfil não está vinculado a uma UBS. Peça ao coordenador para vincular.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("pacientes").insert({
      nome_completo: form.nome_completo.trim(),
      cns: form.cns.trim() || null,
      cpf: form.cpf.trim() || null,
      data_nascimento: form.data_nascimento || null,
      telefone: form.telefone.trim() || null,
      endereco: form.endereco.trim() || null,
      bairro: form.bairro.trim() || null,
      observacoes: form.observacoes.trim() || null,
      ubs_id: profile.ubs_id,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Paciente cadastrado!");
    setForm(emptyForm);
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["pacientes"] });
    qc.invalidateQueries({ queryKey: ["pacientes-list"] });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Pacientes</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre e gerencie os pacientes vinculados à sua UBS.
          </p>
        </div>
        {canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Novo paciente</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" /> Cadastrar paciente
                </DialogTitle>
                <DialogDescription>
                  O paciente será vinculado à sua UBS automaticamente.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label>Nome completo *</Label>
                  <Input value={form.nome_completo} onChange={e => update("nome_completo", e.target.value)} />
                </div>
                <div>
                  <Label>CNS</Label>
                  <Input value={form.cns} onChange={e => update("cns", e.target.value)} />
                </div>
                <div>
                  <Label>CPF</Label>
                  <Input value={form.cpf} onChange={e => update("cpf", e.target.value)} />
                </div>
                <div>
                  <Label>Data de nascimento</Label>
                  <Input type="date" value={form.data_nascimento} onChange={e => update("data_nascimento", e.target.value)} />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input value={form.telefone} onChange={e => update("telefone", e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Label>Endereço</Label>
                  <Input value={form.endereco} onChange={e => update("endereco", e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Label>Bairro</Label>
                  <Input value={form.bairro} onChange={e => update("bairro", e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Label>Observações</Label>
                  <Textarea rows={3} value={form.observacoes} onChange={e => update("observacoes", e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
                <Button onClick={handleSubmit} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cadastrar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-4">
            <span>Lista de pacientes</span>
            <div className="relative w-72 max-w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nome..."
                className="pl-9"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...
            </div>
          ) : !pacientes || pacientes.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Nenhum paciente cadastrado ainda.
            </div>
          ) : (
            <div className="divide-y rounded-md border">
              {pacientes.map(p => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <div>
                    <div className="font-medium">{p.nome_completo}</div>
                    <div className="text-xs text-muted-foreground">
                      {[p.cpf && `CPF ${p.cpf}`, p.cns && `CNS ${p.cns}`, p.bairro].filter(Boolean).join(" · ") || "Sem dados adicionais"}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">{p.telefone ?? ""}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
