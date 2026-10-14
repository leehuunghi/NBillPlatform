import vi from '../locales/vi.json';

const resolve = path =>
  path.split('.').reduce((node, key) => (node == null ? node : node[key]), vi);

// t('hero.owingTo', { admin: 'Nghị' }) -> thay {admin} bằng giá trị truyền vào.
// Thiếu key thì trả lại chính path để lỗi hiện ra rõ trên UI thay vì trắng chữ.
export const t = (path, vars) => {
  const value = resolve(path);
  if (typeof value !== 'string') return path;
  if (!vars) return value;
  return value.replace(/\{(\w+)\}/g, (_match, key) =>
    vars[key] === undefined ? '' : String(vars[key])
  );
};

export const locale = vi.format.locale;
export const currencySuffix = vi.format.currency;
