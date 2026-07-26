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
            <i className="ti ti-x" style={{ fontSize: 14 }} aria-hidden="true" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
