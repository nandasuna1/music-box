import { cert, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import serviceAccount from '../../service-account.json'

initializeApp({
  credential: cert(serviceAccount as any),
})

async function main() {
  const uid = '8WkkGc0SS8VTwYXLtDJ1zAAXt763'

  await getAuth().setCustomUserClaims(uid, {
    role: 'authenticated',
  })

  console.log('Custom claim configured!')
}

main().catch(console.error)