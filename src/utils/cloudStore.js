import {
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'

export { isFirebaseConfigured }

function getAppDataRef(userId) {
  return db && userId
    ? doc(db, 'carrierLogUsers', userId, 'documents', 'appData')
    : null
}

export function subscribeAppData({ userId, onData, onError }) {
  const appDataRef = getAppDataRef(userId)

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

export function saveAppData(userId, data) {
  const appDataRef = getAppDataRef(userId)

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

export function deleteAppData(userId) {
  const appDataRef = getAppDataRef(userId)

  if (!appDataRef) {
    return Promise.resolve()
  }

  return deleteDoc(appDataRef)
}
