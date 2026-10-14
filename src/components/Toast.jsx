import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function Toast({ toast }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          role="status"
          initial={{ opacity: 0, y: 30, scale: 0.85, x: '-50%' }}
          animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
          exit={{ opacity: 0, y: 20, x: '-50%' }}
          transition={{ type: 'spring', stiffness: 420, damping: 26 }}
          className={`fixed bottom-8 left-1/2 z-[60] whitespace-nowrap rounded-full px-6 py-3 text-sm font-extrabold text-white shadow-[0_8px_0_rgba(0,0,0,.15)] ${
            toast.type === 'error' ? 'bg-debt' : 'bg-ink'
          }`}
        >
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
