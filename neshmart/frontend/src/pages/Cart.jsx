import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PaymentModal from '../components/PaymentModal';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Trash2, ShoppingCart } from 'lucide-react';

export default function Cart() {
  const { items, removeFromCart } = useCart();
  const { user } = useAuth();
  const [buyingProduct, setBuyingProduct] = useState(null);

  function handleBuy(product) {
    if (!user) {
      window.location.href = '/auth?tab=login';
      return;
    }
    setBuyingProduct(product);
  }

  return (
    <div className="min-h-screen bg-slatebg flex flex-col">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-8 flex-1 w-full">
        <h1 className="text-2xl font-bold text-slate-800 mb-1 flex items-center gap-2">
          <ShoppingCart size={24} /> My Cart
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          Items saved here don't reserve stock — pay with M-Pesa to actually secure each item.
        </p>

        {items.length === 0 ? (
          <div className="bg-white rounded-xl2 border border-slate-100 p-8 text-center">
            <p className="text-slate-400 text-sm mb-3">Your cart is empty.</p>
            <Link to="/marketplace" className="text-brand-green font-semibold text-sm hover:underline">
              Browse the marketplace
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((p) => (
              <div key={p.id} className="bg-white rounded-xl2 border border-slate-100 p-3 flex items-center gap-3">
                <Link to={`/product/${p.id}`} className="shrink-0">
                  <img
                    src={p.image_url || 'https://via.placeholder.com/64'}
                    alt={p.title}
                    className="w-16 h-16 rounded-lg object-cover bg-slate-100"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${p.id}`} className="font-semibold text-slate-800 hover:text-brand-green truncate block">
                    {p.title}
                  </Link>
                  <p className="text-sm font-bold text-brand-green">KES {Number(p.price).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => handleBuy(p)}
                  className="bg-brand-orange text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-orange-600"
                >
                  Buy via M-Pesa
                </button>
                <button
                  onClick={() => removeFromCart(p.id)}
                  className="text-slate-400 hover:text-red-500 p-2"
                  aria-label="Remove from cart"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {buyingProduct && (
        <PaymentModal product={buyingProduct} onClose={() => setBuyingProduct(null)} />
      )}

      <Footer />
    </div>
  );
        }
