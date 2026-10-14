# Plano de migração: Firebase Auth + Firestore para Supabase PostgreSQL

## Visão geral

Este documento registra o plano de migração baseado na arquitetura real do projeto e na análise do código atual. A intenção é manter o Firebase Authentication como fonte de identidade e substituir o Firestore por PostgreSQL no Supabase, acessado diretamente pelo React Native por meio do cliente JavaScript do Supabase.

A arquitetura desejada é:

React Native
│
├── Firebase Authentication
│   └── Firebase UID
│
└── Supabase JS Client
    └── Supabase PostgreSQL

Não há backend dedicado neste momento, e a arquitetura deve permanecer simples, adequada ao mobile, sem Prisma no bundle do React Native.

## 1. Arquitetura atual encontrada no código

### 1.1 Firebase Authentication

O projeto inicializa Firebase Auth em `services/firebase.ts`.

Principais características:

- `initializeApp(firebaseConfig)`
- `getFirestore(app)`
- `getAuth(app)`
- persistência usando `getReactNativePersistence(secureStoreAsyncStorage)`
- uso do Firebase Auth para login com Google

Fluxo do login:

- `services/auth/login.ts`
- `GoogleSignin.signIn()`
- `GoogleAuthProvider.credential(idToken)`
- `signInWithCredential(auth, credential)`
- `auth.currentUser` usado após login

O Firebase UID já é a identidade real do usuário no app.

### 1.2 Firestore

O projeto usa Firestore para persistir:

- perfil do usuário
- reviews do usuário
- albums salvos para depois
- contadores por usuário

Arquivos principais:

- `services/firebase.ts`
- `services/user/upsert.ts`
- `services/user/getUserProfile.ts`
- `services/reviews/upsertReview.ts`
- `services/reviews/getUserReviews.ts`
- `services/reviews/getUserRecentReviews.ts`
- `services/reviews/getUserAlbumReview.ts`
- `services/album/upsertSaveForLater.ts`
- `services/saveForLater/getUserSaveForLater.ts`
- `services/album/getIsFavoriteAlbum.ts`

### 1.3 Estrutura observada no Firestore

O código mostra que o app usa as seguintes noções de dados:

- `users/{uid}`
  - perfil do usuário
  - campos como `uid`, `name`, `email`, `photoURL`, `provider`, `createdAt`
  - contadores `reviewsCount` e `listenLaterCount`

- `reviews/{userId_albumId}`
  - review global por usuário + álbum
  - campos de review (`rating`, `comment`, `albumId`, etc.)

- `users/{uid}/reviews/{reviewId}`
  - ponteiro por usuário para manter listas de reviews

- `saveForLater/{userId_albumId}`
  - item salvo global por usuário + álbum

- `users/{uid}/saveForLater/{saveForLaterId}`
  - ponteiro por usuário para manter listas

A arquitetura usa transações para manter consistência:

- `runTransaction(db, ...)`
- `increment(1)` para contadores
- `serverTimestamp()` para timestamps

Isso mostra que o app já possui uma lógica de consistência que deve ser refletida em SQL com constraints, unique indexes e regras de negócio explicitadas.

## 2. Entidades e padrões reais no código

### 2.1 `users`

Arquivo:
- `services/user/upsert.ts`
- `services/user/getUserProfile.ts`

Estrutura real:

- documento keyado pelo Firebase UID
- `uid`, `name`, `email`, `photoURL`, `provider`, `createdAt`
- contadores `reviewsCount`, `listenLaterCount`

Conclusão:

- o Firebase UID é o identificador natural do usuário
- isso é adequado para manter em PostgreSQL como `users.id`

### 2.2 Reviews

Arquivos:
- `services/reviews/upsertReview.ts`
- `services/reviews/getUserReviews.ts`
- `services/reviews/getUserRecentReviews.ts`
- `services/user/getUserAlbumReview.ts`

O app grava uma review como:

- `reviews/{user.uid}_${album.id}`
- campos com: `userId`, `albumId`, `title`, `artist`, `cover`, `rating`, `comment`, `ratedAt`

Também cria um ponteiro em:

- `users/{uid}/reviews/{reviewId}`

Leituras:

- por usuário
- por álbum
- recentes ordenados por `ratedAt`

Conclusão:

- a relação user-review-album deve virar tabelas SQL com integridade referencial e unique constraints
- não faz sentido manter ponteiros duplicados em SQL se a tabela `reviews` já expressa o relacionamento direto

### 2.3 `saveForLater`

Arquivos:
- `services/album/upsertSaveForLater.ts`
- `services/saveForLater/getUserSaveForLater.ts`
- `services/album/getIsFavoriteAlbum.ts`

Estrutura:

- documento global: `saveForLater/{userId_albumId}`
- campos: `userId`, `albumId`, `album: { title, cover, artist }`, `savedAt`
- ponteiro em `users/{uid}/saveForLater/{saveForLaterId}`

Conclusão:

- o melhor modelo relacional é uma tabela `saved_albums` com unique `(user_id, album_id)`
- não precisa de subcollection ou ponteiro por usuário

## 3. Análise dos pontos de integração com Firebase e Supabase

### 3.1 Variáveis de ambiente existentes

Arquivo:
- `.env.example`

Existem variáveis públicas do Firebase:

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID`

Também já existe a base do cliente do Supabase:

- `lib/supabase.ts`
- usa `createClient(process.env.EXPO_PUBLIC_SUPABASE_URL!, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!)`

Isso confirma que a dependência do Supabase já foi adicionada, mas a integração secionada pela autenticação do usuário ainda precisa ser feita de forma segura.

### 3.2 Configuração do Expo

A configuração do Expo já usa variáveis públicas em:

- `app/_layout.tsx`
- Google SignIn e Sentry usam `EXPO_PUBLIC_*`

Esse padrão é consistente com a abordagem correta para app cliente: usar chaves públicas e nunca segredos do banco.

### 3.3 Dependências reais

`package.json` já contém:

- `firebase`
- `@supabase/supabase-js`
- `@react-native-google-signin/google-signin`

A dependência do Supabase já está instalada. Não é necessário adicionar Prisma ao app.

## 4. Risco de segurança: não usar `user_id` do cliente como fonte de confiança

O requisito mais importante do projeto é que o cliente não tenha controle arbitrário sobre o owner do dado.

O padrão inseguro seria:

```ts
const uid = auth.currentUser?.uid;

await supabase.from('projects').select('*').eq('user_id', uid);
```

Esse padrão não é suficiente porque o cliente pode manipular o valor de `user_id` na requisição.

O correto é:

- o banco confiar no JWT validado
- o JWT do Firebase ser integrado ao Supabase como identidade externa
- a política do banco usar `auth.uid()` ou a claim equivalente do provedor autenticado

## 5. Como o Supabase deve validar o Firebase como provedor de identidade

A abordagem correta é usar o Firebase Authentication como provedor externo/custom JWT do Supabase, conforme o suporte atual do Supabase.

Em termos práticos:

- manter Firebase Auth ativo no app
- obter o ID token do usuário autenticado pelo Firebase
- passá-lo ao Supabase usando o mecanismo de JWT/authorization aceito pelo cliente
- no banco, o Supabase valida esse JWT
- a política do PostgreSQL usa a identidade do JWT validado, não um campo vindo do aplicativo

O objetivo é ficaria equivalente a:

```sql
create policy "Users can access their own data"
on some_table
for select
to authenticated
using (user_id = auth.uid());
```

Mas o que precisa ser ajustado para o cenário Firebase são:

- `auth.uid()` deve refletir o subject do JWT validado pelo Supabase
- para a integração Firebase, esse subject deve corresponder ao Firebase UID do usuário
- o Supabase precisa reconhecer que esse JWT veio do provedor Firebase, não de uma Auth native do Supabase

Em outras palavras, o valor correto para políticas de RLS é o UID do Firebase, porque esse valor é a identidade estável do usuário no sistema atual.

Se `auth.uid()` for usado, ele precisa representar o identificador do usuário autenticado que o Supabase reconheceu como `authenticated` e que foi emitido pelo provedor configurado. No cenário de Firebase, isso deve apontar para o UID do Firebase.

### Recomendação final

- manter o Firebase UID como identificador estável do usuário
- usar esse mesmo UID como `users.id` em PostgreSQL
- no RLS, confiar em `auth.uid()` após a validação do JWT do Firebase pelo Supabase
- não confiar em `user_id` vindo do cliente

## 6. Modelo relacional proposto

### 6.1 Tabela `users`

Finalidade:
- armazenar perfil do usuário autenticado com Firebase

Primary key:
- `id` = Firebase UID

Foreign keys:
- nenhum

Índices:
- PK já gera índice

Constraints:
- `id` not null
- `email` nullable se email não estiver disponível

Campos nullable:
- `name`, `email`, `photo_url`

Relacionamento com Firebase UID:
- direto: `users.id = firebase_uid`

### 6.2 Tabela `albums`

Finalidade:
- armazenar metadados do álbum consultado e associado aos reviews/saves

Primary key:
- `id` = Deezer album ID (número inteiro)

Foreign keys:
- nenhum

Índices:
- índice em `id` (PK)

Constraints:
- `source` e `title` obrigatórios se o app precisar operá-los

Campos nullable:
- `artist`, `cover_url`, `source`

Relacionamento com Firebase UID:
- indireto; não precisa do UID

### 6.3 Tabela `reviews`

Finalidade:
- representar a avaliação de um álbum pelo usuário

Primary key:
- `id` = UUID ou `user_id + album_id`

Foreign keys:
- `user_id -> users.id`
- `album_id -> albums.id`

Índices:
- `idx_reviews_user_id_rated_at (user_id, rated_at DESC)`
- unique `(user_id, album_id)`

Constraints:
- `rating` entre 1 e 5
- `comment` opcional
- `rated_at` obrigatório

Campos nullable:
- `comment`

Relacionamento com Firebase UID:
- `reviews.user_id` = Firebase UID do usuário autenticado

### 6.4 Tabela `saved_albums`

Finalidade:
- representar o álbum salvo para mais tarde

Primary key:
- `id` = UUID ou `user_id + album_id`

Foreign keys:
- `user_id -> users.id`
- `album_id -> albums.id`

Índices:
- `idx_saved_albums_user_id_saved_at (user_id, saved_at DESC)`
- unique `(user_id, album_id)`

Constraints:
- `saved_at` obrigatório
- unique `(user_id, album_id)` para evitar duplicação

Campos nullable:
- nenhum em usos típicos

Relacionamento com Firebase UID:
- `saved_albums.user_id` = Firebase UID do usuário autenticado

## 7. Relações e normalização

### 7.1 1:1

- usuário e perfil
- a tabela `users` é suficiente para perfil e dados pessoais do usuário

### 7.2 1:N

- um usuário tem muitas reviews
- um usuário tem muitos albums salvos
- um álbum pode ter muitas reviews

### 7.3 N:N

- não é necessário representar uma relação N:N geral no momento
- a relação user-album é resolvida por `reviews` e `saved_albums`

### 7.4 Arrays e objetos aninhados

O código atual tem objetos aninhados como:

- `album: { title, cover, artist }`

Em SQL, isso deve virar colunas normais ou uma tabela separada se a estrutura crescer. Para o escopo atual, o melhor é armazenar campos simples em `saved_albums` ou `albums` e não manter JSON grossamente.

### 7.5 Subcollections

As subcollections do Firestore (`users/{uid}/reviews`, `users/{uid}/saveForLater`) são um padrão de ponteiro para simplificar consultas no app. Em SQL, essas subcollections devem ser abandonadas como estrutura de persistência operacional, porque a tabela principal com FK já resolve a relação.

## 8. Firebase UID como identidade estável

É recomendável manter o Firebase UID como identidade em PostgreSQL.

Exemplo:

```text
Firebase Auth
uid = abc123

PostgreSQL
users.id = abc123
```

Isso é adequado porque:

- o app já usa o UID como identificador do usuário
- o sistema já foi construído sobre esse valor
- evita uma migração de identidade desnecessária

Não é necessário gerar um novo ID interno se o Firebase UID já funciona como identificador do usuário em todas as operações do app.

## 9. Supabase: configuração cliente e segurança

O cliente do app deve usar apenas chaves públicas:

```env
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

Nunca incluir:

- `service_role` key
- senha do banco
- connection string do PostgreSQL
- secrets administrativos

O ambiente do app mobile nunca deve ter as credenciais privilegiadas do Supabase.

## 10. Prisma

Não deve haver Prisma no React Native.

O projeto não tem backend dedicado e a intenção é manter a arquitetura simples. Portanto, não deve ser feito:

```ts
import { PrismaClient } from "@prisma/client";
```

Se no futuro for necessário Prisma, ele deve rodar em:

- uma API/admin tool
- um worker/backend isolado
- um ambiente de migração/ETL, não no mobile

Neste momento, o uso do Supabase JavaScript client é a escolha correta e mais simples para o app.

## 11. Mapeamento do código atual para SQL

### 11.1 `users/{uid}`

Mapeamento proposto:

```sql
INSERT INTO users (id, name, email, photo_url, provider, created_at)
VALUES (...);
```

### 11.2 `reviews/{userId_albumId}`

Mapeamento proposto:

```sql
INSERT INTO reviews (user_id, album_id, title, artist, cover, rating, comment, rated_at)
VALUES (...);
```

### 11.3 `saveForLater/{userId_albumId}`

Mapeamento proposto:

```sql
INSERT INTO saved_albums (user_id, album_id, title, artist, cover, saved_at)
VALUES (...);
```

### 11.4 Contadores `reviewsCount` e `listenLaterCount`

Hoje o app mantém esses valores em `users/{uid}` via `increment(1)`.

Em SQL, existem duas opções:

- calcular no read com `COUNT(*)`
- manter contadores em `users` se houver necessidade de performance crítica

Para arquitetura simples e confiável, o melhor é começar pelo cálculo derivado em queries, a menos que o uso real mostrar necessidade de contadores materializados.

## 12. Plano de migração em etapas

### Etapa 1 — Validar a estrutura real do Firestore

- listar todos os documentos e subcollections usados
- confirmar contadores, campos e timestamps
- verificar quais campos são realmente usados pela UI
- preservar dados existentes

### Etapa 2 — Definir schema SQL e RLS

- criar `users`, `albums`, `reviews`, `saved_albums`
- definir `PK`, `FK`, `UNIQUE`, `INDEX`, `CHECK`
- ativar RLS em todas as tabelas
- definir políticas `using (user_id = auth.uid())`

### Etapa 3 — Integrar JWT do Firebase ao Supabase

- validar que o Supabase aceita o Firebase como provedor externo/custom JWT
- garantir que o subject do JWT corresponda ao Firebase UID
- evitar que `user_id` venha do cliente

### Etapa 4 — Implementar cliente Supabase no app

- centralizar em um módulo como `lib/supabase.ts`
- usar `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- manter a autenticação via Firebase Auth

### Etapa 5 — Substituir services do Firestore

Trocar partes como:

- `getUserProfile`
- `upsertUser`
- `getUserReviews`
- `getUserRecentReviews`
- `getUserAlbumReview`
- `upsertReview`
- `upsertSaveForLater`
- `getUserSaveForLater`
- `getIsFavoriteAlbum`

por consultas ao Supabase.

### Etapa 6 — Migração de dados

- exportar ou复制 dados aprovados do Firestore
- transformar para o formato SQL
- migrar para o Supabase
- validar contagens e registros por usuário

### Etapa 7 — Cutover e rollback

- manter Firebase Auth e Firestore em modo de rollback
- validar app localmente e em staging
- só depois remover o Firestore do app, caso fique aprovado

## 13. Arquivos principais afetados

- `services/firebase.ts`
- `lib/supabase.ts`
- `services/user/*`
- `services/reviews/*`
- `services/album/*`
- `services/saveForLater/*`
- `.env.example`
- `package.json`

## 14. Conclusão

O código real do projeto já mostra que a identidade do usuário é o Firebase UID e que a persistência de dados hoje é orientada por perfil + reviews + albums salvos. Isso torna a migração para PostgreSQL natural e segura, desde que o banco confie no JWT autenticado do Firebase e não em valores arbitrários enviados pelo client.

A recomendação principal é:

- manter Firebase Authentication
- usar o Firebase UID como `users.id`
- modelar `reviews` e `saved_albums` como tabelas relacionais
- usar Supabase JS client com RLS
- garantir no banco que `auth.uid()` reflita o usuário autenticado pelo Firebase

Esse é o caminho mais simples, seguro e coerente com a arquitetura atual do app em React Native/Expo.
