import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import './styles/app.css'

import Dashboard from './pages/Dashboard.jsx'
import GestionVehiculos from './pages/GestionVehiculos.jsx'
import GestionVendedores from './pages/GestionVendedores.jsx'
import GestionCategorias from './pages/GestionCategorias.jsx'
import ValidarVehiculo from './pages/ValidarVehiculo.jsx'
import ValidarVendedor from './pages/ValidarVendedor.jsx'
import Placeholder from './pages/Placeholder.jsx'
import Configuracion from './pages/Configuracion.jsx'
import Reportes from './pages/Reportes.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />

      <Route path="/vehiculos" element={<GestionVehiculos />} />
      <Route path="/vehiculos/nuevo" element={<GestionVehiculos />} />

      <Route path="/vendedores" element={<GestionVendedores />} />
      <Route path="/vendedores/nuevo" element={<GestionVendedores />} />

      <Route path="/categorias" element={<GestionCategorias />} />

      <Route path="/validar/vehiculo" element={<ValidarVehiculo />} />
      <Route path="/validar/vendedor" element={<ValidarVendedor />} />

      <Route
        path="/reportes"
        element={
          <Reportes/>
        }
      />
      <Route path="/configuracion" element={<Configuracion />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
