import React, { useState } from 'react'
import Layout from '../components/Layout.jsx'
import { useAppData } from '../data/AppDataContext.jsx'
import { vehiculoColores } from '../data/uiOptions.js'
import { getErrorMessage } from '../services/api.js'

function colorHexDe(nombre) {
  return vehiculoColores.find((c) => c.nombre.toLowerCase() === (nombre || '').toLowerCase())?.hex || '#999'
}

export default function ValidarVehiculo() {
  const { validarVehiculo, historialVehiculos } = useAppData()
  const [tipoBusqueda, setTipoBusqueda] = useState('placa') // placa | qr
  const [valor, setValor] = useState('')
  const [resultado, setResultado] = useState(null)
  const [buscado, setBuscado] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleBuscar = async (e) => {
    e?.preventDefault()
    if (!valor.trim()) return
    setBuscando(true)
    setErrorMsg('')
    try {
      const found = await validarVehiculo(tipoBusqueda, valor.trim())
      setResultado(found)
      setBuscado(true)
    } catch (err) {
      setErrorMsg(getErrorMessage(err))
    } finally {
      setBuscando(false)
    }
  }

  const esValido = resultado && resultado.estadoActivo === 'VIGENTE'

  return (
    <Layout variant="validador" contentClassName="validator-content">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Escanear código QR</h1>
          <p style={{ fontSize: 12, color: '#888', marginTop: 3 }}>
            Apunta la cámara al QR del vehículo o ingresa la placa
          </p>
        </div>

        <div className="card">
          <div className="card-head">
            <p className="card-title">Cámara</p>
            <p className="card-sub">Encuadra el código QR</p>
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="scan-area">
              <div className="scan-corner" style={{ top: 6, left: 6, borderWidth: '2px 0 0 2px', borderRadius: '3px 0 0 0' }} />
              <div className="scan-corner" style={{ top: 6, right: 6, borderWidth: '2px 2px 0 0', borderRadius: '0 3px 0 0' }} />
              <div className="scan-corner" style={{ bottom: 6, left: 6, borderWidth: '0 0 2px 2px', borderRadius: '0 0 0 3px' }} />
              <div className="scan-corner" style={{ bottom: 6, right: 6, borderWidth: '0 2px 2px 0', borderRadius: '0 0 3px 0' }} />
              <div className="scan-line" />
              <svg width="70" height="70" viewBox="0 0 130 130" opacity="0.2">
                <g fill="#1a1a2e">
                  <rect x="10" y="10" width="40" height="40" rx="3" fill="none" stroke="#1a1a2e" strokeWidth="5" />
                  <rect x="20" y="20" width="20" height="20" />
                  <rect x="80" y="10" width="40" height="40" rx="3" fill="none" stroke="#1a1a2e" strokeWidth="5" />
                  <rect x="90" y="20" width="20" height="20" />
                  <rect x="10" y="80" width="40" height="40" rx="3" fill="none" stroke="#1a1a2e" strokeWidth="5" />
                  <rect x="20" y="90" width="20" height="20" />
                  <rect x="60" y="60" width="8" height="8" />
                  <rect x="70" y="60" width="8" height="8" />
                  <rect x="80" y="60" width="8" height="8" />
                  <rect x="60" y="70" width="8" height="8" />
                  <rect x="80" y="80" width="8" height="8" />
                  <rect x="90" y="70" width="8" height="8" />
                </g>
              </svg>
            </div>
            <p style={{ fontSize: 11, color: '#aaa', textAlign: 'center' }}>
              — la cámara resuelve el código QR (tipoBusqueda=qr); o busca manualmente —
            </p>
          </div>
          <form className="manual-row" onSubmit={handleBuscar}>
            <select
              className="form-select"
              style={{ maxWidth: 100, height: 34 }}
              value={tipoBusqueda}
              onChange={(e) => setTipoBusqueda(e.target.value)}
            >
              <option value="placa">Placa</option>
              <option value="qr">Código QR</option>
            </select>
            <input
              className="manual-input"
              placeholder={tipoBusqueda === 'placa' ? 'Ej. ABC-1234' : 'Código QR'}
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
            <button type="submit" className="btn-buscar" disabled={buscando}>
              {buscando ? 'Buscando…' : 'Buscar'}
            </button>
          </form>
        </div>

        <div className="card">
          <div className="card-head">
            <p className="card-title">Últimas verificaciones</p>
          </div>
          {historialVehiculos.length === 0 && (
            <div style={{ padding: 16, textAlign: 'center', color: '#aaa', fontSize: 11 }}>Sin verificaciones aún.</div>
          )}
          {historialVehiculos.map((h, i) => (
            <div className="hist-item" key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#1a1a2e' }}>
                  {h.placa}
                </span>
                {h.resultado === 'valido' ? (
                  <span className="badge-ok">
                    <i className="ti ti-check" style={{ fontSize: 10 }} aria-hidden="true" />
                    Válido
                  </span>
                ) : (
                  <span className="badge-err">
                    <i className="ti ti-x" style={{ fontSize: 10 }} aria-hidden="true" />
                    Inválido
                  </span>
                )}
              </div>
              <p style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                {h.hace} · {h.detalle}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ visibility: 'hidden', height: 52 }} />

        {!buscado && (
          <div className="card">
            <div className="empty-result">
              <i className="ti ti-qrcode" style={{ fontSize: 32, color: '#d1c9b8' }} aria-hidden="true" />
              Escanea un código QR o busca una placa para ver el resultado aquí.
            </div>
          </div>
        )}

        {buscado && errorMsg && (
          <div className="card">
            <div className="alert-err">
              <i className="ti ti-alert-triangle" style={{ fontSize: 16, flexShrink: 0 }} aria-hidden="true" />
              {errorMsg}
            </div>
          </div>
        )}

        {buscado && !errorMsg && !resultado && (
          <div className="card">
            <div className="card-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p className="card-title">Resultado</p>
                <p className="card-sub">Información del vehículo escaneado</p>
              </div>
              <span className="badge-err" style={{ fontSize: 11, padding: '4px 10px' }}>
                <i className="ti ti-x" style={{ fontSize: 11 }} aria-hidden="true" />
                No encontrado
              </span>
            </div>
            <div className="alert-err">
              <i className="ti ti-alert-triangle" style={{ fontSize: 16, flexShrink: 0 }} aria-hidden="true" />
              No existe ningún vehículo que coincida con ese dato.
            </div>
          </div>
        )}

        {buscado && !errorMsg && resultado && (
          <div className="card">
            <div className="card-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p className="card-title">Resultado</p>
                <p className="card-sub">Información del vehículo escaneado</p>
              </div>
              {esValido ? (
                <span className="badge-ok" style={{ fontSize: 11, padding: '4px 10px' }}>
                  <i className="ti ti-check" style={{ fontSize: 11 }} aria-hidden="true" />
                  Vehículo vigente
                </span>
              ) : (
                <span className="badge-err" style={{ fontSize: 11, padding: '4px 10px' }}>
                  <i className="ti ti-x" style={{ fontSize: 11 }} aria-hidden="true" />
                  {resultado.estadoActivo}
                </span>
              )}
            </div>

            {esValido ? (
              <div className="alert-ok">
                <i className="ti ti-shield-check" style={{ fontSize: 16, flexShrink: 0 }} aria-hidden="true" />
                Vehículo autorizado para ingresar a la comunidad.
              </div>
            ) : (
              <div className="alert-err">
                <i className="ti ti-shield-x" style={{ fontSize: 16, flexShrink: 0 }} aria-hidden="true" />
                Este vehículo no está vigente ({resultado.estadoActivo}). Evalúa negar el ingreso.
              </div>
            )}

            <div className="rows">
              <div className="row">
                <span className="rl">
                  <i className="ti ti-id-badge" style={{ fontSize: 12 }} aria-hidden="true" />
                  Placa
                </span>
                <span className="rv" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  {resultado.placa}
                </span>
              </div>
              <div className="row">
                <span className="rl">
                  <i className="ti ti-car" style={{ fontSize: 12 }} aria-hidden="true" />
                  Modelo
                </span>
                <span className="rv">{resultado.modelo}</span>
              </div>
              <div className="row">
                <span className="rl">
                  <i className="ti ti-palette" style={{ fontSize: 12 }} aria-hidden="true" />
                  Color
                </span>
                <span className="rv" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span className="color-swatch" style={{ background: colorHexDe(resultado.color) }} />
                  {resultado.color}
                </span>
              </div>
              <div className="row">
                <span className="rl">
                  <i className="ti ti-user" style={{ fontSize: 12 }} aria-hidden="true" />
                  Propietario
                </span>
                <span className="rv">{resultado.nombrePropietario}</span>
              </div>
              <div className="row">
                <span className="rl">
                  <i className="ti ti-calendar" style={{ fontSize: 12 }} aria-hidden="true" />
                  Vence
                </span>
                <span className="rv">{resultado.fechaExpiracion}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
