import { useOnlineStatus } from '../context/OnlineStatusContext';

interface Props {
  userId: number;
  size: number;
  borderWidth: number;
  glow?: boolean;
  className?: string;
}

export function OnlineStatusDot({ userId, size, borderWidth, glow, className = '' }: Props) {
  const { isOnline } = useOnlineStatus();
  const online = isOnline(userId);

  return (
    <span
      className={`absolute block rounded-full border-white ${className}`}
      style={{
        width: size,
        height: size,
        borderWidth,
        backgroundColor: online ? '#4caf50' : '#bfb8ae',
        boxShadow: online && glow ? '0 0 6px rgba(76,175,80,0.4)' : 'none',
        bottom: 0,
        right: 0,
      }}
    />
  );
}
