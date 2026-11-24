import { supabase } from '@/lib/supabase'
import { getAuth } from 'firebase/auth'

export async function syncUserProfile() {
  const user = getAuth().currentUser

  if (!user) {
    throw new Error('User is not authenticated')
  }

  console.log('[Profile Sync] Firebase user:', user.uid)

  const { data, error } = await supabase
    .from('profile')
    .upsert({
      firebase_uid: user.uid,
      display_name: user.displayName,
      avatar_url: user.photoURL,
    })
    .select()

    if (error) {
      console.log('[Profile Sync] Error details:', JSON.stringify({
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      }, null, 2))

      throw error
    }

  console.log('[Profile Sync] Success:', data)
}