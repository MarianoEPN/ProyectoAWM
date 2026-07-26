import React, { useState } from 'react'
import Layout from '../components/Layout.jsx'
import { useAppData } from '../data/AppDataContext.jsx'
import { colorPalette } from '../data/uiOptions.js'

export default function GestionCategorias() {
  const { categorias, vendedoresPorCategoria, addCategoria, updateCategoria, deleteCategoria } = useAppData()

  const [editingId, setEditingId] = useState(null)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [colorSel, setColorSel] = useState(colorPalette[0].hex)
  const [error, setError] = useState('')

  const limpiar = () => {
    setEditingId(null)
    setNombre('')
    setDescripcion('')
    setColorSel(colorPalette[0].hex)
    setError('')
  }

  const startEdit = (cat) => {
    setEditingId(cat.id)
    setNombre(cat.nombre)
    setDescripcion(cat.descripcion)
    setColorSel(cat.iconBg)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('El nombre de la categoría es obligatorio.')
      return
    }
    try {
      if (editingId) {
        await updateCategoria(editingId, { nombre: nombre.trim(), descripcion: descripcion.trim(), iconBg: colorSel })
      } else {
        await addCategoria({ nombre: nombre.trim(), descripcion: descripcion.trim(), iconBg: colorSel })
      }
      limpiar()
    } catch (err) {
      setError('No se pudo guardar: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleDelete = async (cat) => {
    const enUso = vendedoresPorCategoria[cat.nombre] || 0
    if (enUso > 0) return
    try {
      await deleteCategoria(cat.id)
    } catch (err) {
      alert('No se pudo eliminar la categoría: ' + (err.response?.data?.message || err.message))
    }
  }

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
              <p className="card-sub">{categorias.length} categorías activas</p>
            </div>
            <button className="btn-new" onClick={limpiar}>
              <i className="ti ti-plus" style={{ fontSize: 12 }} aria-hidden="true" />
              Nueva
            </button>
          </div>

          {categorias.map((cat) => {
            const enUso = vendedoresPorCategoria[cat.nombre] || 0
            return (
              <div className="cat-row" key={cat.id}>
                <div className="cat-icon" style={{ background: cat.iconBg }}>
                  <i className={`ti ${cat.icono}`} style={{ fontSize: 16, color: cat.iconColor }} aria-hidden="true" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#1a1a2e', margin: 0 }}>{cat.nombre}</p>
                  <p style={{ fontSize: 11, color: '#888', marginTop: 1 }}>{cat.descripcion}</p>
                </div>
                <span className="badge-n">{enUso} vendedores</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <div className="iBtn edit" onClick={() => startEdit(cat)} title="Editar">
                    <i className="ti ti-edit" style={{ fontSize: 13 }} aria-hidden="true" />
                  </div>
                  <div
                    className={'iBtn danger' + (enUso > 0 ? ' disabled' : '')}
                    title={enUso > 0 ? 'No se puede eliminar: tiene vendedores asignados' : 'Eliminar'}
                    onClick={() => handleDelete(cat)}
                  >
                    <i className="ti ti-trash" style={{ fontSize: 13 }} aria-hidden="true" />
                  </div>
                </div>
              </div>
            )
          })}
          {categorias.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: '#aaa', fontSize: 12 }}>Aún no hay categorías.</div>
          )}
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
            <div className="form-field">
              <label className="form-label">Color de identificación</label>
              <div className="cp-row">
                {colorPalette.map((c) => (
                  <div
                    key={c.hex}
                    className={'cp' + (colorSel === c.hex ? ' sel' : '')}
                    style={{ background: c.hex }}
                    title={c.nombre}
                    onClick={() => setColorSel(c.hex)}
                  />
                ))}
              </div>
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="form-footer">
              <button type="button" className="btn-sec" onClick={limpiar}>
                Limpiar
              </button>
              <button type="submit" className="btn-pri">
                <i className="ti ti-check" style={{ fontSize: 12 }} aria-hidden="true" />
                Guardar
              </button>
            </div>
          </form>
          <div className="hint-row">
            <i className="ti ti-info-circle" style={{ fontSize: 12, color: '#C8871A' }} aria-hidden="true" />
            <span>Solo se eliminan categorías sin vendedores asignados.</span>
          </div>
        </div>
      </div>
    </Layout>
  )
}
