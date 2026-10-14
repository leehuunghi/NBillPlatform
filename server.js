import 'dotenv/config';
import express from 'express';
import { dataStore, defaultData } from './api/_utils.js';
import { applyDataMutation, DataActionError } from './api/_dataMutations.js';
import avatarHandler from './api/avatar.js';

const app = express();
const PORT = 5174;

app.use(express.json({ limit: '1mb' }));

app.get('/api/load', async (_req, res) => {
  try {
    res.json(await dataStore.read());
  } catch (_err) {
    res.status(200).json(defaultData);
  }
});

app.post('/api/save', async (req, res) => {
  try {
    const { saveMeta, ...payload } = req.body || {};
    if (saveMeta) {
      console.log(
        `[save] route=${saveMeta.route || 'unknown'} action=${saveMeta.action || 'unknown'} at=${saveMeta.at || ''}`
      );
    }
    const result = await dataStore.write(payload, saveMeta);
    res.json({ success: true, storage: result.storage });
  } catch (_err) {
    res.status(500).json({ success: false, error: 'Failed to save file' });
  }
});

// Đọc bản mới nhất trước khi áp dụng action, tránh đè lên thay đổi của
// người khác vừa lưu xen giữa (xem api/data-action.js / api/_dataMutations.js).
app.post('/api/data-action', async (req, res) => {
  try {
    const { action, payload, saveMeta } = req.body || {};
    const data = await dataStore.mutate(current => applyDataMutation(current, action, payload), saveMeta);
    res.status(200).json({ success: true, data });
  } catch (err) {
    const status = err instanceof DataActionError ? err.status : 500;
    res.status(status).json({ success: false, error: err?.message || 'Không thể lưu dữ liệu' });
  }
});

app.get('/api/avatar', (req, res) => avatarHandler(req, res));

app.post('/api/vietqr', async (req, res) => {
  try {
    const { amount, addInfo, acqId, accountNo, accountName } = req.body || {};
    if (!amount || !acqId || !accountNo || !accountName) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }
    if (!process.env.VIETQR_CLIENT_ID || !process.env.VIETQR_API_KEY) {
      return res.status(500).json({ ok: false, error: 'Missing VietQR API credentials' });
    }

    const payload = {
      accountNo,
      accountName,
      acqId: Number(acqId),
      amount: Number(amount),
      addInfo: addInfo || '',
      format: 'text',
      template: 'compact',
    };

    const response = await fetch('https://api.vietqr.io/v2/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': process.env.VIETQR_CLIENT_ID,
        'x-api-key': process.env.VIETQR_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    const qrData = data?.data?.qrData || data?.data?.qrCode;
    if (!qrData) {
      return res.status(502).json({ ok: false, error: 'Failed to generate payload', raw: data });
    }
    return res.json({ ok: true, payload: qrData });
  } catch (_err) {
    return res.status(500).json({ ok: false, error: 'VietQR API error' });
  }
});

app.listen(PORT, () => {
  console.log(`Data server running on http://localhost:${PORT}`);
});
