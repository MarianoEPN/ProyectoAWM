import React, { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import Modal from '../components/Modal.jsx'
import { useAppData } from '../data/AppDataContext.jsx'
import { usePagination } from '../hooks/usePagination.js'
import { getInitials, getAvatarColors } from '../utils/avatar.js'

const PAGE_SIZE = 5

function estadoDeVencimiento(iso) {
  if (!iso) return 'pendiente'
  const hoy = new Date()
  const fecha = new Date(iso)
  return fecha >= hoy ? 'vigente' : 'caducada'
}

function VendedorForm({ initial, categorias, onCancel, onSubmit }) {
  const [cedula, setCedula] = useState(initial?.cedula || '')
  const [nombre, setNombre] = useState(initial?.nombre || '')
  const [categoria, setCategoria] = useState(initial?.categoria || categorias[0]?.nombre || '')
  const [resolucion, setResolucion] = useState(initial?.resolucion || '')
  const [vencimiento, setVencimiento] = useState(initial?.vencimiento || '')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!cedula.trim() || !nombre.trim() || !resolucion.trim() || !vencimiento) {
      setError('Completa cédula, nombre, resolución y vencimiento.')
      return
    }
    if (!/^\d{10}$/.test(cedula.trim())) {
      setError('La cédula debe tener 10 dígitos.')
      return
    }
    onSubmit({
      cedula: cedula.trim(),
      nombre: nombre.trim(),
      categoria,
      resolucion: resolucion.trim(),
      vencimiento,
      estado: estadoDeVencimiento(vencimiento)
    })
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
        <label className="form-label">Categoría *</label>
        <select className="form-select" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          {categorias.map((c) => (
            <option key={c.id} value={c.nombre}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="form-field">
        <label className="form-label">N.° de resolución *</label>
        <input
          className="form-input"
          style={{ fontFamily: 'var(--font-mono)' }}
          placeholder="Ej. RES-2026-0001"
          value={resolucion}
          onChange={(e) => setResolucion(e.target.value)}
        />
      </div>
      <div className="form-field">
        <label className="form-label">Vencimiento de autorización *</label>
        <input type="date" className="form-input" value={vencimiento} onChange={(e) => setVencimiento(e.target.value)} />
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="form-footer">
        <button type="button" className="btn-sec" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn-pri">
          <i className="ti ti-check" style={{ fontSize: 12 }} aria-hidden="true" />
          Guardar
        </button>
      </div>
    </form>
  )
}

export default function GestionVendedores() {
  const { vendedores, categorias, addVendedor, updateVendedor, revocarVendedor, loading, error } = useAppData()
  const navigate = useNavigate()
  const location = useLocation()
  const isNewRoute = location.pathname.endsWith('/nuevo')

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('todos') // todos | vigente | caducada
  const [showModal, setShowModal] = useState(isNewRoute)
  const [editing, setEditing] = useState(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return vendedores.filter((v) => {
      const matchesSearch =
        !q ||
        v.cedula.toLowerCase().includes(q) ||
        v.nombre.toLowerCase().includes(q) ||
        v.categoria.toLowerCase().includes(q)
      const matchesFilter =
        filter === 'todos' ||
        (filter === 'vigente' && v.estado === 'vigente') ||
        (filter === 'caducada' && v.estado === 'caducada')
      return matchesSearch && matchesFilter
    })
  }, [vendedores, search, filter])

  const { page, setPage, totalPages, pageItems, total, next, prev } = usePagination(filtered, PAGE_SIZE)

  const totalRegistrados = vendedores.length
  const vigentes = vendedores.filter((v) => v.estado === 'vigente').length
  const caducadas = vendedores.filter((v) => v.estado === 'caducada').length

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
    if (location.pathname.endsWith('/nuevo')) navigate('/vendedores')
  }

  const handleSubmit = async (data) => {
    try {
      if (editing) {
        await updateVendedor(editing.id, data)
      } else {
        await addVendedor(data)
      }
      closeModal()
    } catch (err) {
      alert('No se pudo guardar el vendedor: ' + (err.response?.data?.message || err.message))
    }
  }

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
            placeholder="Buscar por cédula, nombre o categoría…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="filter-btn">
            <i className="ti ti-adjustments-horizontal" aria-hidden="true" />
          </div>
          <button className="btn-search" onClick={() => setPage(1)}>
            <i className="ti ti-search" style={{ fontSize: 13 }} aria-hidden="true" />
            Buscar
          </button>
        </div>

        <div className="stats">
          <div className="stat">
            <p className="stat-n">{totalRegistrados}</p>
            <p className="stat-l">Total registrados</p>
          </div>
          <div className="stat">
            <p className="stat-n" style={{ color: '#065f46' }}>
              {vigentes}
            </p>
            <p className="stat-l">Autorizaciones vigentes</p>
          </div>
          <div className="stat">
            <p className="stat-n" style={{ color: '#991b1b' }}>
              {caducadas}
            </p>
            <p className="stat-l">Autorizaciones caducadas</p>
          </div>
        </div>

        <div className="filters">
          <span style={{ fontSize: 11, color: '#888' }}>Filtrar:</span>
          <div className={'chip' + (filter === 'todos' ? ' on' : '')} onClick={() => setFilter('todos')}>
            Todos
          </div>
          <div className={'chip' + (filter === 'vigente' ? ' on' : '')} onClick={() => setFilter('vigente')}>
            <span className="dot" style={{ background: '#059669' }} />
            Vigentes
          </div>
          <div className={'chip' + (filter === 'caducada' ? ' on' : '')} onClick={() => setFilter('caducada')}>
            <span className="dot" style={{ background: '#dc2626' }} />
            Caducadas
          </div>
        </div>

        <table>
          <colgroup>
            <col style={{ width: '14%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '19%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '8%' }} />
          </colgroup>
          <thead>
            <tr>
              <th className="sortable">
                Cédula <i className="ti ti-arrows-sort" style={{ fontSize: 11 }} aria-hidden="true" />
              </th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>N.° resolución</th>
              <th>Vencimiento</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: '#aaa', padding: '24px 12px' }}>
                  Cargando vendedores…
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: '#991b1b', padding: '24px 12px' }}>
                  No se pudo conectar con el backend ({error.message}).
                </td>
              </tr>
            )}
            {!loading && !error && pageItems.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: '#aaa', padding: '24px 12px' }}>
                  No se encontraron vendedores con ese criterio.
                </td>
              </tr>
            )}
            {pageItems.map((v) => (
              <tr key={v.id}>
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
                <td>{v.categoria}</td>
                <td className="mono-sm">{v.resolucion}</td>
                <td>{v.vencimientoTexto}</td>
                <td>
                  {v.estado === 'vigente' && (
                    <span className="badge bg-ok">
                      <i className="ti ti-check" style={{ fontSize: 10 }} aria-hidden="true" />
                      Vigente
                    </span>
                  )}
                  {v.estado === 'caducada' && (
                    <span className="badge bg-exp">
                      <i className="ti ti-alert-circle" style={{ fontSize: 10 }} aria-hidden="true" />
                      Caducada
                    </span>
                  )}
                  {v.estado === 'pendiente' && (
                    <span className="badge bg-pend">
                      <i className="ti ti-clock" style={{ fontSize: 10 }} aria-hidden="true" />
                      Pendiente
                    </span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <div
                      className="iBtn edit"
                      title="Editar"
                      onClick={() => {
                        setEditing(v)
                        setShowModal(true)
                      }}
                    >
                      <i className="ti ti-edit" style={{ fontSize: 13 }} aria-hidden="true" />
                    </div>
                    <div
                      className="iBtn danger"
                      title="Revocar"
                      onClick={() => revocarVendedor(v.id).catch((err) => alert('Error: ' + err.message))}
                    >
                      <i className="ti ti-ban" style={{ fontSize: 13 }} aria-hidden="true" />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pager">
          <span>
            Página {page} de {totalPages} · Total {total}
          </span>
          <div className="pbtns">
            <button className="pbtn" disabled={page === 1} onClick={prev}>
              ← Anterior
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} className={'pbtn' + (p === page ? ' on' : '')} onClick={() => setPage(p)}>
                {p}
              </button>
            ))}
            <button className="pbtn" disabled={page === totalPages} onClick={next}>
              Siguiente →
            </button>
          </div>
        </div>
      </div>

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
