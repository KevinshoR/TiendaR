import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login/Login'
import Registro from './pages/Registro/Registro'
import Dashboard from './pages/Dashboard/Dashboard'
import Inventario from './pages/Inventario/Inventario'
import Ventas from './pages/Ventas/Ventas'
import NuevaVenta from './pages/NuevaVenta/NuevaVenta'
import Clientes from './pages/Clientes/Clientes'
import Empleados from './pages/Empleados/Empleados'
import Configuracion from './pages/Configuracion/Configuracion'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/ventas" element={<Ventas />} />
        <Route path="/ventas/nueva" element={<NuevaVenta />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/empleados" element={<Empleados />} />
        <Route path="/configuracion" element={<Configuracion />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
