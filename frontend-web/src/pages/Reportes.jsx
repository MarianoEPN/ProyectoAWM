import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import Layout from '../components/Layout.jsx'
import { useAppData } from '../data/AppDataContext.jsx'
import { vendedoresApi, vehiculosApi, categoriasApi, getErrorMessage } from '../services/api.js'

// Colores consistentes con el resto de la app (badges bg-ok/bg-exp, etc).
const COLOR_ESTADO = { VIGENTE: '#059669', REVOCADA: '#dc2626' }
function colorDeEstado(estado) {
  return COLOR_ESTADO[estado] || '#C8871A' // cualquier otro estado (ej. PENDIENTE) cae aquí
}

const NOMBRES_ESTADO = { VIGENTE: 'Vigente', REVOCADA: 'Revocado' }
function nombreEstado(estado) {
  return NOMBRES_ESTADO[estado] || estado
}

// Los listados paginan de a 10 por defecto — para graficar el padrón
// completo hay que recorrer todas las páginas, no solo la primera.
async function fetchAllPaginated(listFn, limit = 100) {
  let page = 1
  let all = []
  // Salvaguarda: nunca más de 200 páginas, por si metadata viniera mal formada.
  for (let i = 0; i < 200; i++) {
    const { data, metadata } = await listFn({ page, limit })
    all = all.concat(data)
    if (!metadata || !metadata.nextPage || page >= metadata.totalPages) break
    page += 1
  }
  return all
}

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

function ChartCard({ title, subtitle, children, extra }) {
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <p className="card-title">{title}</p>
          {subtitle && <p className="card-sub">{subtitle}</p>}
        </div>
        {extra}
      </div>
      <div style={{ padding: '12px 16px 18px' }}>{children}</div>
    </div>
  )
}

function EstadoTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div style={{ background: '#fff', border: '0.5px solid #e0d8c8', borderRadius: 8, padding: '6px 10px', fontSize: 11 }}>
      <strong>{p.name}</strong>: {p.value}
    </div>
  )
}

function TimelineTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div style={{ background: '#fff', border: '0.5px solid #e0d8c8', borderRadius: 8, padding: '8px 10px', fontSize: 11 }}>
      <strong>{row.nombre}</strong>
      <br />
      Emisión: {row.fechaEmision}
      <br />
      Expiración: {row.fechaExpiracion}
      <br />
      Estado: {nombreEstado(row.estadoActivo)}
    </div>
  )
}

export default function Reportes() {
  const { vehiculosMeta, vendedoresMeta, categoriasMeta } = useAppData()

  const [vendedoresAll, setVendedoresAll] = useState([])
  const [vehiculosAll, setVehiculosAll] = useState([])
  const [categoriasAll, setCategoriasAll] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas')

  useEffect(() => {
    let cancelado = false
    async function cargar() {
      setLoading(true)
      setError(null)
      try {
        const [vend, veh, cat] = await Promise.all([
          fetchAllPaginated(vendedoresApi.listar),
          fetchAllPaginated(vehiculosApi.listar),
          fetchAllPaginated(categoriasApi.listar)
        ])
        if (cancelado) return
        setVendedoresAll(vend)
        setVehiculosAll(veh)
        setCategoriasAll(cat)
      } catch (err) {
        if (!cancelado) setError(err)
      } finally {
        if (!cancelado) setLoading(false)
      }
    }
    cargar()
    return () => {
      cancelado = true
    }
  }, [])

  // ---------- 1. Vendedores: vigentes vs revocados, filtrable por categoría ----------
  const vendedoresFiltrados = useMemo(() => {
    if (categoriaFiltro === 'todas') return vendedoresAll
    return vendedoresAll.filter((v) => (v.categorias || []).some((c) => String(c.idCategoria) === categoriaFiltro))
  }, [vendedoresAll, categoriaFiltro])

  const estadoVendedoresData = useMemo(() => {
    const counts = {}
    vendedoresFiltrados.forEach((v) => {
      counts[v.estadoActivo] = (counts[v.estadoActivo] || 0) + 1
    })
    return Object.entries(counts).map(([estado, total]) => ({ estado, nombre: nombreEstado(estado), total }))
  }, [vendedoresFiltrados])

  // ---------- 4. Vendedores por categoría (usa el totalVendedores que ya calcula el backend) ----------
  const categoriaData = useMemo(() => {
    return [...categoriasAll]
      .sort((a, b) => b.totalVendedores - a.totalVendedores)
      .map((c) => ({ nombre: c.nombre, total: c.totalVendedores }))
  }, [categoriasAll])

  // ---------- 3. Vehículos: vigentes vs revocados ----------
  const estadoVehiculosData = useMemo(() => {
    const counts = {}
    vehiculosAll.forEach((v) => {
      counts[v.estadoActivo] = (counts[v.estadoActivo] || 0) + 1
    })
    return Object.entries(counts).map(([estado, total]) => ({ estado, nombre: nombreEstado(estado), total }))
  }, [vehiculosAll])

  // ---------- 2. Vendedores: línea de tiempo emisión -> expiración ----------
  const MAX_FILAS_TIMELINE = 15
  const timeline = useMemo(() => {
    const conFechas = vendedoresAll.filter((v) => v.fechaEmision && v.fechaExpiracion)
    if (conFechas.length === 0) return []
    const minTime = Math.min(...conFechas.map((v) => new Date(v.fechaEmision).getTime()))
    return conFechas
      .slice()
      .sort((a, b) => new Date(a.fechaEmision) - new Date(b.fechaEmision))
      .slice(0, MAX_FILAS_TIMELINE)
      .map((v) => {
        const inicio = new Date(v.fechaEmision).getTime()
        const fin = new Date(v.fechaExpiracion).getTime()
        return {
          nombre: v.nombre,
          offsetDias: Math.round((inicio - minTime) / 86400000),
          duracionDias: Math.max(1, Math.round((fin - inicio) / 86400000)),
          fechaEmision: v.fechaEmision,
          fechaExpiracion: v.fechaExpiracion,
          estadoActivo: v.estadoActivo
        }
      })
  }, [vendedoresAll])

  if (error) {
    return (
      <Layout variant="interno">
        <div className="alert-err">
          <i className="ti ti-alert-triangle" style={{ fontSize: 16, flexShrink: 0 }} aria-hidden="true" />
          No se pudo cargar el panel: {getErrorMessage(error)}
        </div>
      </Layout>
    )
  }

  return (
    <Layout variant="interno">
      <div style={{ marginBottom: 18 }}>
        <h1 className="page-title">Reportes</h1>
        <p className="page-sub">Resumen general del sistema de control de vendedores y vehículos</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard
          icon="ti-users"
          iconBg="#fef3c7"
          iconColor="#92400e"
          label="Vendedores registrados"
          value={vendedoresMeta ? vendedoresMeta.totalItems : '—'}
          to="/vendedores"
        />
        <StatCard
          icon="ti-car"
          iconBg="#e0f2fe"
          iconColor="#0369a1"
          label="Vehículos registrados"
          value={vehiculosMeta ? vehiculosMeta.totalItems : '—'}
          to="/vehiculos"
        />
        <StatCard
          icon="ti-tag"
          iconBg="#ede9fe"
          iconColor="#5b21b6"
          label="Categorías"
          value={categoriasMeta ? categoriasMeta.totalItems : '—'}
          to="/categorias"
        />
      </div>

      {loading ? (
        <div className="card">
          <div style={{ padding: 40, textAlign: 'center', color: '#aaa', fontSize: 12 }}>Cargando datos para los gráficos…</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* 1. Vendedores vigentes vs revocados, con filtro de categoría */}
            <ChartCard
              title="Vendedores: vigentes vs. revocados"
              subtitle={
                categoriaFiltro === 'todas'
                  ? 'Todas las categorías'
                  : categoriasAll.find((c) => String(c.idCategoria) === categoriaFiltro)?.nombre
              }
              extra={
                <select
                  className="form-select"
                  style={{ width: 160, height: 30, fontSize: 11 }}
                  value={categoriaFiltro}
                  onChange={(e) => setCategoriaFiltro(e.target.value)}
                >
                  <option value="todas">Todas las categorías</option>
                  {categoriasAll.map((c) => (
                    <option key={c.idCategoria} value={String(c.idCategoria)}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              }
            >
              {estadoVendedoresData.length === 0 ? (
                <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center', padding: '30px 0' }}>
                  No hay vendedores en esta categoría.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={estadoVendedoresData}
                      dataKey="total"
                      nameKey="nombre"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                    >
                      {estadoVendedoresData.map((entry) => (
                        <Cell key={entry.estado} fill={colorDeEstado(entry.estado)} />
                      ))}
                    </Pie>
                    <Tooltip content={<EstadoTooltip />} />
                    <Legend verticalAlign="bottom" height={24} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* 4. Vendedores por categoría (complementa el filtro de arriba) */}
            <ChartCard title="Vendedores por categoría" subtitle="Total asignado por categoría (todas las vigencias)">
              {categoriaData.length === 0 ? (
                <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center', padding: '30px 0' }}>Aún no hay categorías.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={categoriaData} layout="vertical" margin={{ left: 10, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0e8d8" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="nombre" width={130} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => [value, 'Vendedores']} />
                    <Bar dataKey="total" fill="#C8871A" radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* 3. Vehículos vigentes vs revocados */}
            <ChartCard title="Vehículos: vigentes vs. revocados" subtitle="Todo el padrón vehicular">
              {estadoVehiculosData.length === 0 ? (
                <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center', padding: '30px 0' }}>
                  No hay vehículos registrados.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={estadoVehiculosData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0e8d8" />
                    <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip content={<EstadoTooltip />} />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]} barSize={60}>
                      {estadoVehiculosData.map((entry) => (
                        <Cell key={entry.estado} fill={colorDeEstado(entry.estado)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* 2. Vendedores: línea de tiempo emisión -> expiración */}
            <ChartCard
              title="Vendedores: vigencia de autorización"
              subtitle={`Emisión → expiración (primeros ${Math.min(MAX_FILAS_TIMELINE, timeline.length)} por fecha de emisión)`}
            >
              {timeline.length === 0 ? (
                <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center', padding: '30px 0' }}>
                  No hay datos de fechas disponibles.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={timeline} layout="vertical" margin={{ left: 10, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0e8d8" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10 }}
                      label={{ value: 'Días desde el primer registro', position: 'insideBottom', offset: -5, fontSize: 10 }}
                    />
                    <YAxis type="category" dataKey="nombre" width={130} tick={{ fontSize: 11 }} />
                    <Tooltip content={<TimelineTooltip />} />
                    {/* barra invisible que empuja el inicio hasta la fecha de emisión real */}
                    <Bar dataKey="offsetDias" stackId="vigencia" fill="transparent" />
                    <Bar dataKey="duracionDias" stackId="vigencia" radius={[0, 4, 4, 0]} barSize={12}>
                      {timeline.map((row) => (
                        <Cell key={row.nombre} fill={colorDeEstado(row.estadoActivo)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>
        </div>
      )}
    </Layout>
  )
}
