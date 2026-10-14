export const loadData = () => fetch('/api/load').then(res => res.json());

// 1 mutation atomic ở server: server luôn đọc bản dữ liệu MỚI NHẤT rồi mới
// áp dụng thay đổi (xem api/_dataMutations.js).
export const runDataAction = (action, payload, saveMeta) =>
  fetch('/api/data-action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload, saveMeta }),
  }).then(async response => {
    const json = await response.json().catch(() => null);
    if (!response.ok || json?.success !== true) {
      throw new Error(json?.error || 'Không thể lưu dữ liệu');
    }
    return json.data;
  });

export const generateVietQr = body =>
  fetch('/api/vietqr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(res => res.json());
