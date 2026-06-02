
# SaúdeOps — Plano de construção

Sistema de gestão de visitas domiciliares / agentes comunitários de saúde para UBS, com 3 perfis (Agente, Coordenador, Auditor) e 13 módulos.

## Realidade do escopo

13 módulos com backend real, papéis, RLS, dashboard em tempo real, assinatura digital, modelador de rotas e auditoria não cabem em uma única entrega sem ficar todo raso. Proposta: **3 fases**. Esta primeira fase entrega a fundação sólida e os 5 módulos mais críticos do dia a dia do agente; as outras duas fases ficam para iterações seguintes.

## Identidade visual

- Tema claro, clínico mas com personalidade — não vou usar o "azul SUS genérico".
- Paleta: verde-água profundo como primária (saúde + confiança), coral suave como acento (alertas/CTA), neutros quentes (off-white, grafite).
- Tipografia: Plus Jakarta Sans (display) + Inter (corpo).
- Layout app-shell: sidebar fixa com módulos agrupados, topbar com busca global + perfil + notificações, conteúdo em cards generosos.
- Estados densos (tabelas, dashboards) com ritmo visual claro, sem virar planilha.

## Fase 1 — Fundação + núcleo operacional (esta entrega)

### Backend (Lovable Cloud)
- Habilitar Cloud.
- Auth email/senha + Google.
- Enum `app_role` ('agente', 'coordenador', 'auditor') + tabela `user_roles` + função `has_role` (security definer).
- Tabelas: `profiles`, `ubs` (unidades), `pacientes`, `fichas_visita` (com rascunho automático), `registros_ponto`, `ordens_servico`, `agendamentos`, `faltas_justificativas`, `assinaturas`, `notificacoes`.
- RLS em todas as tabelas escopada por papel + UBS.
- Trigger de auto-criação de profile no signup.
- Trigger `updated_at` automático.

### Frontend
- Rotas:
  - `/` landing/login
  - `/auth` login + cadastro
  - `/_authenticated/dashboard` — painel adaptado ao papel
  - `/_authenticated/ficha/nova` e `/ficha/$id` — preenchimento de ficha com **rascunho automático** (autosave a cada mudança, debounced)
  - `/_authenticated/ponto` — registro de ponto/presença (entrada, saída, intervalo, geolocalização opcional)
  - `/_authenticated/agenda` — calendário semanal + lista de OS do dia
  - `/_authenticated/os/$id` — detalhe da OS com ações
  - `/_authenticated/faltas` — registro de falta + justificativa (upload anexo)
- App shell com sidebar + topbar.
- Dashboard com KPIs reais lidos do banco (visitas do dia, pendentes, faltas, prazo vencendo).
- Hooks de papel: navegação e ações se ajustam ao perfil logado.

## Fase 2 — Operação avançada (próxima iteração)

- Distribuição automática de OS (algoritmo simples por carga/área).
- Agendamentos recorrentes (regras tipo "toda terça às 9h por 12 semanas").
- Notificação antecipada de visita (preview no dashboard + e-mail via Lovable Email).
- Assinatura digital + comprovante PDF.
- Controle de prazos e alertas de pendências com badges no shell.
- Painel em tempo real via Supabase Realtime (subscriptions nas tabelas chave).

## Fase 3 — Gestão e inteligência (iteração final)

- Portal de auditoria da UBS (visão Auditor, trilha de eventos, exportação).
- Relatórios analíticos gerenciais com gráficos (Recharts) e filtros.
- Filtros avançados de busca globais.
- Modelador de rotas (ordenação de visitas do dia, mapa, otimização básica).

## O que cada perfil enxerga (Fase 1)

- **Agente**: dashboard pessoal, agenda do dia, OS atribuídas, ficha, ponto, faltas próprias.
- **Coordenador**: dashboard da UBS, todas as OS/agendas dos agentes da sua UBS, aprovação de justificativas.
- **Auditor**: dashboard global somente-leitura, acesso a todas as fichas e registros (stubs nesta fase, completo na Fase 3).

## Detalhes técnicos

- TanStack Start + TanStack Query + Supabase via `requireSupabaseAuth`.
- Server functions para todas as leituras/escritas sensíveis; RLS como segunda camada.
- Rascunho automático: `useMutation` debounced 800ms salvando em `fichas_visita` com `status='rascunho'`; envio final muda para `status='enviada'`.
- Geolocalização do ponto via `navigator.geolocation` (opcional, com fallback).
- Componentes shadcn customizados via variantes no design system (sem classes ad-hoc).

## Fora de escopo desta entrega

App nativo, integração com e-SUS/CNES, biometria real para assinatura, mapa OSM/Google interativo, push notifications nativas. Tudo isso pode entrar nas fases seguintes se você quiser.

Posso seguir com a Fase 1?
