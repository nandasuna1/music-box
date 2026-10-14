# ADR 0001: Fronteiras entre TanStack Query, Zustand e Context API

- **Status:** Aceito
- **Data:** 2026-08-10
- **Relacionado a:** `DT-006` e `EV-001` (`BACKLOG_EVOLUCAO_SENIOR.md`), `ARQU-04` (`BACKLOG.md`)

## Contexto

O app usa três paradigmas de gerenciamento de estado ao mesmo tempo, sem
nenhuma decisão documentada sobre quando usar cada um:

- **Context API** para sessão de autenticação (`contexts/AuthContext.tsx`).
- **Zustand** para perfil do usuário (`storage/store/profileStore.ts`).
- **TanStack Query** para dados remotos de álbum
  (`app/(protected)/(tabs)/index.tsx`).

O sintoma mais concreto disso é `profileStore.loadProfile`, que chama
diretamente `getUserRecentReviews` e `getUserProfile` e gerencia `loading`
manualmente — duplicando exatamente o que `useQuery` já resolve (cache,
retry, invalidação), só que pior: sem nenhuma dessas políticas. Uma auditoria
do repositório mostra ainda que **nenhum componente lê os campos
`recentReviews`/`profile`/`loading` do `profileStore`** — ele é populado em
`services/auth/login.ts` e limpo em `services/auth/logout.ts`, mas é estado
morto do ponto de vista de UI.

Sem uma fronteira clara, qualquer novo desenvolvedor (ou IA) precisa adivinhar
onde um novo dado deve morar, o que tende a piorar conforme o app cresce.

## Decisão

Adotamos a seguinte separação de responsabilidades, alinhada ao padrão
"Server State vs Client State" (ver https://tkdodo.eu/blog/practical-react-query):

| Camada             | Quando usar                                                                                                                                                | Exemplos no app                                                                                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TanStack Query** | Qualquer dado que vem de uma API/rede — é "server state": tem dono remoto, pode ficar stale, precisa de cache/retry/invalidação.                           | Álbuns do Deezer (`getTopAlbums`, `searchAlbums`), perfil do usuário (`getUserProfile`), reviews recentes (`getUserRecentReviews`), leituras do Firestore em geral. |
| **Zustand**        | Estado de UI puramente client-only, efêmero, sem persistência em backend.                                                                                  | Filtros selecionados, aba ativa, flags de UI (ex.: modal aberto), preferências locais de sessão de navegação.                                                       |
| **Context API**    | Apenas infraestrutura transversal que precisa ser acessada em qualquer ponto da árvore de componentes, e que não é "dado de servidor" no sentido do Query. | Sessão de autenticação (`user`/`loading` do Firebase Auth), tema.                                                                                                   |

Regra prática: **se o dado tem uma chamada de rede por trás, ele é
responsabilidade do TanStack Query — nunca do Zustand ou de um Context
customizado.**

### Consequência imediata

`profileStore` (Zustand) é considerado descontinuado. Toda a lógica de
`loadProfile`/`reset` será migrada para hooks de `useQuery`
(`useUserProfile`, `useUserRecentReviews`), removendo as chamadas de
`useProfileStore.getState()` de `services/auth/login.ts` e
`services/auth/logout.ts`, e o arquivo `storage/store/profileStore.ts` será
removido assim que não houver mais nenhuma referência a ele no código.

## Consequências

- Novos dados remotos passam a ter um único lugar óbvio para morar
  (hooks de `useQuery`), eliminando a pergunta "Zustand, Context ou Query?".
- Cache, retry e invalidação de dados de perfil passam a ser gerenciados
  automaticamente pelo TanStack Query, em vez de reimplementados manualmente.
- Zustand deixa de ser usado neste projeto até que exista um caso real de
  estado client-only compartilhado entre telas distantes; se/quando isso
  acontecer, a dependência já está instalada e pode ser usada seguindo a
  tabela acima.
- PRs futuros que introduzam novo estado devem referenciar este ADR na
  descrição, justificando em qual das três categorias o dado se encaixa.
