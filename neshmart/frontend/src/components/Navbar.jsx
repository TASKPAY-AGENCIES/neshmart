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
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img
            src="https://i.postimg.cc/brsDbtfv/Gemini-Generated-Image-4jrsw44jrsw44jrs.png"
            alt="NESHMART"
            className="h-9 w-9 rounded-lg object-cover"
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
              className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-green/40"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          {user ? (
            <>
              <Link
                to={user.role === 'admin' ? '/admin' : '/dashboard/buyer'}
                className="text-sm font-medium text-slate-700 hover:text-brand-green px-3 py-2"
              >
                Hi, {user.full_name?.split(' ')[0]}
              </Link>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-red-500 px-3 py-2"
              >
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/auth?tab=login" className="text-sm font-semibold px-4 py-2 rounded-full hover:bg-slate-100">
                Login
              </Link>
              <Link
                to="/auth?tab=register"
                className="text-sm font-semibold px-4 py-2 rounded-full bg-brand-green text-white hover:bg-green-800 transition"
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
