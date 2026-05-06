import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ArchiveRestore, AlertTriangle, Upload, X, Package, History } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/ui/Toast';
import Modal from '../components/ui/Modal';

const ProductForm = ({ 
  onSubmit, submitLabel, form, setForm, preview, setPreview, 
  handleImageChange, categories, newCategory, setNewCategory, 
  handleAddCategory, formLoading 
}) => (
  <form onSubmit={onSubmit} className="space-y-4">
    {/* Image upload */}
    <div>
      <label className="block text-xs font-medium text-text-secondary mb-1.5">Foto Produk</label>
      <div className="relative">
        {preview ? (
          <div className="relative w-full h-40 rounded-xl overflow-hidden bg-bg-tertiary">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <button type="button" onClick={() => { setPreview(null); setForm({ ...form, image: null }); }}
              className="absolute top-2 right-2 p-1 rounded-lg bg-black/60 text-white hover:bg-black/80">
              <X size={14} />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-border hover:border-border-light cursor-pointer transition-colors bg-bg-tertiary/50">
            <Upload size={20} className="text-text-muted mb-1" />
            <span className="text-xs text-text-muted">Klik untuk upload</span>
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
        )}
      </div>
    </div>
    <div>
      <label className="block text-xs font-medium text-text-secondary mb-1.5">Nama Barang *</label>
      <input type="text" value={form.nama_barang} onChange={(e) => setForm({ ...form, nama_barang: e.target.value })}
        className="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary" placeholder="Contoh: Buku Fisika Dasar" />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1.5">Harga (Rp) *</label>
        <input type="number" value={form.harga} onChange={(e) => setForm({ ...form, harga: e.target.value })}
          className="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary" placeholder="25000" />
      </div>
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1.5">Stok</label>
        <input type="number" value={form.stok} onChange={(e) => setForm({ ...form, stok: e.target.value })}
          className="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary" placeholder="10" />
      </div>
    </div>
    <div>
      <label className="block text-xs font-medium text-text-secondary mb-1.5">Kategori</label>
      <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
        className="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary">
        <option value="">Pilih kategori</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.nama_kategori}</option>)}
      </select>
      <div className="flex gap-2 mt-2">
        <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
          className="flex-1 px-3 py-1.5 bg-bg-tertiary border border-border rounded-lg text-xs text-text-primary" placeholder="Kategori baru..." />
        <button type="button" onClick={handleAddCategory}
          className="px-3 py-1.5 text-xs font-medium bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors">Tambah</button>
      </div>
    </div>
    <button type="submit" disabled={formLoading}
      className="w-full py-2.5 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
      {formLoading ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : submitLabel}
    </button>
  </form>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('products');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form
  const [form, setForm] = useState({ nama_barang: '', harga: '', stok: '', category_id: '', image: null });
  const [preview, setPreview] = useState(null);
  const [newCategory, setNewCategory] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, salesRes, catRes] = await Promise.all([
        api.get('/products/mine'),
        api.get('/transactions/sales'),
        api.get('/categories'),
      ]);
      setProducts(prodRes.data.products);
      setSales(salesRes.data.transactions);
      setCategories(catRes.data.categories);
    } catch (err) {
      toast('Gagal memuat data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setForm({ nama_barang: '', harga: '', stok: '', category_id: '', image: null });
    setPreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, image: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!form.nama_barang || !form.harga) { toast('Nama dan harga wajib diisi', 'error'); return; }
    setFormLoading(true);
    try {
      const formData = new FormData();
      formData.append('nama_barang', form.nama_barang);
      formData.append('harga', form.harga);
      formData.append('stok', form.stok || 0);
      if (form.category_id) formData.append('category_id', form.category_id);
      if (form.image) formData.append('image', form.image);

      await api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast('Produk berhasil ditambahkan!', 'success');
      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast(err.response?.data?.error || 'Gagal menambahkan produk', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const formData = new FormData();
      formData.append('nama_barang', form.nama_barang);
      formData.append('harga', form.harga);
      formData.append('stok', form.stok);
      if (form.category_id) formData.append('category_id', form.category_id);
      if (form.image) formData.append('image', form.image);

      await api.put(`/products/${editingProduct.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast('Produk berhasil diperbarui!', 'success');
      setShowEditModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast(err.response?.data?.error || 'Gagal memperbarui produk', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setForm({
      nama_barang: product.nama_barang,
      harga: product.harga,
      stok: product.stok,
      category_id: product.category_id || '',
      image: null,
    });
    setPreview(product.image_url);
    setShowEditModal(true);
  };

  const handleDelete = async (type) => {
    try {
      await api.delete(`/products/${deletingProduct.id}?type=${type}`);
      toast(type === 'hard' ? 'Produk dihapus permanen' : 'Produk diarsipkan', 'success');
      setShowDeleteModal(false);
      setDeletingProduct(null);
      fetchData();
    } catch (err) {
      toast('Gagal menghapus produk', 'error');
    }
  };

  const handleRestore = async (id) => {
    try {
      await api.patch(`/products/${id}/restore`);
      toast('Produk dipulihkan!', 'success');
      fetchData();
    } catch (err) {
      toast('Gagal memulihkan produk', 'error');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      const res = await api.post('/categories', { nama_kategori: newCategory });
      setCategories([...categories, res.data.category]);
      setForm({ ...form, category_id: res.data.category.id });
      setNewCategory('');
      toast('Kategori ditambahkan!', 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'Gagal', 'error');
    }
  };

  const formatPrice = (p) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p);
  const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-text-muted mt-1">Halo, {user?.nama} 👋</p>
        </div>
        <button onClick={() => { resetForm(); setShowAddModal(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-black font-semibold text-sm rounded-xl hover:bg-gray-200 transition-all hover:scale-105 active:scale-95">
          <Plus size={16} /> Tambah Produk
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-bg-secondary rounded-xl border border-border mb-6 max-w-xs">
        {[{ key: 'products', label: 'Produk Saya', icon: <Package size={14} /> },
          { key: 'sales', label: 'Riwayat Penjualan', icon: <History size={14} /> }].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              tab === t.key ? 'bg-white text-black' : 'text-text-secondary hover:text-white'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Products Tab */}
      {tab === 'products' && (
        <div className="space-y-3">
          {products.length === 0 ? (
            <div className="text-center py-16 bg-bg-secondary rounded-2xl border border-border">
              <Package size={40} className="mx-auto text-text-muted/30 mb-3" />
              <p className="text-text-secondary font-medium">Belum ada produk</p>
              <p className="text-sm text-text-muted mt-1">Mulai jual barang kamu sekarang!</p>
            </div>
          ) : (
            <div className="bg-bg-secondary rounded-2xl border border-border overflow-hidden">
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-text-muted px-4 py-3">Produk</th>
                      <th className="text-left text-xs font-medium text-text-muted px-4 py-3">Kategori</th>
                      <th className="text-right text-xs font-medium text-text-muted px-4 py-3">Harga</th>
                      <th className="text-center text-xs font-medium text-text-muted px-4 py-3">Stok</th>
                      <th className="text-center text-xs font-medium text-text-muted px-4 py-3">Status</th>
                      <th className="text-right text-xs font-medium text-text-muted px-4 py-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {products.map((p) => (
                      <tr key={p.id} className={`hover:bg-hover/50 transition-colors ${p.deleted_at ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-bg-tertiary overflow-hidden flex-shrink-0">
                              {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> :
                                <div className="w-full h-full flex items-center justify-center text-lg">📦</div>}
                            </div>
                            <span className="text-sm font-medium text-text-primary truncate max-w-[200px]">{p.nama_barang}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-text-muted">{p.nama_kategori || '—'}</td>
                        <td className="px-4 py-3 text-sm font-medium text-text-primary text-right">{formatPrice(p.harga)}</td>
                        <td className="px-4 py-3 text-sm text-center text-text-secondary">{p.stok}</td>
                        <td className="px-4 py-3 text-center">
                          {p.deleted_at ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">Arsip</span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Aktif</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {p.deleted_at ? (
                              <button onClick={() => handleRestore(p.id)} className="p-1.5 rounded-lg text-text-muted hover:text-green-400 hover:bg-green-500/10 transition-colors" title="Pulihkan">
                                <ArchiveRestore size={14} />
                              </button>
                            ) : (
                              <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-hover transition-colors" title="Edit">
                                <Pencil size={14} />
                              </button>
                            )}
                            <button onClick={() => { setDeletingProduct(p); setShowDeleteModal(true); }}
                              className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Hapus">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-border">
                {products.map((p) => (
                  <div key={p.id} className={`p-4 ${p.deleted_at ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-bg-tertiary overflow-hidden flex-shrink-0">
                        {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> :
                          <div className="w-full h-full flex items-center justify-center text-xl">📦</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.nama_barang}</p>
                        <p className="text-xs text-text-muted">{formatPrice(p.harga)} · Stok: {p.stok}</p>
                      </div>
                      <div className="flex gap-1">
                        {p.deleted_at ? (
                          <button onClick={() => handleRestore(p.id)} className="p-2 rounded-lg hover:bg-green-500/10 text-text-muted hover:text-green-400"><ArchiveRestore size={16} /></button>
                        ) : (
                          <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-hover text-text-muted hover:text-white"><Pencil size={16} /></button>
                        )}
                        <button onClick={() => { setDeletingProduct(p); setShowDeleteModal(true); }} className="p-2 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sales Tab */}
      {tab === 'sales' && (
        <div>
          {sales.length === 0 ? (
            <div className="text-center py-16 bg-bg-secondary rounded-2xl border border-border">
              <History size={40} className="mx-auto text-text-muted/30 mb-3" />
              <p className="text-text-secondary font-medium">Belum ada transaksi penjualan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sales.map((s) => (
                <div key={s.id} className="bg-bg-secondary border border-border rounded-xl p-4 flex items-center gap-4 hover:border-border-light transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-bg-tertiary overflow-hidden flex-shrink-0">
                    {s.image_url ? <img src={s.image_url} alt="" className="w-full h-full object-cover" /> :
                      <div className="w-full h-full flex items-center justify-center">📦</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{s.nama_barang}</p>
                    <p className="text-xs text-text-muted">Pembeli: {s.buyer_nama} ({s.buyer_nim}) · {s.quantity}x</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-white">{formatPrice(s.total_harga)}</p>
                    <p className="text-[10px] text-text-muted">{formatDate(s.tanggal_transaksi)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Tambah Produk">
        <ProductForm 
          onSubmit={handleAddProduct} 
          submitLabel="Tambah Produk"
          form={form} setForm={setForm} preview={preview} setPreview={setPreview}
          handleImageChange={handleImageChange} categories={categories}
          newCategory={newCategory} setNewCategory={setNewCategory}
          handleAddCategory={handleAddCategory} formLoading={formLoading}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Produk">
        <ProductForm 
          onSubmit={handleEditProduct} 
          submitLabel="Simpan Perubahan"
          form={form} setForm={setForm} preview={preview} setPreview={setPreview}
          handleImageChange={handleImageChange} categories={categories}
          newCategory={newCategory} setNewCategory={setNewCategory}
          handleAddCategory={handleAddCategory} formLoading={formLoading}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Hapus Produk">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
            <AlertTriangle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-text-primary font-medium">{deletingProduct?.nama_barang}</p>
              <p className="text-xs text-text-muted mt-1">Pilih jenis penghapusan:</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleDelete('soft')}
              className="py-2.5 px-4 text-sm font-medium bg-bg-tertiary border border-border rounded-xl hover:bg-hover transition-colors text-text-secondary">
              Arsipkan
            </button>
            <button onClick={() => handleDelete('hard')}
              className="py-2.5 px-4 text-sm font-medium bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors text-red-400">
              Hapus Permanen
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
