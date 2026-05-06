import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Printer, ArrowLeft, CheckCircle, Package, User, Calendar, Hash } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function InvoicePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await api.get(`/transactions/${id}/invoice`);
        setInvoice(res.data.invoice);
      } catch (err) {
        setError(err.response?.data?.error || 'Invoice tidak ditemukan');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  const formatPrice = (p) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p);
  const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary">{error}</p>
          <Link to="/" className="text-sm text-white underline mt-2 inline-block">Kembali</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Actions (hidden on print) */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link to="/" className="flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors">
          <ArrowLeft size={16} />
          Kembali
        </Link>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black font-semibold text-sm rounded-xl hover:bg-gray-200 transition-all"
        >
          <Printer size={14} />
          Cetak Invoice
        </button>
      </div>

      {/* Invoice Card */}
      <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden print:border-gray-300 print:bg-white print:text-black">
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-border print:border-gray-300 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 mb-4 print:bg-green-50">
            <CheckCircle size={28} className="text-green-400 print:text-green-600" />
          </div>
          <h1 className="text-xl font-bold print:text-black">Transaksi Berhasil</h1>
          <p className="text-sm text-text-muted mt-1 print:text-gray-500">Invoice bukti transaksi Comtrade</p>
        </div>

        {/* Invoice Details */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Transaction ID & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <Hash size={14} className="text-text-muted mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium">ID Transaksi</p>
                <p className="text-sm font-semibold mt-0.5">TXN-{String(invoice.transaction_id).padStart(6, '0')}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar size={14} className="text-text-muted mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Tanggal</p>
                <p className="text-sm font-medium mt-0.5">{formatDate(invoice.tanggal_transaksi)}</p>
              </div>
            </div>
          </div>

          {/* Buyer & Seller */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-bg-tertiary/50 rounded-xl print:bg-gray-50">
            <div className="flex items-start gap-2">
              <User size={14} className="text-text-muted mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Pembeli</p>
                <p className="text-sm font-semibold mt-0.5">{invoice.buyer_nama}</p>
                <p className="text-xs text-text-muted">{invoice.buyer_nim}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Package size={14} className="text-text-muted mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Penjual</p>
                <p className="text-sm font-semibold mt-0.5">{invoice.seller_nama}</p>
                <p className="text-xs text-text-muted">{invoice.seller_nim}</p>
              </div>
            </div>
          </div>

          {/* Product */}
          <div className="flex items-center gap-4 p-4 bg-bg-tertiary/50 rounded-xl print:bg-gray-50">
            <div className="w-14 h-14 rounded-lg bg-bg-tertiary overflow-hidden flex-shrink-0 print:bg-gray-200">
              {invoice.image_url ? (
                <img src={invoice.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{invoice.nama_barang}</p>
              <p className="text-xs text-text-muted mt-0.5">
                {formatPrice(invoice.harga_satuan)} × {invoice.quantity}
              </p>
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between pt-4 border-t border-border print:border-gray-300">
            <span className="text-sm text-text-secondary print:text-gray-600">Total Pembayaran</span>
            <span className="text-2xl font-black">{formatPrice(invoice.total_harga)}</span>
          </div>

          {/* Footer note */}
          <p className="text-[10px] text-text-muted text-center print:text-gray-400">
            Invoice ini adalah bukti transaksi digital. Harap simpan sebagai bukti pengambilan barang.
          </p>
        </div>
      </div>

      {/* Purchase History Link */}
      <div className="text-center mt-6 print:hidden">
        <Link to="/dashboard" className="text-sm text-text-muted hover:text-white transition-colors">
          Lihat riwayat transaksi →
        </Link>
      </div>
    </div>
  );
}
