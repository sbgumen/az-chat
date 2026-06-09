import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useSmartBack } from '../../hooks/useSmartBack';
import { useAuth } from '../../context/AuthContext';
import {
  ChevronLeft,
  Heart,
  MessageCircle,
  Share2,
  Star,
  MapPin,
  Play,
  Pause,
  Send,
  X,
  Edit3,
} from 'lucide-react';
import {
  getMomentDetail,
  getComments,
  postComment,
  deleteComment,
  toggleLike,
  toggleFavorite,
} from '../../api/moments';
import { followUser, unfollowUser, getFollowing } from '../../api/user';
import { ImageViewer } from '../../components/ImageViewer';
import { SafeImg } from '../../components/SafeImg';
import { renderMentionContent } from '../../utils/mention';

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const getAvatar = (avatar: string) => avatar?.startsWith('http') ? avatar : `${apiBase}${avatar}`;

interface MomentData {
  id: number;
  user_id: number;
  user_nickname: string;
  user_avatar: string;
  user_level?: number;
  content: string;
  images: string[];
  audio_url?: string;
  audio_duration?: number;
  location: string;
  visibility: 'public' | 'friends' | 'private';
  topic_name: string;
  like_count: number;
  comment_count: number;
  is_liked: boolean;
  is_favorited: boolean;
  created_at: string;
}

interface CommentData {
  id: number;
  user_id: number;
  nickname: string;
  avatar: string;
  level: number;
  content: string;
  reply_to: number | null;
  created_at: string;
  replies: CommentData[];
}

export function MomentDetail() {
  const navigate = useNavigate();
  const { momentId } = useParams<{ momentId: string }>();
  const { user } = useAuth();
  const goBack = useSmartBack('/moments');

  const [moment, setMoment] = useState<MomentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentPage, setCommentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  // Interaction state
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  // Audio
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioPlayProgress, setAudioPlayProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Image viewer
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  // Reply
  const [replyTo, setReplyTo] = useState<{ id: number; nickname: string } | null>(null);

  // New comment input
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  // Fetch moment detail
  useEffect(() => {
    if (!momentId) return;
    setLoading(true);
    getMomentDetail(Number(momentId))
      .then((res: any) => {
        if (res.code === 0 && res.data) {
          const d = res.data;
          setMoment(d);
          setLikeCount(d.like_count || 0);
          setIsLiked(d.is_liked || false);
          setIsFavorited(d.is_favorited || false);
          setCommentCount(d.comment_count || 0);
        }
      })
      .catch((err) => console.error('Failed to fetch moment detail', err))
      .finally(() => setLoading(false));
  }, [momentId]);

  // 加载已关注列表，检查是否已关注作者
  useEffect(() => {
    getFollowing().then((res: any) => {
      if (res.code === 0 && res.data) {
        const ids = new Set((res.data || []).map((u: any) => u.id));
        if (moment) setIsFollowing(ids.has(moment.user_id));
      }
    }).catch(() => {});
  }, [moment]);

  // Fetch comments
  const fetchComments = useCallback(
    (page: number, append = false) => {
      if (!momentId) return;
      setLoadingComments(true);
      getComments(Number(momentId), page, 20)
        .then((res: any) => {
          if (res.code === 0) {
            const list = res.data?.list || [];
            setComments((prev) => (append ? [...prev, ...list] : list));
            setHasMoreComments(res.data?.pagination?.hasMore ?? false);
          }
        })
        .catch((err) => console.error('Failed to fetch comments', err))
        .finally(() => setLoadingComments(false));
    },
    [momentId],
  );

  useEffect(() => {
    fetchComments(1);
  }, [fetchComments]);

  const loadMoreComments = () => {
    const nextPage = commentPage + 1;
    setCommentPage(nextPage);
    fetchComments(nextPage, true);
  };

  // Toggle like
  const handleToggleLike = useCallback(async () => {
    if (!momentId) return;
    const optimisticallyLiked = !isLiked;
    setIsLiked(optimisticallyLiked);
    setLikeCount((prev) => (optimisticallyLiked ? prev + 1 : prev - 1));
    try {
      await toggleLike(Number(momentId));
    } catch {
      setIsLiked(!optimisticallyLiked);
      setLikeCount((prev) => (optimisticallyLiked ? prev - 1 : prev + 1));
    }
  }, [momentId, isLiked]);

  // Toggle favorite
  const handleToggleFollow = useCallback(async () => {
    if (!moment) return;
    const prev = isFollowing;
    setIsFollowing(!prev);
    try {
      if (prev) await unfollowUser(moment.user_id);
      else await followUser(moment.user_id);
    } catch { setIsFollowing(prev); }
  }, [moment, isFollowing]);

  const handleToggleFavorite = useCallback(async () => {
    if (!momentId) return;
    const optimisticallyFavorited = !isFavorited;
    setIsFavorited(optimisticallyFavorited);
    try {
      await toggleFavorite(Number(momentId));
    } catch {
      setIsFavorited(!optimisticallyFavorited);
    }
  }, [momentId, isFavorited]);

  // Post comment
  const handlePostComment = useCallback(async () => {
    if (!momentId || !commentText.trim() || postingComment) return;
    setPostingComment(true);
    try {
      const res: any = await postComment(Number(momentId), commentText.trim(), replyTo?.id);
      if (res.code === 0) {
        setCommentText('');
        setReplyTo(null);
        setCommentCount((prev) => prev + 1);
        // Refresh comments
        fetchComments(1);
      }
    } catch (err) {
      console.error('Failed to post comment', err);
    } finally {
      setPostingComment(false);
    }
  }, [momentId, commentText, replyTo, postingComment, fetchComments]);

  // Delete comment
  const handleDeleteComment = useCallback(
    async (commentId: number) => {
      if (!momentId) return;
      try {
        await deleteComment(Number(momentId), commentId);
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        setCommentCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to delete comment', err);
      }
      setDeleteTarget(null);
    },
    [momentId],
  );

  // Audio control
  const toggleAudio = useCallback(() => {
    if (!moment?.audio_url) return;
    if (!audioRef.current) {
      const audio = new Audio(moment.audio_url);
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
  }, [moment?.audio_url, isPlayingAudio]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  // Render image grid
  const resolveUrl = (url: string) => url?.startsWith('http') ? url : `${apiBase}${url}`;
  const renderImageGrid = (images: string[]) => {
    if (!images || images.length === 0) return null;

    const gridMap: Record<number, string> = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
    };

    const gridClass = gridMap[Math.min(images.length, 3)] || 'grid-cols-3';
    const maxWidth = images.length === 1 ? 'max-w-[200px]' : images.length === 2 ? 'max-w-[260px]' : '';

    return (
      <div className={`grid ${gridClass} gap-1 rounded-xl overflow-hidden mb-3 ${maxWidth}`}>
        {images.map((img, i) => (
          <div
            key={i}
            className="aspect-square overflow-hidden cursor-pointer"
            onClick={() => setViewerIndex(i)}
          >
            <SafeImg
              src={resolveUrl(img)}
              alt=""
              className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-300"
            />
          </div>
        ))}
      </div>
    );
  };

  // Format time
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    try {
      const d = new Date(timeStr);
      const now = new Date();
      const diff = now.getTime() - d.getTime();
      if (diff < 60 * 1000) return '刚刚';
      if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}分钟前`;
      if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}小时前`;
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${month}-${day}`;
    } catch {
      return timeStr;
    }
  };

  // Loading state
  if (loading) {
    return (
      <motion.div
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
        style={{ background: '#FFFBFA' }}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="w-8 h-8 border-2 border-[#FF6B6B] border-t-transparent rounded-full animate-spin" />
      </motion.div>
    );
  }

  if (!moment) {
    return (
      <motion.div
        className="fixed inset-0 z-[200] flex flex-col"
        style={{ background: '#FFFBFA' }}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center gap-3 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 flex-shrink-0">
          <button onClick={goBack} className="w-9 h-9 flex items-center justify-center">
            <ChevronLeft size={22} color="#2D1B1B" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[#BBA0A0] text-[14px]">动态不存在或已被删除</p>
        </div>
      </motion.div>
    );
  }

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
      <div className="flex items-center gap-3 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 flex-shrink-0">
        <button onClick={goBack} className="w-9 h-9 flex items-center justify-center">
          <ChevronLeft size={22} color="#2D1B1B" />
        </button>
        <SafeImg
          src={getAvatar(moment.user_avatar)}
          alt=""
          className="w-8 h-8 rounded-full object-cover bg-[#F0E6E6] cursor-pointer"
          onClick={() => navigate(`/user/${moment.user_id}/moments`)}
        />
        <div className="flex flex-col min-w-0 flex-1 cursor-pointer" onClick={() => navigate(`/user/${moment.user_id}/moments`)}>
          <div className="flex items-center gap-1.5">
            <span className="text-[14px] font-semibold text-[#2D1B1B] truncate">
              {moment.user_nickname}
            </span>
            {moment.user_level ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white bg-gradient-to-r from-[#FF6B6B] to-[#FFB347]">
                LV{moment.user_level}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#BBA0A0]">
            <span>{formatTime(moment.created_at)}</span>
          </div>
        </div>
        {user && moment && user.id === moment.user_id ? (
          <button
            onClick={() => navigate(`/moments/publish?edit=${moment.id}`)}
            className="px-3 py-1.5 rounded-full text-[12px] font-semibold active:scale-95 transition-transform flex items-center gap-1"
            style={{ background: '#F0F0F0', color: '#2D1B1B' }}
          >
            <Edit3 size={13} />编辑
          </button>
        ) : (
          <button
            onClick={handleToggleFollow}
            className="px-3 py-1.5 rounded-full text-[12px] font-semibold active:scale-95 transition-transform"
            style={isFollowing
              ? { background: '#F0F0F0', color: '#BBA0A0' }
              : { background: 'linear-gradient(135deg, #FF6B6B, #FFB347)', color: '#fff' }}
          >
            {isFollowing ? '已关注' : '关注'}
          </button>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 pt-4">
        {/* Text content with @mention rendering */}
        {moment.content && (
          <p className="text-[17px] text-[#2D1B1B] pb-3 break-words" style={{ lineHeight: 1.75, letterSpacing: '0.3px', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
            {renderMentionContent(moment.content, (uid) => navigate(`/user/${uid}`))}
          </p>
        )}

        {/* Topic pills */}
        {moment.topic_name && (
          <div className="flex flex-wrap gap-2 mb-4">
            {moment.topic_name.split(',').filter(Boolean).map((tag, i) => (
              <button
                key={i}
                className="px-3 py-1 rounded-full text-[12px] font-semibold bg-[#FFF0E5] text-[#FF6B6B] active:scale-95 transition-transform"
                onClick={() => navigate(`/topics/${encodeURIComponent(tag.trim())}`)}
              >
                #{tag.trim()}
              </button>
            ))}
          </div>
        )}

        {/* Image grid */}
        {moment.images && moment.images.length > 0 && renderImageGrid(moment.images)}

        {/* Audio player */}
        {moment.audio_url && (
          <div className="w-full rounded-2xl mb-4 p-3 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #FFF0E5, #FFF5F0)' }}>
            <button onClick={toggleAudio} className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #FF6B6B, #FF8E8E)' }}>
              {isPlayingAudio ? <Pause size={18} color="#fff" /> : <Play size={18} color="#fff" fill="#fff" style={{ marginLeft: 2 }} />}
            </button>
            <div className="flex-1 h-8 flex items-end gap-[2px]">
              {Array.from({ length: 28 }, () => Math.random() * 0.6 + 0.3).map((h, i) => (
                <div key={i} className="w-1 rounded-full flex-shrink-0" style={{
                  height: `${h * 100}%`,
                  background: i / 28 <= audioPlayProgress ? 'linear-gradient(180deg, #FF6B6B, #FF8E8E)' : '#F0E6E6',
                }} />
              ))}
            </div>
            <span className="text-[12px] text-[#BBA0A0] flex-shrink-0">
              {Math.round((moment.audio_duration || 0) * (1 - (isPlayingAudio ? audioPlayProgress : 0)))}s
            </span>
          </div>
        )}

        {/* Location + time */}
        {moment.location && (
          <div className="flex items-center gap-1 mb-3">
            <MapPin size={11} color="#BBA0A0" />
            <span className="text-[12px] text-[#BBA0A0]">{moment.location}</span>
            <span className="text-[11px] text-[#BBA0A0] ml-auto">{formatTime(moment.created_at)}</span>
          </div>
        )}

        {/* Interactive bar */}
        <div className="mb-5 flex items-center justify-around py-3" style={{ background: '#F8F3F0', borderRadius: '12px' }}>
          <button
            onClick={handleToggleLike}
            className="flex items-center gap-1.5 text-[13px] py-1 px-3 rounded-full transition-colors"
          >
            <Heart size={18} fill={isLiked ? '#FF6B6B' : 'none'} color={isLiked ? '#FF6B6B' : '#BBA0A0'} />
            <span style={{ color: isLiked ? '#FF6B6B' : '#BBA0A0' }}>{likeCount}</span>
          </button>

          <button className="flex items-center gap-1.5 text-[13px] text-[#BBA0A0] py-1 px-3 rounded-full transition-colors">
            <MessageCircle size={18} />
            <span>{commentCount}</span>
          </button>

          <button className="flex items-center gap-1.5 text-[13px] text-[#BBA0A0] py-1 px-3 rounded-full transition-colors">
            <Share2 size={18} />
          </button>

          <button
            onClick={handleToggleFavorite}
            className="flex items-center gap-1.5 text-[13px] py-1 px-3 rounded-full transition-colors"
          >
            <Star
              size={18}
              fill={isFavorited ? '#FFB347' : 'none'}
              color={isFavorited ? '#FFB347' : '#BBA0A0'}
            />
          </button>
        </div>

        {/* Comments section */}
        <div className="mb-5">
          <h3 className="text-[14px] font-semibold text-[#2D1B1B] mb-3">
            全部评论 · {commentCount}
          </h3>

          {comments.length === 0 && !loadingComments ? (
            <p className="text-[13px] text-[#BBA0A0] text-center py-8">暂无评论，来说点什么吧</p>
          ) : (
            <div className="flex flex-col gap-3">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  momentUserId={moment.user_id}
                  onReply={(id, nickname) => {
                    setReplyTo({ id, nickname });
                    commentInputRef.current?.focus();
                  }}
                  onDelete={(id) => setDeleteTarget(id)}
                />
              ))}
            </div>
          )}

          {loadingComments && (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-[#FF6B6B] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {hasMoreComments && !loadingComments && (
            <button
              onClick={loadMoreComments}
              className="w-full text-center text-[13px] text-[#A18CD1] py-3"
            >
              加载更多评论
            </button>
          )}
        </div>

        {/* Bottom spacer */}
        <div className="h-16" />
      </div>

      {/* Reply tag */}
      {replyTo && (
        <div className="flex-shrink-0 h-9 flex items-center justify-between px-4 bg-[#FFF5F0] text-[12px] text-[#FF6B6B]">
          <span>回复 {replyTo.nickname}</span>
          <button onClick={() => setReplyTo(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Fixed bottom input bar */}
      <div
        className="flex-shrink-0 flex items-center gap-2.5 px-4 py-2 bg-[#FFFBFA] border-t border-[#F0E6E6]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        <SafeImg
          src={getAvatar(moment.user_avatar)}
          alt=""
          className="w-[26px] h-[26px] rounded-full object-cover bg-[#F0E6E6] flex-shrink-0"
        />
        <div className="flex-1 flex items-center bg-[#F5F0F0] rounded-full px-4">
          <input
            ref={commentInputRef}
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="说点什么..."
            className="flex-1 bg-transparent text-[13px] text-[#3D2B2B] placeholder-[#BBA0A0] py-2 outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handlePostComment();
            }}
          />
          {commentText.trim() && (
            <button
              onClick={handlePostComment}
              disabled={postingComment}
              className="flex-shrink-0 ml-2"
            >
              <Send size={18} color="#FF6B6B" />
            </button>
          )}
        </div>
        <button onClick={handleToggleLike} className="flex-shrink-0 w-9 h-9 flex items-center justify-center">
          <Heart size={20} fill={isLiked ? '#FF6B6B' : 'none'} color={isLiked ? '#FF6B6B' : '#BBA0A0'} />
        </button>
      </div>

      {/* Image viewer */}
      <AnimatePresence>
        {viewerIndex !== null && moment?.images && <ImageViewer images={moment.images.map(resolveUrl)} initialIndex={viewerIndex} onClose={() => setViewerIndex(null)} />}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteTarget !== null && (
          <motion.div
            className="fixed inset-0 z-[300] bg-black/40 flex items-center justify-center px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 w-full max-w-xs"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[14px] text-[#2D1B1B] text-center mb-5">确定要删除这条评论吗？</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 rounded-full text-[13px] font-semibold text-[#BBA0A0] bg-[#F5F0F0]"
                >
                  取消
                </button>
                <button
                  onClick={() => handleDeleteComment(deleteTarget)}
                  className="flex-1 py-2.5 rounded-full text-[13px] font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #FF6B6B, #FF8E8E)' }}
                >
                  删除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ========== Comment Item Component ==========
interface CommentItemProps {
  comment: CommentData;
  momentUserId: number;
  onReply: (id: number, nickname: string) => void;
  onDelete: (id: number) => void;
}

function CommentItem({ comment, momentUserId, onReply, onDelete }: CommentItemProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showAllReplies, setShowAllReplies] = useState(false);

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    try {
      const d = new Date(timeStr);
      const now = new Date();
      const diff = now.getTime() - d.getTime();
      if (diff < 60 * 1000) return '刚刚';
      if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}分钟前`;
      if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}小时前`;
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${month}-${day}`;
    } catch {
      return timeStr;
    }
  };

  const displayedReplies = showAllReplies
    ? comment.replies || []
    : (comment.replies || []).slice(0, 2);

  return (
    <div>
      {/* Main comment */}
      <div className="bg-white rounded-2xl shadow-sm p-3">
        <div className="flex items-start gap-2.5">
          <SafeImg
            src={getAvatar(comment.avatar)}
            alt=""
            className="w-6 h-6 rounded-full object-cover bg-[#F0E6E6] flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[12px] font-semibold text-[#2D1B1B]">{comment.nickname}</span>
              {comment.user_id === momentUserId && (
                <span className="text-[10px] px-1 py-0.5 rounded bg-gradient-to-r from-[#FF6B6B]/20 to-[#FFB347]/20 text-[#FF6B6B]">
                  作者
                </span>
              )}
              <span className="text-[11px] text-[#BBA0A0]">{formatTime(comment.created_at)}</span>
            </div>
            <p className="text-[13px] text-[#3D2B2B] leading-relaxed mb-2">{comment.content}</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setLiked(!liked);
                  setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
                }}
                className="flex items-center gap-1 text-[12px] transition-colors"
                style={{ color: liked ? '#FF6B6B' : '#BBA0A0' }}
              >
                <Heart size={13} fill={liked ? '#FF6B6B' : 'none'} />
                {likeCount > 0 && <span>{likeCount}</span>}
              </button>
              <button
                onClick={() => onReply(comment.id, comment.nickname)}
                className="text-[12px] text-[#BBA0A0] hover:text-[#FF6B6B] transition-colors"
              >
                回复
              </button>
              <button
                onClick={() => onDelete(comment.id)}
                className="text-[12px] text-[#BBA0A0] hover:text-[#FF6B6B] transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {displayedReplies.length > 0 && (
        <div className="mt-1.5 ml-8 flex flex-col gap-1.5">
          {displayedReplies.map((reply) => (
            <div
              key={reply.id}
              className="rounded-xl p-2.5"
              style={{ background: '#FFFBFA' }}
            >
              <div className="flex items-start gap-2">
                <SafeImg
                  src={getAvatar(reply.avatar)}
                  alt=""
                  className="w-5 h-5 rounded-full object-cover bg-[#F0E6E6] flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-[11px] font-semibold text-[#2D1B1B]">{reply.nickname}</span>
                    {reply.reply_to && (
                      <>
                        <span className="text-[10px] text-[#BBA0A0]">回复</span>
                        <span className="text-[11px] text-[#A18CD1]">
                          {comment.nickname}
                        </span>
                      </>
                    )}
                    <span className="text-[10px] text-[#BBA0A0]">{formatTime(reply.created_at)}</span>
                  </div>
                  <p className="text-[12px] text-[#3D2B2B] leading-relaxed">{reply.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Show more/less replies */}
      {comment.replies && comment.replies.length > 2 && (
        <button
          onClick={() => setShowAllReplies(!showAllReplies)}
          className="ml-8 mt-1 text-[12px] text-[#A18CD1]"
        >
          {showAllReplies
            ? '收起回复'
            : `查看全部 ${comment.replies.length} 条回复`}
        </button>
      )}
    </div>
  );
}
