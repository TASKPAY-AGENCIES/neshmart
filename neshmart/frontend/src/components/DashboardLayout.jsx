import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, LayoutDashboard, Package, ShieldCheck, LogOut, Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const KABIANGA_BG = 'https://i.postimg.cc/DfHkcTdd/Gemini-Generated-Image-fnfln6fnfln6fnfl.png';

export default function DashboardLayout({ title, subtitle, tabs, activeTab, onTabChange, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  const navLinks = [
    { label: 'Marketplace', icon: Store, to: '/marketplace' },
    { label: 'Buyer Dashboard', icon: LayoutDashboard, to: '/dashboard/buyer' },
    { label: 'Seller Dashboard', icon: Package, to: '/dashboard/seller' },
  ];
  if (user?.role === 'admin') {
    navLinks.push({ label: 'Admin Panel', icon: ShieldCheck, to: '/admin' });
  }

  return (
    <div className="min-h-screen relative">
      {/* Blurred background image */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${KABIANGA_BG})`, filter: 'blur(6px) brightness(0.6)', transform: 'scale(1.08)' }}
      />
      <div className="fixed inset-0 bg-slate-900/40" />

      <div className="relative flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col bg-white/10 backdrop-blur-2xl border-r border-white/20 p-4">
          <Link to="/" className="flex items-center gap-2 px-2 py-3 mb-4">
            <ShoppingBag className="text-brand-orange" size={24} />
            <span className="text-lg font-extrabold text-white">
              NESH<span className="text-brand-orange">MART</span>
            </span>
          </Link>

          <nav className="flex-1 space-y-1">
            {navLinks.map(({ label, icon: Icon, to }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/80 hover:bg-white/15 hover:text-white transition"
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </nav>

          {tabs && (
            <div className="mt-4 pt-4 border-t border-white/15 space-y-1">
              <p className="px-3 text-[11px] uppercase tracking-wide text-white/50 mb-1">Sections</p>
              {tabs.map((t) => (
                <button
                  key={t}
                  onClick={() => onTabChange?.(t)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition ${
                    activeTab === t ? 'bg-white/25 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-white/15">
            <p className="px-3 text-sm font-semibold text-white truncate">{user?.full_name}</p>
            <p className="px-3 text-xs text-white/50 truncate mb-2">{user?.email}</p>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/70 hover:bg-red-500/20 hover:text-white transition"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white drop-shadow-sm">{title}</h1>
              {subtitle && <p className="text-white/70 text-sm mt-1">{subtitle}</p>}
            </div>

            {/* Mobile tab strip (sidebar hidden on small screens) */}
            {tabs && (
              <div className="md:hidden flex gap-2 overflow-x-auto pb-3 mb-4">
                {tabs.map((t) => (
                  <button
                    key={t}
                    onClick={() => onTabChange?.(t)}
                    className={`shrink-0 px-4 py-1.5 rounded-full text-sm border transition ${
                      activeTab === t
                        ? 'bg-white text-slate-800 border-white'
                        : 'bg-white/10 text-white border-white/30'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
