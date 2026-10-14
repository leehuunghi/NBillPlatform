import { locale, currencySuffix } from './i18n.js';

export const formatVND = value =>
  Number(value || 0).toLocaleString(locale, { maximumFractionDigits: 0 }) + currencySuffix;

// Hiển thị số đang gõ có dấu chấm ngăn cách hàng nghìn (chỉ để nhìn).
export const formatNumberInput = value =>
  String(value || '')
    .replace(/\D/g, '')
    .replace(/^0+(?=\d)/, '')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export const digitsOnly = value => String(value || '').replace(/\D/g, '');

export const todayISO = () => new Date().toISOString().slice(0, 10);

// 2026-10-14 -> "14/10"
export const formatShortDate = iso => {
  const [, month, day] = String(iso || '').split('-');
  return month && day ? `${day}/${month}` : '';
};

// Nội dung chuyển khoản: không dấu, in hoa, tối đa 25 ký tự.
export const buildTransferContent = memberName =>
  String(memberName || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
    .slice(0, 25);
