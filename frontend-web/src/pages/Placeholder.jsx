import React from 'react'
import Layout from '../components/Layout.jsx'

export default function Placeholder({ icon, title, description }) {
  return (
    <Layout variant="interno">
      <div className="placeholder-page">
        <i className={`ti ${icon}`} aria-hidden="true" />
        <h1 style={{ fontSize: 16, fontWeight: 600, color: '#555', margin: 0 }}>{title}</h1>
        <p style={{ fontSize: 12, maxWidth: 320 }}>{description}</p>
      </div>
    </Layout>
  )
}
