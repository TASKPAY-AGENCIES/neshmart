import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { Users, Package, Receipt, Flag, TrendingUp } from 'lucide-react';

const TABS = ['Overview', 'Users', 'Products', 'Transactions', 'Reports'];

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-white rounded-xl2 border border-slate-100 p-4 flex items-center gap-3">
      <div className="bg-brand-green/10 text-brand-green p-2 rounded-lg"><Icon size={20} /></div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="font-bold text-slate-800">{value}</p>
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
    <div className="min-h-screen bg-slatebg">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Admin Panel</h1>
        <p className="text-slate-500 text-sm mb-6">Platform moderation and oversight.</p>

        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm border transition ${
                tab === t
                  ? 'bg-brand-green text-white border-brand-green'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-brand-green'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading && <p className="text-slate-400 text-sm">Loading...</p>}

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
              <div key={u.id} className="bg-white rounded-xl2 border border-slate-100 p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{u.full_name} {u.is_verified_student && '✓'}</p>
                  <p className="text-xs text-slate-400 truncate">{u.email} · {u.phone}</p>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${u.is_banned ? 'bg-red-50 text-red-500' : 'bg-brand-green/10 text-brand-green'}`}>
                  {u.is_banned ? 'Banned' : 'Active'}
                </span>
                <button
                  onClick={() => toggleBan(u.id, u.is_banned)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:border-red-400"
                >
                  {u.is_banned ? 'Unban' : 'Ban'}
                </button>
              </div>
            ))}
            {users.length === 0 && <p className="text-slate-400 text-sm">No users found.</p>}
          </div>
        )}

        {!loading && tab === 'Products' && (
          <div className="space-y-2">
            {products.map((p) => (
              <div key={p.id} className="bg-white rounded-xl2 border border-slate-100 p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{p.title}</p>
                  <p className="text-xs text-slate-400 truncate">{p.seller_name} · KES {Number(p.price).toLocaleString()} · {p.status}</p>
                </div>
                {p.status !== 'REMOVED' ? (
                  <button
                    onClick={() => moderateProduct(p.id, 'REMOVED')}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    onClick={() => moderateProduct(p.id, 'ACTIVE')}
                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:border-brand-green"
                  >
                    Restore
                  </button>
                )}
              </div>
            ))}
            {products.length === 0 && <p className="text-slate-400 text-sm">No products found.</p>}
          </div>
        )}

        {!loading && tab === 'Transactions' && (
          <div className="space-y-2">
            {transactions.map((t) => (
              <div key={t.id} className="bg-white rounded-xl2 border border-slate-100 p-3">
                <p className="font-medium text-slate-800 truncate">{t.product_title}</p>
                <p className="text-xs text-slate-400">
                  {t.buyer_name} → {t.seller_name} · KES {Number(t.amount).toLocaleString()} · {t.escrow_status}
                </p>
              </div>
            ))}
            {transactions.length === 0 && <p className="text-slate-400 text-sm">No transactions found.</p>}
          </div>
        )}

        {!loading && tab === 'Reports' && (
          <div className="space-y-2">
            {reports.map((r) => (
              <div key={r.id} className="bg-white rounded-xl2 border border-slate-100 p-3">
                <p className="font-medium text-slate-800 truncate">{r.product_title}</p>
                <p className="text-xs text-slate-400 mb-2">Reported by {r.reporter_name}: {r.reason}</p>
                {r.status === 'OPEN' && (
                  <div className="flex gap-2">
                    <button onClick={() => resolveReport(r.id, 'REVIEWED')} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:border-brand-green">
                      Mark Reviewed
                    </button>
                    <button onClick={() => resolveReport(r.id, 'DISMISSED')} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-400">
                      Dismiss
                    </button>
                  </div>
                )}
                {r.status !== 'OPEN' && (
                  <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-500">{r.status}</span>
                )}
              </div>
            ))}
            {reports.length === 0 && <p className="text-slate-400 text-sm">No reports found.</p>}
          </div>
        )}
      </div>
    </div>
  );
        }
