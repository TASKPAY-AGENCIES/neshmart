import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Marketplace from './pages/Marketplace';
import BuyerDashboard from './pages/BuyerDashboard';
import SellerDashboard from './pages/SellerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProductDetail from './pages/ProductDetail';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/marketplace" element={<Marketplace />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route
        path="/dashboard/buyer"
        element={<ProtectedRoute><BuyerDashboard /></ProtectedRoute>}
      />
      <Route
        path="/dashboard/seller"
        element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>}
      />
      <Route
        path="/admin"
        element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>}
      />
    </Routes>
  );
}
