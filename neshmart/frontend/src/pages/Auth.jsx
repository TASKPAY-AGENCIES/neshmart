import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BadgeCheck } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Auth() {
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') === 'register' ? 'register' : 'login');
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const isStudentEmail = form.email.toLowerCase().endsWith('@uo-kabianga.ac.ke');

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'register') {
        const { data } = await api.post('/auth/register', form);
        login(data.token, data.user);
      } else {
        const { data } = await api.post('/auth/login', { email: form.email, password: form.password });
        login(data.token, data.user);
      }
      navigate('/marketplace');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slatebg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl2 shadow-lg w-full max-w-md p-8"
      >
        <div className="flex justify-center mb-4">
          <img
            src="https://i.postimg.cc/brsDbtfv/Gemini-Generated-Image-4jrsw44jrsw44jrs.png"
            alt="NESHMART"
            className="h-16 w-16 rounded-2xl object-cover shadow-md"
          />
        </div>
        <h1 className="text-center font-extrabold text-2xl mb-6">
          <span className="text-brand-green">NESH</span><span className="text-brand-orange">MART</span>
        </h1>

        <div className="flex bg-slate-100 rounded-full p-1 mb-6">
          {['login', 'register'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-full text-sm font-semibold capitalize transition ${
                tab === t ? 'bg-white shadow text-brand-green' : 'text-slate-500'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.form
            key={tab}
            initial={{ opacity: 0, x: tab === 'login' ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            className="space-y-3"
          >
            {tab === 'register' && (
              <>
                <input
                  required placeholder="Full Name" value={form.fullName}
                  onChange={(e) => update('fullName', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40"
                />
                <input
                  required placeholder="Phone (2547XXXXXXXX)" value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40"
                />
              </>
            )}
            <div className="relative">
              <input
                required type="email" placeholder="Email Address" value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40"
              />
              {tab === 'register' && isStudentEmail && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-brand-green text-[10px] font-semibold">
                  <BadgeCheck size={14} /> Verified Student
                </span>
              )}
            </div>
            <input
              required type="password" placeholder="Password" value={form.password}
              onChange={(e) => update('password', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40"
            />
            {tab === 'register' && (
              <input
                required type="password" placeholder="Confirm Password" value={form.confirmPassword}
                onChange={(e) => update('confirmPassword', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40"
              />
            )}

            {error && <p className="text-red-500 text-xs">{error}</p>}

            <button
              disabled={loading}
              className="w-full bg-brand-green text-white font-semibold py-2.5 rounded-lg hover:bg-green-800 transition disabled:opacity-50"
            >
              {loading ? 'Please wait...' : tab === 'login' ? 'Login' : 'Create Account'}
            </button>
          </motion.form>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
