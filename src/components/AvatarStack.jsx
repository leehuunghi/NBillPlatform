import React from 'react';
import Avatar from './Avatar.jsx';

export default function AvatarStack({ members, max = 4, size = 26 }) {
  const shown = members.slice(0, max);
  return (
    <div className="flex items-center">
      {shown.map((member, i) => (
        <div key={member.id} style={{ marginLeft: i ? -size * 0.32 : 0 }}>
          <Avatar member={member} size={size} />
        </div>
      ))}
    </div>
  );
}
