import React, { useState } from 'react'
import Layout from '../components/Layout.jsx'
import { useAppData } from '../data/AppDataContext.jsx'
import { getInitials, getAvatarColors } from '../utils/avatar.js'

export default function ValidarVendedor() {
  const { buscarVendedor, historialVendedores } = useAppData()
  const [query, setQuery] = useState('')
  const [resultado, setResultado] = useState(null)
  const [buscado, setBuscado] = useState(false)

  const [buscando, setBuscando] = useState(false)

  const handleBuscar = async (e) => {
    e?.preventDefault()
    if (!query.trim()) return
    setBuscando(true)
    try {
      const found = await buscarVendedor(query)
      setResultado(found)
      setBuscado(true)
    } catch (err) {
      alert('Error al consultar el backend: ' + err.message)
    } finally {
      setBuscando(false)
    }
  }

  const esVigente = resultado && resultado.estado === 'vigente'

  return (
    <Layout variant="validador" contentClassName="validator-content">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Verificar vendedor</h1>
          <p style={{ fontSize: 12, color: '#888', marginTop: 3 }}>
            Escanea el QR del vendedor o ingresa su cédula o N.° de resolución
          </p>
        </div>

        <div className="card">
          <div className="card-head">
            <p className="card-title">Cámara</p>
            <p className="card-sub">Encuadra el código QR del vendedor</p>
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
            <p style={{ fontSize: 11, color: '#aaa', textAlign: 'center' }}>— o ingresa cédula o resolución —</p>
          </div>
          <form className="manual-row" onSubmit={handleBuscar}>
            <input
              className="manual-input"
              placeholder="Cédula o N.° resolución"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
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
          {historialVendedores.map((h, i) => (
            <div className="hist-item" key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a2e' }}>{h.nombre}</span>
                {h.resultado === 'vigente' ? (
                  <span className="badge-ok">
                    <i className="ti ti-check" style={{ fontSize: 10 }} aria-hidden="true" />
                    Vigente
                  </span>
                ) : (
                  <span className="badge-err">
                    <i className="ti ti-x" style={{ fontSize: 10 }} aria-hidden="true" />
                    Expirado
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
              Escanea un código QR o busca una cédula / resolución para ver el resultado aquí.
            </div>
          </div>
        )}

        {buscado && !resultado && (
          <div className="card">
            <div className="card-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p className="card-title">Resultado</p>
                <p className="card-sub">Información del vendedor escaneado</p>
              </div>
              <span className="badge-err" style={{ fontSize: 11, padding: '4px 10px' }}>
                <i className="ti ti-x" style={{ fontSize: 11 }} aria-hidden="true" />
                No encontrado
              </span>
            </div>
            <div className="alert-err">
              <i className="ti ti-alert-triangle" style={{ fontSize: 16, flexShrink: 0 }} aria-hidden="true" />
              No existe un vendedor registrado con ese dato.
            </div>
          </div>
        )}

        {buscado && resultado && (
          <div className="card">
            <div className="card-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p className="card-title">Resultado</p>
                <p className="card-sub">Información del vendedor escaneado</p>
              </div>
              {esVigente ? (
                <span className="badge-ok" style={{ fontSize: 11, padding: '4px 10px' }}>
                  <i className="ti ti-check" style={{ fontSize: 11 }} aria-hidden="true" />
                  Vendedor vigente
                </span>
              ) : (
                <span className="badge-err" style={{ fontSize: 11, padding: '4px 10px' }}>
                  <i className="ti ti-x" style={{ fontSize: 11 }} aria-hidden="true" />
                  No vigente
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 16px 6px' }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: getAvatarColors(resultado.nombre).bg,
                  border: '2px solid #C8871A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  fontWeight: 600,
                  color: getAvatarColors(resultado.nombre).color,
                  marginBottom: 8
                }}
              >
                {getInitials(resultado.nombre)}
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>{resultado.nombre}</p>
              <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Cédula: {resultado.cedula}</p>
            </div>

            {esVigente ? (
              <div className="alert-ok">
                <i className="ti ti-shield-check" style={{ fontSize: 16, flexShrink: 0 }} aria-hidden="true" />
                Este vendedor cuenta con autorización vigente para operar en la comunidad.
              </div>
            ) : (
              <div className="alert-err">
                <i className="ti ti-shield-x" style={{ fontSize: 16, flexShrink: 0 }} aria-hidden="true" />
                La autorización de este vendedor no está vigente.
              </div>
            )}

            <div className="rows">
              <div className="row">
                <span className="rl">
                  <i className="ti ti-tag" style={{ fontSize: 12 }} aria-hidden="true" />
                  Categoría
                </span>
                <span className="rv">{resultado.categoria}</span>
              </div>
              <div className="row">
                <span className="rl">
                  <i className="ti ti-file-text" style={{ fontSize: 12 }} aria-hidden="true" />
                  N.° resolución
                </span>
                <span className="rv" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                  {resultado.resolucion}
                </span>
              </div>
              <div className="row">
                <span className="rl">
                  <i className="ti ti-calendar" style={{ fontSize: 12 }} aria-hidden="true" />
                  Vence el
                </span>
                <span className="rv">{resultado.vencimientoTexto}</span>
              </div>
              <div className="row">
                <span className="rl">
                  <i className="ti ti-clock" style={{ fontSize: 12 }} aria-hidden="true" />
                  Verificado
                </span>
                <span className="rv" style={{ color: '#aaa' }}>
                  hace unos segundos
                </span>
              </div>
            </div>

            <div className="hint-row" style={{ background: '#faf8f4' }}>
              <i className="ti ti-lock" style={{ fontSize: 12, color: '#C8871A' }} aria-hidden="true" />
              <span style={{ color: '#aaa' }}>Datos de contacto no son visibles en esta vista.</span>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
