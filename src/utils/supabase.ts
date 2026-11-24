// import { createClient } from '@supabase/supabase-js'
// import { getAuth } from 'firebase/auth'

// export const supabase = createClient(
//   process.env.EXPO_PUBLIC_SUPABASE_URL!,
//   process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
//   {
//     accessToken: async () => {
//       const user = getAuth().currentUser
//       return user ? await user.getIdToken() : null
//     },
//     auth: {
//       persistSession: false,
//       autoRefreshToken: false,
//       detectSessionInUrl: false,
//     },
//   }
// )

