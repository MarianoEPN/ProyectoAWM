import React from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import { useAppData } from '../data/AppDataContext.jsx'

function StatCard({ icon, iconBg, iconColor, label, value, to }) {
  return (
    <Link to={to} className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--border-radius-md)',
            background: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <i className={`ti ${icon}`} style={{ fontSize: 19, color: iconColor }} aria-hidden="true" />
        </div>
        <div>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>{value}</p>
          <p style={{ fontSize: 11, color: '#888', marginTop: 1 }}>{label}</p>
        </div>
      </div>
    </Link>
  )
}

export default function Dashboard() {
  const { vehiculos, vendedores, categorias } = useAppData()

  const vehiculosActivos = vehiculos.filter((v) => v.estado === 'activo').length
  const vendedoresVigentes = vendedores.filter((v) => v.estado === 'vigente').length
  const vendedoresCaducados = vendedores.filter((v) => v.estado === 'caducada').length

  return (
    <Layout variant="interno">
      <div style={{ marginBottom: 18 }}>
        <h1 className="page-title">Panel principal</h1>
        <p className="page-sub">Resumen general del sistema de control de vendedores y vehículos</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard icon="ti-users" iconBg="#fef3c7" iconColor="#92400e" label="Vendedores registrados" value={vendedores.length} to="/vendedores" />
        <StatCard icon="ti-shield-check" iconBg="#d1fae5" iconColor="#065f46" label="Autorizaciones vigentes" value={vendedoresVigentes} to="/vendedores" />
        <StatCard icon="ti-car" iconBg="#e0f2fe" iconColor="#0369a1" label="Vehículos activos" value={vehiculosActivos} to="/vehiculos" />
        <StatCard icon="ti-tag" iconBg="#ede9fe" iconColor="#5b21b6" label="Categorías" value={categorias.length} to="/categorias" />
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <p className="card-title">Accesos rápidos</p>
            <p className="card-sub">Tareas frecuentes del módulo interno</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, padding: 16 }}>
          <Link to="/vehiculos/nuevo" className="btn-new" style={{ textDecoration: 'none', justifyContent: 'center' }}>
            <i className="ti ti-circle-plus" style={{ fontSize: 13 }} aria-hidden="true" />
            Registrar vehículo
          </Link>
          <Link to="/vendedores/nuevo" className="btn-new" style={{ textDecoration: 'none', justifyContent: 'center' }}>
            <i className="ti ti-user-plus" style={{ fontSize: 13 }} aria-hidden="true" />
            Registrar vendedor
          </Link>
          <Link
            to="/validar/vehiculo"
            className="btn-sec"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
          >
            <i className="ti ti-qrcode" style={{ fontSize: 13 }} aria-hidden="true" />
            Ir al validador
          </Link>
        </div>
      </div>

      {vendedoresCaducados > 0 && (
        <div className="alert-err" style={{ margin: '16px 0 0' }}>
          <i className="ti ti-alert-triangle" style={{ fontSize: 16, flexShrink: 0 }} aria-hidden="true" />
          Hay {vendedoresCaducados} vendedor(es) con autorización caducada. Revisa el módulo de Vendedores.
        </div>
      )}
    </Layout>
  )
}
