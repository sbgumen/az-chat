import { RemoteImage } from '../../components/RemoteImage';
import { CanvasBackground } from '../../components/CanvasBackground';
import { CardDecoration } from '../../components/CardDecoration';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Camera, Plus, AlertCircle, ChevronRight, Palette } from 'lucide-react';
import { updateProfile, uploadAvatar, getProfile } from '../../api/user';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSmartBack } from '../../hooks/useSmartBack';

// 字段错误类型
type FieldErrors = {
  nickname?: string;
  weight?: string;
  height?: string;
  birthday?: string;
  signature?: string;
  tags?: string;
};

// 自定义滚轮日期选择器
function DatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const now = new Date();
  const [showPicker, setShowPicker] = useState(false);
  const parsed = value ? new Date(value + 'T00:00:00') : null;
  const [year, setYear] = useState(parsed?.getFullYear() ?? now.getFullYear() - 20);
  const [month, setMonth] = useState((parsed?.getMonth() ?? 0) + 1);
  const [day, setDay] = useState(parsed?.getDate() ?? 1);

  const years = Array.from({ length: 100 }, (_, i) => now.getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const safeDay = Math.min(day, daysInMonth);

  const confirm = () => {
    const str = `${year}-${String(month).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
    onChange(str);
    setShowPicker(false);
  };

  const displayValue = value
    ? `${value.slice(0, 4)}年${parseInt(value.slice(5, 7))}月${parseInt(value.slice(8, 10))}日`
    : '请选择生日';

  return (
    <>
      <button type="button" onClick={() => setShowPicker(true)}
        className={`w-full text-left text-sm ${value ? 'text-cream-900' : 'text-cream-400'}`}>
        {displayValue}
      </button>
      <AnimatePresence>
        {showPicker && (
          <>
            <motion.div className="fixed inset-0 z-[400] bg-black/40"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPicker(false)} />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-[401] bg-white rounded-t-3xl shadow-2xl"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-cream-100">
                <button onClick={() => setShowPicker(false)} className="text-cream-500 text-sm">取消</button>
                <span className="text-sm font-semibold text-cream-900">选择生日</span>
                <button onClick={confirm} className="text-warm-500 text-sm font-semibold">确定</button>
              </div>
              <div className="flex px-4 py-4 gap-2 h-52">
                <WheelColumn items={years} selected={year} onSelect={setYear} suffix="年" />
                <WheelColumn items={months} selected={month} onSelect={setMonth} suffix="月" />
                <WheelColumn items={days} selected={safeDay} onSelect={setDay} suffix="日" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function WheelColumn({ items, selected, onSelect, suffix }: {
  items: number[]; selected: number; onSelect: (v: number) => void; suffix: string;
}) {
  const ITEM_H = 40;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const idx = items.indexOf(selected);
    if (idx >= 0 && containerRef.current) {
      containerRef.current.scrollTop = idx * ITEM_H;
    }
  }, [selected, items]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const idx = Math.round(containerRef.current.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(idx, items.length - 1));
    if (items[clamped] !== selected) onSelect(items[clamped]);
  };

  return (
    <div className="flex-1 relative overflow-hidden">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 bg-cream-100/70 rounded-xl pointer-events-none z-0 border-y border-cream-200" />
      <div ref={containerRef} className="h-full overflow-y-scroll scrollbar-hide snap-y snap-mandatory"
        style={{ scrollSnapType: 'y mandatory' }} onScroll={handleScroll}>
        <div style={{ height: `calc(50% - ${ITEM_H / 2}px)` }} />
        {items.map(item => (
          <div key={item}
            className={`flex items-center justify-center h-10 text-sm font-medium snap-center cursor-pointer transition-colors ${item === selected ? 'text-cream-900' : 'text-cream-400'}`}
            style={{ scrollSnapAlign: 'center' }}
            onClick={() => {
              onSelect(item);
              const idx = items.indexOf(item);
              containerRef.current?.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' });
            }}
          >
            {item}{suffix}
          </div>
        ))}
        <div style={{ height: `calc(50% - ${ITEM_H / 2}px)` }} />
      </div>
    </div>
  );
}

// 字段错误提示组件
function FieldError({ msg }: { msg?: string }) {
  return (
    <AnimatePresence>
      {msg && (
        <motion.div
          className="flex items-center gap-1 mt-1.5"
          initial={{ opacity: 0, y: -4, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -4, height: 0 }}
          transition={{ duration: 0.18 }}
        >
          <AlertCircle size={12} className="text-red-500 shrink-0" />
          <span className="text-[11px] text-red-500">{msg}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function EditProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const goBack = useSmartBack('/profile');
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // field refs for scroll-to-error
  const nicknameRef = useRef<HTMLDivElement>(null);
  const weightRef = useRef<HTMLDivElement>(null);
  const heightRef = useRef<HTMLDivElement>(null);
  const signatureRef = useRef<HTMLDivElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);

  const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
  const getAvatar = (a: string) => a?.startsWith('http') ? a : `${apiBase}${a}`;

  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [gender, setGender] = useState<number>(user?.gender ?? 0);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [birthday, setBirthday] = useState('');
  const [signature, setSignature] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [avatarSrc, setAvatarSrc] = useState(
    user?.avatar ? getAvatar(user.avatar) : 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
  );
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState('');
  const initialRef = useRef<any>(null);
  const composingRef = useRef(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res: any = await getProfile();
        if (res.code === 0 && res.data) {
          const d = res.data;
          if (d.weight) setWeight(String(d.weight));
          if (d.height) setHeight(String(d.height));
          if (d.birthday) setBirthday(d.birthday.slice(0, 10));
          if (d.signature) setSignature(d.signature);
          let parsedTags: string[] = [];
          if (d.tags) {
            const parsed = typeof d.tags === 'string' ? JSON.parse(d.tags) : d.tags;
            if (Array.isArray(parsed)) { setTags(parsed); parsedTags = parsed; }
          }
          if (d.nickname) setNickname(d.nickname);
          if (d.gender !== undefined) setGender(d.gender);
          initialRef.current = {
            nickname: d.nickname ?? '', gender: d.gender ?? 0,
            weight: d.weight ? String(d.weight) : '',
            height: d.height ? String(d.height) : '',
            birthday: d.birthday ? d.birthday.slice(0, 10) : '',
            signature: d.signature ?? '',
            tags: parsedTags,
          };
        }
      } catch { /* ignore */ }
    };
    load();
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setAvatarSrc(preview);
    try {
      const res: any = await uploadAvatar(file);
      if (res.code === 0 && res.data?.avatar) {
        updateUser({ avatar: res.data.avatar });
      }
    } catch { /* ignore */ }
  };

  // 客户端字段验证，返回错误映射和第一个出错的 ref
  const validate = (): { errors: FieldErrors; firstRef: React.RefObject<HTMLDivElement | null> | null } => {
    const errors: FieldErrors = {};
    let firstRef: React.RefObject<HTMLDivElement | null> | null = null;

    if (!nickname.trim()) {
      errors.nickname = '昵称不能为空';
      firstRef = firstRef ?? nicknameRef;
    } else if (nickname.trim().length > 20) {
      errors.nickname = '昵称最多20个字符';
      firstRef = firstRef ?? nicknameRef;
    }

    if (weight) {
      const w = parseFloat(weight);
      if (isNaN(w) || w < 20 || w > 300) {
        errors.weight = '体重请填写 20~300 kg 之间的数值';
        firstRef = firstRef ?? weightRef;
      }
    }

    if (height) {
      const h = parseFloat(height);
      if (isNaN(h) || h < 50 || h > 250) {
        errors.height = '身高请填写 50~250 cm 之间的数值';
        firstRef = firstRef ?? heightRef;
      }
    }

    if (signature.length > 100) {
      errors.signature = '个人签名不能超过100字';
      firstRef = firstRef ?? signatureRef;
    }

    return { errors, firstRef };
  };

  const handleSave = async () => {
    setGlobalError('');
    const { errors, firstRef } = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // 滚动到第一个出错字段
      if (firstRef?.current && scrollRef.current) {
        const container = scrollRef.current;
        const el = firstRef.current;
        const top = el.offsetTop - container.offsetTop - 16;
        container.scrollTo({ top, behavior: 'smooth' });
      }
      return;
    }
    setFieldErrors({});
    setSaving(true);
    try {
      const payload: any = { nickname: nickname.trim(), signature, tags };
      if (gender !== 0) payload.gender = gender;
      if (weight) payload.weight = parseFloat(weight);
      if (height) payload.height = parseFloat(height);
      if (birthday) payload.birthday = birthday;

      const res: any = await updateProfile(payload);
      if (res.code === 0) {
        updateUser({ nickname: nickname.trim(), gender });
        goBack();
      } else {
        // 尝试将后端错误映射到字段
        const msg: string = res.msg || res.message || '保存失败，请检查填写内容';
        const mapped: FieldErrors = {};
        let mappedRef: React.RefObject<HTMLDivElement | null> | null = null;

        if (/昵称/.test(msg)) { mapped.nickname = msg; mappedRef = nicknameRef; }
        else if (/体重/.test(msg)) { mapped.weight = msg; mappedRef = weightRef; }
        else if (/身高/.test(msg)) { mapped.height = msg; mappedRef = heightRef; }
        else if (/签名/.test(msg)) { mapped.signature = msg; mappedRef = signatureRef; }
        else if (/标签/.test(msg)) { mapped.tags = msg; mappedRef = tagsRef; }
        else { setGlobalError(msg); }

        if (Object.keys(mapped).length > 0) {
          setFieldErrors(mapped);
          if (mappedRef?.current && scrollRef.current) {
            const container = scrollRef.current;
            const el = mappedRef.current;
            container.scrollTo({ top: el.offsetTop - container.offsetTop - 16, behavior: 'smooth' });
          }
        }
      }
    } catch (e: any) {
      if (e?.name === 'TypeError' || e?.message?.includes('fetch') || e?.message?.includes('network')) {
        setGlobalError('网络连接失败，请检查网络后重试');
      } else if (e?.status === 401 || e?.code === 401) {
        setGlobalError('登录已过期，请重新登录');
      } else if (e?.status >= 500) {
        setGlobalError('服务器错误，请稍后重试');
      } else {
        setGlobalError('保存失败，请稍后重试');
      }
    } finally {
      setSaving(false);
    }
  };

  const hasError = (field: keyof FieldErrors) => !!fieldErrors[field];
  const isDirty = (field: string) => initialRef.current && initialRef.current[field] !== (
    field === 'nickname' ? nickname.trim() :
    field === 'weight' ? weight :
    field === 'height' ? height :
    field === 'signature' ? signature :
    field === 'tags' ? JSON.stringify(tags) :
    field === 'gender' ? gender :
    field === 'birthday' ? birthday :
    undefined
  );
  const completion = (() => {
    let f = 0;
    if (nickname.trim()) f += 20;
    if (avatarSrc && !avatarSrc.includes('dicebear')) f += 20;
    if (gender !== 0) f += 15;
    if (weight) f += 10;
    if (height) f += 10;
    if (birthday) f += 10;
    if (signature) f += 10;
    if (tags.length > 0) f += 5;
    return f;
  })();
  const recommendedTags = ['前端', '设计师', '二次元', '咖啡控', '夜猫子', '电影迷']
    .filter(t => !tags.includes(t));
  const [managing, setManaging] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<number>>(new Set());

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col bg-cream-100"
        
      
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 bg-cream-100">
        <button onClick={goBack}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-cream-200 transition-colors shrink-0">
          <ChevronLeft size={22} className="text-cream-800" />
        </button>
        <div>
          <h1 className="font-display text-lg font-semibold text-cream-900">编辑资料</h1>
          <p className="text-[11px] text-cream-600 mt-0.5">完善你的个人档案，让更多人了解你</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 px-4 py-6 flex flex-col gap-4 relative">
        <CanvasBackground />

        {/* Personalization entry - enhanced 3D */}
        <div className="relative" style={{ perspective: '800px' }}>
          <div
            className="rounded-2xl cursor-pointer transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #FEFDFB 0%, #FDF5EF 30%, #F9E8D9 100%)',
              transform: 'rotateX(3deg) rotateY(-1deg)',
              boxShadow: [
                '0 1px 0 rgba(255,255,255,0.8) inset',
                '0 4px 8px rgba(200,149,108,0.06)',
                '0 12px 24px rgba(200,149,108,0.08)',
                '0 20px 40px rgba(180,130,90,0.04)',
              ].join(', '),
              border: '1px solid rgba(200,149,108,0.08)',
            }}
            onClick={() => navigate('/profile/personalization')}
          >
            {/* glossy highlight */}
            <div className="absolute top-0 left-4 right-4 h-px rounded-full opacity-40"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)' }} />
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #D4A574, #C8956C)',
                  boxShadow: '0 4px 12px rgba(200,149,108,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
                }}>
                <Palette size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold" style={{ color: '#3D2E1F' }}>个性化你的主页</div>
                <div className="text-[11px] text-cream-600 mt-0.5">背景图、主页风格、装饰特效</div>
              </div>
              <ChevronRight size={14} className="text-cream-500 shrink-0" />
            </div>
          </div>
        </div>

        {/* Avatar with artistic line decoration */}
        <div className="flex flex-col items-center pt-2 pb-4">
          <div className="relative" style={{ width: 160, height: 160 }}>
            {/* SVG artistic arcs */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 160 160">
              <defs>
                <linearGradient id="arcGrad1" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#D4A574" stopOpacity="0.3"/>
                  <stop offset="50%" stopColor="#E8B89A" stopOpacity="0.5"/>
                  <stop offset="100%" stopColor="#D4A574" stopOpacity="0.1"/>
                </linearGradient>
                <linearGradient id="arcGrad2" x1="1" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C8956C" stopOpacity="0.15"/>
                  <stop offset="100%" stopColor="#E8B89A" stopOpacity="0.4"/>
                </linearGradient>
              </defs>
              {/* outer partial arc - top right */}
              <path d="M 160 80 A 80 80 0 0 0 80 0" fill="none" stroke="url(#arcGrad1)" strokeWidth="1" strokeDasharray="4 6"/>
              {/* inner arc - bottom left */}
              <path d="M 0 80 A 65 65 0 0 1 80 160" fill="none" stroke="url(#arcGrad2)" strokeWidth="1.2" strokeDasharray="3 8"/>
              {/* small accent arc - right side */}
              <path d="M 150 50 A 70 70 0 0 1 110 150" fill="none" stroke="#D4A574" strokeWidth="0.6" opacity="0.25" strokeDasharray="2 10"/>
              {/* tiny dots along orbit */}
              <circle cx="151" cy="62" r="2" fill="#D4A574" opacity="0.3"/>
              <circle cx="141" cy="48" r="1.5" fill="#E8B89A" opacity="0.25"/>
              <circle cx="15" cy="108" r="1.8" fill="#C8956C" opacity="0.25"/>
              <circle cx="28" cy="130" r="1.2" fill="#D4A574" opacity="0.2"/>
            </svg>

            {/* avatar centered in the decoration */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: 96, height: 96 }}>
              {/* glow */}
              <div className="absolute inset-[-14px] rounded-full animate-pulse"
                style={{ background: 'radial-gradient(circle, rgba(200,149,108,0.12), transparent 70%)' }} />
              {/* gradient ring */}
              <div className="absolute -inset-1 rounded-full"
                style={{ background: 'linear-gradient(135deg, #D4A574, #E8B89A, #D4A574)', padding: '2px' }}>
                <div className="w-full h-full rounded-full" style={{ background: '#FDFBF7' }} />
              </div>
              {/* avatar */}
              <button onClick={() => fileRef.current?.click()}
                className="absolute inset-0 rounded-full overflow-hidden"
                style={{ boxShadow: '0 4px 24px rgba(200,149,108,0.18)' }}>
                <RemoteImage src={avatarSrc} alt="avatar"
                  className="w-full h-full object-cover" />
                <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera size={20} className="text-white" />
                </div>
              </button>
              {/* camera badge */}
              <button onClick={() => fileRef.current?.click()}
                className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-lg bg-white flex items-center justify-center hover:scale-110 transition-transform z-10"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <Camera size={12} className="text-warm-500" />
              </button>
            </div>
          </div>
          <p className="text-[11px] text-cream-600 mt-3">点击头像更换照片</p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        {/* Completion bar */}
        <div className="bg-white rounded-2xl px-4 py-3.5 relative" style={{ boxShadow: '0 1px 3px rgba(45,32,22,0.035)' }}>
          <CardDecoration pattern="dots" color="#D4A574" />
          <div className="flex items-end justify-between mb-2">
            <span className="font-display text-[22px] font-bold leading-none" style={{ color: '#D4A574' }}>{completion}%</span>
            <div className="text-right">
              <div className="text-[13px] font-medium text-cream-900">资料完整度</div>
              <div className="text-[11px] text-cream-600">继续完善可获得更多关注</div>
            </div>
          </div>
          <div className="h-1 rounded-full bg-cream-200 overflow-hidden">
            <motion.div className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #D4A574, #E8B89A)' }}
              initial={{ width: 0 }}
              animate={{ width: `${completion}%` }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>

        {/* Basic Info Form */}
        <div className="bg-white rounded-2xl relative" style={{ boxShadow: '0 1px 3px rgba(45,32,22,0.035)' }}>
          <CardDecoration pattern="waves" color="#D4A574" />
          {/* Nickname */}
          <div ref={nicknameRef} className={`rounded-t-2xl px-4 py-3 border-b border-cream-100 ${hasError('nickname') ? 'bg-red-50/60' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 shrink-0">
                {isDirty('nickname') && <span className="w-1 h-1 rounded-full animate-pulse-soft" style={{ background: '#D4A574' }} />}
                <span className="text-[13px] font-medium text-cream-700">昵称<span className="text-red-400">*</span></span>
              </div>
              <input
                type="text"
                value={nickname}
                onChange={e => { setNickname(e.target.value); if (fieldErrors.nickname) setFieldErrors(p => ({ ...p, nickname: undefined })); }}
                placeholder="请输入昵称"
                className={`flex-1 ml-3 min-w-0 text-right text-sm bg-transparent outline-none placeholder:text-cream-400 ${hasError('nickname') ? 'text-red-600' : isDirty('nickname') ? 'text-warm-600' : 'text-cream-900'}`}
              />
            </div>
            <FieldError msg={fieldErrors.nickname} />
          </div>

          {/* Gender - Color Drop */}
          <div className="px-4 py-3 border-b border-cream-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 shrink-0">
                {isDirty('gender') && <span className="w-1 h-1 rounded-full animate-pulse-soft" style={{ background: '#D4A574' }} />}
                <span className="text-[13px] font-medium text-cream-700">性别</span>
              </div>
              <div className="flex items-center gap-3">
                {[
                  { value: 2, label: '女', gradient: 'linear-gradient(135deg, #F9A8D4, #EC4899)', ring: 'rgba(236,72,153,0.25)' },
                  { value: 1, label: '男', gradient: 'linear-gradient(135deg, #93C5FD, #3B82F6)', ring: 'rgba(59,130,246,0.25)' },
                ].map(opt => {
                  const sel = gender === opt.value;
                  return (
                    <button key={opt.value} onClick={() => setGender(opt.value)}
                      className={`flex flex-col items-center gap-1 transition-all duration-300 ${sel ? 'scale-110' : 'scale-100 hover:scale-105'}`}
                    >
                      <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-semibold transition-all duration-300"
                        style={{
                          background: opt.gradient,
                          boxShadow: sel ? `0 0 0 3px ${opt.ring}` : undefined,
                        }}
                      >
                        {opt.value === 2 ? '\u2640' : opt.value === 1 ? '\u2642' : '\u2014'}
                      </div>
                      <span className={`text-[10px] font-medium transition-colors ${sel ? 'text-cream-800 font-semibold' : 'text-cream-400'}`}>
                        {sel ? '已选' : opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Weight & Height */}
          <div className="flex border-b border-cream-100">
            {/* Weight */}
            <div ref={weightRef} className={`flex-1 px-4 py-3 border-r border-cream-100 ${hasError('weight') ? 'bg-red-50/60' : ''}`}>
              <div className="flex items-center gap-2 shrink-0 mb-2">
                {isDirty('weight') && <span className="w-1 h-1 rounded-full animate-pulse-soft" style={{ background: '#D4A574' }} />}
                <span className="text-[11px] font-medium text-cream-500">体重 / kg</span>
              </div>
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => { const v = parseFloat(weight) || 60; if (v > 20) { setWeight(String(v - 1)); if (fieldErrors.weight) setFieldErrors(p => ({ ...p, weight: undefined })); } }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-cream-400 hover:bg-cream-100 hover:text-cream-700 transition-colors text-lg font-light">-</button>
                <input
                  type="number"
                  value={weight}
                  onChange={e => { setWeight(e.target.value); if (fieldErrors.weight) setFieldErrors(p => ({ ...p, weight: undefined })); }}
                  placeholder="60"
                  className={`w-14 text-center text-xl font-semibold bg-transparent outline-none placeholder:text-cream-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${hasError('weight') ? 'text-red-600' : isDirty('weight') ? 'text-warm-600' : 'text-cream-900'}`}
                />
                <button type="button" onClick={() => { const v = parseFloat(weight) || 60; if (v < 300) { setWeight(String(v + 1)); if (fieldErrors.weight) setFieldErrors(p => ({ ...p, weight: undefined })); } }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-cream-400 hover:bg-cream-100 hover:text-cream-700 transition-colors text-lg font-light">+</button>
              </div>
              <FieldError msg={fieldErrors.weight} />
            </div>

            {/* Height */}
            <div ref={heightRef} className={`flex-1 px-4 py-3 ${hasError('height') ? 'bg-red-50/60' : ''}`}>
              <div className="flex items-center gap-2 shrink-0 mb-2">
                {isDirty('height') && <span className="w-1 h-1 rounded-full animate-pulse-soft" style={{ background: '#D4A574' }} />}
                <span className="text-[11px] font-medium text-cream-500">身高 / cm</span>
              </div>
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => { const v = parseFloat(height) || 170; if (v > 50) { setHeight(String(v - 1)); if (fieldErrors.height) setFieldErrors(p => ({ ...p, height: undefined })); } }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-cream-400 hover:bg-cream-100 hover:text-cream-700 transition-colors text-lg font-light">-</button>
                <input
                  type="number"
                  value={height}
                  onChange={e => { setHeight(e.target.value); if (fieldErrors.height) setFieldErrors(p => ({ ...p, height: undefined })); }}
                  placeholder="170"
                  className={`w-14 text-center text-xl font-semibold bg-transparent outline-none placeholder:text-cream-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${hasError('height') ? 'text-red-600' : isDirty('height') ? 'text-warm-600' : 'text-cream-900'}`}
                />
                <button type="button" onClick={() => { const v = parseFloat(height) || 170; if (v < 250) { setHeight(String(v + 1)); if (fieldErrors.height) setFieldErrors(p => ({ ...p, height: undefined })); } }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-cream-400 hover:bg-cream-100 hover:text-cream-700 transition-colors text-lg font-light">+</button>
              </div>
              <FieldError msg={fieldErrors.height} />
            </div>
          </div>

          {/* Birthday */}
          <div className="rounded-b-2xl px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 shrink-0">
                {isDirty('birthday') && <span className="w-1 h-1 rounded-full animate-pulse-soft" style={{ background: '#D4A574' }} />}
                <span className="text-[13px] font-medium text-cream-700">生日</span>
              </div>
              <div className="flex-1 ml-3 min-w-0 text-right">
                <DatePicker value={birthday} onChange={setBirthday} />
              </div>
            </div>
          </div>
        </div>

        {/* Signature */}
        <div ref={signatureRef} className={`bg-white rounded-2xl relative ${hasError('signature') ? 'ring-2 ring-red-300' : ''}`}
          style={{ boxShadow: '0 1px 3px rgba(45,32,22,0.035)' }}>
          <span className="absolute top-2 right-3 text-[28px] leading-none pointer-events-none select-none" style={{ color: '#F2EDE6' }}>&ldquo;</span>
          <div className="px-4 pt-3.5 pb-3 relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-medium text-cream-700">个人签名</span>
              <span className={`text-[11px] ${signature.length > 90 ? 'text-orange-400' : 'text-cream-500'}`}>{signature.length}/100</span>
            </div>
            <textarea
              value={signature}
              onChange={e => { setSignature(e.target.value); if (fieldErrors.signature) setFieldErrors(p => ({ ...p, signature: undefined })); }}
              maxLength={100}
              rows={2}
              placeholder="写一句话介绍自己..."
              className="w-full text-sm text-cream-900 rounded-xl px-3 py-2 resize-none outline-none placeholder:text-cream-400 transition-colors"
              style={{ background: '#FEFDFB' }}
            />
            <FieldError msg={fieldErrors.signature} />
          </div>
        </div>

        {/* Tags */}
        <div ref={tagsRef} className={`bg-white rounded-2xl ${hasError('tags') ? 'ring-2 ring-red-300' : ''}`}
          style={{ boxShadow: '0 1px 3px rgba(45,32,22,0.035)' }}>
          <div className="px-4 py-3.5">
            {/* Header with manage button */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-cream-700">个性标签</span>
                <span className="text-[11px] text-cream-400 bg-cream-100 rounded-full px-2 py-0.5">{tags.length}/5</span>
              </div>
              {tags.length > 0 && (
                <button
                  onClick={() => { setManaging(!managing); setSelectedTags(new Set()); }}
                  className="text-[12px] font-medium transition-colors px-2 py-1 rounded-lg"
                  style={{ color: managing ? '#E8816A' : '#BFB0A3' }}
                >
                  {managing ? '完成' : '管理'}
                </button>
              )}
            </div>

            {/* My tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag, i) => {
                const sel = selectedTags.has(i);
                return (
                  <motion.span key={tag} layout
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    onClick={() => {
                      if (managing) {
                        setSelectedTags(prev => {
                          const next = new Set(prev);
                          next.has(i) ? next.delete(i) : next.add(i);
                          return next;
                        });
                      }
                    }}
                    className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all overflow-hidden ${
                      managing ? 'cursor-pointer' : 'cursor-default'
                    } ${sel ? 'scale-95 opacity-60' : managing ? 'hover:scale-105' : ''}`}
                    style={{
                      background: sel
                        ? '#FEE2E2'
                        : `linear-gradient(135deg, ${['#FDF5EF','#FEF7F0','#FDF3EC','#FEF5ED','#FDF4EE'][i % 5]}, ${['#F9E8D9','#FADDC8','#F8E4D4','#F9E0CF','#F7E7DA'][i % 5]})`,
                      color: sel ? '#EF4444' : '#7B5538',
                    }}
                  >
                    {managing && (
                      <span className={`mr-0.5 text-[10px] ${sel ? 'text-red-500' : 'text-cream-400'}`}>
                        {sel ? '\u2713' : '\u25CB'}
                      </span>
                    )}
                    <span className="relative z-10">{tag}</span>
                  </motion.span>
                );
              })}
            </div>

            {/* Manage action bar */}
            {managing && (
              <motion.div className="flex gap-2 mb-3"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              >
                <button
                  onClick={() => {
                    if (selectedTags.size === 0) return;
                    const indices = Array.from(selectedTags).sort((a, b) => b - a);
                    const newTags = [...tags];
                    indices.forEach(i => newTags.splice(i, 1));
                    setTags(newTags);
                    setSelectedTags(new Set());
                    setManaging(false);
                  }}
                  disabled={selectedTags.size === 0}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold disabled:opacity-30 transition-all"
                  style={{ background: '#FEE2E2', color: '#EF4444' }}
                >
                  删除选中 ({selectedTags.size})
                </button>
                <button
                  onClick={() => { setManaging(false); setSelectedTags(new Set()); }}
                  className="px-4 py-2 rounded-xl text-xs font-medium"
                  style={{ background: '#F2EDE6', color: '#9C8B7D' }}
                >
                  取消
                </button>
              </motion.div>
            )}

            {/* Recommended tags - independent, always visible while space remains */}
            {recommendedTags.length > 0 && tags.length < 5 && !managing && (
              <div className="pt-2 border-t border-cream-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse-soft" style={{ background: '#D4A574' }} />
                  <span className="text-[11px] text-cream-500">为你推荐</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recommendedTags.map(tag => (
                    <button key={tag}
                      onClick={() => { if (tags.length < 5) setTags([...tags, tag]); }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all active:scale-95"
                      style={{ border: '1px dashed #E0D6C8', color: '#B8A088' }}
                    >
                      <Plus size={10} style={{ color: '#D4A574' }} /> {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom tag input */}
            {tags.length < 5 && !managing && (
              <div className={`flex items-center gap-2 ${recommendedTags.length > 0 ? 'mt-3' : 'mt-1'}`}>
                <input
                  type="text"
                  value={newTag}
                  onChange={e => { if (!composingRef.current) setNewTag(e.target.value.slice(0, 6)); else setNewTag(e.target.value); }}
                  maxLength={6}
                  placeholder="输入自定义标签..."
                  className="flex-1 text-sm text-cream-900 rounded-xl px-3 py-2.5 outline-none transition-colors placeholder:text-cream-400"
                  style={{ background: '#FDFBF7', border: '1.5px solid #F0EBE3' }}
                  onCompositionStart={() => { composingRef.current = true; }}
                  onCompositionEnd={e => {
                    composingRef.current = false;
                    const v = (e.target as HTMLInputElement).value;
                    setNewTag(v.slice(0, 6));
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newTag.trim()) {
                      setTags([...tags, newTag.trim()]);
                      setNewTag('');
                    }
                  }}
                  onFocus={e => { e.target.style.borderColor = '#D4A574'; }}
                  onBlur={e => { e.target.style.borderColor = '#F0EBE3'; }}
                />
                <button
                  onClick={() => { if (newTag.trim()) { setTags([...tags, newTag.trim()]); setNewTag(''); } }}
                  disabled={!newTag.trim()}
                  className="w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-30 transition-all active:scale-95 shrink-0"
                  style={{ background: 'linear-gradient(135deg, #D4A574, #C8956C)' }}
                >
                  <Plus size={18} className="text-white" />
                </button>
              </div>
            )}
            <FieldError msg={fieldErrors.tags} />
          </div>
        </div>

        {/* Global error */}
        <AnimatePresence>
          {globalError && (
            <motion.div
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200"
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            >
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <span className="text-[13px] text-red-600">{globalError}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Save button */}
      <div className="px-4 pb-10 pt-2 bg-cream-100" style={{ borderTop: '1px solid #F8F5F0' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 rounded-2xl text-white text-[15px] font-semibold transition-all duration-200 disabled:opacity-60 active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #D4A574, #C8956C)',
            boxShadow: '0 4px 16px rgba(200,149,108,0.2)',
          }}
        >
          {saving ? '保存中...' : '保存修改'}
        </button>
      </div>
    </motion.div>
  );
}
