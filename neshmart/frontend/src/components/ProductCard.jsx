import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MessageCircle, Heart, BadgeCheck, MapPin, Eye, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ProductCard({ product, onWishlist }) {
  const { addToCart, isInCart } = useCart();
  const whatsappLink = product.whatsapp_number
    ? `https://wa.me/${product.whatsapp_number}?text=${encodeURIComponent(`Hi, is "${product.title}" still available on NESHMART?`)}`
    : null;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-xl2 shadow-sm hover:shadow-md transition overflow-hidden border border-slate-100 flex flex-col"
    >
      <div className="relative aspect-square bg-slate-100">
        {product.image_url ? (
          <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-sm">No image</div>
        )}
        <button
          onClick={() => onWishlist?.(product.id)}
          className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 shadow hover:text-red-500"
          aria-label="Add to wishlist"
        >
          <Heart size={16} />
        </button>
        <span className="absolute bottom-2 left-2 bg-slate-900/70 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
          <MapPin size={10} /> {product.campus_location}
        </span>
      </div>

      <div className="p-3 flex flex-col gap-1 flex-1">
        <div className="flex items-center gap-1">
          <h3 className="font-semibold text-sm text-slate-800 line-clamp-1">{product.title}</h3>
          {product.seller_verified && <BadgeCheck size={14} className="text-brand-green shrink-0" />}
        </div>
        <p className="text-xs text-slate-400">{product.category_name} &middot; {product.condition}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="font-bold text-brand-green">KES {Number(product.price).toLocaleString()}</span>
          <span className="text-[10px] text-slate-400">{timeAgo(product.created_at)}</span>
        </div>
        <p className="text-[11px] text-slate-400">{product.quantity} available</p>
<div className="mt-2 flex gap-2">
          <Link
            to={`/product/${product.id}`}
            className="flex-1 flex items-center justify-center gap-1 bg-brand-orange text-white text-xs font-semibold py-2 rounded-lg hover:bg-orange-600 transition"
          >
            <Eye size={14} /> View Item
          </Link>
          {product.status !== 'SOLD' && (
            <button
              onClick={() => addToCart(product)}
              disabled={isInCart(product.id)}
              className="flex items-center justify-center gap-1 bg-brand-green text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-green-800 transition disabled:opacity-50"
            >
              <ShoppingCart size={14} /> {isInCart(product.id) ? 'Added' : 'Add'}
            </button>
          )}
          {product.status !== 'SOLD' && whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-1 bg-brand-green text-white text-xs font-semibold py-2 rounded-lg hover:bg-green-800 transition"
            >
              <MessageCircle size={14} /> Chat
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
