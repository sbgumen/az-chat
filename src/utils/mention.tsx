import type { ReactNode } from 'react';
import { LinkifyText } from '../components/LinkifyText';

/** 解析 @[userId:nickname] 格式，渲染为彩色 @昵称（可点击跳转） */
export function renderMentionContent(text: string, onMentionClick?: (userId: number) => void, linkColor?: string, mentionColor?: string): ReactNode {
  if (!text) return null;
  const mc = mentionColor || '#4169E1';
  const lc = linkColor || '#2563eb';
  const parts = text.split(/(@\[\d+:[^\]]+\])/g);
  return parts.map((part, i) => {
    const m = part.match(/^@\[(\d+):([^\]]+)\]$/);
    if (m) {
      const userId = parseInt(m[1]);
      return (
        <span
          key={i}
          style={{ color: mc, fontWeight: 600, cursor: onMentionClick ? 'pointer' : 'default' }}
          onClick={onMentionClick ? (e) => { e.stopPropagation(); onMentionClick(userId); } : undefined}
        >
          @{m[2]}
        </span>
      );
    }
    return <LinkifyText key={i} text={part} inline linkColor={lc} />;
  });
}

/** 纯文本版本：去除 @mention 标记，只保留 @昵称 */
export function mentionToPlainText(text: string): string {
  if (!text) return '';
  return text.replace(/@\[(\d+):([^\]]+)\]/g, '@$2');
}
