// Proxy ảnh avatar: một số CDN (vd. Zalo) chặn tải ảnh từ trang khác (hotlink).
// Server tải hộ rồi trả lại, chỉ cho phép các host trong danh sách trắng.
const ALLOWED_HOST_SUFFIXES = ['.zadn.vn'];

const isAllowed = url =>
  url.protocol === 'https:' && ALLOWED_HOST_SUFFIXES.some(suffix => url.hostname.endsWith(suffix));

export default async function handler(req, res) {
  let target;
  try {
    target = new URL(String(req.query?.u || ''));
  } catch (_error) {
    return res.status(400).send('Bad url');
  }
  if (!isAllowed(target)) return res.status(400).send('Host not allowed');

  try {
    const upstream = await fetch(target, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'image/*' },
    });
    const type = upstream.headers.get('content-type') || '';
    if (!upstream.ok || !type.startsWith('image/')) return res.status(502).send('Upstream failed');

    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.status(200).send(Buffer.from(await upstream.arrayBuffer()));
  } catch (_error) {
    return res.status(502).send('Upstream error');
  }
}
