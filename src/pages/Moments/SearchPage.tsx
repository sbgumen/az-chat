import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSmartBack } from '../../hooks/useSmartBack';
import { ChevronLeft, Search, X, Hash, MessageCircle, Heart } from 'lucide-react';
import { searchMoments } from '../../api/moments';
import { SafeImg } from '../../components/SafeImg';
import { renderMentionContent } from '../../utils/mention';

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const getUrl = (s: string) => s?.startsWith('http') ? s : `${apiBase}${s}`;

type SearchTab = 'moment' | 'topic' | 'user';

const hotSearches = ['咖啡馆探店', '春日穿搭', '旅行日记', '音乐推荐', '美食分享', '读书笔记'];

export function SearchPage() {
  const navigate = useNavigate();
  const goBack = useSmartBack('/moments');
  const [searchParams] = useSearchParams();
  const searchUserId = searchParams.get('userId');
  const searchUserNickname = searchParams.get('nickname');

  const [keyword, setKeyword] = useState('');
  const [tab, setTab] = useState<SearchTab>('moment');
  const [results, setResults] = useState<any[]>([]);
  const [topicMoments, setTopicMoments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const loadingRef = useRef(false);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const doSearch = useCallback(async (kw: string, t: SearchTab, pg: number, append: boolean) => {
    if (!kw.trim()) return;
    // 新搜索跳过加载锁（允许覆盖旧请求）
    if (!append && loadingRef.current) {
      loadingRef.current = false;
    }
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const uid = searchUserId ? Number(searchUserId) : undefined;
      const res: any = await searchMoments(kw.trim(), t, pg, 15, uid);
      if (res.code === 0) {
        const list = res.data?.list || [];
        setResults(prev => append ? [...prev, ...list] : list);
        setHasMore(res.data?.pagination?.hasMore ?? false);
        if (t === 'topic' && res.data?.moments) {
          setTopicMoments(res.data.moments);
        } else {
          setTopicMoments([]);
        }
      } else {
        console.error('搜索返回异常:', res);
      }
    } catch (err) { console.error('搜索失败:', err); } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [searchUserId]);

  // 自动搜索：关键词变化 300ms 后触发
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!keyword.trim()) {
      setResults([]);
      setHasMore(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      setPage(1);
      setResults([]);
      doSearch(keyword, tab, 1, false);
    }, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [keyword, tab, doSearch]);

  // 点击热门搜索标签
  const handleTagClick = (s: string) => {
    setKeyword(s);
  };

  // 手动搜索（Enter 时立即触发）
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && keyword.trim()) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setPage(1);
      setResults([]);
      doSearch(keyword, tab, 1, false);
    }
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    doSearch(keyword, tab, next, true);
  };

  const tabs: SearchTab[] = searchUserId ? ['moment'] : ['moment', 'topic', 'user'];

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: '#FFFBFA' }}
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-[calc(var(--status-bar-height,0px)+10px)] pb-3">
        <button onClick={goBack} className="p-0.5"><ChevronLeft size={22} color="#2D1B1B" /></button>
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5F0F0]">
          <Search size={14} color="#BBA0A0" />
          <input
            ref={inputRef} type="text" value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={searchUserId ? `搜索${searchUserNickname || 'TA'}的动态...` : '输入关键词自动搜索...'}
            className="flex-1 bg-transparent text-[14px] text-[#2D1B1B] placeholder-[#BBA0A0] outline-none"
          />
          {keyword && <button onClick={() => setKeyword('')}><X size={14} color="#BBA0A0" /></button>}
        </div>
      </div>

      {/* 热门搜索 — 只在无输入时显示 */}
      {!keyword.trim() && (
        <div className="px-4 pt-2">
          <p className="text-[10px] text-[#BBA0A0] mb-3">热门搜索</p>
          <div className="flex flex-wrap gap-2">
            {hotSearches.map(s => (
              <button key={s} onClick={() => handleTagClick(s)}
                className="px-3.5 py-1.5 rounded-full text-[12px] font-medium text-[#FF6B6B] bg-[#FFF0E5] active:scale-95 transition-transform">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Result tabs */}
      {keyword.trim() && (
        <div className="flex gap-5 px-4 py-2">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-[13px] font-semibold pb-1 ${tab === t ? 'text-[#FF6B6B]' : 'text-[#BBA0A0]'}`}>
              {t === 'moment' ? '动态' : t === 'topic' ? '话题' : '用户'}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-3">
        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-[#FF6B6B] border-t-transparent rounded-full animate-spin" /></div>
        ) : results.length === 0 && keyword.trim() ? (
          <p className="text-[13px] text-[#BBA0A0] text-center py-16">未找到相关内容</p>
        ) : (
          <div className="flex flex-col gap-2 pb-20">
            {tab === 'moment' && results.map((m: any) => (
              <div key={m.id} className="p-3 rounded-xl cursor-pointer active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #FFF0E5, #FFF5F0)' }}
                onClick={() => navigate(`/moments/${m.id}`)}>
                <div className="flex items-center gap-2 mb-1">
                  <SafeImg src={getUrl(m.user_avatar)} alt="" className="w-5 h-5 rounded-full object-cover bg-[#F0E6E6]" />
                  <span className="text-[11px] font-semibold text-[#2D1B1B]">{m.user_nickname}</span>
                </div>
                <p className="text-[12px] text-[#3D2B2B]">{renderMentionContent(m.content?.slice(0, 100) || '')}</p>
                <div className="flex gap-3 mt-1.5">
                  <span className="flex items-center gap-0.5 text-[10px] text-[#BBA0A0]"><Heart size={10} />{m.like_count}</span>
                  <span className="flex items-center gap-0.5 text-[10px] text-[#BBA0A0]"><MessageCircle size={10} />{m.comment_count}</span>
                </div>
              </div>
            ))}
            {tab === 'topic' && results.map((t: any) => (
              <div key={t.id} className="p-3 rounded-xl cursor-pointer active:scale-[0.98] flex items-center gap-3"
                style={{ background: 'linear-gradient(135deg, #F3EFFF, #F8F5FF)' }}
                onClick={() => navigate(`/topics/${encodeURIComponent(t.name)}`)}>
                <Hash size={16} color="#A18CD1" />
                <div className="flex-1"><span className="text-[13px] font-semibold text-[#2D1B1B]">{t.name}</span></div>
                <span className="text-[10px] text-[#BBA0A0]">{t.usage_count}条动态</span>
              </div>
            ))}
            {/* 话题相关动态 */}
            {tab === 'topic' && topicMoments.length > 0 && (
              <>
                <p className="text-[10px] text-[#BBA0A0] px-1 pt-2 pb-1">相关动态</p>
                {topicMoments.map((m: any) => (
                  <div key={`tm-${m.id}`} className="p-3 rounded-xl cursor-pointer active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #FFF0E5, #FFF5F0)' }}
                    onClick={() => navigate(`/moments/${m.id}`)}>
                    <div className="flex items-center gap-2 mb-1">
                      <SafeImg src={getUrl(m.user_avatar)} alt="" className="w-5 h-5 rounded-full object-cover bg-[#F0E6E6]" />
                      <span className="text-[11px] font-semibold text-[#2D1B1B]">{m.user_nickname}</span>
                    </div>
                    <p className="text-[12px] text-[#3D2B2B]">{renderMentionContent(m.content?.slice(0, 100) || '')}</p>
                    <div className="flex gap-3 mt-1.5">
                      <span className="flex items-center gap-0.5 text-[10px] text-[#BBA0A0]"><Heart size={10} />{m.like_count}</span>
                      <span className="flex items-center gap-0.5 text-[10px] text-[#BBA0A0]"><MessageCircle size={10} />{m.comment_count}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
            {tab === 'user' && results.map((u: any) => (
              <div key={u.id} className="p-3 rounded-xl cursor-pointer active:scale-[0.98] flex items-center gap-3"
                style={{ background: 'linear-gradient(135deg, #F0FFF4, #E8F8F0)' }}
                onClick={() => navigate(`/user/${u.id}`)}>
                <SafeImg src={getUrl(u.avatar)} alt="" className="w-9 h-9 rounded-full object-cover bg-[#F0E6E6]" />
                <div className="flex-1">
                  <span className="text-[13px] font-semibold text-[#2D1B1B]">{u.nickname}</span>
                  {u.signature && <p className="text-[10px] text-[#BBA0A0] truncate">{u.signature}</p>}
                </div>
                {u.level > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#FFF0E5] text-[#FF6B6B] font-semibold">LV.{u.level}</span>}
              </div>
            ))}
            {hasMore && (
              <button onClick={loadMore} className="py-3 text-[12px] text-[#BBA0A0] text-center">加载更多</button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export { SearchPage as MomentSearchPage };
