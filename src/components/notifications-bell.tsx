import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Notificacao = {
  id: string;
  titulo: string;
  mensagem: string | null;
  tipo: string | null;
  lida: boolean;
  link: string | null;
  created_at: string;
};

async function fetchNotificacoes(): Promise<Notificacao[]> {
  const { data, error } = await supabase
    .from("notificacoes")
    .select("id, titulo, mensagem, tipo, lida, link, created_at")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data ?? []) as Notificacao[];
}

export function NotificationsBell() {
  const qc = useQueryClient();
  const { data: notifs = [] } = useQuery({
    queryKey: ["notificacoes"],
    queryFn: fetchNotificacoes,
    staleTime: 30_000,
  });

  const unread = notifs.filter((n) => !n.lida).length;

  useEffect(() => {
    const channel = supabase
      .channel("notificacoes-bell")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notificacoes" },
        () => qc.invalidateQueries({ queryKey: ["notificacoes"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const markOne = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notificacoes")
        .update({ lida: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notificacoes"] }),
  });

  const markAll = useMutation({
    mutationFn: async () => {
      const ids = notifs.filter((n) => !n.lida).map((n) => n.id);
      if (ids.length === 0) return;
      const { error } = await supabase
        .from("notificacoes")
        .update({ lida: true })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notificacoes"] }),
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="font-display text-sm font-semibold">Notificações</div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => markAll.mutate()}
            disabled={unread === 0 || markAll.isPending}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Marcar todas
          </Button>
        </div>

        {notifs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
            <Inbox className="h-8 w-8 opacity-50" />
            <span>Você ainda não tem notificações.</span>
          </div>
        ) : (
          <ScrollArea className="max-h-[420px]">
            <ul className="divide-y">
              {notifs.map((n) => {
                const body = (
                  <div className="flex gap-3 px-4 py-3 text-left transition hover:bg-muted/60">
                    <div
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        n.lida ? "bg-transparent" : "bg-accent",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className={cn("text-sm", n.lida ? "text-foreground/80" : "font-semibold text-foreground")}>
                        {n.titulo}
                      </div>
                      {n.mensagem && (
                        <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.mensagem}</div>
                      )}
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                      </div>
                    </div>
                  </div>
                );

                const handleClick = () => {
                  if (!n.lida) markOne.mutate(n.id);
                };

                return (
                  <li key={n.id}>
                    {n.link ? (
                      <Link to={n.link} onClick={handleClick} className="block">
                        {body}
                      </Link>
                    ) : (
                      <button type="button" onClick={handleClick} className="block w-full">
                        {body}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
