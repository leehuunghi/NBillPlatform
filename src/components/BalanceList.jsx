import React from 'react';
import { motion } from 'framer-motion';
import Avatar from './Avatar.jsx';
import { formatVND } from '../lib/format.js';
import { t } from '../lib/i18n.js';

const EPS = 0.5;

// Ai đang nợ / dư bao nhiêu, xếp từ nợ nhiều nhất xuống người dư nhiều nhất.
export default function BalanceList({ members, balances, treasurer, meId, totalSpent, onlyDebtors, className = '' }) {
  const rows = members
    .filter(m => m.id !== treasurer?.id)
    .map(m => ({ member: m, balance: balances.get(m.id) || 0 }))
    .sort((a, b) => a.balance - b.balance);
  const maxAbs = Math.max(1, ...rows.map(r => Math.abs(r.balance)));

  return (
    <section className={`card-surface p-5 ${className}`}>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-display text-xl font-extrabold">{t('group.whoOwes')}</h3>
        {onlyDebtors ? (
          <button type="button" onClick={onlyDebtors} className="py-1.5 text-[13px] font-extrabold text-brand">
            {t('group.onlyDebtors')}
          </button>
        ) : (
          <span className="text-xs font-extrabold text-ink-soft">
            {t('group.total', { amount: formatVND(totalSpent) })}
          </span>
        )}
      </div>
      <ul className="mt-3.5 flex flex-col gap-3">
        {rows.map(({ member, balance }, i) => {
          const owes = balance < -EPS;
          const has = balance > EPS;
          const label = owes
            ? t('balance.owes', { amount: formatVND(-balance) })
            : has
              ? t('balance.surplus', { amount: formatVND(balance) })
              : t('balance.clear');
          const width = owes || has ? Math.max(6, (Math.abs(balance) / maxAbs) * 100) : 0;
          return (
            <li key={member.id} className="flex items-center gap-2.5">
              <Avatar member={member} size={34} />
              <div className="min-w-0 flex-1">
                <div className="flex justify-between text-[13px] font-extrabold">
                  <span className="truncate">
                    {member.name}
                    {member.id === meId ? t('common.youSuffix') : ''}
                  </span>
                  <span className={owes ? 'text-debt' : has ? 'text-pine' : 'text-ink-soft'}>{label}</span>
                </div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-[#EFEAFF]">
                  <motion.div
                    className="h-full origin-left rounded-full"
                    style={{ width: `${width}%`, background: owes ? '#F0568C' : '#2BB673' }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.1 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
