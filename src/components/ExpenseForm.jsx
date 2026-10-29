import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Repeat } from 'lucide-react';
import Avatar from './Avatar.jsx';
import { SheetHeader } from './Sheet.jsx';
import { CATEGORY_BG } from './ExpenseCard.jsx';
import { digitsOnly, formatNumberInput, formatVND, todayISO } from '../lib/format.js';
import { splitEqually } from '../lib/data.js';
import { t } from '../lib/i18n.js';

const CATEGORIES = ['food', 'go', 'fun', 'other'];

const isEqualSplit = expense => {
  const equal = splitEqually(expense.amount, expense.splits.map(s => s.memberId));
  return equal.every((s, i) => s.amount === expense.splits[i].amount);
};

const initialState = (members, me, expense) => {
  if (!expense) {
    return {
      note: '',
      amount: '',
      payerId: me?.id || members[0]?.id || null,
      date: todayISO(),
      category: 'food',
      participants: members.map(m => m.id),
      mode: 'equal',
      custom: {},
    };
  }
  const equal = isEqualSplit(expense);
  return {
    note: expense.note || '',
    amount: String(expense.amount),
    payerId: expense.payerId,
    date: expense.date || todayISO(),
    category: expense.category || 'other',
    participants: expense.splits.map(s => s.memberId),
    mode: equal ? 'equal' : 'custom',
    custom: Object.fromEntries(expense.splits.map(s => [s.memberId, String(s.amount)])),
  };
};

const Segmented = ({ options, value, onChange }) => (
  <div className="flex gap-1 rounded-full bg-white p-1.5">
    {options.map(option => (
      <button
        key={option.value}
        type="button"
        onClick={() => onChange(option.value)}
        className="relative h-11 flex-1 rounded-full text-[15px] font-extrabold"
      >
        {value === option.value && (
          <motion.span
            layoutId="segmented-active"
            className="absolute inset-0 rounded-full bg-ink"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
        <span className={`relative ${value === option.value ? 'text-white' : 'text-ink-soft'}`}>{option.label}</span>
      </button>
    ))}
  </div>
);

export default function ExpenseForm({ members, me, expense, saving, onSubmit, onClose }) {
  const [form, setForm] = useState(() => initialState(members, me, expense));
  const [error, setError] = useState('');
  const [payerOpen, setPayerOpen] = useState(false);
  const set = patch => {
    setError('');
    setForm(prev => ({ ...prev, ...patch }));
  };

  const participants = useMemo(
    () => members.filter(m => form.participants.includes(m.id)),
    [members, form.participants]
  );
  const custom = form.mode === 'custom';
  const customSum = participants.reduce((sum, m) => sum + (Number(form.custom[m.id]) || 0), 0);
  const total = custom ? customSum : Number(form.amount) || 0;

  const splits = useMemo(() => {
    if (custom) return participants.map(m => ({ memberId: m.id, amount: Number(form.custom[m.id]) || 0 }));
    return splitEqually(Number(form.amount) || 0, participants.map(m => m.id));
  }, [custom, participants, form.custom, form.amount]);

  const payer = members.find(m => m.id === form.payerId) || null;
  const allSelected = form.participants.length === members.length;
  const perPerson = participants.length ? total / participants.length : 0;

  const toggleParticipant = id =>
    set({
      participants: form.participants.includes(id)
        ? form.participants.filter(p => p !== id)
        : [...form.participants, id],
    });

  const submit = () => {
    if (saving) return;
    if (participants.length === 0) return setError(t('add.errPeople'));
    if (total <= 0) return setError(t('add.errAmount'));
    if (custom && Number(form.amount) > 0 && customSum !== Number(form.amount)) return setError(t('add.errSplit'));
    onSubmit({
      id: expense?.id,
      amount: total,
      payerId: form.payerId,
      splits: splits.filter(s => s.amount > 0 || !custom),
      note: form.note,
      category: form.category,
      date: form.date,
    });
  };

  return (
    <div>
      <SheetHeader title={expense ? t('add.editTitle') : t('add.title')} onClose={onClose} />

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-3.5 md:grid-cols-2">
        <div className="card-surface p-[18px]">
          <label htmlFor="exp-note" className="text-[13px] font-extrabold text-ink-soft">
            {t('add.whatLabel')}
          </label>
          <input
            id="exp-note"
            type="text"
            value={form.note}
            onChange={event => set({ note: event.target.value })}
            placeholder={t('add.whatPlaceholder')}
            className="input-field mt-1.5 h-[50px] text-[17px]"
          />

          {!custom && (
            <>
              <label htmlFor="exp-amount" className="mt-3.5 block text-[13px] font-extrabold text-ink-soft">
                {t('add.amountLabel')}
              </label>
              <input
                id="exp-amount"
                type="text"
                inputMode="numeric"
                value={formatNumberInput(form.amount)}
                onChange={event => set({ amount: digitsOnly(event.target.value) })}
                placeholder={t('add.amountPlaceholder')}
                className="input-field mt-1.5 h-[60px] font-display text-3xl text-brand"
              />
            </>
          )}

          <label htmlFor="exp-date" className="mt-3.5 block text-[13px] font-extrabold text-ink-soft">
            {t('add.dateLabel')}
          </label>
          <input
            id="exp-date"
            type="date"
            value={form.date}
            onChange={event => set({ date: event.target.value })}
            className="input-field mt-1.5 h-[46px]"
          />

          <div className="mt-3.5 flex flex-wrap gap-2">
            {CATEGORIES.map(key => (
              <button
                key={key}
                type="button"
                onClick={() => set({ category: key })}
                aria-pressed={form.category === key}
                className="h-10 rounded-full px-4 text-sm font-extrabold transition-shadow"
                style={{
                  background: CATEGORY_BG[key],
                  boxShadow: form.category === key ? '0 0 0 3px #1E1B3A' : 'none',
                }}
              >
                {t(`categories.${key}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <Segmented
            value={form.mode}
            onChange={mode => set({ mode })}
            options={[
              { value: 'equal', label: t('add.modeEqual') },
              { value: 'custom', label: t('add.modeCustom') },
            ]}
          />

          <h3 className="mt-3.5 font-display text-xl font-extrabold">{t('add.payerLabel')}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {payerOpen ? (
              members.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    set({ payerId: m.id });
                    setPayerOpen(false);
                  }}
                  aria-pressed={form.payerId === m.id}
                  className={`flex h-11 flex-none items-center gap-2 rounded-full py-0 pl-2 pr-3.5 text-sm font-extrabold ${
                    form.payerId === m.id ? 'bg-brand text-white' : 'bg-white'
                  }`}
                >
                  <Avatar member={m} size={26} ring={0} />
                  {m.name}
                </button>
              ))
            ) : (
              <>
                {payer && (
                  <span className="flex h-11 min-w-0 items-center gap-2 rounded-full bg-brand py-0 pl-2 pr-4 text-sm font-extrabold text-white">
                    <Avatar member={payer} size={26} ring={0} />
                    <span className="whitespace-nowrap">
                      {payer.name}
                      {me && payer.id === me.id ? t('common.youSuffix') : ''}
                    </span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setPayerOpen(true)}
                  aria-expanded={payerOpen}
                  className="flex h-11 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-extrabold text-brand"
                >
                  <Repeat size={15} strokeWidth={2.6} />
                  {t('add.changePayer')}
                </button>
              </>
            )}
          </div>

          <div className="mt-3.5 flex items-baseline justify-between">
            <h3 className="font-display text-xl font-extrabold">{t('add.whoTitle')}</h3>
            <button
              type="button"
              onClick={() => set({ participants: allSelected ? [] : members.map(m => m.id) })}
              className="py-2 text-[13px] font-extrabold text-brand"
            >
              {allSelected ? t('add.clearAll') : t('add.selectAll')}
            </button>
          </div>
          <div className="mt-1 flex flex-wrap gap-2">
            {members.map(m => {
              const on = form.participants.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleParticipant(m.id)}
                  aria-pressed={on}
                  className={`flex h-11 items-center gap-2 rounded-full pl-2 pr-3.5 text-sm font-extrabold transition-colors ${
                    on ? 'bg-ink text-white' : 'bg-white text-ink'
                  }`}
                >
                  <Avatar member={m} size={26} ring={0} />
                  {m.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {custom && (
        <div className="mt-3.5 flex flex-col gap-2">
          {participants.map(m => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2.5 rounded-[20px] bg-white px-3 py-2"
            >
              <Avatar member={m} size={34} />
              <label htmlFor={`split-${m.id}`} className="flex-1 text-[15px] font-extrabold">
                {m.name}
              </label>
              <input
                id={`split-${m.id}`}
                type="text"
                inputMode="numeric"
                value={formatNumberInput(form.custom[m.id])}
                onChange={event => set({ custom: { ...form.custom, [m.id]: digitsOnly(event.target.value) } })}
                placeholder={t('add.amountPlaceholder')}
                className="input-field h-[42px] w-32 rounded-[14px] px-3 text-right text-base"
              />
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 rounded-[28px] bg-ink px-5 py-4 text-white">
        <div>
          <div className="text-xs font-extrabold opacity-75">
            {custom ? t('add.avgPerPerson') : t('add.perPerson')}
          </div>
          <motion.div
            key={Math.round(perPerson)}
            initial={{ scale: 0.85 }}
            animate={{ scale: 1 }}
            className="origin-left font-display text-3xl font-extrabold leading-[1.1]"
          >
            {formatVND(perPerson)}
          </motion.div>
        </div>
        <div className="text-right text-[13px] font-extrabold opacity-85">
          {t('add.totalLine', { amount: formatVND(total) })}
          <br />
          {t('common.peopleCount', { n: participants.length })}
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-2.5 text-center text-[13px] font-extrabold text-debt">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={saving}
        className="mt-4 h-[58px] w-full rounded-full bg-brand font-display text-xl font-extrabold text-white shadow-chunk-lg transition-transform hover:scale-[1.02] active:translate-y-0.5 disabled:opacity-60"
      >
        {saving ? t('common.saving') : expense ? t('add.saveEdit') : t('add.save')}
      </button>
    </div>
  );
}
