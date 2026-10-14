import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useMedia } from '../hooks/useMedia.js';
import { t } from '../lib/i18n.js';

// Hộp thoại dùng chung: trượt lên từ đáy trên điện thoại, bật giữa màn hình
// trên desktop. Đóng bằng Esc, bấm nền hoặc nút X.
export default function Sheet({ open, onClose, label, size = 'md', children }) {
  const isDesktop = useMedia('(min-width: 768px)');

  useEffect(() => {
    if (!open) return undefined;
    const onKey = event => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  const maxWidth = size === 'lg' ? 'md:max-w-3xl' : size === 'sm' ? 'md:max-w-md' : 'md:max-w-xl';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-ink/55" onClick={onClose} aria-hidden="true" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className={`relative max-h-[94vh] w-full overflow-y-auto rounded-t-[36px] bg-canvas p-5 pb-8 md:rounded-[36px] md:p-6 ${maxWidth}`}
            initial={isDesktop ? { opacity: 0, scale: 0.88, y: 20 } : { y: '100%' }}
            animate={isDesktop ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
            exit={isDesktop ? { opacity: 0, scale: 0.92 } : { y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SheetHeader({ title, subtitle, onClose }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-display text-[32px] font-extrabold leading-[1.05]">{title}</h2>
        {subtitle && <p className="mt-1 text-sm font-bold text-ink-soft">{subtitle}</p>}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={t('common.closeAria')}
        className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-white shadow-chunk transition-transform hover:scale-105"
      >
        <X size={20} strokeWidth={3} />
      </button>
    </div>
  );
}
