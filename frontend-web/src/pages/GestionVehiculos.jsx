import React, { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import Modal from '../components/Modal.jsx'
import { useAppData } from '../data/AppDataContext.jsx'
import { getErrorMessage } from '../services/api.js'
import { vehiculoColores } from '../data/uiOptions.js'

function colorHexDe(nombre) {
  return vehiculoColores.find((c) => c.nombre.toLowerCase() === (nombre || '').toLowerCase())?.hex || '#999'
}

function VehiculoForm({ initial, onCancel, onSubmit, reactivar }) {
  const [placa, setPlaca] = useState(initial?.placa || '')
  const [modelo, setModelo] = useState(initial?.modelo || '')
  const [color, setColor] = useState(initial?.color || '')
  const [idHabitante, setIdHabitante] = useState(initial?.idHabitante ?? '')
  const [fechaEmision, setFechaEmision] = useState(initial?.fechaEmision || '')
  const [fechaExpiracion, setFechaExpiracion] = useState(initial?.fechaExpiracion || '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const isReactivar = reactivar

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!placa.trim() || !modelo.trim() || !color.trim() || !idHabitante || !fechaEmision || !fechaExpiracion) {
      setError('Completa placa, modelo, color, habitante y ambas fechas.')
      return
    }
    const today = new Date().toISOString().split('T')[0]
    if (fechaEmision > today) {
      setError('La fecha de emisión no puede ser posterior a la fecha actual.')
      return
    }
    if (fechaExpiracion < fechaEmision) {
      setError('La fecha de expiración no puede ser anterior a la de emisión.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSubmit({
        placa: placa.trim().toUpperCase(),
        modelo: modelo.trim(),
        color,
        idHabitante: Number(idHabitante),
        fechaEmision,
        fechaExpiracion,
        estadoActivo: initial?.estadoActivo || 'VIGENTE'
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
        <label className="form-label">Placa *</label>
        <input
          className="form-input"
          style={{ fontFamily: 'var(--font-mono)' }}
          placeholder="Ej. ABC-1234"
          value={placa}
          onChange={(e) => setPlaca(e.target.value)}
          disabled={isReactivar}
        />
      </div>
      <div className="form-field">
        <label className="form-label">Modelo *</label>
        <input
          className="form-input"
          placeholder="Ej. Toyota Hilux"
          value={modelo}
          onChange={(e) => setModelo(e.target.value)}
          disabled={isReactivar}
        />
      </div>
      <div className="form-field">
        <label className="form-label">ID del habitante (sistema legacy) *</label>
        <input
          className="form-input"
          type="number"
          placeholder="Ej. 4050"
          value={idHabitante}
          onChange={(e) => setIdHabitante(e.target.value)}
          disabled={isReactivar}
        />
      </div>
      <div className="form-field">
        <label className="form-label">Color <span style={{ color: '#991b1b' }}>*</span></label>
        <input
          className="form-input"
          placeholder="Ej. Azul electricidad"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          disabled={isReactivar}
        />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div className="form-field" style={{ flex: 1 }}>
          <label className="form-label">Fecha de emisión *</label>
          <input
            type="date"
            className="form-input"
            value={fechaEmision}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setFechaEmision(e.target.value)}
          />
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

export default function GestionVehiculos() {
  const {
    vehiculos,
    vehiculosMeta,
    vehiculosPage,
    vehiculosLoading,
    vehiculosError,
    fetchVehiculos,
    addVehiculo,
    updateVehiculo,
    toggleVehiculoEstado,
    obtenerVehiculo
  } = useAppData()
  const navigate = useNavigate()
  const location = useLocation()
  const isNewRoute = location.pathname.endsWith('/nuevo')

  const [filtroTexto, setFiltroTexto] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [showModal, setShowModal] = useState(isNewRoute)
  const [editing, setEditing] = useState(null)
  const [qrVehiculo, setQrVehiculo] = useState(null)

  // Función para reactivar: carga detalle y marca reactivar
  const handleReactivar = async (v) => {
    try {
      const detalle = await obtenerVehiculo(v.idVehiculo)
      setEditing({ ...detalle, reactivar: true })
      setShowModal(true)
    } catch (err) {
      alert('No se pudo cargar el detalle del vehículo: ' + getErrorMessage(err))
    }
  }

  // La API no expone búsqueda por texto (solo /vehiculos/validar es búsqueda
  // exacta por placa o qr). Este filtro solo actúa sobre lo ya cargado en la
  // página actual — para buscar en todo el padrón usa el validador.
  const visibles = useMemo(() => {
    return vehiculos.filter((v) => {
      const t = filtroTexto.trim().toLowerCase()
      const matchesTexto = !t || v.placa.toLowerCase().includes(t) || v.nombrePropietario.toLowerCase().includes(t)
      const matchesEstado = filtroEstado === 'todos' || v.estadoActivo === filtroEstado
      return matchesTexto && matchesEstado
    })
  }, [vehiculos, filtroTexto, filtroEstado])

  const vigentesEnPagina = vehiculos.filter((v) => v.estadoActivo === 'VIGENTE').length
  const revocadosEnPagina = vehiculos.filter((v) => v.estadoActivo !== 'VIGENTE').length

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
    if (location.pathname.endsWith('/nuevo')) navigate('/vehiculos')
  }

  const handleSubmit = async (data) => {
    if (editing) {
      if (editing.reactivar) {
        data.estadoActivo = 'VIGENTE'
      }
      await updateVehiculo(editing.idVehiculo, data)
    } else {
      await addVehiculo(data)
    }
    closeModal()
  }

  const handleToggleEstado = async (v) => {
    try {
      await toggleVehiculoEstado(v)
    } catch (err) {
      alert('No se pudo actualizar el estado: ' + getErrorMessage(err))
    }
  }

  const handleVerQr = async (v) => {
    setQrVehiculo('cargando')
    try {
      const detalle = await obtenerVehiculo(v.idVehiculo)
      setQrVehiculo(detalle)
    } catch (err) {
      setQrVehiculo(null)
      alert('No se pudo obtener el código QR: ' + getErrorMessage(err))
    }
  }

  const meta = vehiculosMeta

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
              {revocadosEnPagina}
            </p>
            <p className="stat-l">Revocados (en esta página)</p>
          </div>
        </div>

        <div className="search-row">
          <input
            className="search-input"
            placeholder="Filtrar en esta página…"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
          />
          <div style={{ marginLeft: 8, display: 'flex', gap: 6 }}>
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
        </div>
        <p style={{ fontSize: 11, color: '#aaa', padding: '0 16px 10px', margin: 0 }}>
          Este filtro solo busca dentro de la página cargada. Para buscar una placa específica en todo el padrón, usa el
          validador.
        </p>

        <table>
          <colgroup>
            <col style={{ width: '14%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '13%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Placa</th>
              <th>Modelo</th>
              <th>Color</th>
              <th>Propietario</th>
              <th>Vence</th>
              <th>Estado</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {vehiculosLoading && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: '#aaa', padding: '24px 12px' }}>
                  Cargando vehículos…
                </td>
              </tr>
            )}
            {!vehiculosLoading && vehiculosError && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: '#991b1b', padding: '24px 12px' }}>
                  No se pudo conectar con el backend ({getErrorMessage(vehiculosError)}).
                </td>
              </tr>
            )}
            {!vehiculosLoading && !vehiculosError && visibles.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: '#aaa', padding: '24px 12px' }}>
                  No hay vehículos que coincidan con el filtro en esta página.
                </td>
              </tr>
            )}
            {visibles.map((v) => (
              <tr key={v.idVehiculo}>
                <td className="mono">{v.placa}</td>
                <td>{v.modelo}</td>
                <td>
                  <div className="cell-flex">
                    <span className="color-swatch" style={{ background: colorHexDe(v.color) }} />
                    {v.color}
                  </div>
                </td>
                <td>{v.nombrePropietario}</td>
                <td>{v.fechaExpiracion}</td>
                <td>
                  {v.estadoActivo === 'VIGENTE' ? (
                    <span className="badge bg-ok">
                      <i className="ti ti-check" style={{ fontSize: 10 }} aria-hidden="true" />
                      Vigente
                    </span>
                  ) : (
                    <span className="badge bg-off">
                      <i className="ti ti-ban" style={{ fontSize: 10 }} aria-hidden="true" />
                      {v.estadoActivo}
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
                    <div className="iBtn qr" title="Ver código QR" onClick={() => handleVerQr(v)}>
                      <i className="ti ti-qrcode" style={{ fontSize: 13 }} aria-hidden="true" />
                    </div>
                    {v.estadoActivo === 'VIGENTE' ? (
                      <div
                        className="iBtn danger"
                        title="Revocar"
                        onClick={() => handleToggleEstado(v)}
                      >
                        <i className="ti ti-ban" style={{ fontSize: 13 }} aria-hidden="true" />
                      </div>
                    ) : (
                      <div
                        className="iBtn reactivate"
                        title="Reactivar"
                        onClick={() => handleReactivar(v)}
                      >
                        <i className="ti ti-refresh" style={{ fontSize: 13 }} aria-hidden="true" />
                      </div>
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
            <button className="pbtn" disabled={!meta || !meta.prevPage} onClick={() => fetchVehiculos(vehiculosPage - 1)}>
              ← Anterior
            </button>
            <button className="pbtn on">{vehiculosPage}</button>
            <button className="pbtn" disabled={!meta || !meta.nextPage} onClick={() => fetchVehiculos(vehiculosPage + 1)}>
              Siguiente →
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <Modal
          title={
            editing?.reactivar
              ? 'Reactivar vehículo'
              : editing
                ? 'Editar vehículo'
                : 'Nuevo vehículo'
          }
          subtitle={
            editing?.reactivar
              ? 'Solo puedes modificar las fechas de emisión y expiración'
              : 'Completa los datos del vehículo'
          }
          onClose={closeModal}
        >
          <VehiculoForm
            initial={editing}
            onCancel={closeModal}
            onSubmit={handleSubmit}
            reactivar={editing?.reactivar || false}
          />
        </Modal>
      )}

      {qrVehiculo && (
        <Modal title="Código QR" subtitle={qrVehiculo !== 'cargando' ? qrVehiculo.placa : ''} onClose={() => setQrVehiculo(null)}>
          {qrVehiculo === 'cargando' ? (
            <p style={{ fontSize: 12, color: '#888' }}>Cargando…</p>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <i className="ti ti-qrcode" style={{ fontSize: 64, color: '#1a1a2e' }} aria-hidden="true" />
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, marginTop: 10, wordBreak: 'break-all' }}>
                {qrVehiculo.codigoQr}
              </p>
              <p style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>
                Este valor es el que debe codificarse en la imagen QR física a imprimir.
              </p>
            </div>
          )}
        </Modal>
      )}
    </Layout>
  )
}