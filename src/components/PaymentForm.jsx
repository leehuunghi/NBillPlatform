import React, { useState } from 'react';
import Avatar from './Avatar.jsx';
import { SheetHeader } from './Sheet.jsx';
import { digitsOnly, formatNumberInput, formatVND } from '../lib/format.js';
import { t } from '../lib/i18n.js';

// Admin ghi nhận 1 khoản thanh toán: bạn đó trả cho admin (giảm nợ) hoặc
// admin hoàn lại cho bạn đó (giảm số dư dương). Số tiền gợi ý = đúng số còn nợ/dư.
export default function PaymentForm({ members, balances, payment, defaultMemberId, saving, onSubmit, onDelete, onClose }) {
  const suggest = (memberId, type) => {
    const balance = balances.get(memberId) || 0;
    const value = type === 'pay' ? Math.max(0, -balance) : Math.max(0, balance);
    return value > 0 ? String(Math.round(value)) : '';
  };

  const startMember = payment?.memberId || defaultMemberId || members[0]?.id || null;
  const startType = payment?.type || ((balances.get(startMember) || 0) > 0 ? 'receive' : 'pay');
  const [form, setForm] = useState({
    memberId: startMember,
    type: startType,
    amount: payment ? String(payment.amount) : suggest(startMember, startType),
    note: payment?.note || '',
  });
  const [error, setError] = useState('');

  const patch = (next, resuggest) => {
    setError('');
    setForm(prev => {
      const merged = { ...prev, ...next };
      if (resuggest && !payment) merged.amount = suggest(merged.memberId, merged.type);
      return merged;
    });
  };

  const balance = balances.get(form.memberId) || 0;
  const typeOptions = [
    { value: 'pay', label: t('admin.paymentPay') },
    { value: 'receive', label: t('admin.paymentReceive') },
  ];

  const submit = () => {
    const amount = Number(form.amount);
    if (!amount || amount <= 0) return setError(t('admin.paymentErrAmount'));
    onSubmit({ id: payment?.id, memberId: form.memberId, amount, type: form.type, note: form.note });
  };

  return (
    <div>
      <SheetHeader title={payment ? t('admin.paymentEditTitle') : t('admin.paymentTitle')} onClose={onClose} />

      <h3 className="mt-4 font-display text-xl font-extrabold">{t('admin.paymentMember')}</h3>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {members.map(m => (
          <button
            key={m.id}
            type="button"
            onClick={() => patch({ memberId: m.id }, true)}
            aria-pressed={form.memberId === m.id}
            className={`flex h-11 items-center gap-2 rounded-full pl-2 pr-3.5 text-sm font-extrabold ${
              form.memberId === m.id ? 'bg-ink text-white' : 'bg-white'
            }`}
          >
            <Avatar member={m} size={26} ring={0} />
            {m.name}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[13px] font-bold text-ink-soft">
        {balance < -0.5
          ? t('balance.owes', { amount: formatVND(-balance) })
          : balance > 0.5
            ? t('balance.surplus', { amount: formatVND(balance) })
            : t('balance.clear')}
      </p>

      <h3 className="mt-3.5 font-display text-xl font-extrabold">{t('admin.paymentType')}</h3>
      <div className="mt-1.5 flex gap-1 rounded-full bg-white p-1.5">
        {typeOptions.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => patch({ type: option.value }, true)}
            className={`h-11 flex-1 rounded-full px-2 text-[13px] font-extrabold ${
              form.type === option.value ? 'bg-ink text-white' : 'text-ink-soft'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <label htmlFor="pay-amount" className="mt-3.5 block text-[13px] font-extrabold text-ink-soft">
        {t('admin.paymentAmount')}
      </label>
      <input
        id="pay-amount"
        type="text"
        inputMode="numeric"
        value={formatNumberInput(form.amount)}
        onChange={event => patch({ amount: digitsOnly(event.target.value) })}
        placeholder={t('add.amountPlaceholder')}
        className="input-field mt-1.5 h-[60px] font-display text-3xl text-brand"
      />

      <label htmlFor="pay-note" className="mt-3.5 block text-[13px] font-extrabold text-ink-soft">
        {t('admin.paymentNote')}
      </label>
      <input
        id="pay-note"
        type="text"
        value={form.note}
        onChange={event => patch({ note: event.target.value })}
        className="input-field mt-1.5 h-12"
      />

      {error && (
        <p role="alert" className="mt-2.5 text-center text-[13px] font-extrabold text-debt">
          {error}
        </p>
      )}

      <div className="mt-4 flex gap-2.5">
        {payment && (
          <button
            type="button"
            onClick={onDelete}
            disabled={saving}
            className="chunk-btn h-[58px] bg-[#FFD6DC] px-5 text-[15px] text-[#9B1C3A]"
          >
            {t('admin.paymentDelete')}
          </button>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="h-[58px] flex-1 rounded-full bg-brand font-display text-xl font-extrabold text-white shadow-chunk-lg transition-transform hover:scale-[1.02] active:translate-y-0.5 disabled:opacity-60"
        >
          {saving ? t('common.saving') : t('admin.paymentSave')}
        </button>
      </div>
    </div>
  );
}
