import { useEffect, useState } from 'react'
import {
  deleteUser,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithPopup,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import '../App.css'
import { auth, isFirebaseConfigured } from '../firebase'
import { deleteAppData } from '../utils/cloudStore'

export default function DeleteAccountPage() {
  const [currentUser, setCurrentUser] = useState(null)
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isDeleted, setIsDeleted] = useState(false)

  useEffect(() => {
    if (!auth) {
      return undefined
    }

    return onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setIsLoading(false)
    })
  }, [])

  const handleSignIn = async () => {
    if (!auth) {
      setErrorMessage('Firebase 설정을 확인해주세요.')
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
    } catch (error) {
      console.error('Delete account page sign in failed', error)
      setErrorMessage('Google 로그인에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    if (!auth) {
      return
    }

    setErrorMessage('')

    try {
      await signOut(auth)
      setConfirmation('')
    } catch (error) {
      console.error('Delete account page sign out failed', error)
      setErrorMessage('로그아웃에 실패했습니다. 다시 시도해주세요.')
    }
  }

  const handleDeleteAccount = async () => {
    if (!auth?.currentUser || confirmation !== '삭제' || isDeleting) {
      return
    }

    let cloudDataDeleted = false

    setIsDeleting(true)
    setErrorMessage('')

    try {
      await reauthenticateWithPopup(auth.currentUser, new GoogleAuthProvider())
      await deleteAppData(auth.currentUser.uid)
      cloudDataDeleted = true
      await deleteUser(auth.currentUser)
      setCurrentUser(null)
      setConfirmation('')
      setIsDeleted(true)
    } catch (error) {
      console.error('Delete account page deletion failed', error)
      setErrorMessage(
        cloudDataDeleted
          ? '서버 데이터는 삭제되었지만 계정 삭제를 완료하지 못했습니다. 다시 로그인한 후 재시도해주세요.'
          : '계정 삭제에 실패했습니다. Google 계정을 다시 확인한 후 재시도해주세요.',
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <main className="delete-account-page">
      <section className="delete-account-panel">
        <p className="delete-account-eyebrow">Carrier Log</p>
        <h1>계정 및 데이터 삭제</h1>
        <p className="delete-account-description">
          Google Play에서 제공되는 Carrier Log 앱의 로그인 계정과 서버 저장
          데이터를 삭제할 수 있습니다.
        </p>

        <div className="delete-account-notice">
          <strong>삭제되는 항목</strong>
          <p>
            Carrier Log 로그인 계정, 운행일지, 보험사, 정산 단가, 입금 계좌,
            요청사항 등 서버에 저장된 데이터
          </p>
          <p>삭제한 계정과 데이터는 복구할 수 없습니다.</p>
        </div>

        {!isFirebaseConfigured && (
          <p className="delete-account-error">Firebase 설정을 확인해주세요.</p>
        )}

        {isDeleted && (
          <div className="delete-account-success">
            <strong>삭제가 완료되었습니다.</strong>
            <p>Carrier Log 계정과 서버 저장 데이터가 삭제되었습니다.</p>
          </div>
        )}

        {!isDeleted && !currentUser && isFirebaseConfigured && (
          <div className="delete-account-action">
            <p>삭제할 계정으로 Google 로그인해주세요.</p>
            {errorMessage && (
              <p className="delete-account-error">{errorMessage}</p>
            )}
            <button
              type="button"
              className="delete-account-google-button"
              disabled={isLoading}
              onClick={handleSignIn}
            >
              {isLoading ? '로그인 확인 중' : 'Google로 로그인'}
            </button>
          </div>
        )}

        {!isDeleted && currentUser && (
          <div className="delete-account-action">
            <div className="delete-account-user">
              <span>삭제할 계정</span>
              <strong>{currentUser.displayName || 'Google 사용자'}</strong>
              <p>{currentUser.email}</p>
              <button type="button" disabled={isDeleting} onClick={handleSignOut}>
                다른 계정 선택
              </button>
            </div>

            <label className="delete-account-confirmation">
              <span>계속하려면 아래에 삭제를 입력하세요.</span>
              <input
                type="text"
                value={confirmation}
                disabled={isDeleting}
                onChange={(event) => setConfirmation(event.target.value)}
                placeholder="삭제"
                autoComplete="off"
              />
            </label>

            {errorMessage && (
              <p className="delete-account-error">{errorMessage}</p>
            )}

            <button
              type="button"
              className="delete-account-delete-button"
              disabled={confirmation !== '삭제' || isDeleting}
              onClick={handleDeleteAccount}
            >
              {isDeleting ? '삭제 중' : '계정 및 데이터 삭제'}
            </button>
          </div>
        )}

        <p className="delete-account-footnote">
          앱이 설치된 기기에 남아 있는 로컬 데이터는 앱 설정의 계정 및 데이터
          삭제 기능을 사용하거나 기기 설정에서 앱 데이터를 삭제해주세요.
        </p>
      </section>
    </main>
  )
}
