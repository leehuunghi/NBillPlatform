import { getNextMemberId } from '../shared/dataHelpers.js';

// Chuẩn hóa dữ liệu tải từ /api/load: sửa id thành viên bị trùng/thiếu và
// remap lại mọi tham chiếu (payer, splits, payments, qrCache).
export const normalizeLoadedData = rawData => {
  const data = rawData && typeof rawData === 'object' ? rawData : {};
  const sourceMembers = Array.isArray(data.members) ? data.members : [];
  const usedIds = new Set();
  const idMap = new Map();

  const getNextAvailableId = () => {
    let candidate = 1;
    while (usedIds.has(candidate)) candidate += 1;
    return candidate;
  };

  const members = sourceMembers.map(member => {
    const originalId = Number(member?.id) || 0;
    let nextId = originalId;
    if (!nextId || usedIds.has(nextId)) nextId = getNextAvailableId();
    usedIds.add(nextId);
    if (!idMap.has(originalId)) idMap.set(originalId, []);
    idMap.get(originalId).push(nextId);
    return { ...member, id: nextId };
  });

  const splitIdCursor = new Map();
  const remapRefId = (oldId, mode = 'first') => {
    const candidates = idMap.get(Number(oldId)) || [];
    if (candidates.length === 0) return Number(oldId) || 0;
    if (mode === 'sequence') {
      const currentIndex = splitIdCursor.get(Number(oldId)) || 0;
      const nextId = candidates[Math.min(currentIndex, candidates.length - 1)];
      splitIdCursor.set(Number(oldId), currentIndex + 1);
      return nextId;
    }
    return candidates[0];
  };

  const expenses = Array.isArray(data.expenses)
    ? data.expenses.map(expense => {
        splitIdCursor.clear();
        return {
          ...expense,
          payerId: remapRefId(expense?.payerId),
          splits: Array.isArray(expense?.splits)
            ? expense.splits.map(split => ({
                ...split,
                memberId: remapRefId(split?.memberId, 'sequence'),
              }))
            : [],
        };
      })
    : [];

  const payments = Array.isArray(data.payments)
    ? data.payments.map(payment => ({ ...payment, memberId: remapRefId(payment?.memberId) }))
    : [];

  const qrCache = Object.fromEntries(
    Object.entries(data.qrCache && typeof data.qrCache === 'object' ? data.qrCache : {}).map(
      ([memberId, value]) => [String(remapRefId(memberId)), value]
    )
  );

  return {
    ...data,
    members,
    expenses,
    payments,
    qrCache,
    treasurerAccount: data.treasurerAccount || '',
    treasurerBankBin: data.treasurerBankBin || '',
    treasurerAccountNo: data.treasurerAccountNo || '',
    treasurerAccountName: data.treasurerAccountName || '',
    nextMemberId: Math.max(Number(data.nextMemberId) || 0, getNextMemberId(members)),
  };
};

// Số dư từng người: dương = đang dư (admin nợ lại), âm = đang nợ admin.
// Cộng tiền cho người trả, trừ phần chia của từng người, rồi cộng/trừ các
// khoản thanh toán qua thủ quỹ. Tổng mọi số dư luôn bằng 0.
export const computeBalances = ({ members, expenses, payments, treasurerId }) => {
  const map = new Map();
  members.forEach(m => map.set(m.id, 0));

  expenses.forEach(exp => {
    map.set(exp.payerId, (map.get(exp.payerId) || 0) + exp.amount);
    exp.splits.forEach(s => map.set(s.memberId, (map.get(s.memberId) || 0) - s.amount));
  });

  payments.forEach(p => {
    if (!treasurerId) return;
    const sign = p.type === 'pay' ? 1 : -1;
    map.set(p.memberId, (map.get(p.memberId) || 0) + sign * p.amount);
    map.set(treasurerId, (map.get(treasurerId) || 0) - sign * p.amount);
  });

  return map;
};

export const getShare = (expense, memberId) =>
  expense.splits.find(s => s.memberId === memberId)?.amount || 0;

export const involvesMember = (expense, memberId) =>
  expense.payerId === memberId || expense.splits.some(s => s.memberId === memberId);

const timeOf = item => new Date(item.createdAt || item.date || 0).getTime();
export const newestFirst = (a, b) => timeOf(b) - timeOf(a);

// Chia đều: làm tròn từng phần, người cuối nhận phần dư để tổng luôn khớp.
export const splitEqually = (amount, memberIds) => {
  if (!amount || memberIds.length === 0) return [];
  const per = Math.round(amount / memberIds.length);
  return memberIds.map((memberId, idx) => ({
    memberId,
    amount: idx === memberIds.length - 1 ? amount - per * (memberIds.length - 1) : per,
  }));
};
