interface Props {
  label: string;
  subtitle?: string;
  photoCount: number;
  isLv30: boolean;
  opacity?: number;
}

export function DaySection({ label, subtitle, photoCount, isLv30, opacity = 1 }: Props) {
  return (
    <div className="flex items-center gap-3 mb-2.5 mt-3" style={{ opacity }}>
      <span
        className="font-extrabold tracking-tight flex-shrink-0"
        style={{
          fontSize: 20,
          color: isLv30 ? `rgba(255,255,255,${0.85 * opacity})` : `rgba(74,55,40,${0.9 * opacity})`,
          letterSpacing: '-0.3px',
        }}
      >
        {label}
      </span>
      {subtitle && (
        <span
          className="text-[11px] flex-shrink-0"
          style={{ color: isLv30 ? `rgba(255,255,255,${0.35 * opacity})` : `rgba(160,144,128,${0.9 * opacity})` }}
        >
          {subtitle}
        </span>
      )}
      <span
        className="text-[11px] flex-shrink-0"
        style={{ color: isLv30 ? `rgba(255,255,255,${0.3 * opacity})` : `rgba(180,160,140,${0.9 * opacity})` }}
      >
        {photoCount} 张
      </span>
      <div className="flex-1" style={{
        height: 1,
        background: isLv30
          ? `rgba(255,255,255,${0.06 * opacity})`
          : `rgba(120,100,80,${0.1 * opacity})`,
      }} />
    </div>
  );
}

export default DaySection;
