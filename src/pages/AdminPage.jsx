import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Wallet } from 'lucide-react';
import AppShell from '../components/AppShell.jsx';
import Avatar from '../components/Avatar.jsx';
import ExpenseCard from '../components/ExpenseCard.jsx';
import ExpenseDetail from '../components/ExpenseDetail.jsx';
import ExpenseForm from '../components/ExpenseForm.jsx';
import PaymentForm from '../components/PaymentForm.jsx';
import Sheet from '../components/Sheet.jsx';
import Toast from '../components/Toast.jsx';
import { useAppData } from '../hooks/useAppData.js';
import { useToast } from '../hooks/useToast.js';
import { formatShortDate, formatVND } from '../lib/format.js';
import { newestFirst } from '../lib/data.js';
import { t } from '../lib/i18n.js';

const EPS = 0.5;

// /superadmin: admin (thủ quỹ) xem + sửa mọi khoản chi, ghi nhận thanh toán
// và cấu hình tài khoản nhận tiền. Không có đăng nhập: chỉ ẩn bằng đường dẫn.
export default function AdminPage() {
  const { data, error, refresh, act, treasurer, balances } = useAppData({ route: '/superadmin' });
  const { toast, notify } = useToast();
  const [sheet, setSheet] = useState(null);
  const [saving, setSaving] = useState(false);
  const [bank, setBank] = useState(null);
  const lastSheet = useRef(null);
  if (sheet) lastSheet.current = sheet;

  if (!data) {
    return (
      <AppShell>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 font-bold text-ink-soft">
          {error ? (
            <>
              <p>{t('common.loadError')}</p>
              <button type="button" onClick={refresh} className="chunk-btn h-12 bg-white px-6">
                {t('common.retry')}
              </button>
            </>
          ) : (
            <p>{t('common.loading')}</p>
          )}
        </div>
      </AppShell>
    );
  }

  const { members, expenses, payments } = data;
  const actor = treasurer || members[0] || null;
  const asAdmin = { asAdmin: true, actorId: actor?.id };
  const sorted = [...expenses].sort(newestFirst);
  const sortedPayments = [...payments].sort(newestFirst);
  const others = members.filter(m => m.id !== treasurer?.id);
  const bankForm = bank || {
    treasurerBankBin: data.treasurerBankBin,
    treasurerAccountNo: data.treasurerAccountNo,
    treasurerAccountName: data.treasurerAccountName,
  };

  const close = () => setSheet(null);
  const run = (promise, successMessage, after) => {
    setSaving(true);
    return promise
      .then(() => {
        if (successMessage) notify(successMessage);
        if (after) after();
      })
      .catch(err => notify(err?.message || t('errors.saveFailed'), 'error'))
      .finally(() => setSaving(false));
  };

  const saveBank = () =>
    run(
      act(
        'treasurerConfig.update',
        {
          ...asAdmin,
          treasurerAccount: data.treasurerAccount,
          treasurerBankBin: bankForm.treasurerBankBin.trim(),
          treasurerAccountNo: bankForm.treasurerAccountNo.trim(),
          treasurerAccountName: bankForm.treasurerAccountName.trim(),
        },
        'Cập nhật tài khoản thủ quỹ'
      ),
      t('admin.bankSaved'),
      () => setBank(null)
    );

  const submitExpense = (expense, editing) =>
    run(
      act('expense.upsert', { expense, ...asAdmin }, editing ? 'Sửa khoản chi (admin)' : 'Thêm khoản chi (admin)'),
      editing ? t('add.savedEdit') : t('add.saved'),
      close
    );

  const deleteExpense = expense => {
    if (!window.confirm(t('detail.confirmDelete', { name: expense.note || t('detail.untitled') }))) return;
    run(act('expense.delete', { expenseId: expense.id, ...asAdmin }, 'Xóa khoản chi (admin)'), t('detail.deleted'), close);
  };

  const submitPayment = payment =>
    run(act('payment.upsert', { payment, ...asAdmin }, payment.id ? 'Sửa thanh toán' : 'Thêm thanh toán'), t('admin.paymentSaved'), close);

  const deletePayment = payment => {
    if (!window.confirm(t('admin.paymentConfirmDelete'))) return;
    run(act('payment.delete', { paymentId: payment.id, ...asAdmin }, 'Xóa thanh toán'), t('admin.paymentDeleted'), close);
  };

  const view = sheet || lastSheet.current;
  const viewExpense = view?.type === 'expense' || view?.type === 'edit' ? expenses.find(e => e.id === view.id) : null;
  const viewPayment = view?.type === 'payment' && view.id ? payments.find(p => p.id === view.id) : null;
  const sheetOpen =
    Boolean(sheet) && (view.type === 'expense' || view.type === 'edit' ? Boolean(viewExpense) : view.type === 'payment' ? !view.id || Boolean(viewPayment) : true);

  const inputClass = 'input-field mt-1.5 h-12';

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-5 pb-16 pt-10 md:px-6">
        <motion.header initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <a
              href="/"
              aria-label={t('admin.backToApp')}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-chunk"
            >
              <ArrowLeft size={22} strokeWidth={3} />
            </a>
            <div>
              <h1 className="font-display text-[32px] font-extrabold leading-none md:text-4xl">{t('admin.title')}</h1>
              <p className="text-sm font-bold text-ink-soft">{treasurer ? treasurer.name : ''}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSheet({ type: 'add' })}
            className="chunk-btn h-[50px] bg-brand px-5 text-base text-white"
          >
            <Plus size={20} strokeWidth={3} />
            {t('add.title')}
          </button>
        </motion.header>

        {!treasurer && (
          <p className="mt-5 rounded-[24px] bg-[#FFD6DC] p-4 text-sm font-extrabold text-[#9B1C3A]">{t('admin.noTreasurer')}</p>
        )}

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <section className="card-surface p-5">
            <h2 className="font-display text-xl font-extrabold">{t('admin.balancesTitle')}</h2>
            <ul className="mt-3 flex flex-col gap-2.5">
              {others.map((member, i) => {
                const balance = balances.get(member.id) || 0;
                const owes = balance < -EPS;
                const has = balance > EPS;
                return (
                  <motion.li
                    key={member.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-2.5"
                  >
                    <Avatar member={member} size={38} />
                    <div className="min-w-0 flex-1">
                      <div className="break-words text-[15px] font-extrabold leading-tight">{member.name}</div>
                      <div className={`text-[13px] font-extrabold ${owes ? 'text-debt' : has ? 'text-pine' : 'text-ink-soft'}`}>
                        {owes
                          ? t('balance.owes', { amount: formatVND(-balance) })
                          : has
                            ? t('balance.surplus', { amount: formatVND(balance) })
                            : t('balance.clear')}
                      </div>
                    </div>
                    {treasurer && (
                      <button
                        type="button"
                        onClick={() => setSheet({ type: 'payment', memberId: member.id })}
                        className="chunk-btn h-10 bg-[#EFEAFF] px-3.5 text-[13px]"
                      >
                        <Wallet size={16} strokeWidth={2.6} />
                        {t('admin.recordPayment')}
                      </button>
                    )}
                  </motion.li>
                );
              })}
            </ul>
          </section>

          <section className="card-surface p-5">
            <h2 className="font-display text-xl font-extrabold">{t('admin.bankTitle')}</h2>
            <form
              className="mt-2"
              onSubmit={event => {
                event.preventDefault();
                saveBank();
              }}
            >
              <label htmlFor="bank-bin" className="block text-[13px] font-extrabold text-ink-soft">
                {t('admin.bankBin')}
              </label>
              <input
                id="bank-bin"
                className={inputClass}
                inputMode="numeric"
                value={bankForm.treasurerBankBin}
                onChange={event => setBank({ ...bankForm, treasurerBankBin: event.target.value })}
              />
              <label htmlFor="bank-no" className="mt-3 block text-[13px] font-extrabold text-ink-soft">
                {t('admin.bankAccountNo')}
              </label>
              <input
                id="bank-no"
                className={inputClass}
                inputMode="numeric"
                value={bankForm.treasurerAccountNo}
                onChange={event => setBank({ ...bankForm, treasurerAccountNo: event.target.value })}
              />
              <label htmlFor="bank-name" className="mt-3 block text-[13px] font-extrabold text-ink-soft">
                {t('admin.bankAccountName')}
              </label>
              <input
                id="bank-name"
                className={inputClass}
                value={bankForm.treasurerAccountName}
                onChange={event => setBank({ ...bankForm, treasurerAccountName: event.target.value })}
              />
              <button
                type="submit"
                disabled={saving}
                className="chunk-btn mt-4 h-12 bg-ink px-6 text-white disabled:opacity-60"
              >
                {t('admin.bankSave')}
              </button>
            </form>
          </section>
        </div>

        <h2 className="mt-8 font-display text-2xl font-extrabold">
          {t('admin.expensesTitle')}
          <span className="ml-2 text-base text-ink-soft">· {t('common.expenseCount', { n: sorted.length })}</span>
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          {sorted.map((expense, index) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              me={actor || { id: 0 }}
              members={members}
              index={index}
              onOpen={e => setSheet({ type: 'expense', id: e.id })}
            />
          ))}
        </div>
        {sorted.length === 0 && (
          <p className="mt-4 rounded-[28px] bg-white/70 p-6 text-center text-sm font-extrabold text-ink-soft">{t('list.emptyAll')}</p>
        )}

        <h2 className="mt-8 font-display text-2xl font-extrabold">{t('admin.paymentsTitle')}</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {sortedPayments.map(payment => {
            const member = members.find(m => m.id === payment.memberId);
            return (
              <li key={payment.id}>
                <button
                  type="button"
                  onClick={() => setSheet({ type: 'payment', id: payment.id })}
                  className="flex w-full items-center gap-2.5 rounded-[20px] bg-white px-4 py-3 text-left text-sm font-extrabold"
                >
                  {member && <Avatar member={member} size={32} />}
                  <span className="min-w-0 flex-1 break-words">
                    {member?.name} · {payment.type === 'pay' ? t('list.paymentPay') : t('list.paymentReceive')}
                    <span className="ml-2 text-xs text-ink-soft">{formatShortDate(String(payment.createdAt || '').slice(0, 10))}</span>
                    {payment.note ? <span className="ml-2 text-xs text-ink-soft">{payment.note}</span> : null}
                  </span>
                  <span className={payment.type === 'pay' ? 'text-pine' : 'text-brand'}>{formatVND(payment.amount)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <Sheet
        open={sheetOpen}
        onClose={close}
        label={t('admin.title')}
        size={view?.type === 'add' || view?.type === 'edit' ? 'lg' : 'md'}
      >
        {view?.type === 'expense' && viewExpense && (
          <ExpenseDetail
            expense={viewExpense}
            me={actor}
            members={members}
            canEdit
            busy={saving}
            onEdit={() => setSheet({ type: 'edit', id: viewExpense.id })}
            onDelete={() => deleteExpense(viewExpense)}
            onClose={close}
          />
        )}
        {view?.type === 'add' && (
          <ExpenseForm members={members} me={actor} saving={saving} onSubmit={e => submitExpense(e, false)} onClose={close} />
        )}
        {view?.type === 'edit' && viewExpense && (
          <ExpenseForm
            members={members}
            me={actor}
            expense={viewExpense}
            saving={saving}
            onSubmit={e => submitExpense(e, true)}
            onClose={close}
          />
        )}
        {view?.type === 'payment' && (
          <PaymentForm
            key={view.id || `new-${view.memberId}`}
            members={others}
            balances={balances}
            payment={viewPayment}
            defaultMemberId={view.memberId}
            saving={saving}
            onSubmit={submitPayment}
            onDelete={() => viewPayment && deletePayment(viewPayment)}
            onClose={close}
          />
        )}
      </Sheet>

      <Toast toast={toast} />
    </AppShell>
  );
}
