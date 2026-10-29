import React from 'react';
import { motion } from 'framer-motion';
import AvatarStack from './AvatarStack.jsx';
import { formatShortDate, formatVND } from '../lib/format.js';
import { getShare } from '../lib/data.js';
import { t } from '../lib/i18n.js';

export const CATEGORY_BG = { food: '#FFE0B8', go: '#CFE8FF', fun: '#E3D8FF', other: '#D8F5E6' };

export const categoryOf = expense => (CATEGORY_BG[expense.category] ? expense.category : 'other');

export default function ExpenseCard({ expense, me, members, index, onOpen }) {
  const category = categoryOf(expense);
  const share = getShare(expense, me.id);
  const participants = expense.splits
    .map(s => members.find(m => m.id === s.memberId))
    .filter(Boolean);
  const payer = members.find(m => m.id === expense.payerId);
  const iPaid = expense.payerId === me.id;

  return (
    <motion.button
      type="button"
      layout
      onClick={() => onOpen(expense)}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24, delay: Math.min(index, 8) * 0.05 }}
      whileHover={{ y: -4, rotate: -0.5 }}
      whileTap={{ scale: 0.97 }}
      className="card-surface flex w-full flex-col items-start px-[18px] py-4 text-left md:px-5 md:py-[18px]"
    >
      <div className="flex w-full items-center gap-2">
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-extrabold"
          style={{ background: CATEGORY_BG[category] }}
        >
          {t(`categories.${category}`)}
        </span>
        <span className="text-xs font-bold text-ink-soft">{formatShortDate(expense.date)}</span>
        <span className="flex-1" />
        <span className="text-[13px] font-extrabold text-ink-soft">{formatVND(expense.amount)}</span>
      </div>
      <div className="mt-2 line-clamp-2 font-display text-xl font-extrabold leading-[1.15] md:text-[22px]">
        {expense.note || t('detail.untitled')}
      </div>
      <div className="mt-3 flex w-full items-end gap-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <AvatarStack members={participants} />
          <span className="break-words text-xs font-extrabold text-ink-soft">
            {participants.length === members.length
              ? t('common.allGroup')
              : t('common.peopleCount', { n: participants.length })}
            {payer ? ` · ${iPaid ? t('card.iPaid') : t('card.paidBy', { name: payer.name })}` : ''}
          </span>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-extrabold text-ink-soft">{t('card.yourShare')}</div>
          {share > 0 ? (
            <div className="font-display text-xl font-extrabold text-brand md:text-[22px]">{formatVND(share)}</div>
          ) : (
            <div className="mt-1 text-xs font-extrabold text-[#8A86A8]">{t('card.notJoined')}</div>
          )}
        </div>
      </div>
    </motion.button>
  );
}
