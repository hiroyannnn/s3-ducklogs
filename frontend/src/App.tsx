import React from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './components/LanguageSwitcher'

export default function App() {
  const { t } = useTranslation();

  return (
    <div>
      <header>
        <div className="header-top">
          <div className="header-left">
            <h1><Link to="/" style={{textDecoration:'none', color:'inherit'}}>S3 DuckLogs</Link></h1>
            <nav>
              <NavLink to="/" end className={({isActive})=> isActive ? 'active' : ''}>
                {t('navigation.connect')}
              </NavLink>
              <NavLink to="/logs" className={({isActive})=> isActive ? 'active' : ''}>
                {t('navigation.logs')}
              </NavLink>
              <NavLink to="/sql" className={({isActive})=> isActive ? 'active' : ''}>
                {t('navigation.sql')}
              </NavLink>
            </nav>
          </div>
          <LanguageSwitcher />
        </div>
      </header>
      <div className="container">
        <Outlet />
      </div>
    </div>
  )
}
