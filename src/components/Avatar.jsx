import React, { useEffect, useState } from 'react';

const PALETTE = [
  '#FFD6E0',
  '#CDF3DF',
  '#FFEFA8',
  '#DCD3FF',
  '#C9E4FF',
  '#FFD9C2',
  '#BDEFEC',
  '#F3D1F7',
  '#E2F0B5',
  '#FFC9C9',
];

export const avatarColor = id => PALETTE[(Math.abs(Number(id) || 1) - 1) % PALETTE.length];

// Ảnh lấy từ member.avatar (đường dẫn trong repo hoặc URL). Thiếu ảnh hoặc
// ảnh lỗi thì rơi về chữ cái đầu trên nền pastel theo id.
export default function Avatar({ member, size = 40, ring = 2, className = '' }) {
  // stage 0: tải thẳng (không gửi referrer); 1: qua proxy /api/avatar; 2: chữ cái đầu.
  const [stage, setStage] = useState(0);
  const avatar = member?.avatar || '';
  const isRemote = /^https?:\/\//i.test(avatar);
  const src = stage === 0 || !isRemote ? avatar : `/api/avatar?u=${encodeURIComponent(avatar)}`;
  const failed = stage >= 2 || (stage === 1 && !isRemote);

  useEffect(() => setStage(0), [avatar]);

  const style = {
    width: size,
    height: size,
    borderWidth: ring,
    background: avatarColor(member?.id),
    fontSize: Math.round(size * 0.46),
  };

  return (
    <div
      style={style}
      className={`flex flex-none items-center justify-center overflow-hidden rounded-full border-solid border-white font-display font-extrabold text-ink ${className}`}
    >
      {src && !failed ? (
        <img
          src={src}
          alt=""
          draggable="false"
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setStage(current => current + 1)}
        />
      ) : (
        <span aria-hidden="true">{String(member?.name || '?').charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}
