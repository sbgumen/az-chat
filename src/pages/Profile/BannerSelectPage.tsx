import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Upload } from 'lucide-react';
import { useSmartBack } from '../../hooks/useSmartBack';
import { useAuth } from '../../context/AuthContext';
import { uploadBanner, saveBannerSettings, getBannerCustomUrls, saveBannerCustomUrl, deleteBannerCustomUrl, getProfile } from '../../api/user';
import { BANNER_PRESETS } from './bannerPresets';
import { RemoteImage } from '../../components/RemoteImage';
import { SafeImg } from '../../components/SafeImg';
import { CanvasBanner } from '../../components/effects/CanvasBanner';

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const getAvatar = (a: string) => a?.startsWith('http') ? a : `${apiBase}${a}`;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-warm-500 mb-2.5 px-1">
      {children}
    </h3>
  );
}

export function BannerSelectPage() {
  const goBack = useSmartBack('/profile/personalization');
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<'select' | 'crop'>('select');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const [bannerType, setBannerType] = useState(user?.banner_type || 'default');
  const [bannerPreset, setBannerPreset] = useState(user?.banner_preset || null);
  const [bannerImage, setBannerImage] = useState(user?.banner_image || null);
  const [customUrls, setCustomUrls] = useState<string[]>([]);


  // Load latest banner data + custom URLs from server on mount
  useEffect(() => {
    (async () => {
      try {
        const [profileRes, urlsRes]: any[] = await Promise.all([getProfile(), getBannerCustomUrls()]);
        if (profileRes.code === 0) {
          setBannerType(profileRes.data.banner_type || 'default');
          setBannerPreset(profileRes.data.banner_preset || null);
          setBannerImage(profileRes.data.banner_image || null);

          // Also update AuthContext user
          if (user) {
            user.banner_type = profileRes.data.banner_type || 'default';
            user.banner_preset = profileRes.data.banner_preset || null;
            user.banner_image = profileRes.data.banner_image || null;
          }
        }
        if (urlsRes.code === 0) setCustomUrls(urlsRes.data || []);
      } catch { }
    })();
  }, []);

  // Crop state — MUST be state (not ref) so React re-renders on drag
  const [cropSrc, setCropSrc] = useState('');
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropScale, setCropScale] = useState(1);
  const [cropSliderVal, setCropSliderVal] = useState(50);
  const cropImgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef({ sx: 0, sy: 0, ox: 0, oy: 0, active: false });
  const pinchRef = useRef(0);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const handleSelectPreset = async (key: string) => {
    setSaving(true);
    try {
      const res: any = await saveBannerSettings({ banner_type: 'preset', banner_preset: key });
      if (res.code === 0) {
        setBannerType('preset');
        setBannerPreset(key);
        setBannerImage(null);
        updateUser({ banner_type: 'preset', banner_preset: key, banner_image: null as any });
        showToast('背景图已更新');
      }
    } catch { showToast('保存失败'); }
    setSaving(false);
  };

  const handleApplyCustom = async (url: string, returnToSelect = false) => {
    setSaving(true);
    try {
      const res: any = await saveBannerSettings({ banner_type: 'custom', banner_image: url });
      if (res.code === 0) {
        setBannerType('custom');
        setBannerImage(url);
        setBannerPreset(null);
        updateUser({ banner_type: 'custom', banner_image: url, banner_preset: null as any });
        showToast('背景图已更新');
        if (returnToSelect) setMode('select');
      }
    } catch { showToast('保存失败'); }
    setSaving(false);
  };

  const handleRemove = async () => {
    setSaving(true);
    try {
      await saveBannerSettings({ banner_type: 'default' });
      setBannerType('default');
      setBannerPreset(null);
      setBannerImage(null);
      updateUser({ banner_type: 'default', banner_preset: null as any, banner_image: null as any });
      showToast('已恢复默认背景');
    } catch { showToast('操作失败'); }
    setSaving(false);
  };


  const handleDeleteCustom = async (url: string, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('删除这张背景图？')) return;
    try {
      const res: any = await deleteBannerCustomUrl(url);
      if (res.code === 0) {
        setCustomUrls(res.data || []);
        if (bannerImage === url) {
          setBannerType('default');
          setBannerImage(null);
          updateUser({ banner_type: 'default', banner_image: null as any });
          await saveBannerSettings({ banner_type: 'default' });
        }
        showToast('已删除');
      }
    } catch { showToast('删除失败'); }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCropSrc(url);
    setCropX(0);
    setCropY(0);
    setCropScale(1);
    setCropSliderVal(50);
    setMode('crop');
    e.target.value = '';
  };

  // Shared drag/pinch logic for both mouse and touch
  const onDragStart = useCallback((cx: number, cy: number) => {
    dragRef.current = { sx: cx, sy: cy, ox: cropX, oy: cropY, active: true };
  }, [cropX, cropY]);

  const onDragMove = useCallback((cx: number, cy: number) => {
    const d = dragRef.current;
    if (!d.active) return;
    setCropX(d.ox + (cx - d.sx));
    setCropY(d.oy + (cy - d.sy));
  }, []);

  const onDragEnd = useCallback(() => {
    dragRef.current.active = false;
    pinchRef.current = 0;
  }, []);

  const onZoom = useCallback((delta: number) => {
    setCropScale(s => {
      const ns = Math.max(0.5, Math.min(3, s + delta));
      setCropSliderVal(Math.round((ns - 0.5) / 2.5 * 100));
      return ns;
    });
  }, []);

  const onSlider = (val: number) => {
    const s = 0.5 + (val / 100) * 2.5;
    setCropScale(s);
    setCropSliderVal(val);
  };

  const handleCropDone = async () => {
    const img = cropImgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const containerW = img.width;                 // image display width (100% of container)
    const containerH = img.height;               // image display height (auto)
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    const s = cropScale;

    // Display dimensions after scale transform
    const dispW = containerW * s;
    const dispH = containerH * s;

    // Image is positioned with CSS: left:50% top:50% + translate(cropX,cropY) scale(s) translate(-50%,-50%)
    // Effective top-left of image on screen:
    const imgTLX = containerW / 2 - dispW / 2 + cropX;
    const imgTLY = containerH / 2 - dispH / 2 + cropY;

    // Crop frame: full width, centered vertically, 3:1 ratio
    const frameW = containerW;
    const frameH = containerW / 3;
    const frameTop = containerH / 2 - frameH / 2;

    // Map from screen to natural coordinates
    const scaleX = natW / dispW;
    const scaleY = natH / dispH;

    const sx = (0 - imgTLX) * scaleX;
    const sy = (frameTop - imgTLY) * scaleY;
    const sw = frameW * scaleX;
    const sh = frameH * scaleY;

    // Clamp to image bounds
    const cx = Math.max(0, Math.min(natW - sw, sx));
    const cy = Math.max(0, Math.min(natH - sh, sy));
    const cw = Math.min(natW - cx, sw);
    const ch = Math.min(natH - cy, sh);

    canvas.width = Math.round(cw);
    canvas.height = Math.round(ch);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, cx, cy, cw, ch, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return showToast('裁剪失败');
      try {
        const file = new File([blob], 'banner.jpg', { type: 'image/jpeg' });
        const upRes: any = await uploadBanner(file);
        if (upRes.code === 0) {
          const url = upRes.data.url;
          try { const cr: any = await saveBannerCustomUrl(url); if (cr.code === 0) setCustomUrls(cr.data || []); } catch { }
          await handleApplyCustom(url, true);
        } else {
          showToast(upRes.message || '上传失败');
        }
      } catch { showToast('上传失败'); }
    }, 'image/jpeg', 0.9);
  };

  // Build style objects that use state (not ref) for reactivity
  const imgTransform = `translate(${cropX}px, ${cropY}px) scale(${cropScale})`;

  const defaultBannerStyle = BANNER_PRESETS.sunrise.style;
  const currentStyle: React.CSSProperties = bannerType === 'custom' && bannerImage
    ? { backgroundImage: `url(${getAvatar(bannerImage)})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : bannerType === 'preset' && bannerPreset && BANNER_PRESETS[bannerPreset]
      ? { ...BANNER_PRESETS[bannerPreset].style }
      : (defaultBannerStyle as React.CSSProperties);

  return (
    <motion.div className="fixed inset-0 z-[250] flex flex-col bg-[#f5efe4]"
      
      
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}>

      <AnimatePresence>
        {toast && (
          <motion.div className="fixed top-20 left-1/2 -translate-x-1/2 z-[500] px-5 py-2.5 rounded-full bg-gray-900/90 text-white text-sm font-medium whitespace-nowrap"
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {mode === 'select' ? (
        <>
          <header className="flex items-center justify-between px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 flex-shrink-0">
            <button onClick={goBack} className="p-1.5 -ml-1 rounded-xl hover:bg-black/5 transition-colors">
              <ArrowLeft size={20} className="text-[#5c4330]" />
            </button>
            <h1 className="text-[17px] font-bold text-[#2a1a0a]">选择背景图</h1>
            <div className="w-8" />
          </header>

          <div className="flex-1 overflow-y-auto">
            {/* Real-time preview */}
            <div className="mx-4 mt-2 rounded-2xl overflow-hidden relative h-[130px]">
              {bannerType === 'preset' && bannerPreset ? (
                <CanvasBanner preset={bannerPreset as any} />
              ) : bannerType === 'custom' && bannerImage ? (
                <SafeImg src={bannerImage.startsWith('http') ? bannerImage : `${apiBase}${bannerImage}`} alt="" className="w-full h-full object-cover" />
              ) : bannerType === 'default' ? (
                <CanvasBanner preset="sunrise" />
              ) : (
                <CanvasBanner preset="sunrise" />
              )}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, rgba(245,239,228,1) 0%, rgba(245,239,228,0.3) 60%, rgba(0,0,0,0.04) 100%)' }} />
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-end gap-2.5">
                <RemoteImage src={user?.avatar ? getAvatar(user.avatar) : 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} alt=""
                  className="w-10 h-10 rounded-full border-2 border-white/70 shadow-md object-cover bg-cream-300"
                  onError={e => { (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'; }} />
                <div>
                  <div className="text-[13px] font-bold text-[#2a1a0a]">{user?.nickname || '用户名'}</div>
                  <div className="text-[9px] text-[#8b6f50]">预览效果</div>
                </div>
              </div>
            </div>

            {/* System Presets */}
            <div className="mx-4 mt-4">
              <SectionLabel>系统预设</SectionLabel>
              <div className="grid grid-cols-3 gap-2.5">
                {Object.entries(BANNER_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => handleSelectPreset(key)}
                    disabled={saving}
                    className="relative rounded-xl h-[68px] overflow-hidden active:opacity-80 transition-all disabled:opacity-50"
                  >
                    <CanvasBanner preset={key as any} />
                    {bannerType === 'preset' && bannerPreset === key && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white/60 flex items-center justify-center z-10">
                        <Check size={12} className="text-[#5c4330]" />
                      </div>
                    )}
                    <div className="absolute bottom-1.5 left-2 text-[8px] font-semibold z-10"
                      style={{ color: key === 'starry' ? 'rgba(255,255,255,0.6)' : '#5c4330' }}>
                      {preset.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Upload */}
            <div className="mx-4 mt-4">
              <SectionLabel>自定义</SectionLabel>

              {/* Upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-5 rounded-xl border-[1.5px] border-dashed flex flex-col items-center gap-2 active:opacity-70 transition-opacity"
                style={{ borderColor: 'rgba(201,149,107,0.4)', background: 'rgba(201,149,107,0.03)' }}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(201,149,107,0.1)' }}>
                  <Upload size={18} className="text-warm-500" />
                </div>
                <div className="text-[13px] font-semibold text-[#5c4330]">从相册中选择图片</div>
                <div className="text-[10px] text-[#a09080]">支持 JPG、PNG，建议横图</div>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelected} />

              {/* Previously uploaded custom backgrounds */}
              {customUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2.5 mt-2.5">
                  {customUrls.map((url, i) => (
                    <div key={url} className="relative rounded-xl h-[68px] overflow-hidden group"
                      style={{ backgroundImage: `url(${getAvatar(url)})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                      {/* Tap to apply */}
                      <button onClick={() => handleApplyCustom(url)} disabled={saving}
                        className="absolute inset-0 disabled:opacity-50" />
                      <div className="absolute inset-0 bg-black/15 pointer-events-none" />
                      {/* Check indicator */}
                      {bannerType === 'custom' && bannerImage === url && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white/60 flex items-center justify-center pointer-events-none">
                          <Check size={12} className="text-[#5c4330]" />
                        </div>
                      )}
                      {/* Delete button on hover/right-click */}
                      <button
                        onClick={(e) => handleDeleteCustom(url, e)}
                        onContextMenu={(e) => handleDeleteCustom(url, e)}
                        className="absolute top-1 left-1 w-5 h-5 rounded-full bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="长按或右键删除"
                      >
                        <span style={{ color: '#fff', fontSize: 10, lineHeight: 1, fontWeight: 700 }}>×</span>
                      </button>
                      <div className="absolute bottom-1.5 left-2 text-[8px] font-semibold text-white pointer-events-none">
                        {i === 0 ? '最新' : `历史`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Current background */}
            <div className="mx-4 mt-4 mb-8">
              <div className="flex items-center justify-between mb-2.5">
                <SectionLabel>当前背景</SectionLabel>
                {bannerType !== 'default' && (
                  <button onClick={handleRemove} disabled={saving}
                    className="text-[11px] text-[#c4876b] font-semibold px-1">移除背景</button>
                )}
              </div>
              <div className="h-14 rounded-xl" style={currentStyle} />
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Crop Mode */}
          <div className="absolute inset-0 z-10 bg-[#111] flex flex-col">
            <div className="flex items-center justify-between px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 flex-shrink-0">
              <button onClick={() => setMode('select')} className="text-[13px] text-white/60 font-medium">取消</button>
              <div className="text-[12px] font-bold text-white tracking-[1px]">裁剪背景图</div>
              <button onClick={handleCropDone} className="text-[13px] text-warm-500 font-bold">完成</button>
            </div>

            {/* Crop area */}
            <div
              className="flex-1 relative overflow-hidden"
              style={{ touchAction: 'none' }}
              onMouseDown={e => { e.preventDefault(); onDragStart(e.clientX, e.clientY); }}
              onMouseMove={e => { e.preventDefault(); onDragMove(e.clientX, e.clientY); }}
              onMouseUp={e => { e.preventDefault(); onDragEnd(); }}
              onMouseLeave={onDragEnd}
              onTouchStart={e => {
                if (e.touches.length === 2) {
                  pinchRef.current = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY);
                } else {
                  onDragStart(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              onTouchMove={e => {
                if (e.touches.length === 2) {
                  const dist = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY);
                  if (pinchRef.current > 0) onZoom((dist - pinchRef.current) / 300);
                  pinchRef.current = dist;
                } else if (dragRef.current.active) {
                  onDragMove(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              onTouchEnd={onDragEnd}>

              {/* Background filler */}
              <div className="absolute inset-0 bg-[#222]" />

              {cropSrc && (
                <img ref={cropImgRef} src={cropSrc} alt=""
                  draggable={false}
                  style={{
                    position: 'absolute',
                    left: '50%', top: '50%',
                    width: '100%', height: 'auto',
                    transform: `${imgTransform} translate(-50%, -50%)`,
                    transformOrigin: 'center center',
                    userSelect: 'none', pointerEvents: 'none',
                  }}
                />
              )}

              {/* Dark overlays */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'linear-gradient(0deg, rgba(0,0,0,0.65) 0%, transparent 38%, transparent 62%, rgba(0,0,0,0.65) 100%)'
              }} />

              {/* Crop frame (3:1) */}
              <div className="absolute left-0 right-0 pointer-events-none"
                style={{ top: '50%', height: 'calc(100vw / 3)', transform: 'translateY(-50%)' }}>
                <div style={{ position: 'absolute', top: -1, left: -1, width: 20, height: 20, borderTop: '3px solid #fff', borderLeft: '3px solid #fff', borderRadius: '4px 0 0 0' }} />
                <div style={{ position: 'absolute', top: -1, right: -1, width: 20, height: 20, borderTop: '3px solid #fff', borderRight: '3px solid #fff', borderRadius: '0 4px 0 0' }} />
                <div style={{ position: 'absolute', bottom: -1, left: -1, width: 20, height: 20, borderBottom: '3px solid #fff', borderLeft: '3px solid #fff', borderRadius: '0 0 0 4px' }} />
                <div style={{ position: 'absolute', bottom: -1, right: -1, width: 20, height: 20, borderBottom: '3px solid #fff', borderRight: '3px solid #fff', borderRadius: '0 0 4px 0' }} />
                <div style={{ position: 'absolute', top: 0, left: '33%', width: 1, height: '100%', background: 'rgba(255,255,255,0.15)' }} />
                <div style={{ position: 'absolute', top: 0, left: '66%', width: 1, height: '100%', background: 'rgba(255,255,255,0.15)' }} />
                <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: 1, background: 'rgba(255,255,255,0.15)' }} />
              </div>
            </div>

            {/* Controls */}
            <div className="flex-shrink-0 bg-[#1a1a1a] px-5 pb-6 pt-3">
              <div className="text-[11px] text-white/40 text-center mb-3">拖动图片调整位置 · 双指缩放</div>
              <div className="flex items-center gap-3">
                <span className="text-lg text-white/40">-</span>
                <input type="range" min={0} max={100} value={cropSliderVal} onChange={e => onSlider(Number(e.target.value))}
                  className="flex-1 h-1 rounded-full appearance-none"
                  style={{ accentColor: '#c9956b', background: 'rgba(255,255,255,0.15)' }} />
                <span className="text-lg text-white/40">+</span>
              </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />
          </div>
        </>
      )}
    </motion.div>
  );
}
