import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSmartBack } from '../../hooks/useSmartBack';
import {
  MapPin,
  Eye,
  Users,
  Globe,
  Lock,
  AtSign,
  Plus,
  X,
  Hash,
  Image as ImageIcon,
  Mic,
  MapPinned,
  Play,
  Pause,
  Square,
  Trash2,
  ChevronRight,
  Check,
} from 'lucide-react';
import { createMoment, updateMoment, uploadMomentImage, uploadMomentAudio, getMomentDetail } from '../../api/moments';
import { compressImage } from '../../utils/compress';
import { SafeImg } from '../../components/SafeImg';
import { TopicPicker } from '../../components/TopicPicker';
import { AtPicker } from '../../components/AtPicker';

const MAX_CHARS = 500;
const WARN_CHARS = 450;
const MAX_IMAGES = 9;
const MAX_AUDIO_SECONDS = 60;

const visibilityOptions = [
  { value: 'public', label: '所有人', icon: Globe, desc: '所有人可见' },
  { value: 'friends', label: '好友', icon: Users, desc: '仅好友可见' },
  { value: 'private', label: '仅自己', icon: Lock, desc: '仅自己可见' },
];

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('不支持定位'));
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 5000,
      maximumAge: 60000,
    });
  });
}

async function getLocation(): Promise<string> {
  // 1) GPS 精确定位（需要 HTTPS）
  try {
    const pos = await getPosition();
    const resp = await fetch(`${apiBase}/api/moments/location/geo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
    });
    const data = await resp.json();
    if (data.code === 0 && data.data?.city) return data.data.city;
  } catch {}

  // 2) 浏览器端 IP 定位（多 API 备选，使用浏览器自己的 IP）
  try {
    let location = '';
    // 2a) ip-api.com — 支持 lang=zh-CN 返回中文地名
    try {
      const resp = await fetch('http://ip-api.com/json/?lang=zh-CN');
      const d = await resp.json();
      if (d.status === 'success' && d.city) {
        if (d.country === '中国') {
          location = d.regionName && d.regionName !== d.city ? `${d.city} · ${d.regionName}` : d.city;
        } else {
          location = d.country ? `${d.country} · ${d.city}` : d.city;
        }
      }
    } catch {}
    // 2b) ipapi.co — 备选（返回英文）
    if (!location) {
      try {
        const resp = await fetch('https://ipapi.co/json/');
        const d = await resp.json();
        if (d.city && !d.error) {
          if (d.country_name === 'China') {
            location = d.region && d.region !== d.city ? `${d.city} · ${d.region}` : d.city;
          } else {
            location = d.country_name ? `${d.country_name} · ${d.city}` : d.city;
          }
        }
      } catch {}
    }
    if (location) return location;
  } catch {}

  // 3) 后端 IP 检测回退（兜底）
  try {
    const resp = await fetch(`${apiBase}/api/moments/location`);
    const data = await resp.json();
    if (data.code === 0 && data.data?.city) return data.data.city;
  } catch {}
  return '';
}

/** 将 HTML 转回 @[userId:nickname] 纯文本格式 */
function htmlToPlain(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  // 还原 mention span
  div.querySelectorAll('.mention').forEach(el => {
    const uid = el.getAttribute('data-id') || '';
    const name = el.textContent?.replace('@', '') || '';
    el.replaceWith(`@[${uid}:${name}]`);
  });
  // 换行保留
  div.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
  div.querySelectorAll('div').forEach(d => d.replaceWith('\n' + d.textContent));
  return div.textContent || '';
}

/** 将 @[userId:nickname] 转为可渲染的 HTML */
function plainToHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/@\[(\d+):([^\]]+)\]/g, '<span class="mention" data-id="$1">@$2</span>')
    .replace(/\n/g, '<br>');
}

export function PublishMoment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const goBack = useSmartBack('/moments');
  const editId = searchParams.get('edit');
  const isEdit = !!editId;

  // Content
  const [, setContent] = useState('');
  const [charCountLocal, setCharCountLocal] = useState(0);
  const editorRef = useRef<HTMLDivElement>(null);
  const insertingRef = useRef(false); // 防止程序化插入触发 onInput
  const charCount = charCountLocal;

  // Images
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [waveformBars, setWaveformBars] = useState<number[]>([]);
  const [micError, setMicError] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioPlayProgress, setAudioPlayProgress] = useState(0);

  // Options
  const [location, setLocation] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [showVisibilityPicker, setShowVisibilityPicker] = useState(false);
  const [topicNames, setTopicNames] = useState<string[]>([]);
  const [showAtPicker, setShowAtPicker] = useState(false);
  const [mentionedUsers, setMentionedUsers] = useState<{ id: number; nickname: string }[]>([]);

  const [locating, setLocating] = useState(false);

  // Publishing
  const [publishing, setPublishing] = useState(false);

  // 编辑模式：加载已有动态数据
  useEffect(() => {
    if (!editId) return;
    getMomentDetail(Number(editId)).then((res: any) => {
      if (res.code === 0 && res.data) {
        const d = res.data;
        setContent(d.content || '');
        setCharCountLocal((d.content || '').length);
        // 渲染到 contentEditable
        if (editorRef.current && d.content) {
          editorRef.current.innerHTML = plainToHtml(d.content);
        }
        if (d.images) setImages(d.images);
        if (d.audio_url) { setAudioUrl(d.audio_url); setAudioDuration(d.audio_duration || 0); }
        if (d.location) setLocation(d.location);
        if (d.visibility) setVisibility(d.visibility);
        if (d.topic_name) setTopicNames(d.topic_name.split(',').filter(Boolean));
      }
    }).catch(() => {});
  }, [editId]);

  // 话题处理（多选切换）
  const handleToggleTopic = (name: string) => {
    setTopicNames(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  // @提及处理 —— 记录打开方式：'type'=输入@触发, 'button'=点击按钮触发
  const [atOpenMode, setAtOpenMode] = useState<'type' | 'button'>('button');

  // 保存编辑器光标（AtPicker 打开前记录）
  const savedRangeRef = useRef<Range | null>(null);

  const handleToggleMention = (userId: number, nickname: string) => {
    const alreadySelected = mentionedUsers.some(u => u.id === userId);
    if (alreadySelected) {
      // 取消勾选：从编辑器中移除对应 span
      setMentionedUsers(prev => prev.filter(u => u.id !== userId));
      const ed = editorRef.current;
      if (!ed) return;
      insertingRef.current = true;
      const span = ed.querySelector(`.mention[data-id="${userId}"]`);
      if (span) {
        const next = span.nextSibling;
        if (next && next.nodeType === 3 && next.textContent?.startsWith(' ')) {
          next.textContent = next.textContent.slice(1);
        }
        span.remove();
      }
      setTimeout(() => { insertingRef.current = false; }, 100);
      setContent(htmlToPlain(ed.innerHTML));
      setCharCountLocal(ed.innerText?.length || 0);
      return;
    }
    // 勾选：插入 mention span
    setMentionedUsers(prev => [...prev, { id: userId, nickname }]);
    const ed = editorRef.current;
    if (!ed) return;
    insertingRef.current = true;
    ed.focus();
    const sel = window.getSelection();
    if (savedRangeRef.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
    if (atOpenMode === 'type' && sel?.anchorNode) {
      const node = sel.anchorNode;
      const offset = sel.anchorOffset;
      if (node.nodeType === 3 && node.textContent && offset > 0 && node.textContent[offset - 1] === '@') {
        node.textContent = node.textContent.slice(0, offset - 1) + node.textContent.slice(offset);
        sel.collapse(node, offset - 1);
      }
    }
    const span = document.createElement('span');
    span.className = 'mention';
    span.setAttribute('data-id', String(userId));
    span.textContent = `@${nickname}`;
    span.contentEditable = 'false';
    const space = document.createTextNode('\u00A0');
    const curSel = window.getSelection();
    if (curSel && curSel.rangeCount > 0) {
      const range = curSel.getRangeAt(0);
      range.insertNode(space);
      range.insertNode(span);
      range.setStartAfter(space);
      range.collapse(true);
      curSel.removeAllRanges();
      curSel.addRange(range);
    }
    ed.focus();
    setTimeout(() => { insertingRef.current = false; }, 100);
    setContent(htmlToPlain(ed.innerHTML));
    setCharCountLocal(ed.innerText?.length || 0);
  };

  // Progress ring calculations
  const progressRadius = 14;
  const progressCircumference = 2 * Math.PI * progressRadius;
  const progressOffset =
    progressCircumference - (Math.min(charCount, MAX_CHARS) / MAX_CHARS) * progressCircumference;
  const isOverWarn = charCount > WARN_CHARS;
  const isOverMax = charCount > MAX_CHARS;

  // Image upload
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const handleImageSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const remaining = MAX_IMAGES - images.length;
      if (remaining <= 0) return;
      const toUpload = Array.from(files).slice(0, remaining);
      setUploadingImages(true);
      setUploadError('');

      try {
        for (const file of toUpload) {
          setUploadProgress(10);
          let uploadFile = file;
          try {
            uploadFile = await compressImage(file);
            setUploadProgress(40);
          } catch {
            // 压缩失败用原图
          }
          const res: any = await uploadMomentImage(uploadFile, (pct) => {
            setUploadProgress(40 + Math.round(pct * 0.6));
          });
          if (res.code === 0 && res.data?.url) {
            setImages((prev) => [...prev, res.data.url]);
            setUploadProgress(100);
          } else {
            setUploadError(res.message || '上传失败，请重试');
          }
        }
      } catch (err) {
        console.error('Image upload failed', err);
        setUploadError('上传失败，请检查网络');
      } finally {
        setUploadingImages(false);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [images.length],
  );

  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Audio recording
  const startRecording = useCallback(async () => {
    setMicError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicError('当前环境不支持录音（需要 HTTPS 或 localhost）');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });

        try {
          const res: any = await uploadMomentAudio(blob);
          if (res.code === 0 && res.data?.url) {
            setAudioUrl(res.data.url);
            setAudioDuration(recordingSeconds);
          }
        } catch (err) {
          console.error('Audio upload failed', err);
        }
      };

      recorder.start(250); // collect data every 250ms for waveform

      // Generate waveform bars during recording
      const waveInterval = setInterval(() => {
        setWaveformBars((prev) => {
          const newBars = [...prev, Math.random() * 0.8 + 0.2];
          return newBars.length > 40 ? newBars.slice(-40) : newBars;
        });
      }, 250);

      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= MAX_AUDIO_SECONDS - 1) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      // Store waveInterval for cleanup
      (recorder as any)._waveInterval = waveInterval;
    } catch (err: any) {
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setMicError('麦克风权限被拒绝，请在浏览器设置中允许访问麦克风');
      } else if (err?.name === 'NotFoundError') {
        setMicError('未检测到麦克风设备');
      } else {
        setMicError('麦克风启动失败，请检查浏览器权限');
      }
      console.error('Microphone access failed', err);
    }
  }, [recordingSeconds]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      clearInterval((mediaRecorderRef.current as any)._waveInterval);
      (mediaRecorderRef.current as any)._waveInterval = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const removeAudio = useCallback(() => {
    setAudioUrl(null);
    setAudioDuration(0);
    setRecordingSeconds(0);
    setWaveformBars([]);
    setIsPlayingAudio(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  const toggleAudioPlayback = useCallback(() => {
    if (!audioUrl) return;
    if (!audioRef.current) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.ontimeupdate = () => {
        setAudioPlayProgress(audio.currentTime / (audio.duration || 1));
      };
      audio.onended = () => {
        setIsPlayingAudio(false);
        setAudioPlayProgress(0);
      };
      audio.play();
      setIsPlayingAudio(true);
    } else {
      if (isPlayingAudio) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlayingAudio(!isPlayingAudio);
    }
  }, [audioUrl, isPlayingAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  // Publish
  const handlePublish = useCallback(async () => {
    const plainContent = editorRef.current ? htmlToPlain(editorRef.current.innerHTML) : '';
    // XSS 清洗
    const { default: DOMPurify } = await import('dompurify');
    const trimmed = DOMPurify.sanitize(plainContent.trim(), { ALLOWED_TAGS: [] });
    if (!trimmed && images.length === 0 && !audioUrl) return;
    // 纯文字发送必须大于10个字
    if (images.length === 0 && !audioUrl && trimmed.length < 10) return;
    if (charCount > MAX_CHARS) return;

    setPublishing(true);
    try {
      let res: any;
      if (isEdit && editId) {
        res = await updateMoment(Number(editId), {
          content: trimmed,
          images: images,
          audio_url: audioUrl || undefined,
          audio_duration: audioDuration || undefined,
          location: location || undefined,
          visibility: visibility as 'public' | 'friends' | 'private',
          topic_name: topicNames.join(','),
        });
      } else {
        res = await createMoment({
          content: trimmed,
          images: images.length > 0 ? images : undefined,
          audio_url: audioUrl || undefined,
          audio_duration: audioDuration || undefined,
          location: location || undefined,
          visibility: visibility as 'public' | 'friends' | 'private',
          topic_name: topicNames.length > 0 ? topicNames.join(',') : undefined,
          mentioned_user_ids: mentionedUsers.length > 0 ? mentionedUsers.map(u => u.id) : undefined,
        });
      }
      if (res.code === 0) {
        navigate(isEdit ? `/moments/${editId}` : '/moments', { replace: true });
      }
    } catch (err) {
      console.error('Publish failed', err);
    } finally {
      setPublishing(false);
    }
  }, [images, audioUrl, audioDuration, location, visibility, topicNames, charCount, navigate, isEdit, editId, mentionedUsers]);

  const textLen = editorRef.current?.innerText?.trim().length || 0;
  const hasMedia = images.length > 0 || !!audioUrl;
  const hasContent = hasMedia ? textLen >= 0 : textLen >= 10;

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: '#FFFBFA' }}
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Fixed top bar */}
      <div className="flex items-center justify-between px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 flex-shrink-0">
        <button onClick={goBack} className="text-[#BBA0A0] text-[15px] px-1">
          取消
        </button>
        <h1 className="text-[15px] font-extrabold text-[#2D1B1B]">{isEdit ? '编辑动态' : '发布动态'}</h1>
        {!hasMedia && textLen > 0 && textLen < 10 && (
          <span className="text-[11px] text-[#FF6B6B] mr-2">还需{10 - textLen}字</span>
        )}
        <button
          onClick={handlePublish}
          disabled={!hasContent || publishing || isOverMax}
          className="px-4 py-1.5 rounded-full text-[13px] font-semibold text-white transition-all"
          style={{
            background:
              hasContent && !isOverMax
                ? 'linear-gradient(135deg, #FF6B6B, #FF8E8E)'
                : '#DDD',
            opacity: hasContent && !isOverMax && !publishing ? 1 : 0.7,
          }}
        >
          {publishing ? '发布中...' : '发布'}
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4">
        {/* Text input — contentEditable 支持 @mention 实时渲染 */}
        <div className="relative mb-4">
          <style>{`
            .publish-editor { min-height:120px; line-height:1.8; font-size:14px; color:#3D2B2B;
              outline:none; word-break:break-word; white-space:pre-wrap;
              font-family:inherit; resize:none;
            }
            .publish-editor:empty::before {
              content:'此刻想记录什么...'; color:#BBA0A0; pointer-events:none;
            }
            .publish-editor .mention { color:#4169E1; font-weight:600; }
          `}</style>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="publish-editor"
            onInput={(e) => {
              if (insertingRef.current) return;
              const el = e.target as HTMLElement;
              const html = el.innerHTML;
              const text = el.innerText || '';
              const sel = window.getSelection();
              if (sel?.anchorNode) {
                const offset = sel.anchorOffset;
                const nodeText = sel.anchorNode.textContent || '';
                if (nodeText[offset - 1] === '@') {
                  if (sel.rangeCount > 0) savedRangeRef.current = sel.getRangeAt(0).cloneRange();
                  setAtOpenMode('type');
                  setShowAtPicker(true);
                }
              }
              // 同步编辑器中的 mention span 到 mentionedUsers 状态（处理删除@的情况）
              const existingIds = new Set<number>();
              el.querySelectorAll('.mention').forEach(s => {
                const id = parseInt(s.getAttribute('data-id') || '');
                if (id) existingIds.add(id);
              });
              setMentionedUsers(prev => prev.filter(u => existingIds.has(u.id)));
              setContent(htmlToPlain(html));
              setCharCountLocal(text.length);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                // 允许换行，但阻止提交表单
              }
            }}
          />
          {/* Character counter with conic-gradient ring */}
          <div className="flex justify-end mt-1">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 32 32" className="absolute inset-0 -rotate-90">
                <circle
                  cx="16"
                  cy="16"
                  r={progressRadius}
                  fill="none"
                  stroke="#F0E6E6"
                  strokeWidth="2.5"
                />
                <circle
                  cx="16"
                  cy="16"
                  r={progressRadius}
                  fill="none"
                  stroke={isOverWarn ? '#FF6B6B' : '#4ECDC4'}
                  strokeWidth="2.5"
                  strokeDasharray={progressCircumference}
                  strokeDashoffset={progressOffset}
                  strokeLinecap="round"
                />
              </svg>
              <span
                className="text-[10px] font-semibold relative z-10"
                style={{ color: isOverWarn ? '#FF6B6B' : '#2D1B1B' }}
              >
                {charCount}
              </span>
            </div>
          </div>
        </div>

        {/* Image grid */}
        <div className="mb-4">
          <div className="grid grid-cols-3 gap-1.5">
            {images.map((img, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-[#F8F0F0] shadow-sm">
                <SafeImg src={img.startsWith('http') ? img : `${apiBase}${img}`} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center text-white"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImages}
                className="aspect-square rounded-lg flex flex-col items-center justify-center gap-1 shadow-sm"
                style={{ background: '#FFF0E5' }}
              >
                <Plus size={20} color="#FF6B6B" />
                <span className="text-[11px] text-[#BBA0A0]">添加图片</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          {uploadingImages && (
            <div className="mt-2 px-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] text-[#FF6B6B]">上传中 {uploadProgress}%</span>
              </div>
              <div className="h-1 bg-[#F0E6E6] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%`, background: 'linear-gradient(90deg, #FF6B6B, #FFB347)' }} />
              </div>
            </div>
          )}
          {uploadError && (
            <p className="text-[11px] text-[#FF6B6B] mt-1.5 text-center">{uploadError}</p>
          )}
        </div>

        {/* Audio recording area */}
        {!audioUrl && (
          <div
            className="w-full rounded-2xl bg-white shadow-sm mb-4 p-4 flex flex-col items-center gap-3"
          >
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-sm"
                style={{ background: 'linear-gradient(135deg, #FF6B6B, #FF8E8E)' }}
              >
                <Mic size={24} color="#fff" />
              </button>
            ) : (
              <div className="flex flex-col items-center gap-3 w-full">
                {/* Pulse ring + square stop button */}
                <div className="relative">
                  <div className="absolute inset-0 w-14 h-14 rounded-md bg-red-500/30 animate-ping" />
                  <button
                    onClick={stopRecording}
                    className="w-14 h-14 rounded-md flex items-center justify-center shadow-sm relative z-10"
                    style={{ background: '#FF6B6B' }}
                  >
                    <Square size={22} fill="#fff" color="#fff" />
                  </button>
                </div>

                {/* Waveform visualization */}
                <div className="w-full h-10 flex items-end justify-center gap-[2px]">
                  {waveformBars.length > 0 ? (
                    waveformBars.map((h, i) => (
                      <div
                        key={i}
                        className="w-1 rounded-full transition-all"
                        style={{
                          height: `${h * 100}%`,
                          background: 'linear-gradient(180deg, #FF6B6B, #FF8E8E)',
                        }}
                      />
                    ))
                  ) : (
                    <span className="text-[12px] text-[#BBA0A0]">录制中...</span>
                  )}
                </div>

                {/* Timer */}
                <span
                  className="text-[13px] font-semibold"
                  style={{ color: recordingSeconds >= 50 ? '#FF6B6B' : '#3D2B2B' }}
                >
                  {recordingSeconds}s / {MAX_AUDIO_SECONDS}s
                </span>
              </div>
            )}

            {!isRecording && (
              <span className="text-[12px] text-[#BBA0A0]">
                点击录制语音动态，最长 {MAX_AUDIO_SECONDS} 秒
              </span>
            )}
            {micError && (
              <span className="text-[12px] text-[#FF6B6B] text-center max-w-[260px]">{micError}</span>
            )}
          </div>
        )}

        {/* Recorded audio player */}
        {audioUrl && (
          <div className="w-full rounded-2xl bg-white shadow-sm mb-4 p-3 flex items-center gap-3">
            <button
              onClick={toggleAudioPlayback}
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #FF6B6B, #FF8E8E)' }}
            >
              {isPlayingAudio ? <Pause size={18} color="#fff" /> : <Play size={18} color="#fff" fill="#fff" />}
            </button>

            {/* Playback waveform */}
            <div className="flex-1 h-8 flex items-end gap-[2px] relative">
              {/* Waveform bars (static for recorded audio) */}
              {(waveformBars.length > 0 ? waveformBars : Array.from({ length: 30 }, () => Math.random() * 0.6 + 0.2)).map(
                (h, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full flex-shrink-0"
                    style={{
                      height: `${h * 100}%`,
                      background:
                        i / 30 <= audioPlayProgress
                          ? 'linear-gradient(180deg, #FF6B6B, #FF8E8E)'
                          : '#F0E6E6',
                    }}
                  />
                ),
              )}
            </div>

            <span className="text-[12px] text-[#BBA0A0] flex-shrink-0">{audioDuration}s</span>

            <button
              onClick={removeAudio}
              className="w-7 h-7 rounded-full flex items-center justify-center bg-[#FFF0F0] flex-shrink-0"
            >
              <Trash2 size={13} color="#FF6B6B" />
            </button>
          </div>
        )}

        {/* Topic picker — 语音组件下方 */}
        <TopicPicker selected={topicNames} onToggle={handleToggleTopic} />

        {/* Options section */}
        <div className="bg-white rounded-2xl shadow-sm mb-4">
          {/* Location — GPS 优先，IP 回退 */}
          <button
            onClick={async () => {
              if (location) { setLocation(''); return; }
              setLocating(true);
              const city = await getLocation();
              setLocation(city);
              setLocating(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-[#FFFBFA]"
          >
            <MapPin size={18} color={location ? '#FF6B6B' : '#BBA0A0'} />
            <span className="text-[14px] text-[#2D1B1B] flex-1 text-left">所在位置</span>
            <span className="text-[13px] text-[#BBA0A0] mr-1">
              {locating ? '获取中...' : (location || '不显示')}
            </span>
            <ChevronRight size={16} color="#BBA0A0" />
          </button>

          {/* Visibility */}
          <div className="relative border-b border-[#FFFBFA]">
            <button
              onClick={() => setShowVisibilityPicker(!showVisibilityPicker)}
              className="w-full flex items-center gap-3 px-4 py-3.5"
            >
              <Eye size={18} color="#A18CD1" />
              <span className="text-[14px] text-[#2D1B1B] flex-1 text-left">谁可以看</span>
              <span className="text-[13px] text-[#BBA0A0] mr-1">
                {visibilityOptions.find((v) => v.value === visibility)?.label}
              </span>
              <ChevronRight size={16} color="#BBA0A0" />
            </button>
            {showVisibilityPicker && (
              <div className="px-4 pb-3 flex gap-2">
                {visibilityOptions.map((opt) => {
                  const Icon = opt.icon;
                  const selected = visibility === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => { setVisibility(opt.value); setShowVisibilityPicker(false); }}
                      className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition-all ${
                        selected ? 'bg-[#FFF0E5]' : 'bg-[#FFFBFA]'
                      }`}
                    >
                      <Icon size={20} color={selected ? '#FF6B6B' : '#BBA0A0'} />
                      <span className="text-[11px] font-medium" style={{ color: selected ? '#FF6B6B' : '#BBA0A0' }}>
                        {opt.label}
                      </span>
                      {opt.desc && (
                        <span className="text-[9px]" style={{ color: selected ? '#FF6B6B' : '#ccc' }}>
                          {opt.desc}
                        </span>
                      )}
                      {selected && <Check size={14} color="#FF6B6B" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* @谁 */}
          <button
            onClick={() => { editorRef.current?.focus(); const sel = window.getSelection(); if (sel?.rangeCount) savedRangeRef.current = sel.getRangeAt(0).cloneRange(); setAtOpenMode('button'); setShowAtPicker(true); }}
            className="w-full flex items-center gap-3 px-4 py-3.5"
          >
            <AtSign size={18} color="#FFB347" />
            <span className="text-[14px] text-[#2D1B1B] flex-1 text-left">@ 谁</span>
            <span className="text-[13px] text-[#BBA0A0] mr-1">
              {mentionedUsers.length > 0 ? `已选${mentionedUsers.length}人` : '提醒好友来看'}
            </span>
            <ChevronRight size={16} color="#BBA0A0" />
          </button>
        </div>
      </div>

      {/* Inline toolbar — 话题组件下方，无悬浮样式 */}
      <div className="py-3">
        <div className="flex items-center justify-around px-2">
          <button
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: topicNames.length > 0 ? '#FF6B6B' : '#FFF0E5' }}
            onClick={() => {
              document.querySelector('[data-topic-picker]')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <Hash size={20} color={topicNames.length > 0 ? '#fff' : '#FF6B6B'} />
          </button>
          <button
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: mentionedUsers.length > 0 ? '#A18CD1' : '#F3EFFF' }}
            onClick={() => { editorRef.current?.focus(); const sel = window.getSelection(); if (sel?.rangeCount) savedRangeRef.current = sel.getRangeAt(0).cloneRange(); setAtOpenMode('button'); setShowAtPicker(true); }}
          >
            <AtSign size={20} color={mentionedUsers.length > 0 ? '#fff' : '#A18CD1'} />
          </button>
          <button
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: images.length > 0 ? '#4ECDC4' : '#F0FFF4' }}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon size={20} color={images.length > 0 ? '#fff' : '#4ECDC4'} />
          </button>
          <button
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: location ? '#FFB347' : '#FFF8F0' }}
            onClick={async () => {
              if (location) { setLocation(''); return; }
              setLocating(true);
              const city = await getLocation();
              setLocation(city);
              setLocating(false);
            }}
          >
            <MapPinned size={20} color={location ? '#fff' : '#FFB347'} />
          </button>
        </div>
      </div>

      {/* @选人弹窗 */}
      <AtPicker
        show={showAtPicker}
        selectedIds={mentionedUsers.map(u => u.id)}
        onToggle={handleToggleMention}
        onClose={() => setShowAtPicker(false)}
      />
    </motion.div>
  );
}
