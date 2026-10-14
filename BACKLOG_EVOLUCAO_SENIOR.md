# BACKLOG DE EVOLUÇÃO — MOBILE SÊNIOR INTERNACIONAL

> Repositório: `music-box`
> Data da análise: 2026-06-26
> Plataforma: React Native `0.81.5` (via Expo `~54.0.31`, New Architecture habilitada)
> Gerenciador de pacotes: `npm` (presença de `package-lock.json`; sem `node_modules` instalado no momento da análise)
> Estado detectado: `Zustand` (`storage/store/profileStore.ts`) + `TanStack Query` (`@tanstack/react-query`) + `Context API` (`contexts/AuthContext.tsx`) — três estratégias coexistindo sem fronteira clara
> Navegação detectada: `Expo Router ~6` (file-based routing sobre React Navigation v7), `typedRoutes` habilitado

> **Nota:** este repositório já possui um `BACKLOG.md` produzido em auditoria anterior (Junho/2026), com foco em 7 pilares de arquitetura. Este documento é complementar — segue o framework de Roadmap Sênior em 5 fases solicitado, cruza com o que já foi mapeado e adiciona itens de processo (ADRs, CI/CD, governança) não cobertos no documento anterior. Os dois documentos devem ser lidos em conjunto; IDs aqui usam prefixos `DT-`, `ME-`, `EV-` para não colidir com os IDs existentes (`ARQU-`, `SEC-`, `PERF-`, etc.).

---

## 📊 Resumo Executivo

| Fase                                 | Total  | 🔴 Crítico | 🟡 Importante | 🟢 Evolução |
| ------------------------------------ | ------ | ---------- | ------------- | ----------- |
| Fase 0 — System Design & Setup       | 5      | 2          | 2             | 1           |
| Fase 1 — Arquitetura & Modularização | 6      | 1          | 4             | 1           |
| Fase 2 — Testes & CI/CD              | 6      | 3          | 1             | 2           |
| Fase 3 — Segurança & Performance     | 5      | 2          | 2             | 1           |
| Fase 4 — Docs & Liderança            | 4      | 0          | 1             | 3           |
| **TOTAL**                            | **26** | **8**      | **10**        | **8**       |

---

## ✅ O QUE JÁ ESTÁ BEM IMPLEMENTADO

- **Expo Router com `typedRoutes` habilitado** (`app.json`) — navegação tipada por arquivo, reduzindo erro de rota inválida em tempo de compilação.
- **TypeScript em modo `strict: true`** (`tsconfig.json`) — base saudável para evolução de tipos.
- **Separação em camada de `services/` por domínio** (`services/album`, `services/auth`, `services/reviews`, `services/user`) — já existe um início de Repository Pattern, mesmo que informal.
- **Uso de `runTransaction` do Firestore em `upsertReview.ts`** — escrita atômica entre coleção global de reviews, ponteiro do usuário e contador, com checagem de "é uma nova review" antes de incrementar. Isso é um padrão de dado consistente bem acima da média de projetos júnior/pleno.
- **Mocks de infraestrutura nativa já configurados no `jest.setup.ts`** (AsyncStorage, NativeEventEmitter, Firebase, Google Sign-In) — esqueleto de teste pronto, falta consistência de uso.
- **`.env` corretamente listado no `.gitignore`** (linha final do arquivo) — não há vazamento de segredo via Git neste momento.
- **Uso de `EXPO_PUBLIC_*` apenas para chaves que são inerentemente públicas no client** (Firebase client config, Google OAuth client IDs) — consistente com o modelo de segurança do Firebase, que depende de Firestore Rules, não de sigilo da `apiKey`.
- **`React Compiler` e `New Architecture` habilitados em `app.json`** — adoção proativa de features modernas do ecossistema RN/Expo.
- **TanStack Query já presente como dependência e em uso na tela inicial** (`app/(protected)/(tabs)/index.tsx`) — caminho certo para cache de rede, falta expandir a outras telas e configurar persistência.
- **Code review anterior (`BACKLOG.md`) já documentado e com exemplos de antes/depois** — evidência de prática de auditoria técnica recorrente, isso por si só é um sinal de maturidade de processo.

---

## 🔴 CRÍTICO — Débitos Técnicos e Riscos Imediatos

### [ID: DT-001] Suíte de testes quebrada e não confiável (testes falham ou testam o mock, não o código)

- **Fase:** Fase 2 — Testabilidade & DevOps Mobile
- **Categoria:** `Testes`
- **Evidência no código:**
  - `__tests__/home.test.tsx` renderiza `Home` (que resolve para `app/(protected)/(tabs)/index.tsx`) e espera encontrar o texto `"vinyl."` — mas esse texto só existe em `app/(auth)/login.tsx`. O componente `Home` real renderiza `"Popular essa semana"`. Esse teste falha (ou falharia, caso a suíte rodasse) porque testa a tela errada.
  - `services/auth/login.test.ts` usa `jest.mock("../firebase.ts", () => { auth: {...} })` e `jest.mock("firebase/auth", () => { GoogleAuthProvider: {...} })` — a arrow function tem um **bloco** `{ ... }` sem `return`, então a sintaxe `auth: {...}` é interpretada como um _label statement_ do JavaScript, não como um objeto. O mock não retorna nada (`undefined`), tornando o teste inócuo.
  - O `expect` final do mesmo teste — `expect(GoogleSignin.signIn()).toHaveBeenCalled()` — invoca `GoogleSignin.signIn()` _de novo_ dentro do próprio `expect`, ao invés de verificar a chamada feita por `login()`. Isso testa se uma função mock "foi chamada" imediatamente após ser chamada por você mesmo, não se `login()` a usou.
- **Impacto:** A suíte de testes não pode ser usada como guarda de regressão. Qualquer gate de CI baseado em `npm test` passando (ou falhando) não reflete a saúde real do código — pode mascarar bugs reais ou bloquear merges por motivo errado.
- **Ação de estudo:** Jest — `Mock Functions` (https://jestjs.io/docs/mock-functions) e a diferença entre _factory function_ de `jest.mock` que retorna um objeto (`() => ({ ... })`) versus um bloco de função; React Native Testing Library — `Querying` (https://callstack.github.io/react-native-testing-library/docs/api/queries).
- **Ação de implementação:**
  1. Corrigir `login.test.ts`: usar `jest.mock("../firebase.ts", () => ({ auth: { currentUser: { uid: "abc-123" } } }))` (parênteses para objeto literal).
  2. Capturar a referência do mock antes de chamar `login()` e usar essa referência no `expect` (ex.: `const signInMock = jest.fn().mockResolvedValue(...); GoogleSignin.signIn = signInMock; await login(); expect(signInMock).toHaveBeenCalled();`).
  3. Corrigir `home.test.tsx` para testar o texto real (`"Popular essa semana"`) ou mover o teste de `"vinyl."` para um arquivo que teste `app/(auth)/login.tsx`.
  4. Rodar `npm install && npm test` localmente antes de qualquer PR para confirmar que a suíte está verde — atualmente o repositório não tem `node_modules` instalado, então nem é possível validar a suíte hoje.
- **Referência no checklist:** Fase 2 — "Testes unitários de lógica de negócios (hooks, stores, use cases, services)" e "Mocks e Stubs para isolar chamadas de rede"
- **Esforço:** P (< 4h)

---

### [ID: DT-002] Ausência total de pipeline de CI — nenhum gate de qualidade roda em PRs

- **Fase:** Fase 2 — Testabilidade & DevOps Mobile
- **Categoria:** `DevOps`
- **Evidência no código:** Não existe diretório `.github/workflows/`. O `package.json` tem scripts `lint` e `test`, mas nada os executa automaticamente em pull requests. Com 1 PR já mesclado (`#1`) sem nenhum check automatizado.
- **Impacto:** Qualquer regressão de lint, type-check ou teste só é percebida manualmente (ou em produção). Não há barreira entre "código compila na minha máquina" e "código está mergeado em `main`". Isso não escala para mais de um desenvolvedor.
- **Ação de estudo:** GitHub Actions para projetos Expo (https://docs.expo.dev/eas/workflows/get-started/ ou Actions genérico com `actions/setup-node`); estratégias de cache de `node_modules` em CI.
- **Ação de implementação:** Criar `.github/workflows/pr-validation.yml` rodando `npm ci`, `npm run lint`, `npx tsc --noEmit` e `npm test -- --watchAll=false` em todo PR contra `main`. Ver YAML completo na seção **Pipelines CI/CD Sugeridas** abaixo.
- **Referência no checklist:** Fase 2 — "Pipeline de CI/CD com: lint + testes + coverage + build em PRs"
- **Esforço:** P (< 4h)

---

### [ID: DT-003] Dados de autenticação sensíveis logados em `console.log` (parcialmente corrigido em diff não commitado)

- **Fase:** Fase 3 — Segurança, Performance & Telemetria
- **Categoria:** `Segurança`
- **Evidência no código:** `git diff` mostra uma alteração local não commitada em `contexts/AuthContext.tsx` que troca `console.log({ firebaseUser })` (objeto completo do Firebase `User`, incluindo `email`, `uid`, tokens de metadata) por `console.log({ uid: firebaseUser?.uid, emailVerified: firebaseUser?.emailVerified })`. Essa é uma melhoria real, mas:
  1. Ainda é um `console.log` incondicional que roda em toda mudança de estado de auth, inclusive em build de produção (Metro/Hermes não removem `console.log` por padrão).
  2. `services/auth/login.ts` (linha 33) e `services/auth/logout.ts` (linha 15) também usam `console.log`/`console.error` sem guarda de ambiente, alguns incluindo o objeto de erro completo (`{ err }`), que pode conter stack traces e payloads sensíveis em logs remotos de dispositivo (ex.: ferramentas de log de loja de apps ou MDM corporativo).
- **Impacto:** Vazamento de identificadores de usuário e metadados de sessão em logs de produção acessíveis via `adb logcat` / Console.app, ou capturados por ferramentas de MDM/EMM em ambientes corporativos.
- **Ação de estudo:** Padrão de logger condicional (`__DEV__`) — https://reactnative.dev/docs/javascript-environment; bibliotecas de logging estruturado para RN (ex.: `react-native-logs` ou wrapper próprio sobre Sentry breadcrumbs).
- **Ação de implementação:** Criar `utils/logger.ts` com uma função `logger.debug/info/error` que só escreve em `__DEV__`, e substituir todas as chamadas diretas a `console.*` em `AuthContext.tsx`, `login.ts` e `logout.ts`. Em produção, erros devem ir para o crash reporter (ver EV-002), não para `console`.
- **Referência no checklist:** Fase 3 — "Logs estruturados (não `console.log` espalhados em produção)"
- **Esforço:** P (< 4h)
- **Status:** ✅ Resolvido

---

### [ID: DT-004] Nenhuma estratégia de armazenamento seguro para sessão — tudo passa por `AsyncStorage`

- **Fase:** Fase 3 — Segurança, Performance & Telemetria
- **Categoria:** `Segurança`
- **Evidência no código:** `services/firebase.ts` configura `initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })`. O token de sessão do Firebase (refresh token incluso) é persistido via `@react-native-async-storage/async-storage`, que grava em texto plano no `SharedPreferences` (Android) / `NSUserDefaults`-like plist (iOS) sem criptografia de hardware.
- **Impacto:** Em um dispositivo comprometido (root/jailbreak) ou com backup não criptografado, o refresh token pode ser extraído e reutilizado para sequestro de sessão.
- **Ação de estudo:** `expo-secure-store` (https://docs.expo.dev/versions/latest/sdk/securestore/) e como o Firebase JS SDK permite plugar um `Persistence` customizado.
- **Ação de implementação:** Implementar um adaptador de persistência customizado para `initializeAuth` usando `expo-secure-store` no lugar de `AsyncStorage` puro, ou avaliar `@react-native-firebase/auth` (módulo nativo) que já usa Keychain/Keystore nativamente em vez do SDK JS. Esse item já está mapeado como `SEC-01` no `BACKLOG.md` existente — manter como crítico aqui por ser o único mecanismo de persistência de sessão do app.
- **Referência no checklist:** Fase 3 — "Tokens, chaves de API e credenciais no Keychain/Keystore — nunca em AsyncStorage puro"
- **Esforço:** M (1-2 dias)
- **Status:** ✅ Resolvido — Criado `storage/auth/secureStorePersistence.ts`, um adaptador `ReactNativeAsyncStorage` que persiste os dados de sessão do Firebase via `expo-secure-store` (Keychain no iOS / Keystore-backed no Android) em vez de `AsyncStorage`. `services/firebase.ts` agora usa `getReactNativePersistence(secureStoreAsyncStorage)`. Como o `expo-secure-store` limita chaves a caracteres alfanuméricos/`.`/`-`/`_` e valores a 2048 bytes — e as chaves/valores do Firebase (ex.: `firebase:authUser:<apiKey>:[DEFAULT]`) violam ambas as restrições — o adaptador sanitiza as chaves e faz _chunking_ automático de valores grandes, com limpeza de chunks obsoletos ao sobrescrever. Em `Platform.OS === "web"` (a app também tem um alvo web) o adaptador cai de volta para `AsyncStorage`, já que `expo-secure-store` não está disponível nesse ambiente. Cobertura via `storage/auth/secureStorePersistence.test.ts` (6 testes: sanitização, chunking, remoção, encolhimento de valor, chave inexistente, fallback web). `tsc --noEmit` e `expo lint` não introduziram nenhum erro novo nos arquivos alterados. Verificação manual em dispositivo real (login → kill do app → reabertura → logout) não foi executada neste ambiente headless (exige fluxo interativo de OAuth do Google) — recomenda-se um checagem manual rápida antes do release. Alternativa `@react-native-firebase/auth` (módulo nativo) permanece como opção futura, fora do escopo desta implementação. Mapeado como `SEC-01` no `BACKLOG.md`.

---

### [ID: DT-005] Nenhum crash reporting ou monitoramento de erros em produção

- **Fase:** Fase 3 — Segurança, Performance & Telemetria
- **Categoria:** `Observabilidade`
- **Evidência no código:** Nenhuma dependência de Sentry, Crashlytics, Bugsnag ou Datadog em `package.json`. Erros em `login.ts`, `logout.ts` e nos `services/*` são tratados com `console.log`/`console.error` e, em alguns casos, simplesmente engolidos (ex.: `login.ts` linha 32-34, captura erro e só faz `console.log`, sem nunca propagar ou notificar a UI).
- **Impacto:** Falhas em produção (ex.: token do Google expirado, regra do Firestore rejeitando escrita, timeout de rede no Deezer) são invisíveis para o time. Não há como saber a taxa de erro real do app sem instrumentação.
- **Ação de estudo:** `@sentry/react-native` quickstart para Expo (https://docs.sentry.io/platforms/react-native/manual-setup/expo/).
- **Ação de implementação:** Instalar `@sentry/react-native`, inicializar em `app/_layout.tsx`, conectar ao logger criado em DT-003 para que todo `logger.error` também envie um evento ao Sentry. Mapeado como `OBS-01` no `BACKLOG.md` existente.
- **Referência no checklist:** Fase 3 — "Integração de crash reporting (Sentry, Crashlytics, Datadog)"
- **Esforço:** M (1-2 dias)

---

### [ID: DT-006] Camada de estado fragmentada entre três paradigmas sem fronteira definida

- **Fase:** Fase 1 — Modularização & Arquitetura
- **Categoria:** `Arquitetura`
- **Evidência no código:** O app usa `Context API` para sessão (`contexts/AuthContext.tsx`), `Zustand` para perfil (`storage/store/profileStore.ts`) e `TanStack Query` para dados remotos de álbum (`app/(protected)/(tabs)/index.tsx`). O `profileStore.loadProfile` chama diretamente `getUserRecentReviews` e `getUserProfile` e gerencia `loading`/`error` manualmente — duplicando exatamente o que `useQuery` já resolveria, e sem nenhuma política de cache, retry ou invalidação. Já mapeado como `ARQU-04` no `BACKLOG.md`, mas vale reforçar aqui como item arquitetural de fundo: não há uma decisão documentada de "quando usar o quê".
- **Impacto:** Inconsistência crescente conforme o app ganha telas — qualquer novo desenvolvedor (ou IA) terá que adivinhar se um novo dado remoto vai para Zustand, Context ou Query.
- **Ação de estudo:** Padrão "Server State vs Client State" do TanStack Query (https://tkdodo.eu/blog/practical-react-query) — referência canônica sobre quando NÃO usar Redux/Zustand para dados que vêm de uma API.
- **Ação de implementação:** Escrever um ADR (ver EV-001) definindo: `TanStack Query` = qualquer dado que vem de rede (Deezer, Firestore reads); `Zustand` = estado de UI client-only (filtros, abas selecionadas, flags efêmeras); `Context` = apenas para dados de infraestrutura transversal (sessão de auth, tema). Depois, migrar `profileStore.loadProfile` para `useQuery`.
- **Referência no checklist:** Fase 1 — "Gerenciamento de estado: ... avalie se o padrão escolhido está sendo usado de forma consistente"
- **Esforço:** M (1-2 dias)
- **Status:** ✅ Resolvido — ADR criado em `docs/adr/0001-state-management-boundaries.md`. `storage/store/profileStore.ts` foi removido (era código morto: nenhum componente lia seu estado). `app/(protected)/(tabs)/profile.tsx` já buscava `profile` e `recentReviews` via `useQuery` inline, seguindo a convenção do restante do app (`rate.tsx`, `[id].tsx`). As chamadas a `useProfileStore.getState().loadProfile/reset` foram removidas de `services/auth/login.ts` e `services/auth/logout.ts`. `tsc --noEmit` e `expo lint` confirmam que nenhum erro novo foi introduzido.

---

### [ID: DT-007] Tipo de retorno de serviço de busca duplicado e inconsistente (`searchAlbums` vs `getTopAlbums`)

- **Fase:** Fase 1 — Modularização & Arquitetura
- **Categoria:** `Arquitetura`
- **Evidência no código:** `services/album/searchAlbum.ts` importa `DeezerAlbum` de `getTopAlbums.ts` (`import { DeezerAlbum } from "./getTopAlbums"`) — o tipo de domínio "Álbum do Deezer" está acoplado ao arquivo de um endpoint específico, não a um módulo de tipos dedicado. Isso é o mesmo padrão já apontado como `ARQU-05` no `BACKLOG.md` para tipagem fraca, mas a causa raiz é estrutural: não existe um `types/Deezer.ts`.
- **Impacto:** Acoplamento incorreto entre arquivos de serviço; qualquer mudança em `getTopAlbums.ts` arrisca quebrar `searchAlbum.ts` silenciosamente.
- **Ação de estudo:** Co-location vs. tipos centralizados em projetos TypeScript de médio porte.
- **Ação de implementação:** Criar `types/Deezer.ts` com `DeezerAlbum`, `DeezerArtist`, `DeezerSearchResponse` e importar de lá em todos os `services/album/*.ts`.
- **Referência no checklist:** Fase 1 — "Estrutura de pastas reflete a arquitetura escolhida"
- **Esforço:** P (< 4h)

---

### [ID: DT-008] Erros de autenticação são silenciados — usuário nunca sabe que o login falhou

- **Fase:** Fase 0 — System Design & Bootstrapping
- **Categoria:** `Arquitetura` / `UX técnica`
- **Evidência no código:** `services/auth/login.ts`, bloco `catch` final (linha 32-34): `catch (err) { console.log({ err }); }`. Se `GoogleSignin.signIn()` falhar, se o `idToken` não existir, ou se `signInWithCredential` rejeitar, a função `login()` simplesmente retorna `undefined` sem lançar exceção e sem qualquer sinal para `GoogleLoginButton.tsx`, que chama `onPress={login}` diretamente. O usuário toca no botão e nada visível acontece.
- **Impacto:** Suporte ao usuário fica impossível de diagnosticar ("cliquei e não aconteceu nada"); não há analytics nem mensagem de erro.
- **Ação de estudo:** Padrão de "Result type" ou `try/catch` propagado para a camada de UI em React; gerenciamento de erro de autenticação OAuth.
- **Ação de implementação:** Fazer `login()` relançar o erro (ou retornar um discriminated union `{ ok: true } | { ok: false, error }`) e em `GoogleLoginButton.tsx` capturar para exibir um toast/alerta e registrar no crash reporter (DT-005).
- **Referência no checklist:** Fase 0 — "Fluxos de dependência unidirecionais entre camadas" (a UI nunca deveria depender de um `console.log` para saber o resultado de uma ação)
- **Esforço:** P (< 4h)

---

## 🟡 IMPORTANTE — Melhorias Arquiteturais e Boas Práticas

### [ID: ME-001] Nenhuma separação entre Domain, Data e Presentation — services chamam Firestore/Deezer diretamente e retornam para a UI

- **Fase:** Fase 0 — System Design & Bootstrapping
- **Categoria:** `Arquitetura`
- **Situação atual:** `services/reviews/upsertReview.ts` mistura regra de negócio (transação, contagem condicional de reviews) com chamadas diretas ao SDK do Firestore. Não há camada de "use case" nem de "repository" que abstraia o Firestore de um possível backend futuro.
- **Situação desejada:** Introduzir um Repository Pattern explícito: `repositories/ReviewRepository.ts` expõe `save(review)`, e a implementação concreta (`FirestoreReviewRepository`) fica isolada. Os "use cases" (`upsertReview` como regra de negócio) dependem da interface, não do Firestore.
- **Ação de estudo:** Clean Architecture aplicada a React Native (artigo de referência: "Clean Architecture for React Native" — buscar por "Clean Architecture React Native repository pattern Firestore").
- **Ação de implementação:** Criar pasta `repositories/` com interfaces e implementações Firestore; `services/` passam a ser "use cases" que recebem o repositório por injeção simples (parâmetro de função, sem precisar de um container de DI ainda).
- **Referência no checklist:** Fase 0 — "Clean Architecture adaptada para RN: separação clara de Domain / Data / Presentation"
- **Esforço:** G (semana+)

---

### [ID: ME-002] `AuthContext` mistura orquestração de SDK com estado de sessão

- **Fase:** Fase 1 — Modularização & Arquitetura
- **Categoria:** `Testabilidade`
- **Situação atual:** `contexts/AuthContext.tsx` chama `onAuthStateChanged` diretamente dentro do provider. Não é possível testar a lógica de "o que acontece quando o Firebase muda de estado" sem montar todo o `AuthProvider` em um teste de componente.
- **Situação desejada:** Extrair para `hooks/useAuthSession.ts`, mantendo o `AuthContext` como casca fina de Provider. Item já mapeado como `ARQU-02` no `BACKLOG.md` existente — reforçado aqui pois afeta diretamente a testabilidade (Fase 2).
- **Ação de estudo:** Padrão "Container/Hook separation" em Context API.
- **Ação de implementação:** Mover `useState`/`useEffect` de `AuthContext.tsx` para `hooks/useAuthSession.ts`; o Context apenas consome o hook e expõe via Provider.
- **Referência no checklist:** Fase 1 — "Padrão Repository para abstração entre API remota e cache local" (extensível ao mesmo princípio de extração de lógica)
- **Esforço:** M (1-2 dias)

---

### [ID: ME-003] Nenhuma expiração ou política de cache no `TanStack Query` configurado

- **Fase:** Fase 1 — Modularização & Arquitetura
- **Categoria:** `Arquitetura`
- **Situação atual:** `app/_layout.tsx` instancia `new QueryClient()` sem nenhuma configuração de `defaultOptions` (sem `staleTime`, `gcTime`, `retry`). Toda query usa os defaults do TanStack Query (`staleTime: 0`), o que significa refetch a cada novo mount/foco de tela mesmo para dados que mudam pouco (ex.: top álbuns).
- **Situação desejada:** `defaultOptions.queries.staleTime` configurado por tipo de dado, e persistência via `@tanstack/query-async-storage-persister` (já apontado como `OFFLINE-01` no `BACKLOG.md`).
- **Ação de estudo:** TanStack Query — "Important Defaults" (https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults).
- **Ação de implementação:** Configurar `new QueryClient({ defaultOptions: { queries: { staleTime: 5 * 60 * 1000, gcTime: 24 * 60 * 60 * 1000 } } })` em `app/_layout.tsx` como baseline, ajustando por query crítica via `staleTime` individual.
- **Referência no checklist:** Fase 1 — "Estratégia de cache local: ... existe expiração de cache?"
- **Esforço:** P (< 4h)

---

### [ID: ME-004] Componentes não usam `memo`/`useCallback` de forma consistente — mas o React Compiler está ativo, então a estratégia precisa ser explícita

- **Fase:** Fase 3 — Segurança, Performance & Telemetria
- **Categoria:** `Performance`
- **Situação atual:** `app.json` tem `"reactCompiler": true`, mas nenhum componente do projeto usa `memo` propositalmente nem depende dele — o que está correto sob o Compiler, mas não há nenhuma nota/comentário/ADR confirmando que essa é uma decisão consciente (poderia ser apenas "ainda não chegamos lá"). Item correlato a `PERF-03` do `BACKLOG.md`.
- **Situação desejada:** Decisão documentada — "memoização manual não é necessária pois o React Compiler está ativo, exceto em casos com dependências externas (ex.: callbacks passados para módulos nativos)".
- **Ação de estudo:** React Compiler docs — "When (and when not) to memoize manually" (https://react.dev/learn/react-compiler).
- **Ação de implementação:** Registrar essa decisão como ADR (ver EV-001) para que futuros PRs não reintroduzam memoização manual desnecessária por hábito.
- **Referência no checklist:** Fase 3 — "Ausência de re-renders desnecessários: uso de `memo`, `useCallback`, `useMemo` onde crítico"
- **Esforço:** P (< 4h)

---

### [ID: ME-005] `Image` nativo do React Native usado em 4 pontos da UI sem cache de disco

- **Fase:** Fase 3 — Segurança, Performance & Telemetria
- **Categoria:** `Performance`
- **Situação atual:** `app/(protected)/(tabs)/index.tsx` e `components/profileComponents.tsx` (`AlbumCard`, `ReviewCard`, `ProfilePic`) usam `<Image source={{ uri: ... }} />` do `react-native` puro, enquanto `expo-image` já está instalado como dependência (`expo-image: ~3.0.11`) e não é usado em nenhum desses 4 lugares. Mapeado como `PERF-01` no `BACKLOG.md` apenas para a tela inicial — aqui ampliado para os outros 3 componentes que têm o mesmo problema.
- **Situação desejada:** Todas as imagens remotas (capas de álbum, avatar de usuário) passam por `expo-image` com `cachePolicy="memory-disk"`.
- **Ação de estudo:** `expo-image` docs (https://docs.expo.dev/versions/latest/sdk/image/).
- **Ação de implementação:** Substituir `Image` por `Image` de `"expo-image"` em `profileComponents.tsx` (`ProfilePic`, `AlbumCard`, `ReviewCard`) e em `index.tsx`.
- **Referência no checklist:** Fase 3 — "lazy loading de imagens (react-native-fast-image)"
- **Esforço:** P (< 4h)

---

### [ID: ME-006] Nenhuma convenção de commit ou Git hook de pré-commit configurado

- **Fase:** Fase 0 — System Design & Bootstrapping
- **Categoria:** `DX`
- **Situação atual:** Não há `husky`, `lint-staged` ou `commitlint` em `devDependencies`. O histórico de commits (`feat: feature`, `feat: new additions`, `v0: first version`) já mostra falta de padronização nas mensagens — `feat: feature` não comunica nada sobre o que mudou.
- **Situação desejada:** Hooks de pré-commit rodando `eslint --fix` e `tsc --noEmit` nos arquivos staged; `commitlint` validando Conventional Commits.
- **Ação de estudo:** Husky v9 + lint-staged setup (https://typicode.github.io/husky/), Conventional Commits (https://www.conventionalcommits.org/).
- **Ação de implementação:** `npm install -D husky lint-staged @commitlint/cli @commitlint/config-conventional`, configurar `.husky/pre-commit` chamando `npx lint-staged`, e `.husky/commit-msg` chamando `npx commitlint --edit $1`.
- **Referência no checklist:** Fase 0 — "Git Hooks de pré-commit com Husky + lint-staged" e "Commitlint ou convenção de commits documentada"
- **Esforço:** P (< 4h)

---

## 🟢 EVOLUÇÃO — O Que Criar do Zero

### [ID: EV-001] Architecture Decision Records (ADRs)

- **Fase:** Fase 0 — System Design & Bootstrapping
- **Categoria:** `Documentação`
- **Descrição:** Não existe nenhum registro de decisão arquitetural no repositório. Decisões como "por que Zustand E TanStack Query coexistem" (DT-006), "por que React Compiler está ativo sem memoização manual" (ME-004) ou "por que Firestore foi escolhido sobre um backend próprio" estão apenas na cabeça de quem escreveu o código.
- **Valor de carreira:** ADRs são o artefato número 1 que diferencia "sabe codar" de "sabe decidir e justificar decisões" em entrevistas de Staff/Senior Engineer — é literalmente o que se pede em perguntas de "fale sobre uma decisão arquitetural que você tomou".
- **Status:** ✅ Primeiro ADR concluído — `docs/adr/0001-state-management-boundaries.md` (referente a DT-006, migração de `profileStore` para `useQuery` já aplicada). Demais ADRs sugeridos abaixo ainda pendentes.
- **Ação de estudo:** Michael Nygard's ADR template (https://github.com/joelparkerhenderson/architecture-decision-record).
- **Ação de implementação:** Criar `docs/adr/0001-state-management-strategy.md`, `docs/adr/0002-auth-persistence.md` seguindo o template:

  ```markdown
  # ADR 0001: Estratégia de gerenciamento de estado

  ## Status: Aceito

  ## Contexto: ...

  ## Decisão: ...

  ## Consequências: ...
  ```

- **Referência no checklist:** Fase 0 — "Ausência ou presença de Architecture Decision Records (ADRs)"
- **Esforço:** P (< 4h) por ADR

---

### [ID: EV-002] Logger estruturado com integração a crash reporting

- **Fase:** Fase 3 — Segurança, Performance & Telemetria
- **Categoria:** `Observabilidade`
- **Descrição:** Não existe abstração de log no projeto — todos os `console.log`/`console.error` são chamados diretamente (ver DT-003). Criar um logger único que decide, por ambiente, se escreve no console (dev) ou envia para Sentry (produção).
- **Valor de carreira:** Observabilidade é frequentemente o que separa "o app funciona no meu celular" de "sabemos o que está acontecendo com os 10 mil usuários em produção" — tema recorrente em entrevistas de nível sênior sobre operação de sistemas mobile.
- **Ação de estudo:** Sentry breadcrumbs e níveis de severidade (https://docs.sentry.io/platforms/react-native/enriching-events/breadcrumbs/).
- **Ação de implementação:**
  ```ts
  // utils/logger.ts
  export const logger = {
    debug: (...args: unknown[]) => {
      if (__DEV__) console.log(...args);
    },
    error: (message: string, err?: unknown) => {
      if (__DEV__) console.error(message, err);
      // Sentry.captureException(err, { extra: { message } });
    },
  };
  ```
- **Referência no checklist:** Fase 3 — "Logs estruturados (não `console.log` espalhados em produção)"
- **Esforço:** P (< 4h) — depende de EV anterior (Sentry instalado, DT-005)

---

### [ID: EV-003] Testes E2E com Maestro cobrindo o fluxo crítico de login → busca → avaliação

- **Fase:** Fase 2 — Testabilidade & DevOps Mobile
- **Categoria:** `Testes`
- **Descrição:** Não existe nenhum teste end-to-end. O fluxo mais valioso do app (login com Google → buscar álbum → avaliar com `RatingInput` → ver no perfil) nunca é validado de ponta a ponta automaticamente.
- **Valor de carreira:** Maestro é hoje a ferramenta mais citada para E2E em React Native por ser declarativa (YAML) e não depender de configuração nativa complexa como Detox — citar experiência com E2E mobile é um diferencial claro em vagas sênior.
- **Ação de estudo:** Maestro getting started (https://maestro.mobile.dev/).
- **Ação de implementação:** Criar `.maestro/login-search-rate.yaml`:
  ```yaml
  appId: com.nandasunadev.musicbox
  ---
  - launchApp
  - tapOn: "Entrar com Google"
  - assertVisible: "Popular essa semana"
  - tapOn:
      id: "search-input"
  - inputText: "Thriller"
  - tapOn:
      text: "Thriller"
  - assertVisible: "Avaliar"
  ```
- **Referência no checklist:** Fase 2 — "Testes E2E configurados (Detox, Maestro ou Appium)"
- **Esforço:** M (1-2 dias)

---

### [ID: EV-004] `eas.json` com profiles de build e EAS Update para OTA

- **Fase:** Fase 2 — Testabilidade & DevOps Mobile
- **Categoria:** `DevOps`
- **Descrição:** Já mapeado em detalhe no `BACKLOG.md` existente (`CICD-01`, `CICD-02`). Reforçado aqui por ser pré-requisito de qualquer pipeline de deploy automatizado (ver pipeline sugerida abaixo).
- **Valor de carreira:** Conhecer o ciclo de build/release de apps Expo (EAS Build + EAS Update) é frequentemente cobrado em vagas que mencionam "ownership de release mobile".
- **Ação de estudo:** EAS Build profiles (https://docs.expo.dev/build/eas-json/).
- **Ação de implementação:** Ver exemplo de `eas.json` já presente no `BACKLOG.md` (item `CICD-01`).
- **Referência no checklist:** Fase 2 — "Fastlane configurado com lanes para: build de QA, testes, deploy para TestFlight/Firebase App Distribution" (equivalente Expo: EAS Build + EAS Submit)
- **Esforço:** M (1-2 dias)

---

### [ID: EV-005] PR Template e checklist de Code Review

- **Fase:** Fase 4 — Documentação, IA & Liderança Técnica
- **Categoria:** `Documentação`
- **Descrição:** Não existe `.github/pull_request_template.md`. O único PR existente (`#1`) não segue nenhuma estrutura visível de descrição, teste manual ou checklist.
- **Valor de carreira:** Processo de review é parte do trabalho de liderança técnica — ter um template documentado mostra preocupação com qualidade de comunicação entre desenvolvedores, não só com código.
- **Ação de estudo:** Exemplos de PR templates de projetos open-source RN de referência (ex.: repositório do próprio Expo).
- **Ação de implementação:** Criar `.github/pull_request_template.md`:

  ```markdown
  ## O que mudou e por quê

  ## Como testar

  - [ ] Testado em iOS
  - [ ] Testado em Android
  - [ ] Testes automatizados adicionados/atualizados

  ## Checklist

  - [ ] Sem `console.log` esquecido
  - [ ] Sem segredo/chave commitado
  - [ ] Lint e type-check passando localmente
  ```

- **Referência no checklist:** Fase 4 — "Processo de Code Review: PR template, checklist, convenções de feedback"
- **Esforço:** P (< 4h)

---

### [ID: EV-006] CHANGELOG.md e versionamento semântico automatizado

- **Fase:** Fase 4 — Documentação, IA & Liderança Técnica
- **Categoria:** `Documentação`
- **Descrição:** `package.json` está fixo em `"version": "1.0.0"` desde o primeiro commit. Não há `CHANGELOG.md` nem ferramenta de versionamento automático.
- **Valor de carreira:** Mostra disciplina de release management — relevante para qualquer função que envolva publicar atualizações de app em produção com rastreabilidade.
- **Ação de estudo:** `semantic-release` ou `standard-version` para projetos RN/Expo (cuidado: requer Conventional Commits, ver ME-006 primeiro).
- **Ação de implementação:** Após ME-006 (commitlint) estar em vigor, instalar `standard-version` e gerar `CHANGELOG.md` automaticamente a cada release.
- **Referência no checklist:** Fase 4 — "CHANGELOG.md atualizado" e "Versionamento semântico automatizado"
- **Esforço:** P (< 4h) — depende de ME-006

---

### [ID: EV-007] README.md completo com setup de ambiente, arquitetura e variáveis de ambiente

- **Fase:** Fase 4 — Documentação, IA & Liderança Técnica
- **Categoria:** `Documentação`
- **Descrição:** O `README.md` atual é o boilerplate padrão gerado por `create-expo-app` — não documenta as variáveis de `.env` necessárias (9 chaves identificadas, ver `.env`), não explica a arquitetura de pastas (`services/`, `storage/`, `contexts/`), nem o fluxo de autenticação com Google/Firebase.
- **Valor de carreira:** Onboarding de novos desenvolvedores é citado com frequência como métrica de maturidade de time — um README que reduz "tempo até o primeiro PR" de um novo dev é um artefato de liderança técnica tangível.
- **Ação de estudo:** Nenhuma — é redação de documentação interna, não pesquisa técnica.
- **Ação de implementação:** Reescrever `README.md` com seções: "Stack", "Variáveis de ambiente necessárias" (listando as 9 chaves do `.env`, sem valores), "Arquitetura de pastas", "Como rodar testes", "Como configurar Firebase/Google Sign-In para desenvolvimento local".
- **Referência no checklist:** Fase 4 — "README.md completo: setup, arquitetura, scripts disponíveis, variáveis de ambiente necessárias"
- **Esforço:** P (< 4h)

---

### [ID: EV-008] CONTRIBUTING.md com convenções do projeto

- **Fase:** Fase 4 — Documentação, IA & Liderança Técnica
- **Categoria:** `Documentação`
- **Descrição:** Não existe `CONTRIBUTING.md`. Convenções implícitas (uso de `@/` para imports absolutos visto em `tsconfig.json` paths, estrutura de `services/` por domínio, padrão de nomenclatura de arquivos) não estão escritas em lugar nenhum — um novo contribuinte (humano ou agente de IA) só descobre lendo código.
- **Valor de carreira:** Demonstra pensamento de "código como produto para outros desenvolvedores", não só para a máquina.
- **Ação de estudo:** Nenhuma — redação interna.
- **Ação de implementação:** Documentar em `CONTRIBUTING.md`: convenção de imports (`@/` para absoluto), padrão de nomenclatura de arquivos de serviço (`verboSubstantivo.ts`), onde colocar novo estado (referenciar ADR de DT-006/EV-001), processo de PR (referenciar EV-005).
- **Referência no checklist:** Fase 4 — "CONTRIBUTING.md com convenções do projeto"
- **Esforço:** P (< 4h)

---

## 🔧 PIPELINES CI/CD SUGERIDAS

### Pipeline 1: PR Validation

```yaml
# .github/workflows/pr-validation.yml
name: PR Validation

on:
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npx tsc --noEmit

      - name: Run tests
        run: npx jest --watchAll=false --coverage

      - name: Upload coverage
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/
```

**Objetivo:** Garante que nenhum PR seja mesclado em `main` sem passar por lint, type-check e testes unitários — fecha a lacuna crítica de DT-002.
**Quando roda:** Em todo `pull_request` aberto ou atualizado contra `main`.

---

### Pipeline 2: EAS Preview Build (QA)

```yaml
# .github/workflows/eas-preview.yml
name: EAS Preview Build

on:
  pull_request:
    branches: [main]
    types: [labeled]

jobs:
  build:
    if: github.event.label.name == 'build-preview'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: npm ci

      - name: Build preview (Android + iOS)
        run: eas build --platform all --profile preview --non-interactive --no-wait
```

**Objetivo:** Permite gerar um build de QA instalável (via EAS `preview` profile) sob demanda, aplicando a label `build-preview` no PR, sem builds manuais. Depende de `eas.json` existir primeiro (EV-004).
**Quando roda:** Quando a label `build-preview` é adicionada a um PR.

---

### Pipeline 3: Release (main → produção)

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run full test suite
        run: npx jest --watchAll=false

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Publish OTA update (production channel)
        run: eas update --channel production --message "${{ github.event.head_commit.message }}"
```

**Objetivo:** Em todo merge em `main`, valida a suíte completa e publica uma atualização OTA via EAS Update no canal `production` — fecha o item `CICD-02` do `BACKLOG.md` existente. Builds nativos completos (binário novo na loja) ficam fora deste pipeline e devem ser disparados manualmente via `eas build --profile production`.
**Quando roda:** Em todo `push` direto em `main` (ou seja, todo merge de PR).

---

## 📚 MAPA DE ESTUDOS PRIORIZADO

| #   | Tópico                                                          | Fase     | Recurso específico sugerido                                                                                               | Semanas |
| --- | --------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------- | ------- |
| 1   | Mock Functions e Jest factory functions                         | Fase 2   | Jest Docs — "Mock Functions" (jestjs.io/docs/mock-functions)                                                              | 1       |
| 2   | `expo-secure-store` e Persistence customizada no Firebase Auth  | Fase 3   | Expo Docs — SecureStore + Firebase JS SDK `Persistence` interface                                                         | 1       |
| 3   | GitHub Actions para projetos Expo/EAS                           | Fase 2   | Expo Docs — "EAS Workflows" + `expo-github-action` README                                                                 | 1       |
| 4   | TanStack Query — Server State vs Client State                   | Fase 1   | Blog "Practical React Query" de TkDodo (tkdodo.eu/blog)                                                                   | 2       |
| 5   | Clean Architecture aplicada a React Native (Repository Pattern) | Fase 0/1 | Buscar "Clean Architecture React Native repository pattern" + qualquer curso de arquitetura RN (ex.: Rocketseat "Ignite") | 2       |
| 6   | Sentry para React Native/Expo (setup + breadcrumbs)             | Fase 3   | Sentry Docs — "React Native Manual Setup for Expo"                                                                        | 1       |
| 7   | Maestro para testes E2E declarativos                            | Fase 2   | maestro.mobile.dev — "Getting Started" + "Writing your first flow"                                                        | 1       |
| 8   | Architecture Decision Records (ADR)                             | Fase 0/4 | "joelparkerhenderson/architecture-decision-record" no GitHub                                                              | 1       |
| 9   | Conventional Commits + semantic-release                         | Fase 0/4 | conventionalcommits.org + docs do `standard-version`                                                                      | 1       |
| 10  | React Compiler — quando memoizar manualmente                    | Fase 3   | react.dev/learn/react-compiler                                                                                            | 1       |

> Sequência total estimada: ~12 semanas em ritmo de estudo paralelo ao trabalho, priorizando itens 1–3 (bloqueadores diretos de qualidade/CI) antes de aprofundar em arquitetura (itens 4–5).

---

## 📝 NOTAS DO AGENTE

- **`node_modules` não estava instalado no momento da análise** — não foi possível executar `npm test` ou `npm run lint` de fato; as falhas identificadas em `DT-001` (testes quebrados) foram confirmadas por leitura estática de código (a sintaxe de `jest.mock` em `login.test.ts` é inválida como objeto, e o texto esperado em `home.test.tsx` não existe no componente testado), não por execução. Recomenda-se rodar `npm install && npm test` manualmente para confirmar antes de iniciar a correção.
- **Diff não commitado em `contexts/AuthContext.tsx`** (visível via `git status`/`git diff` no momento da análise) já é uma correção parcial e na direção certa do item `ARQU-01` do `BACKLOG.md` existente — mas não resolve o problema de fundo (log incondicional em produção, ver DT-003). Vale comitar essa mudança como passo intermediário e abrir o item DT-003 como follow-up.
- **Existe um `BACKLOG.md` não commitado na raiz** (aparece como `??` no `git status`) — provavelmente gerado por uma sessão de auditoria anterior. Os dois documentos devem ser conciliados (ou commitados juntos) para não gerar confusão sobre qual é a fonte de verdade do backlog técnico.
- **Tipo `UserProfile` em `types/User.ts`** tem um comentário de cabeçalho `// types/UserProfile.ts` que não corresponde ao nome real do arquivo (`User.ts`) — provável resquício de renomeação, sem impacto funcional, mas vale corrigir para evitar confusão.
- **`services/user/unsureUserProfileExists.ts`** tem um nome de arquivo com typo aparente (`unsure` em vez de `ensure`) — não foi lido o conteúdo deste arquivo especificamente nesta auditoria, mas o nome sugere a intenção de "ensure user profile exists"; vale renomear em uma limpeza futura de baixo risco.
- **Nenhuma dependência desatualizada crítica foi identificada** — `react: 19.1.0`, `react-native: 0.81.5`, `expo: ~54.0.31` estão alinhados com versões recentes do ecossistema (data da análise: junho/2026). Vale reavaliar este ponto periodicamente, já que o ecossistema Expo/RN evolui rápido.
- **Decisão arquitetural que parece intencional e merece ADR formal:** o uso de Firestore como único backend (sem BFF/API própria) é uma escolha válida para o estágio atual do produto, mas deveria estar documentada como ADR (EV-001) explicando o trade-off aceito (lock-in no Firebase, regras de segurança como única camada de autorização) antes que o projeto cresça e essa decisão precise ser revisitada sob pressão.

---

_Backlog gerado via análise autônoma do repositório com base no Roadmap Mobile Sênior Internacional._
_Revisar e priorizar com o desenvolvedor antes de iniciar implementação._
