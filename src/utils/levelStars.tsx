/**
 * AZ-Chat 四级等级体系：星星 → 月亮 → 太阳 → 皇冠
 * 换算：1星=1级，3星=1月(3级)，3月=1日(9级)，3日=1冠(27级)
 */
import { Star, Moon, Sun, Crown } from 'lucide-react';

export interface StarDisplay {
  crowns: number;   // 皇冠 (27级/个 = 3³)
  suns: number;     // 太阳 (9级/个 = 3²)
  moons: number;    // 月亮 (3级/个 = 3¹)
  stars: number;    // 星星 (1级/个 = 3⁰)
}

/** 将用户等级换算为四级图标数量 */
export function calcStarDisplay(level: number): StarDisplay {
  const total = Math.max(0, level - 1); // LV1=0星
  const crowns = Math.floor(total / 27);
  const rem1 = total % 27;
  const suns = Math.floor(rem1 / 9);
  const rem2 = rem1 % 9;
  const moons = Math.floor(rem2 / 3);
  const stars = rem2 % 3;
  return { crowns, suns, moons, stars };
}

/** 各等级图标元数据（index 从低到高：星→月→日→冠，与渲染 tier 编号一致） */
export const TIER_META = [
  { key: 'star', icon: Star, label: '星', fill: '#fbbf24', className: 'text-amber-500', per: 1 },
  { key: 'moon', icon: Moon, label: '月', fill: '#818cf8', className: 'text-indigo-500', per: 3 },
  { key: 'sun', icon: Sun, label: '日', fill: '#f97316', className: 'text-orange-500', per: 9 },
  { key: 'crown', icon: Crown, label: '冠', fill: '#eab308', className: 'text-yellow-600', per: 27 },
] as const;

/** 纯图标渲染（用于列表、卡片等处的小尺寸显示） */
export function renderLevelIcons(level: number, size = 12) {
  const { crowns, suns, moons, stars } = calcStarDisplay(level);
  const icons: React.ReactNode[] = [];
  if (crowns > 0) icons.push(<span key="c" className="text-yellow-600">{crowns}<Crown size={size} className="inline-block -mt-0.5" fill="#eab308" /></span>);
  if (suns > 0) icons.push(<span key="su" className="text-orange-500">{suns}<Sun size={size} className="inline-block -mt-0.5" fill="#f97316" /></span>);
  if (moons > 0) icons.push(<span key="mo" className="text-indigo-500">{moons}<Moon size={size} className="inline-block -mt-0.5" fill="#818cf8" /></span>);
  if (stars > 0) icons.push(<span key="st" className="text-amber-500">{stars}<Star size={size} className="inline-block -mt-0.5" fill="#fbbf24" /></span>);
  if (icons.length === 0) icons.push(<span key="lv1" className="text-cream-400 text-[10px]">LV1</span>);
  return <span className="inline-flex items-center gap-0.5">{icons}</span>;
}

/** 完整星级展示（用于等级详情页的大尺寸展示） */
export function renderFullStars(level: number) {
  const { crowns, suns, moons, stars } = calcStarDisplay(level);
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {crowns > 0 && Array.from({ length: crowns }).map((_, i) => (
        <Crown key={`c${i}`} size={28} className="text-yellow-600 drop-shadow-md" fill="#eab308" />
      ))}
      {suns > 0 && Array.from({ length: suns }).map((_, i) => (
        <Sun key={`su${i}`} size={28} className="text-orange-500 drop-shadow-md" fill="#f97316" />
      ))}
      {moons > 0 && Array.from({ length: moons }).map((_, i) => (
        <Moon key={`mo${i}`} size={28} className="text-indigo-500 drop-shadow-md" fill="#818cf8" />
      ))}
      {stars > 0 && Array.from({ length: stars }).map((_, i) => (
        <Star key={`st${i}`} size={28} className="text-amber-500 drop-shadow-md" fill="#fbbf24" />
      ))}
      {level === 1 && <span className="text-cream-400 text-sm">LV1 新手上路</span>}
    </div>
  );
}
