import { motion } from 'framer-motion';
import { ArrowLeft, Check } from 'lucide-react';
import { useSmartBack } from '../../hooks/useSmartBack';
import { useAuth } from '../../context/AuthContext';
import { saveChatStyle } from '../../api/user';
import { CHAT_STYLES, type ChatStyleKey } from '../../components/effects/chatStyles';

export function ChatStylePage() {
  const goBack = useSmartBack('/profile');
  const { user, updateUser } = useAuth();
  const currentStyle: ChatStyleKey = (user?.chat_style || 'latte') as ChatStyleKey;
  const styles = Object.values(CHAT_STYLES);

  const handleSelect = async (key: ChatStyleKey) => {
    if (key === currentStyle) return;
    try {
      await saveChatStyle(key);
      updateUser({ chat_style: key });
    } catch { /* ignore */ }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[250] flex flex-col bg-cream-100"
        
      
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="flex items-center gap-3 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 border-b border-cream-200">
        <button onClick={goBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-cream-200 transition-colors">
          <ArrowLeft size={20} className="text-cream-800" />
        </button>
        <h1 className="font-display text-lg font-semibold text-cream-900">聊天界面风格</h1>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-5 flex flex-col gap-4">
        {styles.map(st => {
          const isActive = st.key === currentStyle;
          return (
            <button
              key={st.key}
              onClick={() => handleSelect(st.key)}
              className={`relative rounded-2xl overflow-hidden shadow-soft active:scale-[0.98] transition-all duration-200 ${isActive ? 'ring-2 ring-warm-500' : ''}`}
              style={{ background: '#fff' }}
            >
              {/* Chat preview area */}
              <div style={{ background: st.bg, height: 200, position: 'relative', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ background: st.headerBg, borderBottom: `1px solid ${st.otherBubbleBorder}`, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 6, backdropFilter: 'blur(8px)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#e0dcd4', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#4a3728' }}>张三</div>
                    <div style={{ fontSize: 8, color: '#a09080' }}>在线</div>
                  </div>
                </div>
                {/* Messages */}
                <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {/* Self message */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, flexDirection: 'row-reverse' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#e0dcd4', flexShrink: 0 }} />
                    <div style={{ background: st.selfBubbleGradient, color: st.selfText, padding: '6px 10px', borderRadius: '12px 12px 0 12px', fontSize: 10, maxWidth: '60%', lineHeight: 1.4, boxShadow: st.sendBtnShadow }}>今天天气真好呀</div>
                  </div>
                  {/* Other message */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#d8dcc8', flexShrink: 0 }} />
                    <div style={{ background: st.otherBubble, border: `1px solid ${st.otherBubbleBorder}`, color: st.otherText, padding: '6px 10px', borderRadius: '12px 12px 12px 0', fontSize: 10, maxWidth: '60%', lineHeight: 1.4, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>是啊，出去走走</div>
                  </div>
                  {/* Self message 2 */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, flexDirection: 'row-reverse' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#e0dcd4', flexShrink: 0 }} />
                    <div style={{ background: st.selfBubbleGradient, color: st.selfText, padding: '6px 10px', borderRadius: '12px 12px 0 12px', fontSize: 10, maxWidth: '60%', lineHeight: 1.4, boxShadow: st.sendBtnShadow }}>好的</div>
                  </div>
                </div>
                {/* Input */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: st.tabBarBg, borderTop: `1px solid ${st.tabBarBorder}`, padding: '6px 8px', display: 'flex', gap: 4, alignItems: 'flex-end' }}>
                  <div style={{ flex: 1, background: st.inputBg, border: `1px solid ${st.inputBorder}`, borderRadius: 16, padding: '6px 10px', fontSize: 9, color: '#aaa' }}>输入消息...</div>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: st.inputBg }} />
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: st.inputBg }} />
                </div>
              </div>
              {/* Label */}
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="text-[14px] font-semibold text-cream-900 text-left">{st.label}</div>
                  <div className="text-[11px] text-cream-500 text-left mt-0.5">{st.description}</div>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-warm-500 scale-100' : 'bg-cream-200 scale-75'}`}>
                  {isActive && <Check size={13} className="text-white" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
