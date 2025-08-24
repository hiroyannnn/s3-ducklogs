import React from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'

export default function App() {
  return (
    <div>
      <header>
        <h1><Link to="/" style={{textDecoration:'none', color:'inherit'}}>S3 DuckLogs</Link></h1>
        <nav>
          <NavLink to="/" end className={({isActive})=> isActive ? 'active' : ''}>接続</NavLink>
          <NavLink to="/logs" className={({isActive})=> isActive ? 'active' : ''}>ログ一覧</NavLink>
          <NavLink to="/sql" className={({isActive})=> isActive ? 'active' : ''}>SQL</NavLink>
        </nav>
      </header>
      <div className="container">
        <Outlet />
      </div>
    </div>
  )
}
