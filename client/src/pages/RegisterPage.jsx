import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/ui/Toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nama: '', nim: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama || !form.nim || !form.password) {
      toast('Semua field wajib diisi', 'error');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast('Password tidak cocok', 'error');
      return;
    }
    if (form.password.length < 6) {
      toast('Password minimal 6 karakter', 'error');
      return;
    }
    setLoading(true);
    try {
      await register(form.nama, form.nim, form.password);
      toast('Registrasi berhasil!', 'success');
      navigate('/');
    } catch (err) {
      toast(err.response?.data?.error || 'Registrasi gagal', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02),transparent_70%)]" />

      <div className="w-full max-w-sm relative animate-fade-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <Package size={28} className="text-white" />
            <span className="text-2xl font-bold">Com<span className="text-text-secondary">trade</span></span>
          </Link>
          <p className="text-sm text-text-muted">Buat akun baru</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Nama Lengkap</label>
            <input
              type="text"
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted transition-colors"
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">NIM</label>
            <input
              type="text"
              value={form.nim}
              onChange={(e) => setForm({ ...form, nim: e.target.value })}
              className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted transition-colors"
              placeholder="Masukkan NIM"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3 pr-10 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted transition-colors"
                placeholder="Minimal 6 karakter"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Konfirmasi Password</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted transition-colors"
              placeholder="Ulangi password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus size={16} />
                Daftar
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-text-muted mt-6">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-white font-medium hover:underline">
            Login di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
