import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/axios';
import { Users, Package, Receipt, Flag, TrendingUp } from 'lucide-react';

const TABS = ['Overview', 'Users', 'Products', 'Transactions', 'Reports'];

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 flex items-center gap-3">
      <div className="bg-white/15 text-white p-2 rounded-lg"><Icon size={20} /></div>
      <div>
        <p className="text-xs text-white/50">{label}</p>
        <p className="font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  function loadTab(current) {
    setLoading(true);
    const requests = {
      Overview: api.get('/admin/stats').then(({ data }) => setStats(data)),
      Users: api.get('/admin/users').then(({ data }) => setUsers(data.users)),
      Products: api.get('/admin/products').then(({ data }) => setProducts(data.products)),
      Transactions: api.get('/admin/transactions').then(({ data }) => setTransactions(data.transactions)),
      Reports: api.get('/admin/reports').then(({ data }) => setReports(data.reports)),
    };
    requests[current].finally(() => setLoading(false));
  }

  useEffect(() => { loadTab(tab); }, [tab]);

  async function toggleBan(userId, currentlyBanned) {
    if (!confirm(currentlyBanned ? 'Unban this user?' : 'Ban this user?')) return;
    await api.put(`/admin/users/${userId}/ban`, { banned: !currentlyBanned });
    loadTab('Users');
  }

  async function moderateProduct(id, status) {
    await api.put(`/admin/products/${id}/moderate`, { status });
    loadTab('Products');
  }

  async function resolveReport(id, status) {
    await api.put(`/admin/reports/${id}`, { status });
    loadTab('Reports');
  }

  return (
    <DashboardLayout
      title="Admin Panel"
      subtitle="Platform moderation and oversight."
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
    >
      {loading && <p className="text-white/60 text-sm">Loading...</p>}

      {!loading && tab === 'Overview' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard icon={Users} label="Total Users" value={stats.totalUsers} />
          <StatCard icon={Package} label="Active Listings" value={stats.activeListings} />
          <StatCard icon={Receipt} label="Transactions" value={stats.totalTransactions} />
          <StatCard icon={TrendingUp} label="Commission Earned" value={`KES ${stats.totalCommission.toLocaleString()}`} />
          <StatCard icon={Flag} label="Open Reports" value={stats.openReports} />
        </div>
      )}

      {!loading && tab === 'Users' && (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{u.full_name} {u.is_verified_student && '✓'}</p>
                <p className="text-xs text-white/50 truncate">{u.email} · {u.phone}</p>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${u.is_banned ? 'bg-red-500/20 text-red-200' : 'bg-brand-green/20 text-green-200'}`}>
                {u.is_banned ? 'Banned' : 'Active'}
              </span>
              <button
                onClick={() => toggleBan(u.id, u.is_banned)}
                className="text-xs px-3 py-1.5 rounded-lg border border-white/20 text-white/80 hover:border-red-300"
              >
                {u.is_banned ? 'Unban' : 'Ban'}
              </button>
            </div>
          ))}
          {users.length === 0 && <p className="text-white/60 text-sm">No users found.</p>}
        </div>
      )}

      {!loading && tab === 'Products' && (
        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{p.title}</p>
                <p className="text-xs text-white/50 truncate">{p.seller_name} · KES {Number(p.price).toLocaleString()} · {p.status}</p>
              </div>
              {p.status !== 'REMOVED' ? (
                <button
                  onClick={() => moderateProduct(p.id, 'REMOVED')}
                  className="text-xs px-3 py-1.5 rounded-lg border border-red-400/40 text-red-200 hover:bg-red-500/10"
                >
                  Remove
                </button>
              ) : (
                <button
                  onClick={() => moderateProduct(p.id, 'ACTIVE')}
                  className="text-xs px-3 py-1.5 rounded-lg border border-white/20 text-white/80 hover:border-white/50"
                >
                  Restore
                </button>
              )}
            </div>
          ))}
          {products.length === 0 && <p className="text-white/60 text-sm">No products found.</p>}
        </div>
      )}

      {!loading && tab === 'Transactions' && (
        <div className="space-y-2">
          {transactions.map((t) => (
            <div key={t.id} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-3">
              <p className="font-medium text-white truncate">{t.product_title}</p>
              <p className="text-xs text-white/50">
                {t.buyer_name} → {t.seller_name} · KES {Number(t.amount).toLocaleString()} · {t.escrow_status}
              </p>
            </div>
          ))}
          {transactions.length === 0 && <p className="text-white/60 text-sm">No transactions found.</p>}
        </div>
      )}

      {!loading && tab === 'Reports' && (
        <div className="space-y-2">
          {reports.map((r) => (
            <div key={r.id} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-3">
              <p className="font-medium text-white truncate">{r.product_title}</p>
              <p className="text-xs text-white/50 mb-2">Reported by {r.reporter_name}: {r.reason}</p>
              {r.status === 'OPEN' && (
                <div className="flex gap-2">
                  <button onClick={() => resolveReport(r.id, 'REVIEWED')} className="text-xs px-3 py-1.5 rounded-lg border border-white/20 text-white/80 hover:border-white/50">
                    Mark Reviewed
                  </button>
                  <button onClick={() => resolveReport(r.id, 'DISMISSED')} className="text-xs px-3 py-1.5 rounded-lg border border-white/20 text-white/60 hover:border-white/40">
                    Dismiss
                  </button>
                </div>
              )}
              {r.status !== 'OPEN' && (
                <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-white/10 text-white/60">{r.status}</span>
              )}
            </div>
          ))}
          {reports.length === 0 && <p className="text-white/60 text-sm">No reports found.</p>}
        </div>
      )}
    </DashboardLayout>
  );
              }
