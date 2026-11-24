import 'react-native-url-polyfill/auto'

import type { Database } from '@/types/database.types'
import { createClient } from '@supabase/supabase-js'

import { getAuth } from '@firebase/auth'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
const firebaseAuth = getAuth()

export const supabase = createClient<Database>(
  supabaseUrl,
  supabasePublishableKey,
  {
    accessToken: async () => {
      const user = firebaseAuth.currentUser

      if (!user) {
        console.warn('[Supabase] No authenticated Firebase user')
        return null
      }

      const token = await user.getIdToken()
      // console.log('[Supabase] Firebase token obtained')

      // TODO: Remove this console log after debugging
      // const payload = JSON.parse(
      //   atob(token.split('.')[1])
      // )

      // console.log('[Firebase JWT]', {
      //   sub: payload.sub,
      //   iss: payload.iss,
      //   aud: payload.aud,
      //   role: payload.role,
      // })

      return token
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
)