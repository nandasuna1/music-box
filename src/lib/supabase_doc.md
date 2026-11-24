# Use Supabase with Expo React Native

Learn how to create a Supabase project, add some sample data to your database, and query the data from an Expo app.



## 1. Create a Supabase project

To start, you need a Supabase project.

Create a new Supabase project from [the Dashboard of any organization](https://supabase.com/dashboard/new/_) you belong to.

Note: Use [the Management API](https://supabase.com/docs/reference/api/v1-create-a-project) or ask [the MCP server](https://supabase.com/docs/guides/ai-tools/mcp#account-management) to create a new Supabase project.

## 2. Set up your database

When your Supabase project is up and running, create an `instruments` table with some sample data. Then set only the privileges each Postgres role needs, add [Row Level Security (RLS)](https://supabase.com/docs/guides/database/postgres/row-level-security) for enhanced security for database data by default, and create an RLS policy to make the data in the table publicly readable.

Do these steps within your project's dashboard by copying and running the snippet in your project's [SQL Editor](https://supabase.com/dashboard/project/_/sql/new).

Note: Save some steps by clicking here to prefill the SQL in the SQL Editor, and then clicking **Run**.

Note: You can use [the Management API](https://supabase.com/docs/reference/api/v1-run-a-query) or ask [the MCP server](https://supabase.com/docs/guides/ai-tools/mcp#database) to execute SQL queries.

```sql SQL_EDITOR
-- Create the table
create table instruments (
  id bigint primary key generated always as identity,
  name text not null
);

-- Insert sample data into the table
insert into instruments (name)
values
  ('violin'),
  ('viola'),
  ('cello');

-- Grant the privileges the role needs, which is read access
grant select on public.instruments to anon;

-- Enable row level security for the table
alter table instruments enable row level security;

-- Create a policy to allow the anon role to read from the instruments table
create policy "public can read instruments"
on public.instruments
for select to anon
using (true);
```

Note: If you disabled the Data API during project setup, enable it in the [**Integrations > Data API**](https://supabase.com/dashboard/project/_/integrations/data_api/settings) section of the Dashboard and expose the specific tables or functions you want to access. To automatically grant access for new tables and functions in `public`, enable **Automatically expose new tables**.

## 3. Create an Expo app

Create a minimal Expo app using the `create-expo-app` command with the blank TypeScript template.

```bash
npx create-expo-app my-app --template blank-typescript
```

## 4. Set up AI tooling (optional)

Supabase provides two ways to give AI tools context about your project: Agent Skills, which give your AI coding agent procedural knowledge, and the MCP server, which connects AI assistants to your Supabase project directly.

### Agent Skills

[Agent Skills](https://supabase.com/docs/guides/ai-tools/ai-skills) is a curated set of instructions that give your AI agent procedural knowledge about working with Supabase.

Install them so your AI coding agent can produce more accurate, reliable code using current Supabase patterns, such as authentication, server-side rendering, and database migrations, rather than relying solely on training data.

#### Installing Agent Skills

To install, run the following command in the root of your project:

```bash
npx skills add supabase/agent-skills
```

### Supabase MCP server

The Supabase MCP server connects AI assistants to Supabase, so they can inspect your schema and act on your projects on your behalf. Find out how to add it to your client in [the MCP docs](https://supabase.com/docs/guides/ai-tools/mcp).

## 5. Install the Supabase client library

The fastest way to get started is to use the `@supabase/supabase-js` client library which provides a convenient interface for working with Supabase from a React Native app.

Navigate to the Expo app and install `supabase-js` along with the required dependencies for session storage and URL handling.

```bash
cd my-app && npx expo install @supabase/supabase-js react-native-url-polyfill expo-sqlite
```

## 6. Declare Supabase environment variables

Create a `.env` file in the root of your project and populate it with your Supabase connection variables that you can get from the helper below, or [from the project **Connect** panel](https://supabase.com/dashboard/project/_?showConnect=true\&connectTab=mobiles\&framework=exporeactnative).

Open Connect panel

Expo requires environment variables to be prefixed with `EXPO_PUBLIC_` to be accessible in your app code.

```dotenv name=.env
EXPO_PUBLIC_SUPABASE_URL=<SUBSTITUTE_SUPABASE_URL>
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<SUBSTITUTE_SUPABASE_PUBLISHABLE_KEY>
```

### Get API details

To interact with data in database tables, you use the client libraries that wrap [the auto-generated Data API endpoints](https://supabase.com/docs/guides/api), authenticating using the Project URL and key from [the project **Connect** dialog](https://supabase.com/dashboard/project/_?showConnect=true\&connectTab=mobiles\&framework=exporeactnative).





Note: See [API keys](https://supabase.com/docs/guides/getting-started/api-keys) for a full explanation of all key types, their uses, and where to find them.

## 7. Initialize the Supabase client

Create a helper file at `lib/supabase.ts` to initialize the Supabase client using the environment variables.

The code below uses Expo's localStorage polyfill to persist authentication sessions.

```ts name=lib/supabase.ts
import 'react-native-url-polyfill/auto'

import { createClient } from '@supabase/supabase-js'

import 'expo-sqlite/localStorage/install'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

## 8. Query data from the app

Replace the contents of `App.tsx` with the following code to fetch and display the instruments from your database.

Use `useEffect` to fetch the data when the component mounts and display the query result using React Native components.

```tsx name=App.tsx
import { useEffect, useState } from 'react'
import { FlatList, StyleSheet, Text, View } from 'react-native'

import { supabase } from './lib/supabase'

type Instrument = {
  id: number
  name: string
}

export default function App() {
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getInstruments()
  }, [])

  async function getInstruments() {
    const { data, error } = await supabase.from('instruments').select()

    if (error) {
      setError(error.message)
      return
    }

    setInstruments(data ?? [])
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Error loading instruments: {error}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={instruments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <Text style={styles.item}>{item.name}</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
})
```

## 9. Start the app

Run the development server and scan the QR code with the Expo Go app on your phone, or press `i` for iOS simulator or `a` for Android emulator.

```bash
npx expo start
```

## Production requirements

The quickstart procedure in this guide optimizes for getting you to a working app, not for production.

Before you deploy:

- If your app reads or writes through the Data API, review your [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) policies. Any policy you added here is scoped to this quickstart's sample data, not to real user data.
- Set your Supabase credentials as environment variables on whatever platform you deploy to, rather than committing them to source control.
- Configure a [custom domain](https://supabase.com/docs/guides/platform/custom-domains) for your Supabase project once you're ready to go live.

## Next steps

- Set up [Auth](https://supabase.com/docs/guides/auth) for your app
- [Insert more data](https://supabase.com/docs/guides/database/import-data) into your database
- Upload and serve static files using [Storage](https://supabase.com/docs/guides/storage)