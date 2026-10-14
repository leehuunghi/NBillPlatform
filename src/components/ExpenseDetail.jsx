import React from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2 } from 'lucide-react';
import Avatar from './Avatar.jsx';
import { SheetHeader } from './Sheet.jsx';
import { CATEGORY_BG, categoryOf } from './ExpenseCard.jsx';
import { formatVND } from '../lib/format.js';
import { getShare } from '../lib/data.js';
import { t } from '../lib/i18n.js';

export default function ExpenseDetail({ expense, me, members, canEdit, busy, onEdit, onDelete, onClose }) {
  const category = categoryOf(expense);
  const payer = members.find(m => m.id === expense.payerId);
  const creator = members.find(m => m.id === expense.createdBy);
  const myShare = me ? getShare(expense, me.id) : 0;
  const title = expense.note || t('detail.untitled');

  return (
    <div aria-label={t('detail.dialogAria')}>
      <SheetHeader
        title={title}
        subtitle={[
          t('detail.meta', {
            date: expense.date,
            payer: payer?.name || '?',
            n: expense.splits.length,
          }),
          creator ? t('detail.createdBy', { creator: creator.name }) : '',
        ]
          .filter(Boolean)
          .join(' · ')}
        onClose={onClose}
      />
      <div className="mt-3 flex items-center gap-3">
        <span className="rounded-full px-3 py-1 text-[13px] font-extrabold" style={{ background: CATEGORY_BG[category] }}>
          {t(`categories.${category}`)}
        </span>
        <span className="font-display text-[44px] font-extrabold leading-none text-brand">
          {formatVND(expense.amount)}
        </span>
      </div>

      {me && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`mt-4 flex items-center justify-between rounded-[24px] px-5 py-3.5 ${
            myShare > 0 ? 'bg-sun' : 'bg-[#E4DDFB]'
          }`}
        >
          {myShare > 0 ? (
            <>
              <span className="text-[15px] font-extrabold">{t('card.yourShare')}</span>
              <span className="font-display text-[28px] font-extrabold">{formatVND(myShare)}</span>
            </>
          ) : (
            <span className="text-sm font-extrabold">{t('detail.notJoined')}</span>
          )}
        </motion.div>
      )}

      <h3 className="mt-5 font-display text-xl font-extrabold">{t('detail.splitTitle')}</h3>
      <ul className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
        {expense.splits.map((split, i) => {
          const member = members.find(m => m.id === split.memberId);
          if (!member) return null;
          return (
            <motion.li
              key={`${split.memberId}-${i}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.04 }}
              className={`flex items-center gap-2.5 rounded-[20px] py-2 pl-2.5 pr-3.5 ${
                me && member.id === me.id ? 'bg-[#FFF3B8]' : 'bg-white'
              }`}
            >
              <Avatar member={member} size={38} />
              <span className="flex-1 truncate text-sm font-extrabold">
                {member.name}
                {me && member.id === me.id ? t('common.youSuffix') : ''}
              </span>
              <span className="font-display text-[17px] font-extrabold">{formatVND(split.amount)}</span>
            </motion.li>
          );
        })}
      </ul>

      {canEdit ? (
        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={onEdit}
            disabled={busy}
            className="chunk-btn h-[52px] flex-1 bg-white text-[15px]"
          >
            <Pencil size={18} strokeWidth={2.6} />
            {t('detail.edit')}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="chunk-btn h-[52px] flex-1 bg-[#FFD6DC] text-[15px] text-[#9B1C3A]"
          >
            <Trash2 size={18} strokeWidth={2.6} />
            {t('detail.delete')}
          </button>
        </div>
      ) : (
        <p className="mt-4 text-center text-[13px] font-bold text-ink-soft">{t('detail.onlyCreator')}</p>
      )}
    </div>
  );
}
