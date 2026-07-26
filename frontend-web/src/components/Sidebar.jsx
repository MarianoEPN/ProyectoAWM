import React from 'react'
import { NavLink } from 'react-router-dom'

const internoNav = [
  {
    section: 'General',
    items: [{ to: '/', label: 'Panel principal', icon: 'ti-layout-dashboard', end: true }]
  },
  {
    section: 'Vendedores',
    items: [
      { to: '/vendedores', label: 'Vendedores', icon: 'ti-users' },
      //{ to: '/vendedores/nuevo', label: 'Registrar', icon: 'ti-user-plus' },
      { to: '/categorias', label: 'Categorías', icon: 'ti-tag' }
    ]
  },
  {
    section: 'Vehículos',
    items: [
      { to: '/vehiculos', label: 'Vehículos', icon: 'ti-car' },
      //{ to: '/vehiculos/nuevo', label: 'Registrar', icon: 'ti-circle-plus' },
      { to: '/qr', label: 'Gestión QR', icon: 'ti-qrcode' }
    ]
  },
  {
    section: 'Sistema',
    items: [
      { to: '/reportes', label: 'Reportes', icon: 'ti-chart-bar' },
      { to: '/configuracion', label: 'Configuración', icon: 'ti-settings' }
    ]
  }
]

const validadorNav = [
  {
    section: 'General',
    items: [{ to: '/', label: 'Panel principal', icon: 'ti-layout-dashboard', end: true }]
  },
  {
    section: 'Vendedores',
    items: [{ to: '/validar/vendedor', label: 'Validar vendedor', icon: 'ti-eye' }]
  },
  {
    section: 'Vehículos',
    items: [{ to: '/validar/vehiculo', label: 'Validar vehículo', icon: 'ti-qrcode' }]
  }
]

export default function Sidebar({ variant = 'interno' }) {
  const nav = variant === 'validador' ? validadorNav : internoNav

  return (
    <aside className="sidebar">
      <div className="sb-logo">
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: '#C8871A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <i className="ti ti-building-community" style={{ color: '#fff', fontSize: 14 }} aria-hidden="true" />
        </div>
        <span>Cabildo S.J.C.</span>
      </div>

      {nav.map((group) => (
        <React.Fragment key={group.section}>
          <div className="sb-section">{group.section}</div>
          {group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => 'sb-item' + (isActive ? ' on' : '')}
            >
              <i className={`ti ${item.icon}`} aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </React.Fragment>
      ))}
    </aside>
  )
}
