import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { SheetHeader } from './Sheet.jsx';
import { generateVietQr } from '../lib/api.js';
import { buildTransferContent, formatVND } from '../lib/format.js';
import { t } from '../lib/i18n.js';

// QR trả nợ vào tài khoản của admin (thủ quỹ) với đúng số tiền đang nợ.
// Chỉ hiển thị QR: admin tự ghi nhận thanh toán ở /superadmin khi tiền về.
export default function QrPay({ me, treasurer, data, amount, act, onClose }) {
  const [payload, setPayload] = useState('');
  const [status, setStatus] = useState('loading');
  const [copied, setCopied] = useState(false);

  const addInfo = buildTransferContent(me.name);
  const { treasurerBankBin: bin, treasurerAccountNo: accountNo, treasurerAccountName: owner } = data;
  const rounded = Math.round(amount);

  useEffect(() => {
    let active = true;
    if (rounded <= 0) {
      setStatus('nodebt');
      return undefined;
    }
    if (!bin || !accountNo || !owner) {
      setStatus('nobank');
      return undefined;
    }

    const cached = data.qrCache?.[String(me.id)];
    if (cached?.checksum === rounded && cached?.payload) {
      setPayload(cached.payload);
      setStatus('ready');
      return undefined;
    }

    setStatus('loading');
    generateVietQr({ amount: rounded, addInfo, acqId: bin, accountNo, accountName: owner })
      .then(result => {
        if (!active) return;
        if (!result?.ok || !result?.payload) {
          setStatus('error');
          return;
        }
        setPayload(result.payload);
        setStatus('ready');
        // Cache chỉ để đỡ gọi lại VietQR, lỗi thì bỏ qua.
        act(
          'qrCache.upsert',
          {
            memberId: me.id,
            entry: { checksum: rounded, payload: result.payload, addInfo, updatedAt: new Date().toISOString() },
          },
          'Cache QR'
        ).catch(() => {});
      })
      .catch(() => active && setStatus('error'));

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rounded, me.id, bin, accountNo, owner]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(accountNo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_error) {
      /* clipboard bị chặn: bỏ qua */
    }
  };

  const message =
    status === 'nodebt'
      ? t('qr.noDebt')
      : status === 'nobank'
        ? t('qr.errorNoBank')
        : status === 'error'
          ? t('qr.errorGenerate')
          : '';

  return (
    <div aria-label={t('qr.dialogAria')}>
      <SheetHeader title={t('qr.title', { admin: treasurer.name })} subtitle={t('qr.subtitle')} onClose={onClose} />

      <div className="mt-4 flex flex-col items-center gap-4 md:flex-row md:items-stretch">
        <motion.div
          initial={{ opacity: 0, scale: 0.7, rotate: -6 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16 }}
          className="flex-none rounded-[32px] bg-sun p-3.5 shadow-[0_8px_0_rgba(30,27,58,.14)]"
        >
          <div className="flex h-[236px] w-[236px] items-center justify-center rounded-[18px] bg-white">
            {status === 'ready' ? (
              <QRCodeCanvas value={payload} size={220} aria-label={t('qr.qrAria')} role="img" />
            ) : (
              <p className="px-4 text-center text-sm font-extrabold text-ink-soft">
                {status === 'loading' ? t('qr.generating') : message}
              </p>
            )}
          </div>
        </motion.div>

        <div className="flex w-full flex-1 flex-col justify-center gap-2.5">
          <div className="text-[13px] font-extrabold text-ink-soft">{t('qr.amountToPay')}</div>
          <div className="font-display text-5xl font-extrabold leading-none text-brand">{formatVND(rounded)}</div>
          {bin && accountNo && (
            <div className="rounded-[20px] bg-white px-4 py-3.5 text-sm font-bold leading-relaxed">
              {t('qr.bankLine', { bank: bin, account: accountNo })}
              <br />
              {t('qr.ownerLine', { owner })}
              <br />
              {t('qr.noteLabel')} <b>{addInfo}</b>
            </div>
          )}
          {accountNo && (
            <button type="button" onClick={copy} className="chunk-btn h-12 self-start bg-white px-5 text-sm">
              {copied ? <Check size={18} strokeWidth={3} color="#087F63" /> : <Copy size={18} strokeWidth={2.6} color="#5B3FE0" />}
              {copied ? t('qr.copied') : t('qr.copy')}
            </button>
          )}
          <p className="rounded-[20px] bg-[#D8F5E6] px-4 py-3 text-[13px] font-bold leading-snug">
            {t('qr.afterNote', { admin: treasurer.name })}
          </p>
        </div>
      </div>
    </div>
  );
}
