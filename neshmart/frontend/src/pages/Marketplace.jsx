import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import PaymentModal from '../components/PaymentModal';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const CAMPUSES = ['All', 'Main Campus', 'Kapkatet', 'Premier Hostels', 'Elite Hostels', 'Kabianga Center'];

export default function Marketplace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [page, setPage] = useState(1);

  const search = searchParams.get('search') || '';
  const campus = searchParams.get('campus') || 'All';
  const category = searchParams.get('category') || '';

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 20 };
    if (search) params.search = search;
    if (campus !== 'All') params.campus = campus;
    if (category) params.category = category;

    api.get('/products', { params })
      .then(({ data }) => setProducts(data.products))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [search, campus, category, page]);

  function handleBuy(product) {
    if (!user) {
      window.location.href = '/auth?tab=login';
      return;
    }
    setSelectedProduct(product);
  }

  function setCampus(c) {
    const next = new URLSearchParams(searchParams);
    if (c === 'All') next.delete('campus'); else next.set('campus', c);
    setSearchParams(next);
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-slatebg">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-3">
          {CAMPUSES.map((c) => (
            <button
              key={c}
              onClick={() => setCampus(c)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm border transition ${
                campus === c
                  ? 'bg-brand-green text-white border-brand-green'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-brand-green'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl2 h-64 animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-slate-400 py-20">No listings found. Try a different filter or search.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} onBuy={handleBuy} />
            ))}
          </div>
        )}
      </div>

      {selectedProduct && (
        <PaymentModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  );
}
