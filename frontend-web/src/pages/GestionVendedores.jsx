import React, { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import Modal from '../components/Modal.jsx'
import { useAppData } from '../data/AppDataContext.jsx'
import { getInitials, getAvatarColors } from '../utils/avatar.js'
import { apiBaseUrl, getErrorMessage } from '../services/api.js'

const resolveImageUrl = (src) => {
  if (!src) return null
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  if (src.startsWith('/uploads')) {
    return `${apiBaseUrl}${src}`
  }
  return src
}

function VendedorForm({ initial, categorias, onCancel, onSubmit, reactivar }) {
  const [cedula, setCedula] = useState(initial?.cedula || '')
  const [nombre, setNombre] = useState(initial?.nombre || '')
  const [nResolucion, setNResolucion] = useState(initial?.nResolucion || '')
  const [fechaEmision, setFechaEmision] = useState(initial?.fechaEmision || '')
  const [fechaExpiracion, setFechaExpiracion] = useState(initial?.fechaExpiracion || '')
  const [idHabitante, setIdHabitante] = useState(initial?.idHabitante ?? '')
  const [categoriasIds, setCategoriasIds] = useState((initial?.categorias || []).map((c) => c.idCategoria))
  const [fotoFile, setFotoFile] = useState(null)
  const [preview, setPreview] = useState(initial?.foto || null)

  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const isReactivar = reactivar

  const toggleCategoria = (id) => {
    setCategoriasIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  // Manejador del cambio de archivo de la foto
  const handleFotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP).')
        return
      }
      setFotoFile(file)
      setPreview(URL.createObjectURL(file))
      setError('')
    }
  }

  const previewUrl = resolveImageUrl(preview)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!cedula.trim() || !nombre.trim() || !nResolucion.trim() || !fechaEmision || !fechaExpiracion) {
      setError('Completa cédula, nombre, resolución y ambas fechas.')
      return
    }
    if (fechaEmision > new Date().toISOString().split('T')[0]) {
      setError('La fecha de emisión no puede ser posterior a la fecha actual.')
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
    if (fechaExpiracion < fechaEmision) {
      setError('La fecha de expiración no puede ser anterior a la de emisión.')
      return
    }
    setSaving(true)
    setError('')
    try {
      // 2. CONSTRUIR FORMDATA EN LUGAR DE UN OBJETO JSON
      const formData = new FormData()
      formData.append('cedula', cedula.trim())
      formData.append('nombre', nombre.trim())
      formData.append('nResolucion', nResolucion.trim())
      formData.append('fechaEmision', fechaEmision)
      formData.append('fechaExpiracion', fechaExpiracion)
      formData.append('estadoActivo', initial?.estadoActivo || 'VIGENTE')
      if (idHabitante) formData.append('idHabitante', Number(idHabitante))

      // Pasar array de categorías como JSON para evitar problemas de parsing en multipart/form-data
      formData.append('categoriasIds', JSON.stringify(categoriasIds))

      // Adjuntar el archivo de imagen si el usuario seleccionó uno nuevo
      if (fotoFile) {
        formData.append('foto', fotoFile) // 'foto' debe coincidir con upload.single('foto') en Multer
      }
      await onSubmit(formData)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* campo: FOTO DEL VENDEDOR */}
      <div className="form-field" style={{ marginBottom: 16 }}>
        <label className="form-label">Foto del vendedor</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Vista previa o avatar por defecto */}
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              overflow: 'hidden',
              background: '#f0ede6',
              border: '1px solid #d1c9b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Vista previa"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <i className="ti ti-user" style={{ fontSize: 24, color: '#999' }} />
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            id="foto-input"
            onChange={handleFotoChange}
            disabled={isReactivar}
            style={{ display: 'none' }}
          />
          <label
            htmlFor="foto-input"
            className="btn-sec"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: isReactivar ? 'not-allowed' : 'pointer',
              padding: '6px 12px',
              fontSize: 12
            }}
          >
            <i className="ti ti-upload" style={{ fontSize: 14 }} />
            {preview ? 'Cambiar foto' : 'Subir foto'}
          </label>
          {fotoFile && <span style={{ fontSize: 11, color: '#666', marginLeft: 8 }}>{fotoFile.name}</span>}
        </div>
      </div>
      <div className="form-field">
        <label className="form-label">Cédula *</label>
        <input
          className="form-input"
          style={{ fontFamily: 'var(--font-mono)' }}
          placeholder="10 dígitos"
          value={cedula}
          onChange={(e) => setCedula(e.target.value)}
          disabled={isReactivar}
        />
      </div>
      <div className="form-field">
        <label className="form-label">Nombre completo *</label>
        <input className="form-input" placeholder="Nombre y apellido" value={nombre} onChange={(e) => setNombre(e.target.value)} disabled={isReactivar} />
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
                disabled={isReactivar}
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
          disabled={isReactivar}
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
          {saving
            ? (isReactivar ? 'Reactivando…' : 'Guardando…')
            : (isReactivar ? 'Reactivar' : 'Guardar')
          }
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
      if (editing.reactivar) {
        if (data instanceof FormData) {
          data.set('estadoActivo', 'VIGENTE')
        } else {
          data.estadoActivo = 'VIGENTE'
        }
      }
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
  const handleReactivar = async (v) => {
    setCargandoDetalle(true)
    try {
      const detalle = await obtenerVendedor(v.idVendedor)
      setEditing({ ...detalle, reactivar: true })  // flag para identificar reactivación
      setShowModal(true)
    } catch (err) {
      alert('No se pudo cargar el detalle del vendedor: ' + getErrorMessage(err))
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
                      {v.foto ? (
                        <img
                          src={resolveImageUrl(v.foto)}
                          alt={v.nombre}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        getInitials(v.nombre)
                      )}
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
                <td>{v.fechaExpiracion || v.vencimientoAutorizacion}</td>
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
                    <button type="button" className="iBtn edit" title="Editar" onClick={() => handleEditar(v)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                      </svg>
                    </button>
                    {v.estadoActivo === 'REVOCADA' ? (
                      <button type="button" className="iBtn reactivate" title="Reactivar" onClick={() => handleReactivar(v)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M3 12a9 9 0 0 1 15.46-6.36L21 5" />
                          <path d="M21 3v6h-6" />
                          <path d="M21 12a9 9 0 0 1-15.46 6.36L3 19" />
                          <path d="M3 21v-6h6" />
                        </svg>
                      </button>
                    ) : (
                      <button type="button" className="iBtn danger" title="Eliminar" onClick={() => handleRevocar(v)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    )}
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
          title={
            editing?.reactivar
              ? 'Reactivar vendedor'
              : editing
                ? 'Editar vendedor'
                : 'Nuevo vendedor'
          }
          subtitle={
            editing?.reactivar
              ? 'Solo puedes modificar las fechas de emisión y expiración'
              : 'Completa los datos de la autorización'
          }
          onClose={closeModal}
        >
          <VendedorForm initial={editing} categorias={categorias} onCancel={closeModal} onSubmit={handleSubmit} reactivar={editing?.reactivar || false} />
        </Modal>
      )}
    </Layout>
  )
}
