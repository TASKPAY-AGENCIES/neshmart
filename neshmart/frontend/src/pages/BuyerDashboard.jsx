import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { CheckCircle2, Clock, PackageCheck } from 'lucide-react';

const STATUS_STYLES = {
  AWAITING_PAYMENT: 'bg-slate-100 text-slate-500',
  HELD_IN_ESCROW: 'bg-brand-orange/10 text-brand-orange',
  RELEASED: 'bg-brand-green/10 text-brand-green',
  REFUNDED: 'bg-red-50 text-red-500',
  DISPUTED: 'bg-red-50 text-red-500',
};

export default function BuyerDashboard() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [releasingId, setReleasingId] = useState(null);

  function load() {
    setLoading(true);
    api.get('/escrow/mine')
      .then(({ data }) => setTransactions(data.transactions))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleRelease(transactionId) {
    if (!confirm('Confirm you have physically inspected this item and want to release payment to the seller?')) return;
    setReleasingId(transactionId);
    try {
      await api.post('/escrow/release', { transactionId });
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not release funds');
    } finally {
      setReleasingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slatebg">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">My Purchases</h1>
        <p className="text-slate-500 text-sm mb-6">
          Track your escrow transactions. Only release funds once you've received and inspected your item.
        </p>

        {loading ? (
          <p className="text-slate-400 text-sm">Loading...</p>
        ) : transactions.length === 0 ? (
          <p className="text-slate-400 text-sm">No purchases yet. Browse the marketplace to get started.</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((t) => (
              <div key={t.id} className="bg-white rounded-xl2 border border-slate-100 p-4 flex items-center gap-4">
                <img
                  src={t.image_url || 'https://via.placeholder.com/64'}
                  alt={t.title}
                  className="w-16 h-16 rounded-lg object-cover shrink-0 bg-slate-100"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{t.title}</p>
                  <p className="text-xs text-slate-400">Seller: {t.seller_name}</p>
                  <p className="text-sm font-bold text-brand-green">KES {Number(t.amount).toLocaleString()}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-[11px] font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${STATUS_STYLES[t.escrow_status]}`}>
                    {t.escrow_status === 'RELEASED' && <CheckCircle2 size={12} />}
                    {t.escrow_status === 'HELD_IN_ESCROW' && <Clock size={12} />}
                    {t.escrow_status.replace(/_/g, ' ')}
                  </span>
                  {t.escrow_status === 'HELD_IN_ESCROW' && (
                    <button
                      onClick={() => handleRelease(t.id)}
                      disabled={releasingId === t.id}
                      className="flex items-center gap-1 bg-brand-orange text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50"
                    >
                      <PackageCheck size={14} />
                      {releasingId === t.id ? 'Releasing...' : 'Confirm & Release Funds'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
