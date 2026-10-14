# 🎵 Music Box — Backlog de Refatoração Técnica

> Auditoria baseada nos 7 pilares de arquitetura sênior para React Native / Expo.  
> Stack atual: Expo ~54 · Expo Router ~6 · React Native 0.81 · Zustand · TanStack Query · Firebase · AsyncStorage

---

## 🗺️ Sumário de Diagnóstico

| Pilar                           | Status Atual | Risco   |
| ------------------------------- | ------------ | ------- |
| 1. Arquitetura & State          | ⚠️ Parcial   | Médio   |
| 2. Offline-First & Cache        | 🔴 Falho     | Alto    |
| 3. Design System & A11y         | 🔴 Falho     | Médio   |
| 4. Performance Runtime          | ⚠️ Parcial   | Alto    |
| 5. Segurança Mobile             | 🔴 Falho     | Crítico |
| 6. CI/CD & EAS                  | 🔴 Ausente   | Alto    |
| 7. Telemetria & Observabilidade | 🔴 Ausente   | Alto    |

---

<!--
## 🔴 Prioridade ALTA

### [ARQU-01] Remover `console.log` com dados sensíveis de usuário
- **Arquivo:** `contexts/AuthContext.tsx` (linha 22)
- **Problema:** `console.log` expõe `uid` e `emailVerified` em produção — vazamento de dados.
- **Solução:** Remover ou substituir por logger condicional (`__DEV__ && logger.debug(...)`).
- **Esforço:** 🟢 Pequeno (< 1h)

--- -->

<!-- ### [ARQU-02] Mover lógica de negócio do `AuthContext` para um hook dedicado
- **Arquivo:** `contexts/AuthContext.tsx`
- **Problema:** O contexto mistura orquestração do Firebase com estado de sessão. Dificulta testes e reuso.
- **Solução:** Extrair para `hooks/useAuthSession.ts`, deixando o contexto apenas como provedor de estado.
- **Esforço:** 🟡 Médio (2–4h)

--- -->

<!-- ### [PERF-01] Substituir `<Image />` nativo por `expo-image`
- **Arquivo:** `app/(protected)/(tabs)/index.tsx` (linha 43–46)
- **Problema:** A tag `<Image />` do React Native não usa cache em disco, não suporta WebP/AVIF e não tem `blurhash` placeholder.
- **Solução:** Substituir por `<Image>` do `expo-image` (já instalado) com `contentFit`, `cachePolicy` e `placeholder`.
- **Antes:**
  ```tsx
  import { Image } from "react-native";
  <Image source={{ uri: item.cover_medium }} style={{ width: "100%", aspectRatio: 1, borderRadius: 8 }} />
  ```
- **Depois:**
  ```tsx
  import { Image } from "expo-image";
  <Image source={item.cover_medium} style={{ width: "100%", aspectRatio: 1, borderRadius: 8 }}
    contentFit="cover" cachePolicy="memory-disk" placeholder={{ blurhash: item.md5_image }} />
  ```
- **Esforço:** 🟢 Pequeno (1–2h)

--- -->

### [PERF-02] Substituir `FlatList` por `@shopify/flash-list` na tela de listagem

- **Arquivo:** `app/(protected)/(tabs)/index.tsx` (linha 37)
- **Problema:** `FlatList` padrão tem overhead de layout significativo em listas longas com imagens.
- **Solução:** Instalar e usar `FlashList` com `estimatedItemSize`.
- **Esforço:** 🟡 Médio (2–3h)

---

### [SEC-01] Proteger dados sensíveis com `expo-secure-store`

- **Contexto:** Tokens do Firebase/Google podem ser cacheados pelo SDK — validar onde são persistidos.
- **Problema:** Qualquer token/chave armazenada fora do `expo-secure-store` é acessível em dispositivos com root.
- **Solução:** Instalar `expo-secure-store` e usá-lo para persistência de tokens de sessão e refresh tokens.
- **Esforço:** 🟡 Médio (3–5h)
- **Status:** ✅ Resolvido — Ver `DT-004` em `BACKLOG_EVOLUCAO_SENIOR.md` para os detalhes completos. Resumo: `storage/auth/secureStorePersistence.ts` implementa um adaptador `ReactNativeAsyncStorage` sobre `expo-secure-store` (com sanitização de chaves, chunking de valores >2048 bytes e fallback para `AsyncStorage` no web), plugado em `services/firebase.ts` via `getReactNativePersistence(secureStoreAsyncStorage)`. Testado em `storage/auth/secureStorePersistence.test.ts`.

---

### [SEC-02] Auditar variáveis de ambiente no `.env`

- **Arquivo:** `.env` (existe na raiz, não commitado)
- **Problema:** Se `EXPO_PUBLIC_*` estiver sendo usada para chaves privadas de API (ex: Firebase Admin, chaves server-side), elas ficam embutidas no bundle.
- **Solução:** Apenas `EXPO_PUBLIC_*` para valores realmente públicos. Chaves privadas devem ficar em servidor (Cloud Functions, BFF). Adicionar `.env` ao `.gitignore` (verificar).
- **Esforço:** 🟢 Pequeno (1–2h)

---

### [CICD-01] Criar configuração `eas.json` com profiles de build

- **Problema:** Sem `eas.json`, builds são feitos manualmente sem separação entre ambientes.
- **Solução:** Criar profiles `development`, `preview` e `production` com variáveis de ambiente por ambiente.
- **Esforço:** 🟡 Médio (2–4h)
- **Exemplo:**
  ```json
  {
    "cli": { "version": ">= 12.0.0" },
    "build": {
      "development": {
        "developmentClient": true,
        "distribution": "internal",
        "env": { "APP_ENV": "development" }
      },
      "preview": {
        "distribution": "internal",
        "channel": "preview"
      },
      "production": {
        "channel": "production"
      }
    }
  }
  ```

---

### [CICD-02] Configurar EAS Update para atualizações OTA

- **Problema:** Sem EAS Update, qualquer correção de JS exige nova submissão às lojas.
- **Solução:** Configurar `expo-updates` com canais por branch (`main` → `production`, `develop` → `preview`).
- **Esforço:** 🟡 Médio (3–5h)

---

### [OBS-01] Integrar Sentry para React Native com source maps automáticos

- **Problema:** Não há captura de erros em produção. Crashes e erros silenciosos de JS são invisíveis.
- **Solução:** Instalar `@sentry/react-native` com upload automático de source maps via `eas.json`.
- **Esforço:** 🟡 Médio (3–5h)

---

## 🟡 Prioridade MÉDIA

### [ARQU-03] Organizar `components/` por feature (Feature-First)

- **Problema:** `components/` é uma pasta plana com componentes de domínios distintos (`GoogleLoginButton`, `RatingInput`, `profileComponents`, etc.), dificultando escalabilidade.
- **Solução:** Reorganizar em subpastas por domínio: `components/auth/`, `components/album/`, `components/profile/`, `components/ui/`.
- **Esforço:** 🟡 Médio (2–4h)

---

### [ARQU-04] Integrar `loadProfile` do Zustand com TanStack Query

- **Arquivo:** `storage/store/profileStore.ts`
- **Problema:** O `profileStore` gerencia manualmente loading/error e faz chamadas imperativas. Há duplicação de responsabilidade com o TanStack Query já instalado.
- **Solução:** Usar `useQuery` para `getUserProfile` e `getUserRecentReviews`. Zustand fica apenas para estado de UI local.
- **Antes:**
  ```ts
  async loadProfile(userId) {
    set({ loading: true });
    const [recentReviews, profile] = await Promise.all([...]);
    set({ recentReviews, profile, loading: false });
  }
  ```
- **Depois:**
  ```ts
  const { data: profile } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => getUserProfile(userId),
    staleTime: 5 * 60 * 1000,
  });
  ```
- **Esforço:** 🟡 Médio (3–5h)
- **Status:** ✅ Resolvido. `storage/store/profileStore.ts` foi removido; `app/(protected)/(tabs)/profile.tsx` já busca `profile` e `recentReviews` via `useQuery`. As chamadas a `useProfileStore.getState().loadProfile/reset` foram removidas de `services/auth/login.ts` e `services/auth/logout.ts`. Fronteira documentada em `docs/adr/0001-state-management-boundaries.md`.

---

### [DESIGN-01] Eliminar valores mágicos de cor/tamanho hardcoded

- **Arquivos:** `app/(protected)/(tabs)/index.tsx`, outros componentes
- **Problema:** `color: "#fff"`, `color: "#666"`, `fontSize: 24`, `margin: 8` espalhados inline — impossível manter design system consistente.
- **Solução:** Criar tokens no `constants/theme.ts` (spacing, typography) e referenciar via constantes.
- **Esforço:** 🟡 Médio (4–6h)

---

### [DESIGN-02] Adicionar propriedades de acessibilidade (A11y) nos componentes interativos

- **Problema:** `<Pressable>`, `<Image>` e itens de lista não têm `accessibilityLabel`, `accessibilityRole` ou `accessibilityHint`.
- **Solução:** Auditar todos os elementos interativos e adicionar as props obrigatórias para leitores de tela (VoiceOver/TalkBack).
- **Exemplo:**
  ```tsx
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={`Ver álbum ${item.title} de ${item.artist.name}`}
    onPress={() => router.push(`/album/${item.id}`)}
  >
  ```
- **Esforço:** 🟡 Médio (3–5h)

---

### [OFFLINE-01] Configurar persistência offline do TanStack Query com AsyncStorage

- **Problema:** O TanStack Query está configurado sem `persistQueryClient`. Ao fechar o app, todo cache é perdido — sem dados offline.
- **Solução:** Instalar `@tanstack/query-async-storage-persister` e `@tanstack/react-query-persist-client` para persistir o cache entre sessões.
- **Esforço:** 🟡 Médio (3–4h)

---

### [OFFLINE-02] Avaliar migração de AsyncStorage para MMKV

- **Problema:** `AsyncStorage` tem performance inferior para leituras síncronas frequentes; é baseado em JSON síncrono-assíncrono com overhead.
- **Solução:** Instalar `react-native-mmkv` para substituir usos de AsyncStorage em chave-valor simples (preferências, tokens não-sensíveis).
- **Esforço:** 🟡 Médio (2–4h)

---

### [PERF-03] Auditar uso de `useCallback`/`useMemo` e React Compiler

- **Contexto:** `app.json` já habilita `reactCompiler: true` (React Compiler ativo).
- **Problema:** Com React Compiler ativo, memoização manual pode gerar conflitos ou ser redundante.
- **Solução:** Auditar e remover `useCallback`/`useMemo` desnecessários; deixar o compiler otimizar. Manter apenas onde há dependências externas explícitas.
- **Esforço:** 🟡 Médio (2–4h)

---

### [SEC-03] Verificar e configurar SSL Pinning

- **Problema:** Sem SSL Pinning, requisições à API do Deezer e ao Firebase podem ser interceptadas por proxies (MITM) em redes não confiáveis.
- **Solução:** Avaliar `react-native-ssl-pinning` para endpoints críticos (autenticação, dados de usuário).
- **Esforço:** 🔴 Grande (5–8h)

---

## 🟢 Prioridade BAIXA

### [ARQU-05] Adicionar tipagem forte nos retornos das services do Deezer

- **Arquivo:** `services/album/searchAlbum.ts` — retorna `response.data.data` sem tipo definido.
- **Solução:** Criar tipos completos em `types/Deezer.ts` para todos os endpoints consumidos.
- **Esforço:** 🟢 Pequeno (2–3h)

---

### [DESIGN-03] Avaliar adoção de NativeWind v4 ou Unistyles

- **Problema:** `StyleSheet` puro sem sistema de tokens dificulta theming e modo escuro consistente.
- **Solução:** Avaliar NativeWind v4 (Tailwind) ou Unistyles 2.x para theming declarativo e responsivo.
- **Esforço:** 🔴 Grande (8–16h)

---

### [CICD-03] Automatizar assinatura de app com EAS Credentials

- **Problema:** Gerenciamento manual de keystores (Android) e certificados (iOS) é propenso a erros e perda.
- **Solução:** Migrar para `eas credentials` para gerenciamento centralizado e automatizado.
- **Esforço:** 🟡 Médio (3–5h)

---

### [OBS-02] Adicionar analytics de performance e breadcrumbs estruturados

- **Problema:** Não há rastreamento de gargalos de renderização ou fluxos de navegação em produção.
- **Solução:** Configurar Sentry Performance Monitoring com `Sentry.startTransaction` nos fluxos críticos (login, busca, carregamento de álbum).
- **Esforço:** 🟡 Médio (3–5h)

---

### [PERF-04] Ativar Hermes explicitamente e validar bytecode

- **Contexto:** `newArchEnabled: true` já está configurado no `app.json`.
- **Solução:** Confirmar que `jsEngine: "hermes"` está ativo nos builds de produção (padrão no Expo 50+) e que o bytecode pré-compilado está sendo gerado corretamente via EAS Build.
- **Esforço:** 🟢 Pequeno (1h)

---

## 📊 Resumo Executivo

| ID         | Título                                | Prioridade   | Esforço |
| ---------- | ------------------------------------- | ------------ | ------- |
| SEC-01     | expo-secure-store para tokens         | ✅ Resolvido | Médio   |
| SEC-02     | Auditoria variáveis de ambiente       | ✅ Resolvido | Pequeno |
| ARQU-01    | Remover console.log sensível          | ✅ Resolvido | Pequeno |
| PERF-01    | expo-image no lugar de Image          | ✅ Resolvido | Pequeno |
| PERF-02    | FlashList no lugar de FlatList        | 🔴 Alta      | Médio   |
| CICD-01    | Criar eas.json com profiles           | 🔴 Alta      | Médio   |
| CICD-02    | Configurar EAS Update (OTA)           | 🔴 Alta      | Médio   |
| OBS-01     | Integrar Sentry                       | ✅ Resolvido | Médio   |
| ARQU-02    | Hook dedicado para AuthContext        | ✅ Resolvido | Médio   |
| ARQU-03    | Organizar components por feature      | 🟡 Média     | Médio   |
| ARQU-04    | TanStack Query no ProfileStore        | ✅ Resolvido | Médio   |
| DESIGN-01  | Eliminar valores mágicos de cor       | 🟡 Média     | Médio   |
| DESIGN-02  | Acessibilidade (A11y)                 | 🟡 Média     | Médio   |
| OFFLINE-01 | Persistência offline TanStack Query   | 🟡 Média     | Médio   |
| OFFLINE-02 | Migrar para MMKV                      | 🟡 Média     | Médio   |
| PERF-03    | Auditar memoização com React Compiler | 🟡 Média     | Médio   |
| SEC-03     | SSL Pinning                           | 🟡 Média     | Grande  |
| ARQU-05    | Tipagem forte Deezer API              | 🟢 Baixa     | Pequeno |
| DESIGN-03  | NativeWind / Unistyles                | 🟢 Baixa     | Grande  |
| CICD-03    | EAS Credentials automático            | 🟢 Baixa     | Médio   |
| OBS-02     | Analytics de performance              | 🟢 Baixa     | Médio   |
| PERF-04    | Validar Hermes bytecode               | 🟢 Baixa     | Pequeno |

---

> Gerado em: Junho 2026 · Versão do app: 1.0.0
