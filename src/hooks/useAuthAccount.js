import { useEffect, useState } from 'react'
import { FirebaseAuthentication } from '@capacitor-firebase/authentication'
import { Capacitor } from '@capacitor/core'
import {
  deleteUser,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  signInWithCredential,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { auth } from '../firebase'
import { deleteAppData, isFirebaseConfigured } from '../utils/cloudStore'
import { getInitialStoredValue, persistJson } from '../utils/appDataStorage'

async function reauthenticateCurrentUser() {
  if (!auth?.currentUser) {
    throw new Error('Current Firebase user was not found.')
  }

  if (Capacitor.isNativePlatform()) {
    const result = await FirebaseAuthentication.signInWithGoogle({
      skipNativeAuth: true,
    })
    const idToken = result.credential?.idToken

    if (!idToken) {
      throw new Error('Google ID token was not returned.')
    }

    await reauthenticateWithCredential(
      auth.currentUser,
      GoogleAuthProvider.credential(idToken),
    )
    return
  }

  await reauthenticateWithPopup(auth.currentUser, new GoogleAuthProvider())
}

export function useAuthAccount() {
  const [isLocalOnlyMode, setIsLocalOnlyMode] = useState(() =>
    getInitialStoredValue('isLocalOnlyMode', false),
  )
  const [isAuthLoading, setIsAuthLoading] = useState(isFirebaseConfigured)
  const [authErrorMessage, setAuthErrorMessage] = useState('')
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [deleteAccountError, setDeleteAccountError] = useState('')

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      return undefined
    }

    return onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user)
      setIsAuthLoading(false)

      if (user) {
        setIsLocalOnlyMode(false)
        setAuthErrorMessage('')
      }
    })
  }, [])

  useEffect(() => {
    persistJson('isLocalOnlyMode', isLocalOnlyMode)
  }, [isLocalOnlyMode])

  const handleGoogleSignIn = () => {
    if (!auth) {
      setAuthErrorMessage('Firebase 설정을 확인해주세요.')
      return
    }

    const provider = new GoogleAuthProvider()

    setIsAuthLoading(true)
    setAuthErrorMessage('')

    const signInPromise = Capacitor.isNativePlatform()
      ? FirebaseAuthentication.signInWithGoogle({ skipNativeAuth: true }).then(
          (result) => {
            const idToken = result.credential?.idToken

            if (!idToken) {
              throw new Error('Google ID token was not returned.')
            }

            return signInWithCredential(
              auth,
              GoogleAuthProvider.credential(idToken),
            )
          },
        )
      : signInWithPopup(auth, provider)

    signInPromise
      .catch((error) => {
        console.error('Google sign in failed', error)
        setAuthErrorMessage('구글 로그인에 실패했습니다. 다시 시도해주세요.')
      })
      .finally(() => {
        setIsAuthLoading(false)
      })
  }

  const handleStartLocalOnly = () => {
    setIsLocalOnlyMode(true)
    setAuthErrorMessage('')
  }

  const handleSignOut = (onAfterSignOut) => {
    if (!auth) {
      return
    }

    const nativeSignOutPromise = Capacitor.isNativePlatform()
      ? FirebaseAuthentication.signOut()
      : Promise.resolve()

    nativeSignOutPromise
      .then(() => signOut(auth))
      .then(() => {
        setIsLocalOnlyMode(true)
        onAfterSignOut?.()
      })
      .catch((error) => {
        console.error('Google sign out failed', error)
      })
  }

  const handleDeleteAccount = async ({
    firebaseUserId,
    isDeletingAccountRef,
    resetUserData,
    onAfterDelete,
  }) => {
    if (!auth?.currentUser || !firebaseUserId || isDeletingAccountRef.current) {
      return
    }

    let cloudDataDeleted = false

    isDeletingAccountRef.current = true
    setIsDeletingAccount(true)
    setDeleteAccountError('')

    try {
      await reauthenticateCurrentUser()
      await deleteAppData(firebaseUserId)
      cloudDataDeleted = true
      await deleteUser(auth.currentUser)

      if (Capacitor.isNativePlatform()) {
        await FirebaseAuthentication.signOut().catch((error) => {
          console.error(
            'Native Google sign out after account deletion failed',
            error,
          )
        })
      }

      resetUserData()
      setIsLocalOnlyMode(false)
      onAfterDelete?.()
    } catch (error) {
      console.error('Firebase account deletion failed', error)

      if (cloudDataDeleted) {
        resetUserData()
        setIsLocalOnlyMode(false)
        onAfterDelete?.()
        setAuthErrorMessage(
          '서버 데이터는 삭제되었지만 계정 삭제를 완료하지 못했습니다. 다시 로그인한 후 계정 삭제를 재시도해주세요.',
        )
        if (Capacitor.isNativePlatform()) {
          await FirebaseAuthentication.signOut().catch((signOutError) => {
            console.error(
              'Native sign out after account deletion failure failed',
              signOutError,
            )
          })
        }
        await signOut(auth).catch((signOutError) => {
          console.error(
            'Firebase sign out after account deletion failure failed',
            signOutError,
          )
        })
        return
      }

      setDeleteAccountError(
        '계정 삭제에 실패했습니다. Google 계정을 다시 확인한 후 재시도해주세요.',
      )
    } finally {
      isDeletingAccountRef.current = false
      setIsDeletingAccount(false)
    }
  }

  return {
    firebaseUser,
    firebaseUserId: firebaseUser?.uid || '',
    isLocalOnlyMode,
    isAuthLoading,
    authErrorMessage,
    isDeletingAccount,
    deleteAccountError,
    handleGoogleSignIn,
    handleStartLocalOnly,
    handleSignOut,
    handleDeleteAccount,
  }
}
