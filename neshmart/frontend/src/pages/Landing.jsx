import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import Navbar from '../components/Navbar';
import RotatingBackground from '../components/RotatingBackground';
import Footer from '../components/Footer';

const KABIANGA_BG = 'https://i.postimg.cc/DfHkcTdd/Gemini-Generated-Image-fnfln6fnfln6fnfl.png';

const CAMPUSES = ['All', 'Main Campus', 'Kapkatet', 'Premier Hostels', 'Elite Hostels', 'Kabianga Center'];

const CATEGORIES = [
  'Electronics', 'Phones', 'Laptops', 'Furniture', 'Hostels', 'Fashion',
  'Hoodies', 'Shoes', 'Books', 'Revision Materials', 'Calculators',
  'Kitchen Items', 'Services', 'Tuition', 'Beauty', 'Gaming', 'Accessories', 'Others',
];

export default function Landing() {
  return (
    <div className="min-h-screen relative">
      <RotatingBackground />

      <div className="relative">
        <Navbar />

        <div className="bg-white/10 backdrop-blur-xl border-b border-white/20 px-4 py-2 flex items-center gap-2 justify-center text-center">
          <ShieldAlert size={16} className="text-brand-orange shrink-0" />
          <p className="text-xs sm:text-sm text-white/90">
            <strong>Safety First:</strong> Meet your seller at public areas such as the University Arches or Common Rooms.
            Never release funds before physically inspecting the item.
          </p>
        </div>

        <section className="max-w-5xl mx-auto px-4 py-16 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-5xl font-extrabold text-white leading-tight drop-shadow-sm"
          >
            The Smartest Way for <span className="text-brand-green">Kabianga Comrades</span> to{' '}
            <span className="text-brand-orange">Buy & Sell</span>
          </motion.h1>
          <p className="mt-4 text-white/80 max-w-xl mx-auto">
            Secure, student-to-student trading with M-Pesa escrow protection — your money is only released once you've
            confirmed your item in person.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              to="/marketplace"
              className="bg-brand-green text-white font-semibold px-6 py-3 rounded-full hover:bg-green-800 transition shadow"
            >
              Browse Marketplace
            </Link>
            <Link
              to="/dashboard/seller"
              className="bg-white/10 backdrop-blur-xl border border-brand-orange text-brand-orange font-semibold px-6 py-3 rounded-full hover:bg-white/20 transition"
            >
              Start Selling
            </Link>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 pb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CAMPUSES.map((c) => (
              <Link
                key={c}
                to={`/marketplace${c === 'All' ? '' : `?campus=${encodeURIComponent(c)}`}`}
                className="shrink-0 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-sm text-white/80 hover:border-brand-green hover:text-white transition"
              >
                {c}
              </Link>
            ))}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 pb-16">
          <h2 className="font-bold text-white/90 mb-3">Browse by category</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                to={`/marketplace?category=${encodeURIComponent(cat.toLowerCase().replace(/\s+/g, '-'))}`}
                className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-3 text-center text-xs font-medium text-white/80 hover:bg-white/20 hover:border-brand-green transition"
              >
                {cat}
              </Link>
            ))}
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
