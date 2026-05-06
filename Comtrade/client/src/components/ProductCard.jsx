import { ShoppingCart, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from './ui/Toast';
import api from '../api/axios';

export default function ProductCard({ product, onCartUpdate }) {
  const { user } = useAuth();
  const isOwner = user && user.id === product.seller_id;

  const handleAddToCart = async () => {
    if (!user) {
      toast('Silahkan login terlebih dahulu', 'error');
      return;
    }
    if (isOwner) {
      toast('Tidak bisa membeli produk sendiri', 'error');
      return;
    }
    try {
      await api.post('/cart', { product_id: product.id, quantity: 1 });
      toast('Ditambahkan ke keranjang!', 'success');
      if (onCartUpdate) onCartUpdate();
    } catch (err) {
      toast(err.response?.data?.error || 'Gagal menambahkan ke keranjang', 'error');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="group bg-bg-secondary border border-border rounded-2xl overflow-hidden hover:border-border-light transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
      {/* Image */}
      <div className="aspect-square bg-bg-tertiary overflow-hidden relative">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.nama_barang}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl text-text-muted/30">📦</span>
          </div>
        )}
        {product.stok <= 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-sm font-semibold text-white/80 bg-black/50 px-3 py-1 rounded-full">Habis</span>
          </div>
        )}
        {product.nama_kategori && (
          <span className="absolute top-3 left-3 text-[10px] font-medium uppercase tracking-wider bg-black/60 backdrop-blur-sm text-text-secondary px-2 py-1 rounded-full border border-white/5">
            {product.nama_kategori}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-text-primary text-sm leading-tight line-clamp-2 group-hover:text-white transition-colors">
            {product.nama_barang}
          </h3>
          <div className="flex items-center gap-1.5 mt-1.5">
            <User size={12} className="text-text-muted" />
            <span className="text-xs text-text-muted truncate">{product.seller_nama}</span>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-lg font-bold text-white">{formatPrice(product.harga)}</p>
            <p className="text-[11px] text-text-muted">Stok: {product.stok}</p>
          </div>
          {product.stok > 0 && !isOwner && (
            <button
              onClick={handleAddToCart}
              className="p-2.5 rounded-xl bg-white text-black hover:bg-gray-200 transition-all duration-200 hover:scale-105 active:scale-95"
              title="Tambah ke keranjang"
            >
              <ShoppingCart size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
