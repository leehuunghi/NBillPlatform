// Pure helpers dùng chung giữa client (App.jsx) và server (api/_dataMutations.js).
// Không được import React/DOM hay bất cứ thứ gì chỉ chạy ở 1 phía.

export const getNextMemberId = members =>
  members.reduce((maxId, member) => {
    const memberId = Number(member?.id) || 0;
    return memberId > maxId ? memberId : maxId;
  }, 0) + 1;

export const dropQrCacheEntry = (cache, memberId) => {
  const nextCache = { ...cache };
  delete nextCache[String(memberId)];
  return nextCache;
};
