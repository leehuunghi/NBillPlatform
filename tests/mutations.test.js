import test from 'node:test';
import assert from 'node:assert/strict';
import { applyDataMutation, DataActionError } from '../api/_dataMutations.js';
import { computeBalances } from '../src/lib/data.js';

const base = () => ({
  members: [
    { id: 1, name: 'Nghị', isTreasurer: true },
    { id: 2, name: 'Linh' },
    { id: 3, name: 'Minh' },
  ],
  expenses: [],
  payments: [],
  treasurerAccount: '',
  treasurerBankBin: '',
  treasurerAccountNo: '',
  treasurerAccountName: '',
  qrCache: {},
  nextMemberId: 4,
});

const expensePayload = (extra = {}) => ({
  expense: {
    amount: 300,
    payerId: 1,
    splits: [
      { memberId: 1, amount: 100 },
      { memberId: 2, amount: 100 },
      { memberId: 3, amount: 100 },
    ],
    note: 'Lẩu',
    category: 'food',
    date: '2026-10-14',
  },
  actorId: 2,
  ...extra,
});

const withExpense = () => applyDataMutation(base(), 'expense.upsert', expensePayload());

test('member tạo khoản chi: lưu createdBy và category', () => {
  const [expense] = withExpense().expenses;
  assert.equal(expense.createdBy, 2);
  assert.equal(expense.category, 'food');
});

test('category lạ rơi về other', () => {
  const next = applyDataMutation(base(), 'expense.upsert', expensePayload({ expense: { ...expensePayload().expense, category: 'xyz' } }));
  assert.equal(next.expenses[0].category, 'other');
});

test('không có profile hợp lệ thì không tạo được khoản chi', () => {
  assert.throws(() => applyDataMutation(base(), 'expense.upsert', expensePayload({ actorId: 99 })), DataActionError);
});

test('chỉ người tạo sửa được khoản của mình', () => {
  const data = withExpense();
  const id = data.expenses[0].id;
  const edit = actorId => applyDataMutation(data, 'expense.upsert', {
    expense: { ...expensePayload().expense, id, amount: 600, splits: [{ memberId: 2, amount: 600 }] },
    actorId,
  });
  assert.equal(edit(2).expenses[0].amount, 600);
  assert.throws(() => edit(3), DataActionError);
});

test('người khác không xóa được, admin xóa được', () => {
  const data = withExpense();
  const expenseId = data.expenses[0].id;
  assert.throws(() => applyDataMutation(data, 'expense.delete', { expenseId, actorId: 3 }), DataActionError);
  assert.equal(applyDataMutation(data, 'expense.delete', { expenseId, actorId: 3, asAdmin: true }).expenses.length, 0);
});

test('admin sửa khoản của người khác vẫn giữ createdBy gốc', () => {
  const data = withExpense();
  const next = applyDataMutation(data, 'expense.upsert', {
    expense: { ...expensePayload().expense, id: data.expenses[0].id, amount: 450 },
    actorId: 1,
    asAdmin: true,
  });
  assert.equal(next.expenses[0].createdBy, 2);
  assert.equal(next.expenses[0].amount, 450);
});

test('thanh toán, cấu hình thủ quỹ và thành viên chỉ dành cho admin', () => {
  const pay = { payment: { memberId: 2, amount: 50, type: 'pay' } };
  assert.throws(() => applyDataMutation(base(), 'payment.upsert', pay), DataActionError);
  assert.throws(() => applyDataMutation(base(), 'treasurerConfig.update', { treasurerBankBin: '1' }), DataActionError);
  assert.throws(() => applyDataMutation(base(), 'member.add', { name: 'X' }), DataActionError);
  assert.equal(applyDataMutation(base(), 'payment.upsert', { ...pay, asAdmin: true }).payments.length, 1);
});

test('payment.delete xóa đúng khoản', () => {
  const added = applyDataMutation(base(), 'payment.upsert', { payment: { memberId: 2, amount: 50, type: 'pay' }, asAdmin: true });
  const paymentId = added.payments[0].id;
  assert.throws(() => applyDataMutation(added, 'payment.delete', { paymentId }), DataActionError);
  assert.equal(applyDataMutation(added, 'payment.delete', { paymentId, asAdmin: true }).payments.length, 0);
});

test('số dư: người nợ âm, thanh toán bù lại, tổng luôn bằng 0', () => {
  let data = withExpense();
  const sum = d => [...computeBalances({ ...d, treasurerId: 1 }).values()].reduce((a, b) => a + b, 0);
  const balances = () => computeBalances({ ...data, treasurerId: 1 });
  // Nghị trả 300, mỗi người 100: Nghị +200, Linh -100, Minh -100.
  assert.equal(balances().get(1), 200);
  assert.equal(balances().get(2), -100);
  data = applyDataMutation(data, 'payment.upsert', { payment: { memberId: 2, amount: 100, type: 'pay' }, asAdmin: true });
  assert.equal(balances().get(2), 0);
  assert.equal(balances().get(1), 100);
  assert.equal(sum(data), 0);
});
