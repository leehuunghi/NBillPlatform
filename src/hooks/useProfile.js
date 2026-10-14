import { useCallback, useState } from 'react';

const STORAGE_KEY = 'nbill:profileId';

const read = () => {
  try {
    const value = Number(window.localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch (_error) {
    return null;
  }
};

// Profile đã chọn lưu ở localStorage để lần sau vào thẳng app, không cần login.
export function useProfile() {
  const [profileId, setProfileId] = useState(read);

  const choose = useCallback(id => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(id));
    } catch (_error) {
      /* trình duyệt chặn storage: vẫn dùng được trong phiên hiện tại */
    }
    setProfileId(id);
  }, []);

  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (_error) {
      /* bỏ qua */
    }
    setProfileId(null);
  }, []);

  return { profileId, choose, clear };
}
