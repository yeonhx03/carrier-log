import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import DeleteAccountPage from './components/DeleteAccountPage.jsx'

const isDeleteAccountPage = window.location.pathname === '/delete-account'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isDeleteAccountPage ? <DeleteAccountPage /> : <App />}
  </StrictMode>,
)
