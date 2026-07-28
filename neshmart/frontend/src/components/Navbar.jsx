import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  function handleSearch(e) {
    e.preventDefault();
    navigate(`/marketplace?search=${encodeURIComponent(query)}`);
  }

  return (
    <nav className="sticky top-0 z-40 bg-white/70 backdrop-blur-2xl border-b border-white/40 shadow-sm shadow-black/5">
      <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img
            src="https://i.postimg.cc/brsDbtfv/Gemini-Generated-Image-4jrsw44jrsw44jrs.png"
            alt="NESHMART"
            className="h-9 w-9 rounded-xl object-cover shadow-sm"
          />
          <span className="text-xl font-extrabold">
            <span className="text-brand-green">NESH</span>
            <span className="text-brand-orange">MART</span>
          </span>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 hidden sm:block">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search subwoofers, revision materials, hoodies..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-white/60 bg-white/60 backdrop-blur-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-brand-green/40 transition"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          {user ? (
            <>
              <Link
                to={user.role === 'admin' ? '/admin' : '/dashboard/buyer'}
                className="text-sm font-medium text-slate-700 hover:text-brand-green px-3 py-2 rounded-full hover:bg-white/60 transition"
              >
                Hi, {user.full_name?.split(' ')[0]}
              </Link>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-red-500 px-3 py-2 rounded-full hover:bg-white/60 transition"
              >
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/auth?tab=login" className="text-sm font-semibold px-4 py-2 rounded-full hover:bg-white/60 transition">
                Login
              </Link>
              <Link
                to="/auth?tab=register"
                className="text-sm font-semibold px-4 py-2 rounded-full bg-gradient-to-r from-brand-green to-green-700 text-white shadow-md shadow-green-900/20 hover:shadow-lg hover:scale-[1.03] transition"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
              }
