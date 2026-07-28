import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/axios';
import { CheckCircle2, Clock, PackageCheck } from 'lucide-react';

const STATUS_STYLES = {
  AWAITING_PAYMENT: 'bg-white/10 text-white/60',
  HELD_IN_ESCROW: 'bg-brand-orange/20 text-orange-200',
  RELEASED: 'bg-brand-green/20 text-green-200',
  REFUNDED: 'bg-red-500/20 text-red-200',
  DISPUTED: 'bg-red-500/20 text-red-200',
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
    <DashboardLayout title="My Purchases" subtitle="Track your escrow transactions. Only release funds once you've received and inspected your item.">
      {loading ? (
        <p className="text-white/60 text-sm">Loading...</p>
      ) : transactions.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-center">
          <p className="text-white/60 text-sm">No purchases yet. Browse the marketplace to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((t) => (
            <div key={t.id} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 flex items-center gap-4">
              <img
                src={t.image_url || 'https://via.placeholder.com/64'}
                alt={t.title}
                className="w-16 h-16 rounded-lg object-cover shrink-0 bg-white/10"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{t.title}</p>
                <p className="text-xs text-white/50">Seller: {t.seller_name}</p>
                <p className="text-sm font-bold text-white">KES {Number(t.amount).toLocaleString()}</p>
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
    </DashboardLayout>
  );
}
