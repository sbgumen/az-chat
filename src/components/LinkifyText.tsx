import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ExternalLink, X } from 'lucide-react';

// URL 正则：匹配完整 http/https 链接、www 开头、以及常见域名格式
const URL_RE = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]}>'")]|(?<![a-zA-Z0-9])www\.[^\s<]+[^\s<.,;:!?)\]}>'")]|(?<![a-zA-Z0-9])[a-zA-Z0-9][-a-zA-Z0-9]*\.(?:com|cn|net|org|edu|gov|io|co|me|info|biz|cc|tv|xyz|top|dev|app|site|online|store|tech|club|live|news|blog|shop|wiki|link)(?:\/[^\s<]*)?)/gi;

/** 判断链接是否为本网站 */
function isInternal(url: string): boolean {
  try {
    const host = new URL(url.startsWith('http') ? url : 'https://' + url).hostname;
    const current = window.location.hostname;
    return host === current || host.endsWith('.' + current);
  } catch {
    return true; // 解析失败默认当作内部链接，不弹窗
  }
}

/** 规范化 URL（补协议） */
function normalizeUrl(raw: string): string {
  if (/^https?:\/\//i.test(raw)) return raw;
  return 'https://' + raw;
}

interface LinkifyTextProps {
  text: string;
  className?: string;
  inline?: boolean;
  linkColor?: string;
}

export function LinkifyText({ text, className, inline, linkColor }: LinkifyTextProps) {
  const [confirmUrl, setConfirmUrl] = useState<string | null>(null);

  const parts: { type: 'text' | 'link'; content: string }[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  URL_RE.lastIndex = 0;
  while ((match = URL_RE.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push({ type: 'text', content: text.slice(lastIdx, match.index) });
    }
    parts.push({ type: 'link', content: match[0] });
    lastIdx = URL_RE.lastIndex;
  }
  if (lastIdx < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIdx) });
  }

  const handleLinkClick = (e: React.MouseEvent, rawUrl: string) => {
    e.stopPropagation();
    e.preventDefault();
    const url = normalizeUrl(rawUrl);
    if (isInternal(rawUrl)) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      setConfirmUrl(url);
    }
  };

  if (parts.length === 0) {
    return <>{text}</>;
  }

  const lc = linkColor || '#2563eb';
  const linkEls = parts.map((p, i) =>
    p.type === 'link' ? (
      <a
        key={i}
        href={normalizeUrl(p.content)}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 active:opacity-70 cursor-pointer"
        style={{ color: lc }}
        onClick={(e) => handleLinkClick(e, p.content)}
      >
        {p.content}
      </a>
    ) : (
      <span key={i}>{p.content}</span>
    )
  );

  return (
    <>
      {inline ? <>{linkEls}</> : <p className={className}>{linkEls}</p>}

      {/* 安全弹窗 — Portal 到 body 避免 <p> 嵌套问题 */}
      {confirmUrl && createPortal(
        <AnimatePresence>
          <motion.div
            className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setConfirmUrl(null)}
          >
            <motion.div
              className="bg-white rounded-2xl mx-4 max-w-[320px] w-full overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <AlertTriangle size={16} className="text-amber-500" strokeWidth={2.5} />
                  </div>
                  <span className="font-semibold text-[15px] text-cream-900">即将离开 AZ-Chat</span>
                </div>
                <button onClick={() => setConfirmUrl(null)} className="p-1"><X size={16} className="text-cream-400" /></button>
              </div>
              <div className="px-5 py-3 pb-3">
                <p className="text-[12px] text-cream-500 mb-2">您即将跳转到以下外部链接：</p>
                <div className="bg-cream-50 rounded-xl px-3 py-2.5 text-[12px] text-cream-700 break-all border border-cream-200/60 select-all">
                  {confirmUrl}
                </div>
                <p className="text-[11px] text-cream-400 mt-2 leading-relaxed">
                  请注意网络安全，谨防钓鱼、诈骗等风险。AZ-Chat 不对第三方网站内容负责。
                </p>
              </div>
              <div className="flex border-t border-cream-100">
                <button onClick={() => setConfirmUrl(null)} className="flex-1 py-3 text-[14px] text-cream-600 font-medium active:bg-cream-50">取消</button>
                <div className="w-px bg-cream-100" />
                <button onClick={() => { window.open(confirmUrl, '_blank', 'noopener,noreferrer'); setConfirmUrl(null); }}
                  className="flex-1 py-3 text-[14px] text-blue-500 font-semibold active:bg-blue-50 flex items-center justify-center gap-1.5">
                  <ExternalLink size={14} />继续访问
                </button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
