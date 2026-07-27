import React, { useEffect } from 'react'

export default function Modal({ title, subtitle, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-card" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <div>
            <p className="card-title">{title}</p>
            {subtitle && <p className="card-sub">{subtitle}</p>}
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            <span aria-hidden="true" style={{ fontSize: 16, lineHeight: 1 }}>&times;</span>
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
