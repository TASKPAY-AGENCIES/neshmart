import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Marketplace from './pages/Marketplace';
import BuyerDashboard from './pages/BuyerDashboard';
import SellerDashboard from './pages/SellerDashboard';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/marketplace" element={<Marketplace />} />
      <Route
        path="/dashboard/buyer"
        element={<ProtectedRoute><BuyerDashboard /></ProtectedRoute>}
      />
      <Route
        path="/dashboard/seller"
        element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>}
      />
    </Routes>
  );
}
