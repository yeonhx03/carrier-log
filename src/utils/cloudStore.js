import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'

const ownerId = import.meta.env.VITE_FIREBASE_OWNER_ID || 'default'
const appDataRef = db ? doc(db, 'carrierLogData', ownerId) : null

export { isFirebaseConfigured }

export function subscribeAppData({ onData, onError }) {
  if (!appDataRef) {
    return () => {}
  }

  return onSnapshot(
    appDataRef,
    (snapshot) => {
      onData(snapshot.exists() ? snapshot.data() : null)
    },
    onError,
  )
}

export function saveAppData(data) {
  if (!appDataRef) {
    return Promise.resolve()
  }

  return setDoc(
    appDataRef,
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}
