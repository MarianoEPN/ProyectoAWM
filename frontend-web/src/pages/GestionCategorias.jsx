import React, { useState } from 'react'
import Layout from '../components/Layout.jsx'
import { useAppData } from '../data/AppDataContext.jsx'
import { getErrorMessage } from '../services/api.js'

export default function GestionCategorias() {
  const {
    categorias,
    categoriasMeta,
    categoriasPage,
    categoriasLoading,
    categoriasError,
    fetchCategorias,
    addCategoria,
    updateCategoria,
    desactivarCategoria
  } = useAppData()

  const [editingId, setEditingId] = useState(null)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const limpiar = () => {
    setEditingId(null)
    setNombre('')
    setDescripcion('')
    setError('')
  }

  const startEdit = (cat) => {
    setEditingId(cat.idCategoria)
    setNombre(cat.nombre)
    setDescripcion(cat.descripcion)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('El nombre de la categoría es obligatorio.')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (editingId) {
        await updateCategoria(editingId, { nombre: nombre.trim(), descripcion: descripcion.trim() })
      } else {
        await addCategoria({ nombre: nombre.trim(), descripcion: descripcion.trim() })
      }
      limpiar()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDesactivar = async (cat) => {
    // Salvaguarda solo del frontend: el contrato no exige totalVendedores = 0
    // para desactivar, pero evita desactivar por accidente una categoría en uso.
    if (cat.totalVendedores > 0) {
      alert('Esta categoría tiene vendedores asignados. Reasígnalos antes de desactivarla.')
      return
    }
    try {
      await desactivarCategoria(cat)
    } catch (err) {
      alert('No se pudo desactivar la categoría: ' + getErrorMessage(err))
    }
  }

  const meta = categoriasMeta

  return (
    <Layout variant="interno">
      <div style={{ marginBottom: 18 }}>
        <h1 className="page-title">Gestión de Categorías</h1>
        <p className="page-sub">Administra las categorías disponibles para vendedores ambulantes</p>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="card-head">
            <div>
              <p className="card-title">Categorías registradas</p>
              <p className="card-sub">{meta ? `${meta.totalItems} categorías` : '—'}</p>
            </div>
            <button className="btn-new" onClick={limpiar}>
              <i className="ti ti-plus" style={{ fontSize: 12 }} aria-hidden="true" />
              Nueva
            </button>
          </div>

          {categoriasLoading && (
            <div style={{ padding: 24, textAlign: 'center', color: '#aaa', fontSize: 12 }}>Cargando categorías…</div>
          )}
          {!categoriasLoading && categoriasError && (
            <div style={{ padding: 24, textAlign: 'center', color: '#991b1b', fontSize: 12 }}>
              No se pudo conectar con el backend ({getErrorMessage(categoriasError)}).
            </div>
          )}
          {!categoriasLoading &&
            !categoriasError &&
            categorias.map((cat) => (
              <div className="cat-row" key={cat.idCategoria}>
                <div className="cat-icon" style={{ background: '#f5f0e8' }}>
                  <i className="ti ti-tag" style={{ fontSize: 16, color: '#888' }} aria-hidden="true" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#1a1a2e', margin: 0 }}>{cat.nombre}</p>
                  <p style={{ fontSize: 11, color: '#888', marginTop: 1 }}>{cat.descripcion}</p>
                </div>
                <span className="badge-n">{cat.totalVendedores} vendedores</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <div className="iBtn edit" onClick={() => startEdit(cat)} title="Editar">
                    <i className="ti ti-edit" style={{ fontSize: 13 }} aria-hidden="true" />
                  </div>
                  <div
                    className={'iBtn danger' + (cat.totalVendedores > 0 ? ' disabled' : '')}
                    title={cat.totalVendedores > 0 ? 'Tiene vendedores asignados' : 'Desactivar'}
                    onClick={() => handleDesactivar(cat)}
                  >
                    <i className="ti ti-archive" style={{ fontSize: 13 }} aria-hidden="true" />
                  </div>
                </div>
              </div>
            ))}
          {!categoriasLoading && !categoriasError && categorias.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: '#aaa', fontSize: 12 }}>Aún no hay categorías.</div>
          )}

          <div className="pager">
            <span>{meta ? `Página ${meta.currentPage} de ${meta.totalPages}` : '—'}</span>
            <div className="pbtns">
              <button
                className="pbtn"
                disabled={!meta || !meta.prevPage}
                onClick={() => fetchCategorias(categoriasPage - 1)}
              >
                ← Anterior
              </button>
              <button className="pbtn on">{categoriasPage}</button>
              <button
                className="pbtn"
                disabled={!meta || !meta.nextPage}
                onClick={() => fetchCategorias(categoriasPage + 1)}
              >
                Siguiente →
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <p className="card-title">{editingId ? 'Editar categoría' : 'Nueva categoría'}</p>
              <p className="card-sub">Completa los datos</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} style={{ padding: 14 }}>
            <div className="form-field">
              <label className="form-label">
                Nombre <span style={{ color: '#991b1b' }}>*</span>
              </label>
              <input
                className="form-input"
                placeholder="Ej. Bebidas naturales"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Descripción</label>
              <textarea
                className="form-textarea"
                placeholder="Breve descripción…"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="form-footer">
              <button type="button" className="btn-sec" onClick={limpiar}>
                Limpiar
              </button>
              <button type="submit" className="btn-pri" disabled={saving}>
                <i className="ti ti-check" style={{ fontSize: 12 }} aria-hidden="true" />
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
          <div className="hint-row">
            <i className="ti ti-info-circle" style={{ fontSize: 12, color: '#C8871A' }} aria-hidden="true" />
            <span>No existe un endpoint de borrado definitivo: desactivar es un cambio de estado, no elimina el registro.</span>
          </div>
        </div>
      </div>
    </Layout>
  )
}
