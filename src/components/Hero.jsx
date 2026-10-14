import React from 'react';
import { motion } from 'framer-motion';
import { QrCode, Users } from 'lucide-react';
import { formatVND } from '../lib/format.js';
import { t } from '../lib/i18n.js';

const EPS = 0.5;

const Label = ({ children }) => <div className="text-sm font-extrabold opacity-90">{children}</div>;

const Amount = ({ value }) => (
  <motion.div
    key={value}
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: 'spring', stiffness: 300, damping: 18 }}
    className="mt-0.5 origin-left font-display text-[46px] font-extrabold leading-[1.1] md:text-6xl"
  >
    {formatVND(value)}
  </motion.div>
);

const YellowButton = ({ onClick, icon: Icon, children }) => (
  <button
    type="button"
    onClick={onClick}
    className="mt-4 inline-flex min-h-[50px] items-center gap-2 rounded-full bg-sun px-5 py-2 text-left text-base font-extrabold leading-tight text-ink shadow-[0_5px_0_rgba(30,27,58,.25)] transition-transform hover:scale-105 active:translate-y-0.5 md:min-h-[54px] md:px-6"
  >
    {Icon && <Icon size={20} strokeWidth={2.6} />}
    {children}
  </button>
);

// Thẻ lớn đầu trang: nợ / dư / sạch nợ / góc nhìn của admin.
export default function Hero({ me, treasurer, balance, owedToAdmin, heldByAdmin, onPay, onDebtors }) {
  const isAdmin = Boolean(treasurer) && me.id === treasurer.id;
  const surplus = !isAdmin && balance > EPS;
  const debt = !isAdmin && balance < -EPS;

  const gradient = surplus
    ? 'linear-gradient(120deg,#087F63,#0FA37F,#2BB673)'
    : 'linear-gradient(120deg,#5B3FE0,#B93FD9,#F0568C)';

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20, delay: 0.05 }}
      className="hero-gradient relative overflow-hidden rounded-[32px] p-[22px] text-white shadow-[0_10px_0_-2px_rgba(91,63,224,.28)] md:rounded-[36px] md:p-8"
      style={{ backgroundImage: gradient }}
    >
      <motion.div
        aria-hidden="true"
        className="absolute -right-8 -top-8 h-32 w-32 rounded-[38%] bg-white/15 md:h-48 md:w-48"
        animate={{ rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
      />

      {!treasurer && <p className="relative font-extrabold">{t('hero.noTreasurer')}</p>}

      {treasurer && debt && (
        <div className="relative">
          <Label>{t('hero.owing')}</Label>
          <Amount value={-balance} />
          <div className="text-[13px] font-bold opacity-90">{t('hero.owingTo', { admin: treasurer.name })}</div>
          <YellowButton onClick={onPay} icon={QrCode}>
            {t('hero.payQr')}
          </YellowButton>
        </div>
      )}

      {treasurer && surplus && (
        <div className="relative">
          <Label>{t('hero.surplus')}</Label>
          <Amount value={balance} />
          <div className="text-[13px] font-bold opacity-95">
            {t('hero.surplusHolder', { admin: treasurer.name })}
          </div>
          <YellowButton onClick={onDebtors} icon={Users}>
            {t('hero.seeDebtors')}
          </YellowButton>
        </div>
      )}

      {treasurer && !isAdmin && !debt && !surplus && (
        <div className="relative">
          <Label>{t('hero.clearLabel')}</Label>
          <div className="mt-0.5 font-display text-[40px] font-extrabold leading-[1.1] md:text-6xl">
            {t('hero.clearTitle')}
          </div>
          <div className="text-sm font-bold opacity-95">{t('hero.clearSub')}</div>
          <YellowButton onClick={onDebtors} icon={Users}>
            {t('hero.seeDebtors')}
          </YellowButton>
        </div>
      )}

      {treasurer && isAdmin && (
        <div className="relative">
          <Label>{t('hero.adminOwed')}</Label>
          <Amount value={owedToAdmin} />
          {heldByAdmin > EPS && (
            <div className="text-[13px] font-bold opacity-95">
              {t('hero.adminHolding', { amount: formatVND(heldByAdmin) })}
            </div>
          )}
          <YellowButton onClick={onDebtors} icon={Users}>
            {t('hero.adminSeeDebtors')}
          </YellowButton>
        </div>
      )}
    </motion.section>
  );
}
