import { Link } from 'react-router-dom';
import { ShoppingBag, Phone, MessageCircle, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white/70 backdrop-blur-2xl border-t border-white/40 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-brand-orange" size={20} />
            <span className="font-extrabold text-slate-700">
              <span className="text-brand-green">NESH</span><span className="text-brand-orange">MART</span>
            </span>
            <span className="text-xs text-slate-400 ml-2 hidden sm:inline">
              Kabianga's student marketplace
            </span>
          </div>

          <div className="flex gap-5 text-sm text-slate-500">
            <Link to="/marketplace" className="hover:text-brand-green transition">Marketplace</Link>
            <Link to="/auth?tab=register" className="hover:text-brand-green transition">Sign Up</Link>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-white/40">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500">
            <a href="tel:0716977134" className="flex items-center gap-1.5 hover:text-brand-green transition">
              <Phone size={14} /> 0716 977 134
            </a>
            <a
              href="https://wa.me/254704489205"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-brand-green transition"
            >
              <MessageCircle size={14} /> WhatsApp
            </a>
            <a href="mailto:kipkoechhzl396@gmail.com" className="flex items-center gap-1.5 hover:text-brand-green transition">
              <Mail size={14} /> kipkoechhzl396@gmail.com
            </a>
          </div>

          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} NESHMART. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
