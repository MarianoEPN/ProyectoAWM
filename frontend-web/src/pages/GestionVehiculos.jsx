import React, { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import Modal from '../components/Modal.jsx'
import { useAppData } from '../data/AppDataContext.jsx'
import { usePagination } from '../hooks/usePagination.js'
import { vehiculoColores } from '../data/uiOptions.js'
import { getInitials, getAvatarColors } from '../utils/avatar.js'

const PAGE_SIZE = 4

function VehiculoForm({ initial, onCancel, onSubmit }) {
  const [placa, setPlaca] = useState(initial?.placa || '')
  const [modelo, setModelo] = useState(initial?.modelo || '')
  const [propietario, setPropietario] = useState(initial?.propietario || '')
  const [colorNombre, setColorNombre] = useState(initial?.colorNombre || vehiculoColores[0].nombre)
  const [error, setError] = useState('')

  const colorHex = vehiculoColores.find((c) => c.nombre === colorNombre)?.hex || '#888'

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!placa.trim() || !modelo.trim() || !propietario.trim()) {
      setError('Completa placa, modelo y propietario.')
      return
    }
    onSubmit({ placa, modelo, propietario, colorNombre, colorHex })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-field">
        <label className="form-label">Placa *</label>
        <input
          className="form-input"
          style={{ fontFamily: 'var(--font-mono)' }}
          placeholder="Ej. PBC-1234"
          value={placa}
          onChange={(e) => setPlaca(e.target.value)}
        />
      </div>
      <div className="form-field">
        <label className="form-label">Modelo *</label>
        <input
          className="form-input"
          placeholder="Ej. Chevrolet Aveo 2021"
          value={modelo}
          onChange={(e) => setModelo(e.target.value)}
        />
      </div>
      <div className="form-field">
        <label className="form-label">Propietario *</label>
        <input
          className="form-input"
          placeholder="Nombre completo"
          value={propietario}
          onChange={(e) => setPropietario(e.target.value)}
        />
      </div>
      <div className="form-field">
        <label className="form-label">Color</label>
        <select className="form-select" value={colorNombre} onChange={(e) => setColorNombre(e.target.value)}>
          {vehiculoColores.map((c) => (
            <option key={c.nombre} value={c.nombre}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#888', marginBottom: 4 }}>
        <span className="color-swatch" style={{ background: colorHex }} />
        Vista previa del color
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

export default function GestionVehiculos() {
  const { vehiculos, addVehiculo, updateVehiculo, toggleVehiculoEstado, loading, error } = useAppData()
  const navigate = useNavigate()
  const location = useLocation()
  const isNewRoute = location.pathname.endsWith('/nuevo')

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('todos') // todos | activo | inactivo
  const [showModal, setShowModal] = useState(isNewRoute)
  const [editing, setEditing] = useState(null)

  const filtered = useMemo(() => {
    return vehiculos.filter((v) => {
      const matchesSearch = v.placa.toLowerCase().includes(search.trim().toLowerCase())
      const matchesFilter =
        filter === 'todos' ||
        (filter === 'activo' && v.estado === 'activo') ||
        (filter === 'inactivo' && v.estado === 'inactivo')
      return matchesSearch && matchesFilter
    })
  }, [vehiculos, search, filter])

  const { page, setPage, totalPages, pageItems, total, next, prev } = usePagination(filtered, PAGE_SIZE)

  const totalRegistrados = vehiculos.length
  const qrActivos = vehiculos.filter((v) => v.qr === 'activo').length
  const inactivos = vehiculos.filter((v) => v.estado === 'inactivo').length

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
    if (location.pathname.endsWith('/nuevo')) navigate('/vehiculos')
  }

  const handleSubmit = async (data) => {
    try {
      if (editing) {
        await updateVehiculo(editing.id, data)
      } else {
        await addVehiculo(data)
      }
      closeModal()
    } catch (err) {
      alert('No se pudo guardar el vehículo: ' + (err.response?.data?.message || err.message))
    }
  }

  return (
    <Layout variant="interno">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <h1 className="page-title">Gestión de Vehículos</h1>
        <button className="btn-new" onClick={() => setShowModal(true)}>
          <i className="ti ti-plus" style={{ fontSize: 13 }} aria-hidden="true" />
          Nuevo Vehículo
        </button>
      </div>

      <div className="card">
        <div className="stats">
          <div className="stat">
            <p className="stat-n">{totalRegistrados}</p>
            <p className="stat-l">Total registrados</p>
          </div>
          <div className="stat">
            <p className="stat-n" style={{ color: '#065f46' }}>
              {qrActivos}
            </p>
            <p className="stat-l">QR activos</p>
          </div>
          <div className="stat">
            <p className="stat-n" style={{ color: '#991b1b' }}>
              {inactivos}
            </p>
            <p className="stat-l">Vehículos inactivos</p>
          </div>
        </div>

        <div className="search-row">
          <input
            className="search-input"
            placeholder="Buscar por placa…"
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
          <div style={{ marginLeft: 8, display: 'flex', gap: 6 }}>
            <div className={'chip' + (filter === 'todos' ? ' on' : '')} onClick={() => setFilter('todos')}>
              Todos
            </div>
            <div className={'chip' + (filter === 'activo' ? ' on' : '')} onClick={() => setFilter('activo')}>
              <span className="dot" style={{ background: '#059669' }} />
              QR activo
            </div>
            <div className={'chip' + (filter === 'inactivo' ? ' on' : '')} onClick={() => setFilter('inactivo')}>
              <span className="dot" style={{ background: '#dc2626' }} />
              Inactivos
            </div>
          </div>
        </div>

        <table>
          <colgroup>
            <col style={{ width: '12%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '17%' }} />
          </colgroup>
          <thead>
            <tr>
              <th className="sortable">
                Placa <i className="ti ti-arrows-sort" style={{ fontSize: 11 }} aria-hidden="true" />
              </th>
              <th>Modelo</th>
              <th>Color</th>
              <th>Propietario</th>
              <th>Estado</th>
              <th>QR</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: '#aaa', padding: '24px 12px' }}>
                  Cargando vehículos…
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
                  No se encontraron vehículos con ese criterio.
                </td>
              </tr>
            )}
            {pageItems.map((v) => (
              <tr key={v.id}>
                <td className="mono">{v.placa}</td>
                <td>{v.modelo}</td>
                <td>
                  <div className="cell-flex">
                    <span className="color-swatch" style={{ background: v.colorHex }} />
                    {v.colorNombre}
                  </div>
                </td>
                <td>
                  <div className="cell-flex">
                    <div
                      className="av"
                      style={{ background: getAvatarColors(v.propietario).bg, color: getAvatarColors(v.propietario).color }}
                    >
                      {getInitials(v.propietario)}
                    </div>
                    {v.propietario}
                  </div>
                </td>
                <td>
                  {v.estado === 'activo' ? (
                    <span className="badge bg-ok">
                      <i className="ti ti-check" style={{ fontSize: 10 }} aria-hidden="true" />
                      Activo
                    </span>
                  ) : (
                    <span className="badge bg-off">
                      <i className="ti ti-minus" style={{ fontSize: 10 }} aria-hidden="true" />
                      Inactivo
                    </span>
                  )}
                </td>
                <td>
                  {v.qr === 'activo' ? (
                    <span className="badge bg-qr">
                      <i className="ti ti-qrcode" style={{ fontSize: 10 }} aria-hidden="true" />
                      Activo
                    </span>
                  ) : (
                    <span className="badge bg-qroff">
                      <i className="ti ti-x" style={{ fontSize: 10 }} aria-hidden="true" />
                      Inválido
                    </span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
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
                      className={'iBtn qr' + (v.qr !== 'activo' ? ' disabled' : '')}
                      title={v.qr === 'activo' ? 'Ver QR' : 'QR inactivo'}
                    >
                      <i className="ti ti-qrcode" style={{ fontSize: 13 }} aria-hidden="true" />
                    </div>
                    <div
                      className="iBtn danger"
                      title={v.estado === 'activo' ? 'Desactivar' : 'Activar'}
                      onClick={() => toggleVehiculoEstado(v.id).catch((err) => alert('Error: ' + err.message))}
                    >
                      <i
                        className={v.estado === 'activo' ? 'ti ti-ban' : 'ti ti-rotate-clockwise'}
                        style={{ fontSize: 13 }}
                        aria-hidden="true"
                      />
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
          title={editing ? 'Editar vehículo' : 'Nuevo vehículo'}
          subtitle="Completa los datos del vehículo"
          onClose={closeModal}
        >
          <VehiculoForm initial={editing} onCancel={closeModal} onSubmit={handleSubmit} />
        </Modal>
      )}
    </Layout>
  )
}
