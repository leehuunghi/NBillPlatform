import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Avatar, { avatarColor } from './Avatar.jsx';
import { useMedia } from '../hooks/useMedia.js';
import { t } from '../lib/i18n.js';

// Băng chuyền ngang: người đang chọn ở giữa (to, sáng), hai bên nhỏ và tối hơn.
export default function ProfilePicker({ members, onChoose }) {
  const [index, setIndex] = useState(0);
  const isWide = useMedia('(min-width: 640px)');

  if (members.length === 0) {
    return (
      <p className="mt-16 text-center font-bold text-ink-soft">{t('pick.empty')}</p>
    );
  }

  const cardW = isWide ? 250 : 190;
  const cardH = isWide ? 340 : 270;
  const avatarSize = isWide ? 150 : 120;
  const step1 = isWide ? 262 : 128;
  const step2 = isWide ? 440 : 206;
  const go = delta => setIndex(i => Math.min(members.length - 1, Math.max(0, i + delta)));

  const place = offset => {
    const a = Math.abs(offset);
    if (a === 0) return { x: 0, scale: 1, opacity: 1, y: 0, brightness: 1 };
    if (a === 1) return { x: Math.sign(offset) * step1, scale: 0.74, opacity: 1, y: 40, brightness: 0.72 };
    if (a === 2) return { x: Math.sign(offset) * step2, scale: 0.54, opacity: 0.6, y: 40, brightness: 0.55 };
    return { x: Math.sign(offset) * step2, scale: 0.4, opacity: 0, y: 40, brightness: 0.5 };
  };

  return (
    <div>
      <motion.div
        className="relative mx-auto w-full max-w-[1100px] touch-pan-y select-none overflow-hidden"
        style={{ height: cardH + 56 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(_event, info) => {
          if (info.offset.x < -50) go(1);
          else if (info.offset.x > 50) go(-1);
        }}
        tabIndex={0}
        onKeyDown={event => {
          if (event.key === 'ArrowRight') go(1);
          if (event.key === 'ArrowLeft') go(-1);
          if (event.key === 'Enter') onChoose(members[index]);
        }}
        aria-roledescription="carousel"
      >
        {members.map((member, i) => {
          const offset = i - index;
          const target = place(offset);
          const active = offset === 0;
          return (
            <motion.button
              key={member.id}
              type="button"
              aria-label={member.name}
              tabIndex={active ? 0 : -1}
              onClick={() => (active ? onChoose(member) : setIndex(i))}
              initial={false}
              animate={{
                x: target.x,
                y: target.y,
                scale: target.scale,
                opacity: target.opacity,
                filter: `brightness(${target.brightness})`,
              }}
              whileHover={active ? { rotate: -2, scale: 1.04 } : undefined}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className="absolute left-1/2 top-0 flex flex-col items-center justify-center rounded-[44px] shadow-[0_14px_0_rgba(30,27,58,.14)]"
              style={{
                width: cardW,
                height: cardH,
                marginLeft: -cardW / 2,
                background: avatarColor(member.id),
                zIndex: 10 - Math.abs(offset),
                pointerEvents: Math.abs(offset) > 2 ? 'none' : 'auto',
              }}
            >
              <Avatar member={member} size={avatarSize} ring={6} />
              <span
                className="mt-4 max-w-full truncate px-3 font-display font-extrabold leading-none"
                style={{ fontSize: isWide ? 34 : 28 }}
              >
                {member.name}
              </span>
            </motion.button>
          );
        })}
      </motion.div>

      <div className="mt-2 flex justify-center gap-1.5" aria-hidden="true">
        {members.map((member, i) => (
          <motion.span
            key={member.id}
            animate={{ width: i === index ? 22 : 8, backgroundColor: i === index ? '#5B3FE0' : '#C9BEF2' }}
            className="h-2 rounded-full"
          />
        ))}
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={index === 0}
          aria-label={t('pick.prevAria')}
          className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white shadow-chunk transition-transform hover:scale-105 disabled:opacity-40 sm:h-14 sm:w-14"
        >
          <ChevronLeft size={24} strokeWidth={3} />
        </button>
        <button
          type="button"
          onClick={() => onChoose(members[index])}
          className="h-[58px] min-w-[170px] rounded-full bg-brand px-8 font-display text-xl font-extrabold text-white shadow-chunk-lg transition-transform hover:scale-105 active:translate-y-0.5 sm:h-[62px] sm:min-w-[240px] sm:text-[22px]"
        >
          {t('pick.confirm')}
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={index === members.length - 1}
          aria-label={t('pick.nextAria')}
          className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white shadow-chunk transition-transform hover:scale-105 disabled:opacity-40 sm:h-14 sm:w-14"
        >
          <ChevronRight size={24} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
