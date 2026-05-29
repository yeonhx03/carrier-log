function AuthScreen({
  errorMessage,
  isLoading,
  onGoogleSignIn,
  onStartLocalOnly,
}) {
  return (
    <section className="phone-screen auth-screen">
      <div className="auth-brand">
        <h1>Carrier Log</h1>
        <p>편리한 탁송 기록</p>
      </div>

      <div className="auth-action">
        {errorMessage && <p className="auth-error">{errorMessage}</p>}
        <button
          className="google-login-button"
          type="button"
          onClick={onGoogleSignIn}
          disabled={isLoading}
        >
          <span aria-hidden="true">G</span>
          {isLoading ? '로그인 확인 중' : 'Google로 간편 로그인'}
        </button>

        <div className="local-only-warning">
          <strong>기기 변경 시 기존 데이터가 저장되지 않습니다.</strong>
          <span>기기 변경 시 데이터를 유지하고 싶다면 구글로 로그인하세요.</span>
        </div>

        <button
          className="local-only-button"
          type="button"
          onClick={onStartLocalOnly}
          disabled={isLoading}
        >
          로그인 없이 시작
        </button>
      </div>
    </section>
  )
}

export default AuthScreen
