import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import Connect from './pages/Connect'
import Logs from './pages/Logs'
import SQL from './pages/SQL'
import './i18n' // i18nの初期化
import './index.css' // CSSスタイル

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Connect /> },
      { path: 'logs', element: <Logs /> },
      { path: 'sql', element: <SQL /> }
    ]
  }
])

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
