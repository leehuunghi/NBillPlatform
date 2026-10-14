import { getNextMemberId, dropQrCacheEntry } from '../src/shared/dataHelpers.js';

// Lỗi domain (vd. "không thể xoá thủ quỹ") -> endpoint trả 400 kèm message
// này thẳng cho client hiển thị toast, khác với lỗi hạ tầng (500).
export class DataActionError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

const normalizeBase = data => ({
  members: Array.isArray(data?.members) ? data.members : [],
  expenses: Array.isArray(data?.expenses) ? data.expenses : [],
  payments: Array.isArray(data?.payments) ? data.payments : [],
  treasurerAccount: typeof data?.treasurerAccount === 'string' ? data.treasurerAccount : '',
  treasurerBankBin: typeof data?.treasurerBankBin === 'string' ? data.treasurerBankBin : '',
  treasurerAccountNo: typeof data?.treasurerAccountNo === 'string' ? data.treasurerAccountNo : '',
  treasurerAccountName:
    typeof data?.treasurerAccountName === 'string' ? data.treasurerAccountName : '',
  qrCache: data?.qrCache && typeof data.qrCache === 'object' ? data.qrCache : {},
  nextMemberId: Number(data?.nextMemberId) || 1,
});

const EXPENSE_CATEGORIES = ['food', 'go', 'fun', 'other'];

const withSavedAt = data => ({ ...data, savedAt: new Date().toISOString() });

// Không có đăng nhập: client tự khai `asAdmin` (đang ở /superadmin) và
// `actorId` (profile đã chọn). Đây chỉ là rào chắn mềm để chống bấm nhầm
// giữa các bạn trong nhóm, KHÔNG phải bảo mật thật.
const requireAdmin = payload => {
  if (!payload?.asAdmin) throw new DataActionError('Chỉ admin mới thực hiện được thao tác này');
};

const assertCanModifyExpense = (expense, payload) => {
  if (payload?.asAdmin) return;
  const actorId = Number(payload?.actorId);
  if (!actorId || expense.createdBy !== actorId) {
    throw new DataActionError('Chỉ người tạo khoản chi hoặc admin mới sửa được');
  }
};

// Mỗi action nhận state đã normalize (`base`) + payload gửi từ client, trả
// về state mới. Hàm thuần, không đụng fs/network -> test/đọc dễ, và có thể
// chạy lại an toàn mỗi lần store.mutate() retry trên bản dữ liệu mới nhất.
const actions = {
  'member.add': (base, payload) => {
    requireAdmin(payload);
    const name = String(payload?.name || '').trim();
    if (!name) throw new DataActionError('Tên thành viên không được để trống');
    const id = Math.max(base.nextMemberId, getNextMemberId(base.members));
    const newMember = { id, name, isTreasurer: false };
    return {
      ...base,
      members: [...base.members, newMember],
      nextMemberId: id + 1,
    };
  },

  'member.delete': (base, payload) => {
    requireAdmin(payload);
    const memberId = Number(payload?.memberId);
    const target = base.members.find(m => m.id === memberId);
    if (!target) throw new DataActionError('Không tìm thấy thành viên');
    if (target.isTreasurer) throw new DataActionError('Không thể xóa thủ quỹ');

    const hasExpenseReference = base.expenses.some(
      expense =>
        expense.payerId === memberId || (expense.splits || []).some(s => s.memberId === memberId)
    );
    const hasPaymentReference = base.payments.some(p => p.memberId === memberId);
    if (hasExpenseReference || hasPaymentReference) {
      throw new DataActionError('Không thể xóa thành viên đã có trong khoản chi hoặc thanh toán');
    }

    return {
      ...base,
      members: base.members.filter(m => m.id !== memberId),
      qrCache: dropQrCacheEntry(base.qrCache, memberId),
    };
  },

  'member.setTreasurer': (base, payload) => {
    requireAdmin(payload);
    const memberId = Number(payload?.memberId);
    if (!base.members.some(m => m.id === memberId)) {
      throw new DataActionError('Không tìm thấy thành viên');
    }
    return {
      ...base,
      members: base.members.map(m => ({ ...m, isTreasurer: m.id === memberId })),
    };
  },

  'expense.upsert': (base, payload) => {
    const input = payload?.expense || {};
    const existingId = input.id ? Number(input.id) : null;
    const existing = existingId ? base.expenses.find(e => e.id === existingId) : null;
    if (existingId && !existing) throw new DataActionError('Không tìm thấy khoản chi');
    if (existing) assertCanModifyExpense(existing, payload);

    const amount = Number(input.amount);
    if (!amount || amount <= 0) throw new DataActionError('Số tiền khoản chi không hợp lệ');

    const actorId = Number(payload?.actorId) || 0;
    if (!existing && !payload?.asAdmin && !base.members.some(m => m.id === actorId)) {
      throw new DataActionError('Chưa chọn profile');
    }

    const nextExpense = {
      id: existing?.id || Date.now(),
      amount,
      payerId: Number(input.payerId),
      splits: Array.isArray(input.splits) ? input.splits : [],
      note: String(input.note || '').trim(),
      category: EXPENSE_CATEGORIES.includes(input.category) ? input.category : 'other',
      date: input.date,
      createdBy: existing ? existing.createdBy : actorId || undefined,
      createdAt: existing?.createdAt || new Date().toISOString(),
    };

    return {
      ...base,
      expenses: existing
        ? base.expenses.map(e => (e.id === existing.id ? nextExpense : e))
        : [nextExpense, ...base.expenses],
    };
  },

  'expense.delete': (base, payload) => {
    const expenseId = Number(payload?.expenseId);
    const existing = base.expenses.find(e => e.id === expenseId);
    if (!existing) throw new DataActionError('Không tìm thấy khoản chi');
    assertCanModifyExpense(existing, payload);
    return { ...base, expenses: base.expenses.filter(e => e.id !== expenseId) };
  },

  'payment.upsert': (base, payload) => {
    requireAdmin(payload);
    const input = payload?.payment || {};
    const existingId = input.id ? Number(input.id) : null;
    const existing = existingId ? base.payments.find(p => p.id === existingId) : null;
    const amount = Number(input.amount);
    if (!amount || amount <= 0) throw new DataActionError('Số tiền thanh toán không hợp lệ');
    const memberId = Number(input.memberId);

    const nextPayment = {
      id: existing?.id || Date.now(),
      memberId,
      amount,
      type: input.type === 'receive' ? 'receive' : 'pay',
      note: String(input.note || '').trim(),
      createdAt: existing?.createdAt || new Date().toISOString(),
    };

    let qrCache = dropQrCacheEntry(base.qrCache, memberId);
    if (existing && existing.memberId !== memberId) {
      qrCache = dropQrCacheEntry(qrCache, existing.memberId);
    }

    return {
      ...base,
      payments: existing
        ? base.payments.map(p => (p.id === existing.id ? nextPayment : p))
        : [nextPayment, ...base.payments],
      qrCache,
    };
  },

  'payment.delete': (base, payload) => {
    requireAdmin(payload);
    const paymentId = Number(payload?.paymentId);
    const existing = base.payments.find(p => p.id === paymentId);
    if (!existing) throw new DataActionError('Không tìm thấy khoản thanh toán');
    return {
      ...base,
      payments: base.payments.filter(p => p.id !== paymentId),
      qrCache: dropQrCacheEntry(base.qrCache, existing.memberId),
    };
  },

  'treasurerConfig.update': (base, payload) => {
    requireAdmin(payload);
    return {
      ...base,
      treasurerAccount: String(payload?.treasurerAccount || ''),
      treasurerBankBin: String(payload?.treasurerBankBin || ''),
      treasurerAccountNo: String(payload?.treasurerAccountNo || ''),
      treasurerAccountName: String(payload?.treasurerAccountName || ''),
    };
  },

  'qrCache.upsert': (base, payload) => {
    const memberId = payload?.memberId;
    if (!memberId) return base;
    return {
      ...base,
      qrCache: { ...base.qrCache, [String(memberId)]: payload?.entry || {} },
    };
  },
};

export const applyDataMutation = (data, action, payload) => {
  const handler = actions[action];
  if (!handler) throw new DataActionError(`Action không hợp lệ: ${action}`);
  const base = normalizeBase(data);
  const result = handler(base, payload);
  // Handler trả về đúng `base` (không đổi gì) -> trả lại `data` gốc để
  // dataStore.mutate() nhận ra no-op (next === current) và bỏ qua ghi/commit.
  if (result === base) return data;
  return withSavedAt(result);
};
