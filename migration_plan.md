Quero migrar a persistência de dados deste projeto de Firebase Firestore para Supabase PostgreSQL, mas quero manter o Firebase Authentication exatamente como está.

Você tem acesso ao código completo do projeto. Antes de fazer qualquer alteração, analise a arquitetura atual, identifique como o Firebase Auth e o Firestore são utilizados e apresente um plano de migração baseado no código real do projeto.

## Contexto atual

Este é um aplicativo React Native/Expo.

Atualmente:

- O aplicativo usa Firebase Authentication para autenticação dos usuários.
- O aplicativo usa Firebase Firestore como banco de dados.
- Não existe um backend dedicado.
- Quero continuar usando Firebase Authentication.
- Quero substituir o Firestore por PostgreSQL hospedado no Supabase.
- Quero que o React Native consiga acessar os dados do Supabase diretamente, sem criar um backend dedicado neste primeiro momento.
- Não quero colocar Prisma dentro do React Native.
- A prioridade é manter a arquitetura simples e adequada para um aplicativo mobile.
- Quero manter o Firebase Auth como fonte de identidade dos usuários.

A arquitetura desejada é aproximadamente:

React Native
│
├── Firebase Authentication
│ │
│ └── Firebase UID
│
└── Supabase JS Client
│
└── Supabase PostgreSQL

Não quero substituir Firebase Auth por Supabase Auth.

## Objetivo

Migrar os dados atualmente armazenados no Firestore para tabelas relacionais no PostgreSQL do Supabase.

Quero também substituir as operações atuais do Firestore no aplicativo por operações usando `@supabase/supabase-js`.

Exemplo conceitual:

ANTES:

React Native
↓
Firebase Auth
↓
Firestore

DEPOIS:

React Native
↓
Firebase Auth
↓
Supabase JS
↓
Supabase PostgreSQL

## Requisito importante de segurança

Não quero simplesmente pegar:

```ts
auth.currentUser?.uid;
```

e fazer:

```ts
supabase.from("projects").select("*").eq("user_id", uid);
```

sem proteção no banco.

Isso não é suficiente porque o cliente pode potencialmente modificar o `user_id` enviado na requisição.

Precisamos implementar uma estratégia de autenticação/autorização que permita ao Supabase/PostgreSQL identificar de forma confiável o usuário autenticado pelo Firebase e aplicar Row Level Security (RLS).

Investigue a melhor forma atualmente suportada pelo Supabase para usar Firebase Authentication como provedor de identidade externo/custom JWT e permitir que o JWT do Firebase seja utilizado pelo Supabase para autorização/RLS.

Não invente uma solução. Primeiro verifique a documentação/configuração existente no projeto e, se necessário, consulte a documentação oficial atual do Supabase.

O objetivo é chegar a algo conceitualmente equivalente a:

```sql
create policy "Users can access their own data"
on some_table
for select
to authenticated
using (user_id = auth.uid());
```

mas adaptado corretamente para Firebase UID + Firebase JWT + Supabase.

Se `auth.uid()` não for a abordagem correta para Firebase Auth nesse cenário, determine qual claim deve ser utilizado e explique por quê.

## Primeiro passo: análise

Antes de modificar arquivos, procure e identifique:

1. Configuração do Firebase.
2. Configuração do Firebase Authentication.
3. Todos os locais que usam:

   - `firebase/auth`
   - `firebase/firestore`
   - `getFirestore`
   - `collection`
   - `doc`
   - `getDoc`
   - `getDocs`
   - `addDoc`
   - `setDoc`
   - `updateDoc`
   - `deleteDoc`
   - `onSnapshot`
   - queries com `where`, `orderBy`, `limit`, etc.

4. Todos os repositories/services/hooks relacionados a dados.
5. Estrutura atual das collections e subcollections.
6. Onde o Firebase UID é utilizado.
7. Onde dados específicos do usuário são armazenados.
8. Variáveis de ambiente existentes.
9. Configuração do Expo.
10. Dependências atuais relacionadas a Firebase.
11. Testes existentes relacionados a Firebase/Firestore.
12. Se existem Cloud Functions, caso existam.
13. Se existem regras atuais do Firestore (`firestore.rules`).

Não assuma a estrutura do banco. Derive o modelo a partir do código.

## Modelagem do PostgreSQL

Depois de entender o Firestore, proponha um modelo relacional.

Não faça uma conversão mecânica:

Firestore collection → SQL table

Analise as relações entre entidades.

Por exemplo, se o Firestore possui algo como:

```text
users/{userId}
users/{userId}/projects/{projectId}
```

considere algo como:

```text
users
projects
```

com:

```text
projects.user_id → users.id
```

Analise também:

- relacionamentos 1:1
- relacionamentos 1:N
- relacionamentos N:N
- arrays
- objetos aninhados
- subcollections
- timestamps
- documentos opcionais
- campos que podem ser normalizados
- dados que eventualmente devem permanecer como JSONB

Não normalize excessivamente apenas por ser SQL.

Para cada tabela proposta, explique brevemente:

- finalidade
- primary key
- foreign keys
- índices
- constraints
- campos nullable
- relacionamento com Firebase UID

## Firebase UID

Quero preferencialmente manter o Firebase UID como identificador estável do usuário.

Por exemplo:

```text
Firebase Auth

uid = abc123

        ↓

PostgreSQL

users.id = abc123
```

Avalie se isso é adequado para o modelo encontrado no projeto.

Não gere IDs diferentes para usuários sem necessidade.

## Supabase

Adicionar a dependência:

```bash
npm install @supabase/supabase-js
```

ou equivalente adequado ao package manager utilizado pelo projeto.

Criar uma configuração centralizada do Supabase, por exemplo:

```ts
src / lib / supabase.ts;
```

ou seguindo a estrutura já existente no projeto.

O cliente deve usar somente credenciais públicas apropriadas para o client-side, como:

```env
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

Nunca coloque:

- `service_role` key
- database password
- PostgreSQL connection string
- qualquer secret privilegiado

dentro do aplicativo React Native.

## Prisma

Eu inicialmente considerei usar Prisma porque quero PostgreSQL no Supabase.

Porém, como este projeto não possui backend dedicado, NÃO quero usar Prisma diretamente no React Native.

Não faça:

```ts
import { PrismaClient } from "@prisma/client";
```

dentro do mobile.

Se você concluir que Prisma é necessário para alguma parte específica, explique por que e proponha onde ele deveria rodar, mas não adicione Prisma ao bundle do React Native.

Para esta primeira versão, prefiro:

```text
React Native
    ↓
Supabase JS
    ↓
PostgreSQL
```

com RLS protegendo os dados.

## Migração dos dados

Depois de definir o schema, precisamos migrar os dados existentes do Firestore.

Não apague nem altere os dados do Firestore durante a primeira etapa.

Crie uma estratégia/script de migração separado.

O fluxo deve ser:

```text
Firestore
    ↓
migration script
    ↓
Supabase PostgreSQL
```

O script deve:

1. Ler os documentos do Firestore.
2. Transformar os documentos para o modelo relacional.
3. Preservar os Firebase UIDs.
4. Preservar IDs importantes quando fizer sentido.
5. Converter timestamps corretamente.
6. Resolver foreign keys.
7. Tratar documentos sem campos opcionais.
8. Ser seguro para executar novamente ou, pelo menos, detectar dados já migrados.
9. Produzir logs claros.
10. Não apagar nada do Firestore.

Se o volume de dados for pequeno, podemos usar um script Node.js separado.

Se o volume for grande, proponha uma estratégia apropriada.

## Substituição das queries

Depois do schema e da migração, substitua gradualmente as queries Firestore.

Por exemplo:

ANTES:

```ts
const snapshot = await getDocs(collection(db, "projects"));

const projects = snapshot.docs.map((doc) => ({
  id: doc.id,
  ...doc.data(),
}));
```

DEPOIS:

```ts
const { data, error } = await supabase.from("projects").select("*");
```

Mas adapte cada query ao modelo real do projeto.

Não faça simplesmente uma substituição textual.

Considere:

- joins
- relações
- filtros
- ordenação
- paginação
- listeners
- optimistic updates
- tratamento de loading
- tratamento de erros
- cache
- hooks existentes

## Firestore realtime

Se o projeto utiliza:

```ts
onSnapshot(...)
```

identifique todos esses casos.

Para cada um, determine se realmente precisamos de realtime.

Se sim, avalie o equivalente usando Supabase Realtime.

Não adicione realtime onde atualmente ele não é necessário.

## RLS

Quero Row Level Security habilitado para todas as tabelas que armazenam dados privados do usuário.

Não quero depender apenas de filtros no frontend.

Por exemplo, isto:

```ts
.eq('user_id', currentUser.uid)
```

é útil para a query, mas não deve ser a única camada de segurança.

A segurança real deve estar no PostgreSQL/Supabase através de RLS.

Analise as regras atuais do Firestore e tente preservar a mesma intenção de autorização no novo modelo.

## Configuração do projeto

Respeite a estrutura e convenções existentes do projeto.

Não crie uma arquitetura completamente nova se uma estrutura existente puder ser reutilizada.

Antes de instalar novas dependências, verifique se algo equivalente já está instalado.

Antes de alterar scripts, confira o package manager utilizado.

## Estratégia de implementação

Não faça todas as alterações de uma vez.

Siga esta ordem:

### Fase 1 — análise

Não alterar código.

Entregar:

- arquitetura atual
- collections encontradas
- queries encontradas
- autenticação atual
- dependências relevantes
- riscos
- proposta de arquitetura

### Fase 2 — modelagem

Criar:

- modelo PostgreSQL
- schema/migrations do Supabase
- tabelas
- relações
- índices
- RLS policies

Validar o modelo antes de remover qualquer código Firestore.

### Fase 3 — Supabase client

Criar a integração do React Native com Supabase.

Configurar corretamente:

```env
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
```

Sem secrets no client.

### Fase 4 — Firebase + Supabase authentication

Implementar a estratégia escolhida para permitir que o Supabase reconheça corretamente o usuário autenticado pelo Firebase.

Validar especificamente:

- login
- obtenção do Firebase ID token
- envio do token para Supabase
- identificação do usuário
- RLS
- tentativa de acessar dados de outro usuário

Crie testes ou uma forma clara de validar que um usuário não consegue acessar dados de outro usuário.

### Fase 5 — migração dos dados

Criar o script Firestore → PostgreSQL.

Não apagar Firestore.

### Fase 6 — migração da aplicação

Migrar os repositories/services/hooks um por vez.

Depois de cada migração, garantir que:

- TypeScript continua compilando
- testes continuam passando
- comportamento funcional é preservado

### Fase 7 — validação

Comparar:

```text
Firestore
vs
Supabase
```

para garantir que os dados foram migrados corretamente.

Verificar especialmente:

- quantidade de usuários
- quantidade de registros
- relacionamentos
- IDs
- timestamps
- arrays
- objetos
- dados opcionais

### Fase 8 — limpeza

Somente depois que tudo estiver validado:

- remover queries Firestore não utilizadas
- remover dependências Firestore que não forem mais necessárias
- remover código morto
- atualizar documentação
- manter Firebase Auth

NÃO remova Firebase Authentication.

## Regras importantes

1. Não substituir Firebase Auth.
2. Não adicionar Prisma ao React Native.
3. Não colocar secrets no aplicativo.
4. Não remover Firestore antes da migração estar validada.
5. Não assumir o schema; derive-o do código.
6. Não apagar dados existentes.
7. Não desabilitar segurança para facilitar a implementação.
8. Não confiar apenas em filtros do frontend.
9. Usar RLS para proteção dos dados.
10. Manter Firebase UID como identidade do usuário quando apropriado.
11. Preferir mudanças pequenas e verificáveis.
12. Não reescrever partes do app que não estejam relacionadas à migração.
13. Preservar o comportamento atual da aplicação.

## Resultado esperado

Ao final, quero ter:

```text
React Native / Expo
        │
        ├───────────────┐
        │               │
        ▼               ▼
 Firebase Auth      Supabase JS
        │               │
        │               ▼
        │          Supabase RLS
        │               │
        │               ▼
        │          PostgreSQL
        │
        └── Firebase UID
```

Sem backend dedicado.

Sem Prisma no mobile.

Com Firebase Authentication preservado.

Com PostgreSQL como fonte de dados.

Com RLS garantindo isolamento entre usuários.

Antes de implementar, apresente primeiro a análise do código atual e o plano de migração específico para este projeto. Só faça alterações depois dessa análise.
