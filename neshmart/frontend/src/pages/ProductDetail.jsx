import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PaymentModal from '../components/PaymentModal';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, BadgeCheck, MapPin, MessageCircle } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${id}`)
      .then(({ data }) => setProduct(data.product))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  function handleBuy() {
    if (!user) {
      window.location.href = '/auth?tab=login';
      return;
    }
    setShowPayment(true);
  }

  const whatsappLink = product?.whatsapp_number
    ? `https://wa.me/${product.whatsapp_number}?text=${encodeURIComponent(`Hi, is "${product.title}" still available on NESHMART?`)}`
    : null;

  return (
    <div className="min-h-screen bg-slatebg flex flex-col">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-6 flex-1 w-full">
        <Link to="/marketplace" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-green mb-4">
          <ArrowLeft size={16} /> Back to Marketplace
        </Link>

        {loading && <p className="text-slate-400 text-sm">Loading...</p>}

        {notFound && (
          <div className="bg-white rounded-xl2 border border-slate-100 p-8 text-center">
            <p className="text-slate-500">This listing could not be found. It may have been removed.</p>
          </div>
        )}

        {product && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-square bg-white rounded-xl2 border border-slate-100 overflow-hidden">
              {product.image_url ? (
                <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">No image</div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-slate-800">{product.title}</h1>
                {product.seller_verified && <BadgeCheck size={20} className="text-brand-green shrink-0" />}
              </div>
              <p className="text-sm text-slate-400 mb-3">{product.category_name} &middot; {product.condition}</p>

              <p className="text-3xl font-extrabold text-brand-green mb-4">
                KES {Number(product.price).toLocaleString()}
              </p>

              <div className="flex items-center gap-1 text-sm text-slate-500 mb-1">
                <MapPin size={14} /> {product.campus_location}
              </div>
              <p className="text-sm text-slate-500 mb-1">Sold by: {product.seller_name}</p>
              <p className="text-sm text-slate-500 mb-4">{product.quantity} available</p>

              {product.description && (
                <div className="mb-6">
                  <h2 className="font-semibold text-slate-700 mb-1">Description</h2>
                  <p className="text-sm text-slate-600 whitespace-pre-line">{product.description}</p>
                </div>
              )}

              <div className="flex gap-3">
                {product.status === 'SOLD' ? (
                  <button disabled className="flex-1 bg-slate-300 text-white font-semibold py-3 rounded-xl cursor-not-allowed">
                    Sold Out
                  </button>
                ) : (
                  <button
                    onClick={handleBuy}
                    className="flex-1 bg-brand-orange text-white font-semibold py-3 rounded-xl hover:bg-orange-600 transition"
                  >
                    Buy via M-Pesa
                  </button>
                )}
                {whatsappLink && product.status !== 'SOLD' && (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1 flex-1 bg-brand-green text-white font-semibold py-3 rounded-xl hover:bg-green-800 transition"
                  >
                    <MessageCircle size={18} /> Chat Seller
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showPayment && product && (
        <PaymentModal product={product} onClose={() => setShowPayment(false)} />
      )}

      <Footer />
    </div>
  );
}
