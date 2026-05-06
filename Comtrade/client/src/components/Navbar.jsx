import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Search, LogOut, LayoutDashboard, User, Menu, X, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Navbar({ onSearch }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchVal, setSearchVal] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);
  const debounceRef = useRef(null);

  // Fetch cart count
  useEffect(() => {
    if (user) {
      api.get('/cart').then(res => setCartCount(res.data.items?.length || 0)).catch(() => {});
    }
  }, [user, location]);

  // Search debounce
  useEffect(() => {
    if (onSearch) {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onSearch(searchVal), 300);
    }
    return () => clearTimeout(debounceRef.current);
  }, [searchVal, onSearch]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowMenu(false);
  };

  const isLanding = location.pathname === '/';

  return (
    <nav className="glass sticky top-0 z-50 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <Package size={24} className="text-white group-hover:scale-110 transition-transform" />
            <span className="text-xl font-bold tracking-tight text-white">
              Com<span className="text-text-secondary">trade</span>
            </span>
          </Link>

          {/* Search (desktop) */}
          {isLanding && (
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Cari produk atau penjual..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:border-text-secondary transition-colors"
                />
              </div>
            </div>
          )}

          {/* Right side (desktop) */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to="/cart"
                  className="relative p-2 rounded-xl hover:bg-hover transition-colors text-text-secondary hover:text-white"
                >
                  <ShoppingCart size={20} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-black text-xs font-bold rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>

                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-hover transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-white/10 border border-border flex items-center justify-center">
                      <User size={14} className="text-text-secondary" />
                    </div>
                    <span className="text-sm font-medium text-text-primary max-w-[120px] truncate">{user.nama}</span>
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-bg-secondary border border-border rounded-xl shadow-2xl animate-slide-down overflow-hidden">
                      <Link
                        to="/dashboard"
                        onClick={() => setShowMenu(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-text-secondary hover:text-white hover:bg-hover transition-colors"
                      >
                        <LayoutDashboard size={16} />
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-hover transition-colors border-t border-border"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium bg-white text-black rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-hover transition-colors text-text-secondary"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile search */}
        {isLanding && (
          <div className="md:hidden pb-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted"
              />
            </div>
          </div>
        )}

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 animate-slide-down border-t border-border pt-3 space-y-1">
            {user ? (
              <>
                <div className="px-3 py-2 text-sm text-text-muted">Halo, {user.nama}</div>
                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-hover">
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
                <Link to="/cart" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-hover">
                  <ShoppingCart size={16} /> Keranjang {cartCount > 0 && `(${cartCount})`}
                </Link>
                <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-hover">
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-hover">Login</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-white bg-white/10 hover:bg-white/20 text-center">Daftar</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
