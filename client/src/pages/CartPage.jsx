import { useState, useEffect } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { toast } from '../components/ui/Toast';

export default function CartPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cart');
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      toast('Gagal memuat keranjang', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCart(); }, []);

  const updateQty = async (id, quantity) => {
    if (quantity < 1) return;
    try {
      await api.put(`/cart/${id}`, { quantity });
      fetchCart();
    } catch (err) {
      toast(err.response?.data?.error || 'Gagal update', 'error');
    }
  };

  const removeItem = async (id) => {
    try {
      await api.delete(`/cart/${id}`);
      toast('Item dihapus dari keranjang', 'success');
      fetchCart();
    } catch (err) {
      toast('Gagal menghapus item', 'error');
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setCheckoutLoading(true);
    try {
      const res = await api.post('/transactions/checkout');
      toast('Checkout berhasil!', 'success');
      const firstTxId = res.data.transactions[0]?.id;
      if (firstTxId) {
        navigate(`/invoice/${firstTxId}`);
      } else {
        navigate('/');
      }
    } catch (err) {
      toast(err.response?.data?.error || 'Checkout gagal', 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const formatPrice = (p) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link to="/" className="p-2 rounded-xl hover:bg-hover transition-colors text-text-secondary hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Keranjang</h1>
          <p className="text-sm text-text-muted">{items.length} item</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag size={48} className="mx-auto text-text-muted/30 mb-4" />
          <p className="text-text-secondary font-medium">Keranjang kamu kosong</p>
          <p className="text-sm text-text-muted mt-1 mb-6">Mulai belanja dan tambahkan produk ke keranjang</p>
          <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black font-semibold text-sm rounded-xl hover:bg-gray-200 transition-all">
            Jelajahi Produk
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Cart items */}
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="bg-bg-secondary border border-border rounded-xl p-4 flex gap-4 hover:border-border-light transition-colors">
                {/* Image */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-bg-tertiary overflow-hidden flex-shrink-0">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.nama_barang} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary truncate">{item.nama_barang}</h3>
                    <p className="text-xs text-text-muted mt-0.5">Penjual: {item.seller_nama}</p>
                    <p className="text-sm font-medium text-text-secondary mt-1">{formatPrice(item.harga)}</p>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQty(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-7 h-7 rounded-lg bg-bg-tertiary border border-border flex items-center justify-center hover:bg-hover disabled:opacity-30 transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stok}
                        className="w-7 h-7 rounded-lg bg-bg-tertiary border border-border flex items-center justify-center hover:bg-hover disabled:opacity-30 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Subtotal + Delete */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-white">{formatPrice(item.harga * item.quantity)}</span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Checkout summary */}
          <div className="bg-bg-secondary border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Total ({items.length} item)</span>
              <span className="text-xl font-bold text-white">{formatPrice(total)}</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="w-full py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
            >
              {checkoutLoading ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <ShoppingBag size={16} />
                  Bayar Sekarang
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
