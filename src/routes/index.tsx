import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ClipboardCheck, ShieldCheck, Calendar, MapPin, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SaúdeOps — Operação completa para UBS" },
      { name: "description", content: "Fichas, ponto, agenda, OS, auditoria e relatórios numa única plataforma para agentes comunitários e gestores de saúde." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: ClipboardCheck, title: "Ficha com rascunho automático", desc: "O agente preenche em campo, o sistema salva sozinho. Nada se perde." },
  { icon: Activity, title: "Ponto e presença geolocalizado", desc: "Registro de entrada, saída e intervalos com posição opcional." },
  { icon: Calendar, title: "Agenda e OS unificadas", desc: "Visitas, ordens de serviço e prazos no mesmo lugar." },
  { icon: ShieldCheck, title: "Justificativas com aprovação", desc: "Faltas registradas com anexo e revisadas pelo coordenador." },
  { icon: BarChart3, title: "Painel em tempo real", desc: "Dashboard adaptado ao papel: agente, coordenador ou auditor." },
  { icon: MapPin, title: "Roteirização inteligente", desc: "Modelador de rotas para otimizar o dia de visitas (em breve)." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg gradient-hero text-primary-foreground">
              <Activity className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">SaúdeOps</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/auth"><Button variant="ghost">Entrar</Button></Link>
            <Link to="/auth"><Button>Começar agora</Button></Link>
          </div>
        </div>
      </header>

      <section className="gradient-soft">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:items-center md:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
              <span className="h-2 w-2 rounded-full bg-accent" /> Plataforma para UBS
            </span>
            <h1 className="mt-5 font-display text-5xl font-bold leading-[1.05] tracking-tight text-foreground md:text-6xl">
              Operação de UBS, <span className="text-primary">do campo ao gestor</span>.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Fichas com rascunho automático, ponto geolocalizado, agenda de visitas, ordens de serviço,
              justificativas, auditoria e relatórios — tudo em uma plataforma feita para o dia a dia da atenção primária.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth"><Button size="lg" className="shadow-elevated">Criar conta gratuita</Button></Link>
              <Link to="/auth"><Button size="lg" variant="outline">Já tenho acesso</Button></Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div><span className="font-semibold text-foreground">3 perfis</span> · Agente, Coordenador, Auditor</div>
              <div><span className="font-semibold text-foreground">13 módulos</span> integrados</div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-primary/10 via-accent/5 to-transparent blur-2xl" />
            <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Painel de hoje</div>
                  <div className="font-display text-2xl font-bold">UBS Central</div>
                </div>
                <div className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">12 ativos</div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  { label: "Visitas", value: "48", tone: "text-primary" },
                  { label: "Pendentes", value: "07", tone: "text-accent" },
                  { label: "Concluídas", value: "41", tone: "text-success" },
                ].map(s => (
                  <div key={s.label} className="rounded-lg bg-secondary p-4">
                    <div className={`font-display text-3xl font-bold ${s.tone}`}>{s.value}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-3">
                {["Visita — Maria S.", "Ponto — Entrada 07:54", "OS #2034 atribuída"].map(l => (
                  <div key={l} className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-sm text-foreground">{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 max-w-2xl">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Tudo que sua UBS precisa, integrado.</h2>
          <p className="mt-3 text-muted-foreground">Substitua planilhas, papéis e múltiplos sistemas por um fluxo único.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(f => (
            <div key={f.title} className="group rounded-xl border border-border bg-card p-6 shadow-soft transition hover:border-primary/40 hover:shadow-elevated">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary-soft text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} SaúdeOps</span>
          <span>Atenção primária, com método.</span>
        </div>
      </footer>
    </div>
  );
}
