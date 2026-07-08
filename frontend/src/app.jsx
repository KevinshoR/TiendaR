import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Egresos from './pages/Egresos/Egresos'
import Movimientos from './pages/Movimientos/Movimientos'
import Landing from './pages/Landing'
import Login from './pages/Login/Login'
import Registro from './pages/Registro/Registro'
import Cobranza from './pages/Cobranza/Cobranza'
import Dashboard from './pages/Dashboard/Dashboard'
import Compras from './pages/Compras/Compras'
import Inventario from './pages/Inventario/Inventario'
import Ventas from './pages/Ventas/Ventas'
import NuevaVenta from './pages/NuevaVenta/NuevaVenta'
import TiendaPublica from './pages/Tienda/TiendaPublica'
import Clientes from './pages/Clientes/Clientes'
import Empleados from './pages/Empleados/Empleados'
import Configuracion from './pages/Configuracion/Configuracion'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/tienda/:slug" element={<TiendaPublica />} />
      <Route path="/registro" element={<Registro />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/egresos" element={<Egresos />} />
        <Route path="/ventas" element={<Ventas />} />
        <Route path="/movimientos" element={<Movimientos />} />
        <Route path="/cobranza" element={<Cobranza />} />
        <Route path="/ventas/nueva" element={<NuevaVenta />} />
        <Route path="/compras" element={<Compras />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/empleados" element={<Empleados />} />
        <Route path="/configuracion" element={<Configuracion />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}