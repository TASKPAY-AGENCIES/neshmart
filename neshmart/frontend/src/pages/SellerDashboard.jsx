import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { TrendingUp, Package, Wallet, Clock3, Plus, X } from 'lucide-react';

const CAMPUSES = ['Main Campus', 'Kapkatet', 'Premier Hostels', 'Elite Hostels', 'Kabianga Center'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Used'];

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

function SellWizard({ categories, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '', description: '', categoryId: '', price: '', campusLocation: CAMPUSES[0],
    condition: CONDITIONS[0], quantity: 1, imageUrl: '', whatsappNumber: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/products', form);
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create listing');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl2 max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-slate-700">
          <X size={20} />
        </button>
        <h2 className="font-bold text-lg mb-4">Sell an Item</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input required placeholder="Title" value={form.title} onChange={(e) => update('title', e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          <textarea placeholder="Description" value={form.description} onChange={(e) => update('description', e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" rows={3} />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.categoryId} onChange={(e) => update('categoryId', e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
              <option value="">Category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input required type="number" min="1" placeholder="Price (KES)" value={form.price}
              onChange={(e) => update('price', e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={form.campusLocation} onChange={(e) => update('campusLocation', e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
              {CAMPUSES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select value={form.condition} onChange={(e) => update('condition', e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
              {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" min="1" placeholder="Quantity" value={form.quantity}
              onChange={(e) => update('quantity', e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            <input placeholder="WhatsApp (2547XXXXXXXX)" value={form.whatsappNumber}
              onChange={(e) => update('whatsappNumber', e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <input placeholder="Image URL (Cloudinary link)" value={form.imageUrl}
            onChange={(e) => update('imageUrl', e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button disabled={saving} className="w-full bg-brand-green text-white font-semibold py-2.5 rounded-lg hover:bg-green-800 disabled:opacity-50">
            {saving ? 'Publishing...' : 'Publish Listing'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SellerDashboard() {
  const [stats, setStats] = useState(null);
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showWizard, setShowWizard] = useState(false);

  function loadAll() {
    api.get('/seller/stats').then(({ data }) => setStats(data));
    api.get('/products/mine').then(({ data }) => setListings(data.products));
    api.get('/products/categories').then(({ data }) => setCategories(data.categories));
  }

  useEffect(loadAll, []);

  async function toggleStatus(product) {
    const newStatus = product.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    await api.put(`/products/${product.id}`, { status: newStatus });
    loadAll();
  }

  async function removeListing(id) {
    if (!confirm('Delete this listing?')) return;
    await api.delete(`/products/${id}`);
    loadAll();
  }

  return (
    <div className="min-h-screen bg-slatebg">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Seller Dashboard</h1>
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-1 bg-brand-orange text-white font-semibold px-4 py-2 rounded-full hover:bg-orange-600"
          >
            <Plus size={16} /> Sell Item
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <StatCard icon={Package} label="Active Listings" value={stats.activeListings} />
            <StatCard icon={TrendingUp} label="Products Sold" value={stats.productsSold} />
            <StatCard icon={Clock3} label="Escrow Balance" value={`KES ${stats.escrowBalance.toLocaleString()}`} />
            <StatCard icon={Wallet} label="Total Revenue" value={`KES ${stats.totalRevenue.toLocaleString()}`} />
          </div>
        )}

        <h2 className="font-semibold text-slate-700 mb-3">My Listings</h2>
        <div className="space-y-2">
          {listings.map((p) => (
            <div key={p.id} className="bg-white rounded-xl2 border border-slate-100 p-3 flex items-center gap-3">
              <img src={p.image_url || 'https://via.placeholder.com/56'} alt={p.title} className="w-14 h-14 rounded-lg object-cover bg-slate-100" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 truncate">{p.title}</p>
                <p className="text-xs text-slate-400">{p.status} &middot; KES {Number(p.price).toLocaleString()}</p>
              </div>
              <button onClick={() => toggleStatus(p)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:border-brand-green">
                {p.status === 'ACTIVE' ? 'Pause' : 'Activate'}
              </button>
              <button onClick={() => removeListing(p.id)} className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50">
                Delete
              </button>
            </div>
          ))}
          {listings.length === 0 && <p className="text-slate-400 text-sm">No listings yet — click "Sell Item" to add one.</p>}
        </div>
      </div>

      {showWizard && (
        <SellWizard categories={categories} onClose={() => setShowWizard(false)} onCreated={loadAll} />
      )}
    </div>
  );
}
