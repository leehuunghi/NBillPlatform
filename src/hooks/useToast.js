import { useCallback, useEffect, useRef, useState } from 'react';

export function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const notify = useCallback((message, type = 'success') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ id: Date.now(), message, type });
    timer.current = setTimeout(() => setToast(null), type === 'success' ? 2200 : 3200);
  }, []);

  useEffect(() => () => timer.current && clearTimeout(timer.current), []);

  return { toast, notify };
}
