import { useState, type ReactNode } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import {
  LayoutDashboard, ClipboardList, Clock, Calendar, Briefcase, AlertTriangle,
  BarChart3, ShieldCheck, MapPin, Bell, LogOut, Menu, Activity, Search, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Operação",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/ficha/nova", label: "Nova ficha", icon: ClipboardList },
      { to: "/ponto", label: "Ponto", icon: Clock },
      { to: "/agenda", label: "Agenda & OS", icon: Calendar },
      { to: "/faltas", label: "Faltas", icon: AlertTriangle },
    ],
  },
  {
    label: "Gestão",
    items: [
      { to: "/os", label: "Ordens de serviço", icon: Briefcase },
      { to: "/rotas", label: "Modelador de rotas", icon: MapPin },
      { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
      { to: "/auditoria", label: "Auditoria UBS", icon: ShieldCheck },
    ],
  },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const path = router.state.location.pathname;
  return (
    <nav className="flex flex-col gap-6 p-4">
      {navGroups.map((g) => (
        <div key={g.label}>
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
            {g.label}
          </div>
          <div className="flex flex-col gap-1">
            {g.items.map((it) => {
              const active = path === it.to || path.startsWith(it.to + "/");
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <it.icon className="h-4 w-4" />
                  {it.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SidebarContent() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <div className="font-display text-base font-bold text-sidebar-foreground">VitaCare OS</div>
          <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50">UBS Operations</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <NavList />
      </div>
      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-lg bg-sidebar-accent/40 p-3 text-xs text-sidebar-foreground/80">
          <div className="font-semibold text-sidebar-foreground">Suporte 24/7</div>
          Dúvidas operacionais? Fale com o coordenador.
        </div>
      </div>
    </div>
  );
}

const roleLabel: Record<string, string> = {
  agente: "Agente",
  coordenador: "Coordenador",
  auditor: "Auditor",
};

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { profile, role, ubs } = useProfile();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth" });
  };

  const initials = (profile?.nome_completo ?? "U")
    .split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 bg-sidebar p-0 text-sidebar-foreground border-r border-sidebar-border">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur md:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>

          <div className="relative hidden md:block flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar paciente, OS, ficha..." className="pl-9" />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden text-left md:block">
                    <div className="text-sm font-medium leading-tight">{profile?.nome_completo ?? "Usuário"}</div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{roleLabel[role ?? "agente"]}</Badge>
                      {ubs && <span>· {ubs.nome}</span>}
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{profile?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
