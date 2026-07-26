import React, { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import Modal from '../components/Modal.jsx'
import { useAppData } from '../data/AppDataContext.jsx'
import { getInitials, getAvatarColors } from '../utils/avatar.js'
import { getErrorMessage } from '../services/api.js'

function VendedorForm({ initial, categorias, onCancel, onSubmit }) {
  const [cedula, setCedula] = useState(initial?.cedula || '')
  const [nombre, setNombre] = useState(initial?.nombre || '')
  const [nResolucion, setNResolucion] = useState(initial?.nResolucion || '')
  const [fechaEmision, setFechaEmision] = useState(initial?.fechaEmision || '')
  const [fechaExpiracion, setFechaExpiracion] = useState(initial?.fechaExpiracion || '')
  const [idHabitante, setIdHabitante] = useState(initial?.idHabitante ?? '')
  const [categoriasIds, setCategoriasIds] = useState((initial?.categorias || []).map((c) => c.idCategoria))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const toggleCategoria = (id) => {
    setCategoriasIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!cedula.trim() || !nombre.trim() || !nResolucion.trim() || !fechaEmision || !fechaExpiracion) {
      setError('Completa cédula, nombre, resolución y ambas fechas.')
      return
    }
    if (!/^\d{10}$/.test(cedula.trim())) {
      setError('La cédula debe tener 10 dígitos.')
      return
    }
    if (categoriasIds.length === 0) {
      setError('Selecciona al menos una categoría.')
      return
    }
    if (new Date(fechaExpiracion) < new Date(fechaEmision)) {
      setError('La fecha de expiración no puede ser anterior a la de emisión.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSubmit({
        cedula: cedula.trim(),
        nombre: nombre.trim(),
        foto: initial?.foto || 'Pendiente de definición de infraestructura',
        nResolucion: nResolucion.trim(),
        fechaEmision,
        fechaExpiracion,
        estadoActivo: initial?.estadoActivo || 'VIGENTE',
        idHabitante: idHabitante ? Number(idHabitante) : null,
        categoriasIds
      })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-field">
        <label className="form-label">Cédula *</label>
        <input
          className="form-input"
          style={{ fontFamily: 'var(--font-mono)' }}
          placeholder="10 dígitos"
          value={cedula}
          onChange={(e) => setCedula(e.target.value)}
        />
      </div>
      <div className="form-field">
        <label className="form-label">Nombre completo *</label>
        <input className="form-input" placeholder="Nombre y apellido" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </div>
      <div className="form-field">
        <label className="form-label">Categorías * (una o varias)</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {categorias.map((c) => (
            <label
              key={c.idCategoria}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11,
                padding: '4px 9px',
                border: '0.5px solid #d1c9b8',
                borderRadius: 20,
                background: categoriasIds.includes(c.idCategoria) ? '#C8871A' : '#faf8f4',
                color: categoriasIds.includes(c.idCategoria) ? '#fff' : '#666',
                cursor: 'pointer'
              }}
            >
              <input
                type="checkbox"
                checked={categoriasIds.includes(c.idCategoria)}
                onChange={() => toggleCategoria(c.idCategoria)}
                style={{ display: 'none' }}
              />
              {c.nombre}
            </label>
          ))}
        </div>
        {categorias.length === 0 && <p style={{ fontSize: 11, color: '#aaa' }}>No hay categorías cargadas todavía.</p>}
      </div>
      <div className="form-field">
        <label className="form-label">N.° de resolución *</label>
        <input
          className="form-input"
          style={{ fontFamily: 'var(--font-mono)' }}
          placeholder="Ej. AXBXCX"
          value={nResolucion}
          onChange={(e) => setNResolucion(e.target.value)}
        />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div className="form-field" style={{ flex: 1 }}>
          <label className="form-label">Fecha de emisión *</label>
          <input type="date" className="form-input" value={fechaEmision} onChange={(e) => setFechaEmision(e.target.value)} />
        </div>
        <div className="form-field" style={{ flex: 1 }}>
          <label className="form-label">Fecha de expiración *</label>
          <input
            type="date"
            className="form-input"
            value={fechaExpiracion}
            onChange={(e) => setFechaExpiracion(e.target.value)}
          />
        </div>
      </div>
      <div className="form-field">
        <label className="form-label">ID de habitante (opcional, si reside en la comunidad)</label>
        <input
          className="form-input"
          type="number"
          placeholder="Ej. 4050"
          value={idHabitante}
          onChange={(e) => setIdHabitante(e.target.value)}
        />
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="form-footer">
        <button type="button" className="btn-sec" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn-pri" disabled={saving}>
          <i className="ti ti-check" style={{ fontSize: 12 }} aria-hidden="true" />
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}

export default function GestionVendedores() {
  const {
    vendedores,
    vendedoresMeta,
    vendedoresPage,
    vendedoresLoading,
    vendedoresError,
    fetchVendedores,
    categorias,
    addVendedor,
    updateVendedor,
    obtenerVendedor,
    revocarVendedor
  } = useAppData()
  const navigate = useNavigate()
  const location = useLocation()
  const isNewRoute = location.pathname.endsWith('/nuevo')

  const [filtroTexto, setFiltroTexto] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos') // todos | VIGENTE | otro
  const [showModal, setShowModal] = useState(isNewRoute)
  const [editing, setEditing] = useState(null) // detalle completo (GET /vendedores/{id})
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  // La API no soporta búsqueda por texto en /vendedores (solo pagina). Este
  // filtro solo actúa sobre lo ya cargado en la página actual.
  const visibles = useMemo(() => {
    return vendedores.filter((v) => {
      const t = filtroTexto.trim().toLowerCase()
      const matchesTexto =
        !t || v.cedula.toLowerCase().includes(t) || v.nombre.toLowerCase().includes(t)
      const matchesEstado = filtroEstado === 'todos' || v.estadoActivo === filtroEstado
      return matchesTexto && matchesEstado
    })
  }, [vendedores, filtroTexto, filtroEstado])

  const vigentesEnPagina = vendedores.filter((v) => v.estadoActivo === 'VIGENTE').length
  const otrosEnPagina = vendedores.filter((v) => v.estadoActivo !== 'VIGENTE').length

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
    if (location.pathname.endsWith('/nuevo')) navigate('/vendedores')
  }

  const handleSubmit = async (data) => {
    if (editing) {
      await updateVendedor(editing.idVendedor, data)
    } else {
      await addVendedor(data)
    }
    closeModal()
  }

  // El listado de /vendedores no trae fechaEmision, foto ni idHabitante, así
  // que para editar hay que pedir primero el detalle completo.
  const handleEditar = async (v) => {
    setCargandoDetalle(true)
    try {
      const detalle = await obtenerVendedor(v.idVendedor)
      setEditing(detalle)
      setShowModal(true)
    } catch (err) {
      alert('No se pudo cargar el detalle del vendedor: ' + getErrorMessage(err))
    } finally {
      setCargandoDetalle(false)
    }
  }

  const handleRevocar = async (v) => {
    setCargandoDetalle(true)
    try {
      const detalle = await obtenerVendedor(v.idVendedor)
      await revocarVendedor(detalle)
    } catch (err) {
      alert('No se pudo revocar la autorización: ' + getErrorMessage(err))
    } finally {
      setCargandoDetalle(false)
    }
  }

  const meta = vendedoresMeta

  return (
    <Layout variant="interno">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <h1 className="page-title">Gestión de Vendedores</h1>
        <button className="btn-new" onClick={() => setShowModal(true)}>
          <i className="ti ti-plus" style={{ fontSize: 13 }} aria-hidden="true" />
          Nuevo Vendedor
        </button>
      </div>

      <div className="card">
        <div className="search-row">
          <input
            className="search-input"
            style={{ maxWidth: 'none' }}
            placeholder="Filtrar por cédula o nombre en esta página…"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
          />
        </div>
        <p style={{ fontSize: 11, color: '#aaa', padding: '0 16px 4px', margin: 0 }}>
          Este filtro solo busca dentro de la página cargada. Para verificar una cédula/resolución/QR específico en todo
          el sistema, usa el validador.
        </p>

        <div className="stats">
          <div className="stat">
            <p className="stat-n">{meta ? meta.totalItems : '—'}</p>
            <p className="stat-l">Total registrados</p>
          </div>
          <div className="stat">
            <p className="stat-n" style={{ color: '#065f46' }}>
              {vigentesEnPagina}
            </p>
            <p className="stat-l">Vigentes (en esta página)</p>
          </div>
          <div className="stat">
            <p className="stat-n" style={{ color: '#991b1b' }}>
              {otrosEnPagina}
            </p>
            <p className="stat-l">No vigentes (en esta página)</p>
          </div>
        </div>

        <div className="filters">
          <span style={{ fontSize: 11, color: '#888' }}>Filtrar:</span>
          <div className={'chip' + (filtroEstado === 'todos' ? ' on' : '')} onClick={() => setFiltroEstado('todos')}>
            Todos
          </div>
          <div className={'chip' + (filtroEstado === 'VIGENTE' ? ' on' : '')} onClick={() => setFiltroEstado('VIGENTE')}>
            <span className="dot" style={{ background: '#059669' }} />
            Vigentes
          </div>
          <div className={'chip' + (filtroEstado === 'REVOCADA' ? ' on' : '')} onClick={() => setFiltroEstado('REVOCADA')}>
            <span className="dot" style={{ background: '#dc2626' }} />
            Revocados
          </div>
        </div>

        <table>
          <colgroup>
            <col style={{ width: '13%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '12%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Cédula</th>
              <th>Nombre</th>
              <th>Categorías</th>
              <th>N.° resolución</th>
              <th>Vencimiento</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {vendedoresLoading && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: '#aaa', padding: '24px 12px' }}>
                  Cargando vendedores…
                </td>
              </tr>
            )}
            {!vendedoresLoading && vendedoresError && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: '#991b1b', padding: '24px 12px' }}>
                  No se pudo conectar con el backend ({getErrorMessage(vendedoresError)}).
                </td>
              </tr>
            )}
            {!vendedoresLoading && !vendedoresError && visibles.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: '#aaa', padding: '24px 12px' }}>
                  No hay vendedores que coincidan con el filtro en esta página.
                </td>
              </tr>
            )}
            {visibles.map((v) => (
              <tr key={v.idVendedor}>
                <td className="mono-sm">{v.cedula}</td>
                <td>
                  <div className="cell-flex">
                    <div
                      className="av"
                      style={{ background: getAvatarColors(v.nombre).bg, color: getAvatarColors(v.nombre).color }}
                    >
                      {getInitials(v.nombre)}
                    </div>
                    {v.nombre}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(v.categorias || []).map((c) => (
                      <span key={c.idCategoria} className="badge-n">
                        {c.nombre}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="mono-sm">{v.nResolucion}</td>
                <td>{v.vencimientoAutorizacion}</td>
                <td>
                  {v.estadoActivo === 'VIGENTE' ? (
                    <span className="badge bg-ok">
                      <i className="ti ti-check" style={{ fontSize: 10 }} aria-hidden="true" />
                      Vigente
                    </span>
                  ) : (
                    <span className="badge bg-exp">
                      <i className="ti ti-alert-circle" style={{ fontSize: 10 }} aria-hidden="true" />
                      {v.estadoActivo}
                    </span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <div className="iBtn edit" title="Editar" onClick={() => handleEditar(v)}>
                      <i className="ti ti-edit" style={{ fontSize: 13 }} aria-hidden="true" />
                    </div>
                    <div className="iBtn danger" title="Revocar" onClick={() => handleRevocar(v)}>
                      <i className="ti ti-ban" style={{ fontSize: 13 }} aria-hidden="true" />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pager">
          <span>{meta ? `Página ${meta.currentPage} de ${meta.totalPages} · Total ${meta.totalItems}` : '—'}</span>
          <div className="pbtns">
            <button className="pbtn" disabled={!meta || !meta.prevPage} onClick={() => fetchVendedores(vendedoresPage - 1)}>
              ← Anterior
            </button>
            <button className="pbtn on">{vendedoresPage}</button>
            <button className="pbtn" disabled={!meta || !meta.nextPage} onClick={() => fetchVendedores(vendedoresPage + 1)}>
              Siguiente →
            </button>
          </div>
        </div>
      </div>

      {cargandoDetalle && !showModal && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, background: '#1a1a2e', color: '#fff', padding: '8px 14px', borderRadius: 8, fontSize: 12 }}>
          Cargando detalle…
        </div>
      )}

      {showModal && (
        <Modal
          title={editing ? 'Editar vendedor' : 'Nuevo vendedor'}
          subtitle="Completa los datos de la autorización"
          onClose={closeModal}
        >
          <VendedorForm initial={editing} categorias={categorias} onCancel={closeModal} onSubmit={handleSubmit} />
        </Modal>
      )}
    </Layout>
  )
}
