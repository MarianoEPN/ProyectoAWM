import React from 'react'
import Sidebar from './Sidebar.jsx'

export default function Layout({ variant = 'interno', children, contentClassName = 'content' }) {
  return (
    <div className="app-shell-wrap">
      <div className="shell">
        <Sidebar variant={variant} />
        <div className="main">
          <div className="topbar">
            <span>Módulo</span>
            {variant === 'validador' ? (
              <span className="mode-badge">VALIDADOR</span>
            ) : (
              <span>INTERNO</span>
            )}
          </div>
          <div className={contentClassName}>{children}</div>
        </div>
      </div>
    </div>
  )
}
