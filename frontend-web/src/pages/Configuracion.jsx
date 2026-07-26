import React, { useState } from 'react'
import Layout from '../components/Layout.jsx'

export default function Configuracion() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [guardado, setGuardado] = useState(false)

  const handleGuardar = (e) => {
    e.preventDefault()
    if (token.trim()) {
      localStorage.setItem('token', token.trim())
    } else {
      localStorage.removeItem('token')
    }
    setGuardado(true)
    setTimeout(() => setGuardado(false), 2000)
  }

  const handleLimpiar = () => {
    setToken('')
    localStorage.removeItem('token')
  }

  return (
    <Layout variant="interno">
      <div style={{ marginBottom: 18 }}>
        <h1 className="page-title">Configuración</h1>
        <p className="page-sub">Ajustes de conexión con el backend</p>
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        <div className="card-head">
          <div>
            <p className="card-title">Token de sesión (JWT)</p>
            <p className="card-sub">Todos los endpoints acordados requieren Authorization: Bearer &lt;token&gt;</p>
          </div>
        </div>
        <form onSubmit={handleGuardar} style={{ padding: 16 }}>
          <div className="form-field">
            <label className="form-label">Token</label>
            <textarea
              className="form-textarea"
              style={{ height: 90, fontFamily: 'var(--font-mono)', fontSize: 11 }}
              placeholder="Pega aquí el JWT emitido por el backend…"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>
          <div className="form-footer">
            <button type="button" className="btn-sec" onClick={handleLimpiar}>
              Quitar token
            </button>
            <button type="submit" className="btn-pri">
              <i className="ti ti-check" style={{ fontSize: 12 }} aria-hidden="true" />
              Guardar
            </button>
          </div>
        </form>
        {guardado && (
          <div className="hint-row" style={{ background: '#d1fae5', color: '#065f46' }}>
            <i className="ti ti-check" style={{ fontSize: 12 }} aria-hidden="true" />
            <span style={{ color: '#065f46' }}>Token guardado. Recarga la página para aplicarlo en las próximas peticiones.</span>
          </div>
        )}
        <div className="hint-row">
          <i className="ti ti-info-circle" style={{ fontSize: 12, color: '#C8871A' }} aria-hidden="true" />
          <span>
            El documento de endpoints acordado todavía no define un endpoint de login. En cuanto exista, esta pantalla
            debería reemplazarse por un formulario de usuario/contraseña que llame a ese endpoint y guarde el token
            automáticamente.
          </span>
        </div>
      </div>
    </Layout>
  )
}
