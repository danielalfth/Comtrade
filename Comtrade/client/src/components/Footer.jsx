import { Package } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-bg-secondary/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-text-muted" />
            <span className="text-sm font-semibold text-text-secondary">
              Com<span className="text-text-muted">trade</span>
            </span>
          </div>
          <p className="text-xs text-text-muted text-center">
            © 2026 Comtrade — Marketplace Teknik Komputer UNDIP
          </p>
        </div>
      </div>
    </footer>
  );
}
