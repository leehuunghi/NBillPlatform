import React, { useRef, useState } from 'react';
import { LayoutGroup, motion } from 'framer-motion';
import { Plus, Repeat } from 'lucide-react';
import Avatar from '../components/Avatar.jsx';
import AppShell from '../components/AppShell.jsx';
import BalanceList from '../components/BalanceList.jsx';
import DebtorsSheet from '../components/DebtorsSheet.jsx';
import ExpenseCard from '../components/ExpenseCard.jsx';
import ExpenseDetail from '../components/ExpenseDetail.jsx';
import ExpenseForm from '../components/ExpenseForm.jsx';
import Hero from '../components/Hero.jsx';
import ProfilePicker from '../components/ProfilePicker.jsx';
import QrPay from '../components/QrPay.jsx';
import Sheet from '../components/Sheet.jsx';
import Toast from '../components/Toast.jsx';
import { useAppData } from '../hooks/useAppData.js';
import { useProfile } from '../hooks/useProfile.js';
import { useToast } from '../hooks/useToast.js';
import { formatShortDate, formatVND } from '../lib/format.js';
import { involvesMember, newestFirst } from '../lib/data.js';
import { t } from '../lib/i18n.js';

const EPS = 0.5;

const Centered = ({ children }) => (
  <AppShell>
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center font-bold text-ink-soft">
      {children}
    </div>
  </AppShell>
);

export default function MemberApp() {
  const { data, error, refresh, act, treasurer, balances } = useAppData({ route: '/' });
  const { profileId, choose, clear } = useProfile();
  const { toast, notify } = useToast();
  const [tab, setTab] = useState('mine');
  const [sheet, setSheet] = useState(null);
  const [saving, setSaving] = useState(false);
  const lastSheet = useRef(null);
  if (sheet) lastSheet.current = sheet;

  if (!data) {
    return (
      <Centered>
        {error ? (
          <>
            <p>{t('common.loadError')}</p>
            <button type="button" onClick={refresh} className="chunk-btn h-12 bg-white px-6">
              {t('common.retry')}
            </button>
          </>
        ) : (
          <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.4, repeat: Infinity }}>
            {t('common.loading')}
          </motion.p>
        )}
      </Centered>
    );
  }

  const { members, expenses, payments } = data;
  const me = members.find(m => m.id === profileId) || null;

  if (!me) {
    return (
      <AppShell>
        <main className="flex min-h-screen flex-col items-center px-4 pb-12 pt-16 md:pt-20">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center font-display text-[44px] font-extrabold leading-none tracking-tight md:text-6xl"
          >
            {t('pick.title')}
            <span className="text-brand">{t('pick.titleMark')}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-2.5 text-center text-[15px] font-bold text-ink-soft md:text-lg"
          >
            {t('pick.subtitle')}
          </motion.p>
          <div className="mt-8 w-full md:mt-10">
            <ProfilePicker members={members} onChoose={member => choose(member.id)} />
          </div>
        </main>
      </AppShell>
    );
  }

  const isTreasurer = Boolean(treasurer) && treasurer.id === me.id;
  const sorted = [...expenses].sort(newestFirst);
  const mine = sorted.filter(e => involvesMember(e, me.id));
  const cards = tab === 'mine' ? mine : sorted;
  const myPayments = payments.filter(p => p.memberId === me.id).sort(newestFirst);
  const others = members.filter(m => m.id !== treasurer?.id);
  const debtorRows = others
    .map(member => ({ member, amount: -(balances.get(member.id) || 0) }))
    .filter(row => row.amount > EPS)
    .sort((a, b) => b.amount - a.amount);
  const owedToAdmin = debtorRows.reduce((sum, row) => sum + row.amount, 0);
  const heldByAdmin = others.reduce((sum, m) => sum + Math.max(0, balances.get(m.id) || 0), 0);
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const myBalance = balances.get(me.id) || 0;

  const openExpense = expense => setSheet({ type: 'detail', id: expense.id });
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

  const submitExpense = (expense, editing) =>
    run(
      act('expense.upsert', { expense, actorId: me.id }, editing ? 'Sửa khoản chi' : 'Thêm khoản chi'),
      editing ? t('add.savedEdit') : t('add.saved'),
      () => {
        setSheet(null);
        setTab('mine');
      }
    );

  const deleteExpense = expense => {
    if (!window.confirm(t('detail.confirmDelete', { name: expense.note || t('detail.untitled') }))) return;
    run(act('expense.delete', { expenseId: expense.id, actorId: me.id }, 'Xóa khoản chi'), t('detail.deleted'), close);
  };

  const view = sheet || lastSheet.current;
  const viewExpense = view?.id ? expenses.find(e => e.id === view.id) : null;
  const sheetOpen = Boolean(sheet) && (view.type !== 'detail' && view.type !== 'edit' ? true : Boolean(viewExpense));

  return (
    <AppShell>
      <div className="mx-auto max-w-[1240px] px-5 pb-32 pt-12 md:px-6 md:pb-16 md:pt-6">
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-3.5"
        >
          <div className="hidden items-center gap-3 md:flex">
            <div className="flex h-12 w-12 -rotate-6 items-center justify-center rounded-2xl bg-brand font-display text-[28px] font-extrabold text-white shadow-[0_5px_0_rgba(30,27,58,.2)]">
              {t('common.brandMark')}
            </div>
            <span className="font-display text-[30px] font-extrabold tracking-tight">{t('common.brand')}</span>
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-3 md:hidden">
            <Avatar member={me} size={52} />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-extrabold text-ink-soft">{t('common.greeting')}</div>
              <div className="break-words font-display text-[26px] font-extrabold leading-tight">{me.name}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSheet({ type: 'add' })}
              className="chunk-btn hidden h-[50px] bg-brand px-5 text-base text-white shadow-[0_5px_0_rgba(30,27,58,.25)] hover:scale-105 md:inline-flex"
            >
              <Plus size={20} strokeWidth={3} />
              {t('add.title')}
            </button>
            <div className="flex items-center gap-2.5 rounded-full bg-white py-1.5 pl-1.5 pr-2">
              <span className="hidden md:block">
                <Avatar member={me} size={40} />
              </span>
              <span className="hidden pr-1 text-[15px] font-extrabold md:inline">{me.name}</span>
              <button
                type="button"
                onClick={clear}
                aria-label={t('common.switchUserAria')}
                className="flex h-[38px] items-center gap-1.5 rounded-full bg-[#EFEAFF] px-3.5 text-[13px] font-extrabold hover:scale-105"
              >
                <Repeat size={15} strokeWidth={2.6} />
                {t('common.switchUser')}
              </button>
            </div>
          </div>
        </motion.header>

        <div className="mt-5 flex flex-wrap items-start gap-6">
          <main className="min-w-0 flex-[999_1_560px]">
            <Hero
              me={me}
              treasurer={treasurer}
              balance={myBalance}
              owedToAdmin={owedToAdmin}
              heldByAdmin={heldByAdmin}
              onPay={() => setSheet({ type: 'qr' })}
              onDebtors={() => setSheet({ type: 'debtors' })}
            />

            <LayoutGroup>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-[22px] font-extrabold md:text-[28px]">
                  {tab === 'mine' ? t('list.titleMine') : t('list.titleAll')}
                  <span className="ml-2 text-sm font-extrabold text-ink-soft md:text-base">
                    · {t('common.expenseCount', { n: cards.length })}
                  </span>
                </h2>
                <div role="tablist" className="flex w-full gap-1 rounded-full bg-white p-1.5 md:w-72">
                  {['mine', 'group'].map(key => (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={tab === key}
                      onClick={() => setTab(key)}
                      className="relative h-[42px] flex-1 rounded-full text-[15px] font-extrabold"
                    >
                      {tab === key && (
                        <motion.span
                          layoutId="tab-pill"
                          className="absolute inset-0 rounded-full bg-ink"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className={`relative ${tab === key ? 'text-white' : 'text-ink-soft'}`}>
                        {t(`tabs.${key}`)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </LayoutGroup>

            {tab === 'group' && (
              <BalanceList
                className="mt-4 lg:hidden"
                members={members}
                balances={balances}
                treasurer={treasurer}
                meId={me.id}
                totalSpent={totalSpent}
              />
            )}

            <div className="mt-3.5 grid grid-cols-1 gap-4 md:grid-cols-[repeat(auto-fill,minmax(290px,1fr))]">
                {cards.map((expense, index) => (
                  <ExpenseCard
                    key={expense.id}
                    expense={expense}
                    me={me}
                    members={members}
                    index={index}
                    onOpen={openExpense}
                  />
                ))}
            </div>
            {cards.length === 0 && (
              <p className="mt-6 rounded-[28px] bg-white/70 p-6 text-center text-sm font-extrabold text-ink-soft">
                {tab === 'mine' ? t('list.emptyMine') : t('list.emptyAll')}
              </p>
            )}

            {tab === 'mine' && myPayments.length > 0 && !isTreasurer && (
              <section className="mt-6">
                <h3 className="font-display text-xl font-extrabold">{t('list.paymentsTitle')}</h3>
                <ul className="mt-2 flex flex-col gap-2">
                  {myPayments.map(payment => (
                    <li key={payment.id} className="flex items-center justify-between rounded-[20px] bg-white px-4 py-3 text-sm font-extrabold">
                      <span>
                        {payment.type === 'pay' ? t('list.paymentPay') : t('list.paymentReceive')}
                        <span className="ml-2 text-xs text-ink-soft">
                          {formatShortDate(String(payment.createdAt || '').slice(0, 10))}
                        </span>
                      </span>
                      <span className={payment.type === 'pay' ? 'text-pine' : 'text-brand'}>{formatVND(payment.amount)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </main>

          <aside className="hidden min-w-0 flex-1 basis-[340px] flex-col gap-4 lg:flex">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-3xl bg-white p-4">
                <div className="text-xs font-extrabold text-ink-soft">{t('group.joined')}</div>
                <div className="font-display text-[32px] font-extrabold leading-[1.1]">
                  {t('common.expenseCount', { n: mine.length })}
                </div>
              </div>
              <div className="rounded-3xl bg-white p-4">
                <div className="text-xs font-extrabold text-ink-soft">{t('group.groupTotal')}</div>
                <div className="font-display text-[26px] font-extrabold leading-[1.3]">{formatVND(totalSpent)}</div>
              </div>
            </div>
            <BalanceList
              members={members}
              balances={balances}
              treasurer={treasurer}
              meId={me.id}
              totalSpent={totalSpent}
              onlyDebtors={() => setSheet({ type: 'debtors' })}
            />
          </aside>
        </div>
      </div>

      <motion.button
        type="button"
        onClick={() => setSheet({ type: 'add' })}
        aria-label={t('add.addAria')}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.3 }}
        className="fixed bottom-6 right-5 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-brand shadow-chunk-lg md:hidden"
      >
        <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full border-[3px] border-brand opacity-60" />
        <Plus size={30} strokeWidth={3} color="#fff" />
      </motion.button>

      <Sheet
        open={sheetOpen}
        onClose={close}
        label={view?.type === 'add' ? t('add.title') : view?.type === 'qr' ? t('qr.dialogAria') : t('detail.dialogAria')}
        size={view?.type === 'add' || view?.type === 'edit' ? 'lg' : 'md'}
      >
        {view?.type === 'detail' && viewExpense && (
          <ExpenseDetail
            expense={viewExpense}
            me={me}
            members={members}
            canEdit={viewExpense.createdBy === me.id}
            busy={saving}
            onEdit={() => setSheet({ type: 'edit', id: viewExpense.id })}
            onDelete={() => deleteExpense(viewExpense)}
            onClose={close}
          />
        )}
        {view?.type === 'add' && (
          <ExpenseForm members={members} me={me} saving={saving} onSubmit={e => submitExpense(e, false)} onClose={close} />
        )}
        {view?.type === 'edit' && viewExpense && (
          <ExpenseForm
            members={members}
            me={me}
            expense={viewExpense}
            saving={saving}
            onSubmit={e => submitExpense(e, true)}
            onClose={close}
          />
        )}
        {view?.type === 'qr' && treasurer && (
          <QrPay me={me} treasurer={treasurer} data={data} amount={-myBalance} act={act} onClose={close} />
        )}
        {view?.type === 'debtors' && (
          <DebtorsSheet rows={debtorRows} meId={me.id} total={owedToAdmin} onClose={close} />
        )}
      </Sheet>

      <Toast toast={toast} />
    </AppShell>
  );
}
