import React from 'react';
import { motion } from 'framer-motion';
import Avatar from './Avatar.jsx';
import { SheetHeader } from './Sheet.jsx';
import { formatVND } from '../lib/format.js';
import { t } from '../lib/i18n.js';

// Danh sách người đang thiếu tiền, xếp từ thiếu nhiều tới ít.
export default function DebtorsSheet({ rows, meId, total, onClose }) {
  const max = rows[0]?.amount || 1;
  return (
    <div aria-label={t('debtors.dialogAria')}>
      <SheetHeader
        title={t('debtors.title')}
        subtitle={t('debtors.subtitle', { amount: formatVND(total) })}
        onClose={onClose}
      />
      <ol className="mt-4 flex flex-col gap-2.5">
        {rows.map(({ member, amount }, i) => (
          <motion.li
            key={member.id}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.05 + i * 0.05 }}
            className={`flex items-center gap-2.5 rounded-3xl py-3 pl-2.5 pr-4 ${
              member.id === meId ? 'bg-[#FFF3B8]' : 'bg-white'
            }`}
          >
            <span className={`w-6 text-center font-display text-lg font-extrabold ${i === 0 ? 'text-debt' : 'text-ink-soft'}`}>
              {i + 1}
            </span>
            <Avatar member={member} size={44} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="min-w-0 break-words text-base font-extrabold leading-tight">
                  {member.name}
                  {member.id === meId ? t('common.youSuffix') : ''}
                </span>
                <span className="font-display text-xl font-extrabold text-debt">{formatVND(amount)}</span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[#FDE3EC]">
                <motion.div
                  className="h-full origin-left rounded-full bg-rose"
                  style={{ width: `${Math.max(6, (amount / max) * 100)}%` }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
          </motion.li>
        ))}
      </ol>
      {rows.length === 0 && (
        <motion.p
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-6 rounded-[28px] bg-[#D8F5E6] p-6 text-center font-display text-[22px] font-extrabold"
        >
          {t('debtors.empty')}
        </motion.p>
      )}
    </div>
  );
}
