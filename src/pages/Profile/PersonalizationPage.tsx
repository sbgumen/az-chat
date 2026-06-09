import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, Image, Palette, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSmartBack } from '../../hooks/useSmartBack';
import { useAuth } from '../../context/AuthContext';
import { HOME_STYLES, type HomeStyle } from '../../components/effects/lv30Styles';
import { CHAT_STYLES, type ChatStyleKey } from '../../components/effects/chatStyles';
import { BANNER_PRESETS } from './bannerPresets';

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;

export function PersonalizationPage() {
  const navigate = useNavigate();
  const goBack = useSmartBack('/profile');
  const { user } = useAuth();

  const bannerType = user?.banner_type || 'default';
  const bannerPreset = user?.banner_preset;
  const bannerImage = user?.banner_image;
  const currentStyle: HomeStyle = (localStorage.getItem('az_lv30_style') || user?.lv30_style || 'original') as HomeStyle;
  const stylePalette = HOME_STYLES[currentStyle] || HOME_STYLES.original;

  const currentChatStyle: ChatStyleKey = (user?.chat_style || 'latte') as ChatStyleKey;
  const chatStyleDef = CHAT_STYLES[currentChatStyle] || CHAT_STYLES.latte;

  // Banner preview style
  const defaultBannerStyle = BANNER_PRESETS.sunrise?.style || {};
  const bannerPreviewStyle: React.CSSProperties = bannerType === 'custom' && bannerImage
    ? { backgroundImage: `url(${bannerImage?.startsWith('http') ? bannerImage : `${apiBase}${bannerImage}`})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : bannerType === 'preset' && bannerPreset && BANNER_PRESETS[bannerPreset]
      ? { ...BANNER_PRESETS[bannerPreset].style }
      : ({ ...defaultBannerStyle } as React.CSSProperties);

  const bannerLabel = bannerType === 'custom' ? '自定义'
    : bannerType === 'preset' && bannerPreset && BANNER_PRESETS[bannerPreset]
      ? BANNER_PRESETS[bannerPreset].name
      : '默认';

  return (
    <motion.div
      className="fixed inset-0 z-[250] flex flex-col bg-cream-100"
        
      
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 border-b border-cream-200">
        <button onClick={goBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-cream-200 transition-colors">
          <ArrowLeft size={20} className="text-cream-800" />
        </button>
        <h1 className="font-display text-lg font-semibold text-cream-900">个性化设置</h1>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-5 flex flex-col gap-3">
        {/* Card 1: Banner */}
        <button
          onClick={() => navigate('/profile/personalization/banner')}
          className="relative rounded-3xl overflow-hidden shadow-soft active:scale-[0.98] transition-transform"
          style={{ background: '#fff' }}
        >
          {/* Preview area */}
          <div className="h-[110px] relative overflow-hidden" style={bannerPreviewStyle}>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.15) 60%, rgba(0,0,0,0.02) 100%)' }} />
            <div className="absolute bottom-3 left-4">
              <span className="text-[15px] font-bold text-[#3d2b1a]">背景图设置</span>
            </div>
          </div>
          {/* Info bar */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(200,149,108,0.08)' }}>
                <Image size={15} className="text-warm-500" />
              </div>
              <span className="text-[13px] text-cream-500">当前: {bannerLabel}</span>
            </div>
            <ChevronRight size={16} className="text-cream-400" />
          </div>
        </button>

        {/* Card 2: Home Style */}
        <button
          onClick={() => navigate('/profile/personalization/style')}
          className="relative rounded-3xl overflow-hidden shadow-soft active:scale-[0.98] transition-transform"
          style={{ background: '#fff' }}
        >
          {/* Gradient preview */}
          <div className="h-[110px] relative overflow-hidden" style={{ background: stylePalette.bgGradient }}>
            {stylePalette.isDark && (
              <>
                <div className="absolute -top-6 -left-4 w-[60%] h-[70%] rounded-full blur-2xl"
                  style={{ background: stylePalette.previewPrimary, opacity: 0.25 }} />
                <div className="absolute -bottom-4 -right-4 w-[50%] h-[60%] rounded-full blur-2xl"
                  style={{ background: stylePalette.previewSecondary, opacity: 0.2 }} />
              </>
            )}
            <div className="absolute inset-0" style={{
              background: stylePalette.isDark
                ? 'linear-gradient(0deg, rgba(0,0,0,0.35) 0%, transparent 55%, transparent 100%)'
                : 'linear-gradient(0deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.1) 60%, transparent 100%)'
            }} />
            <div className="absolute bottom-3 left-4">
              <span className="text-[15px] font-bold" style={{ color: stylePalette.isDark ? '#fff' : '#3d2b1a' }}>主页风格</span>
            </div>
          </div>
          {/* Info bar */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: stylePalette.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(200,149,108,0.08)' }}>
                <Palette size={15} style={{ color: stylePalette.previewPrimary }} />
              </div>
              <span className="text-[13px] text-cream-500">当前: {stylePalette.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: stylePalette.previewPrimary }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: stylePalette.previewSecondary }} />
                {stylePalette.isDark && (
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: stylePalette.ringOuter.split(',')[1]?.match(/rgba\([^)]+\)/)?.[0] || stylePalette.previewPrimary }} />
                )}
              </div>
              <ChevronRight size={14} className="text-cream-400 ml-0.5" />
            </div>
          </div>
        </button>

        {/* Card 3: Chat Style */}
        <button
          onClick={() => navigate('/profile/personalization/chat-style')}
          className="relative rounded-3xl overflow-hidden shadow-soft active:scale-[0.98] transition-transform"
          style={{ background: '#fff' }}
        >
          {/* Preview area — simplified chat layout */}
          <div className="h-[110px] relative overflow-hidden" style={{ background: chatStyleDef.bg }}>
            <div className="absolute inset-0 flex flex-col">
              <div style={{ background: chatStyleDef.headerBg, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4, backdropFilter: 'blur(8px)' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#e0dcd4' }} />
                <div style={{ fontSize: 9, color: '#666', fontWeight: 600 }}>联系人</div>
              </div>
              <div style={{ flex: 1, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ display: 'flex', gap: 4, flexDirection: 'row-reverse' }}>
                  <div style={{ background: chatStyleDef.selfBubbleGradient, color: chatStyleDef.selfText, padding: '3px 7px', borderRadius: '8px 8px 0 8px', fontSize: 8, maxWidth: '55%' }}>你好呀</div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <div style={{ background: chatStyleDef.otherBubble, border: `1px solid ${chatStyleDef.otherBubbleBorder}`, color: chatStyleDef.otherText, padding: '3px 7px', borderRadius: '8px 8px 8px 0', fontSize: 8, maxWidth: '55%' }}>好久不见</div>
                </div>
              </div>
              <div style={{ background: chatStyleDef.tabBarBg, borderTop: `1px solid ${chatStyleDef.tabBarBorder}`, padding: '4px 8px', display: 'flex', gap: 3 }}>
                <div style={{ flex: 1, background: chatStyleDef.inputBg, border: `1px solid ${chatStyleDef.inputBorder}`, borderRadius: 10, padding: '4px 8px', fontSize: 8, color: '#aaa' }}>输入消息...</div>
              </div>
            </div>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.1) 60%, transparent 100%)' }} />
            <div className="absolute bottom-3 left-4">
              <span className="text-[15px] font-bold text-[#3d2b1a]">聊天界面风格</span>
            </div>
          </div>
          {/* Info bar */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(200,149,108,0.08)' }}>
                <MessageCircle size={15} className="text-warm-500" />
              </div>
              <span className="text-[13px] text-cream-500">当前: {chatStyleDef.label}</span>
            </div>
            <ChevronRight size={14} className="text-cream-400" />
          </div>
        </button>
      </div>
    </motion.div>
  );
}
