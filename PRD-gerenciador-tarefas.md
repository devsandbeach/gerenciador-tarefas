# PRD — Gerenciador de Tarefas

**Stack:** Next.js 15 (App Router), Server Actions, SQLite, Drizzle ORM, Tailwind CSS, shadcn/ui

---

## Problem Statement

Indivíduos que gerenciam múltiplas atividades do dia a dia enfrentam dificuldade em organizar, priorizar e acompanhar o progresso das tarefas. Ferramentas existentes são pesadas ou cheias de funcionalidades desnecessárias; soluções simples carecem de uma interface agradável e moderna.

---

## Solution

Uma aplicação web de CRUD de tarefas construída com Next.js 15, com interface bonita e moderna usando shadcn/ui e Tailwind. O foco é na experiência de uso: criar, visualizar, editar e excluir tarefas com fluidez, organização visual clara e interações refinadas. Toda a lógica de negócio roda em Server Actions no mesmo repositório Next.js, sem backend separado.

---

## User Stories

### Tarefas — Criação e Edição

1. Como usuário, quero criar uma tarefa com título obrigatório, para que ela seja registrada rapidamente.
2. Como usuário, quero adicionar uma descrição em markdown a uma tarefa, para que o contexto seja preservado com formatação rica.
3. Como usuário, quero definir uma data de vencimento para uma tarefa, para que eu possa gerenciar prazos.
4. Como usuário, quero definir a prioridade de uma tarefa (baixa, média, alta, urgente), para que eu saiba o que fazer primeiro.
5. Como usuário, quero editar qualquer campo de uma tarefa existente via modal ou painel lateral, para que as informações permaneçam corretas.
6. Como usuário, quero excluir uma tarefa com confirmação, para que itens desnecessários sejam removidos sem acidentes.
7. Como usuário, quero duplicar uma tarefa, para que eu possa reusar estrutura de tarefas semelhantes com agilidade.

### Tarefas — Status e Fluxo

8. Como usuário, quero mover uma tarefa entre os status (A Fazer, Em Progresso, Em Revisão, Concluído, Cancelado), para que o progresso seja visível.
9. Como usuário, quero marcar uma tarefa como concluída com um único clique na listagem, para que o fluxo seja ágil sem abrir um modal.
10. Como usuário, quero ver tarefas concluídas visualmente diferenciadas (ex: texto riscado, opacidade reduzida), para que o progresso seja perceptível de relance.
11. Como usuário, quero ver um indicador visual quando uma tarefa está atrasada (data de vencimento no passado e não concluída), para que eu não perca prazos.

### Tarefas — Organização

12. Como usuário, quero adicionar etiquetas (tags) a uma tarefa com cor customizável, para que eu possa categorizar e identificar contextos visualmente.
13. Como usuário, quero adicionar subtarefas a uma tarefa, para que eu possa decompor trabalho complexo em passos menores.
14. Como usuário, quero marcar subtarefas individualmente como concluídas, para que o progresso granular seja registrado.
15. Como usuário, quero ver o progresso das subtarefas exibido como barra ou contador (ex: 2/5), para que eu tenha visibilidade sem abrir a tarefa.
16. Como usuário, quero reordenar tarefas por arrastar e soltar, para que a prioridade visual reflita meu julgamento.

### Listagem, Filtros e Busca

17. Como usuário, quero ver todas as minhas tarefas em uma listagem clara e bem espaçada, para que eu tenha visão geral do trabalho.
18. Como usuário, quero filtrar tarefas por status, para que eu veja apenas o que é relevante no momento.
19. Como usuário, quero filtrar tarefas por prioridade, para que eu foque no mais urgente.
20. Como usuário, quero filtrar tarefas por etiqueta, para que eu acesse contextos específicos rapidamente.
21. Como usuário, quero filtrar tarefas por data de vencimento (hoje, esta semana, atrasadas), para que eu gerencie prazos.
22. Como usuário, quero buscar tarefas por texto no título ou descrição, para que eu encontre qualquer item rapidamente.
23. Como usuário, quero ordenar tarefas por data de criação, vencimento ou prioridade, para que a listagem faça sentido para meu contexto.

### Visualizações

24. Como usuário, quero visualizar tarefas em modo lista, para que eu veja muitas tarefas de forma densa e eficiente.
25. Como usuário, quero visualizar tarefas em modo kanban (colunas por status) com drag and drop entre colunas, para que eu tenha uma visão de fluxo.

### Notificações e Feedback Visual

26. Como usuário, quero receber um toast de confirmação quando uma tarefa for criada, editada ou excluída, para que as ações sejam confirmadas sem ambiguidade.
27. Como usuário, quero ver animações suaves nas transições (abertura de modal, conclusão de tarefa, drag), para que a interface pareça polida e responsiva.
28. Como usuário, quero que a interface seja responsiva e funcione bem em telas menores, para que eu possa usar no celular.

---

## Implementation Decisions

### Arquitetura Geral

- **Next.js 15 App Router monolítico**: frontend e backend no mesmo projeto. Server Actions cobrem todas as mutações. Sem endpoints REST públicos.
- **SQLite via Drizzle ORM**: banco em arquivo único. Drizzle para schema type-safe e queries. Migrações com `drizzle-kit`. Sem autenticação — a aplicação é single-user/local.
- **UI**: shadcn/ui como sistema de componentes base (Button, Dialog, Sheet, Input, Select, Badge, Popover, Calendar, DropdownMenu, etc.). Tailwind para layout e estilos complementares. Tema claro/escuro via `next-themes`.

### Schema do Banco de Dados

Entidades e campos-chave:

- **tasks**: id, title, description (markdown, nullable), status (enum: todo | in_progress | in_review | done | cancelled), priority (enum: low | medium | high | urgent), dueDate (nullable), position (int, para ordenação manual), createdAt, updatedAt
- **tags**: id, name, color (hex), createdAt
- **task_tags**: taskId, tagId (relação N:N)
- **subtasks**: id, taskId, title, completedAt (nullable), position, createdAt

### Módulos da Aplicação

- **tasks**: CRUD completo, mudança de status, duplicação, reordenação por posição
- **subtasks**: CRUD dentro do painel de detalhe de uma tarefa
- **tags**: CRUD de etiquetas e associação com tarefas

### Convenções de Server Actions

Cada Server Action valida o input com Zod antes de operar no banco. Erros retornam `{ error: string }`, sucesso retorna o recurso afetado. Revalidação via `revalidatePath` após toda mutação.

### Drag and Drop

Implementado com `@dnd-kit/core`. A posição é um inteiro no campo `position` da tabela `tasks`. Arrastar entre colunas do kanban atualiza `status` e `position` na mesma Server Action em transação atômica.

### Componentes de UI Notáveis

- **TaskCard**: card compacto para lista e kanban, com checkbox de conclusão rápida, badge de prioridade, badge de tags, contador de subtarefas e indicador de atraso.
- **TaskSheet**: painel lateral (Sheet do shadcn) para edição completa da tarefa sem sair da página.
- **KanbanBoard**: grid de colunas com scroll horizontal em telas menores.
- **FilterBar**: barra de filtros com chips ativos e botão de reset.

---

## Testing Decisions

### O que faz um bom teste neste projeto

- Testes devem validar **comportamento observável**: a tarefa existe no banco após criação, o status correto é persistido após mudança, a query de filtro retorna apenas os registros esperados.
- Não testar detalhes do Drizzle ou internos do ORM — testar o resultado final.
- SQLite em memória (`:memory:`) nos testes para isolamento e velocidade, sem mocks de ORM.

### Módulos a testar

- **Server Actions de tasks**: criar, editar, excluir, mudar status, duplicar, reordenar.
- **Server Actions de subtasks**: criar, marcar como concluída, excluir.
- **Server Actions de tags**: criar, associar/desassociar com tarefa.
- **Queries de filtro**: filtro por status, prioridade, tag, data de vencimento — validados contra dados reais no SQLite em memória.
- **E2E (Playwright)**: criar tarefa, editar, mover no kanban, marcar como concluída, excluir.

### Ferramentas

- Vitest para testes de integração das Server Actions
- Playwright para E2E dos fluxos críticos

---

## Out of Scope

- **Autenticação e múltiplos usuários**
- **Projetos** (agrupamento de tarefas)
- **Dashboard com métricas e gráficos**
- **Colaboração em tempo real**
- **Notificações push ou por e-mail**
- **Integrações externas** (GitHub, Slack, Google Calendar)
- **Comentários em tarefas**
- **Upload de anexos**
- **Visualização em calendário**
- **Filtros salvos como views nomeadas**
- **API REST pública**
- **Mobile app nativo**

---

## Further Notes

- O foco do projeto é qualidade visual e experiência de uso — a interface deve parecer profissional e moderna, não um CRUD genérico.
- shadcn/ui é "copy-paste", não uma lib de pacote; os componentes ficam no repositório e podem ser customizados livremente.
- A ausência de autenticação simplifica o desenvolvimento e permite focar na UI/UX e nos padrões de Server Actions com Drizzle.
- Quando houver necessidade de escalar (múltiplos usuários, PostgreSQL), o Drizzle suporta troca de adapter com mudanças mínimas de código.
