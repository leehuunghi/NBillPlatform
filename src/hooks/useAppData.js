import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loadData, runDataAction } from '../lib/api.js';
import { computeBalances, normalizeLoadedData } from '../lib/data.js';

const REFRESH_MS = 30000;

// Nguồn dữ liệu dùng chung cho cả app thành viên và /superadmin.
// `act()` gọi mutation ở server rồi đồng bộ state theo đúng bản server trả về.
export function useAppData({ route }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const mounted = useRef(true);

  const refresh = useCallback(() => {
    return loadData()
      .then(raw => {
        if (!mounted.current) return;
        setData(normalizeLoadedData(raw));
        setError(false);
      })
      .catch(() => {
        if (mounted.current) setError(true);
      });
  }, []);

  useEffect(() => {
    mounted.current = true;
    refresh();
    // Nhóm bạn dùng chung dữ liệu: tự làm mới định kỳ và khi quay lại tab.
    const timer = setInterval(refresh, REFRESH_MS);
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      mounted.current = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  const act = useCallback(
    (action, payload, label) =>
      runDataAction(action, payload, { route, action: label || action, at: new Date().toISOString() }).then(
        next => {
          if (mounted.current) setData(normalizeLoadedData(next));
          return next;
        }
      ),
    [route]
  );

  const derived = useMemo(() => {
    if (!data) return null;
    const treasurer = data.members.find(m => m.isTreasurer) || null;
    const balances = computeBalances({
      members: data.members,
      expenses: data.expenses,
      payments: data.payments,
      treasurerId: treasurer?.id || null,
    });
    return { treasurer, balances };
  }, [data]);

  return { data, error, refresh, act, ...(derived || { treasurer: null, balances: new Map() }) };
}
