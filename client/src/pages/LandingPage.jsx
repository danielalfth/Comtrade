import { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, TrendingUp, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';

export default function LandingPage({ searchQuery }) {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedCat) params.category_id = selectedCat;
      const res = await api.get('/products', { params });
      setProducts(res.data.products);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data.categories)).catch(() => { });
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, selectedCat]);

  const features = [
    { icon: <Sparkles size={20} />, title: 'Sesama Tekkom', desc: 'Jual beli antar mahasiswa Teknik Komputer' },
    { icon: <TrendingUp size={20} />, title: 'Harga Terjangkau', desc: 'Produk bekas & baru dengan harga mahasiswa' },
    { icon: <Shield size={20} />, title: 'Aman & Terpercaya', desc: 'Transaksi tercatat dengan invoice digital' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.03),transparent_70%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 relative">
          <div className="max-w-2xl mx-auto text-center space-y-6 animate-fade-in">

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
              Jual Beli
              <span className="block text-text-secondary">Sesama Tekkom</span>
            </h1>
            <p className="text-text-muted text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
              Buku matkul, ganci, workshirt, dan berbagai kebutuhan mahasiswa Teknik Komputer. Semua ada di sini.
            </p>
            {!user && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-all hover:scale-105 active:scale-95"
                >
                  Mulai Sekarang
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/login"
                  className="px-6 py-3 text-text-secondary hover:text-white font-medium transition-colors"
                >
                  Sudah punya akun?
                </Link>
              </div>
            )}
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 stagger-children">
            {features.map((f, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-bg-secondary/60 border border-border hover:border-border-light transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-text-secondary group-hover:text-white group-hover:bg-white/10 transition-all mb-3">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-sm text-text-primary">{f.title}</h3>
                <p className="text-xs text-text-muted mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Catalog */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold">Katalog Produk</h2>
            <p className="text-sm text-text-muted mt-1">
              {products.length} produk tersedia
            </p>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCat('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!selectedCat ? 'bg-white text-black' : 'bg-bg-tertiary text-text-secondary hover:text-white border border-border'
                }`}
            >
              Semua
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedCat === cat.id ? 'bg-white text-black' : 'bg-bg-tertiary text-text-secondary hover:text-white border border-border'
                  }`}
              >
                {cat.nama_kategori}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden">
                <div className="aspect-square skeleton" />
                <div className="p-4 space-y-2 bg-bg-secondary border border-border border-t-0 rounded-b-2xl">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                  <div className="skeleton h-5 w-1/3 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-text-secondary font-medium">Tidak ada produk ditemukan</p>
            <p className="text-sm text-text-muted mt-1">Coba ubah kata kunci pencarian</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 stagger-children">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
