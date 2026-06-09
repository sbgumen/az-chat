import api from './index';

// ====== Feed 流 ======
export function getFeed(tab: string = 'recommend', page: number = 1, limit: number = 15) {
  return api.get('/api/moments/feed', { params: { tab, page, limit } });
}

// ====== 发布动态 ======
export function createMoment(data: {
  content?: string; images?: string[]; audio_url?: string; audio_duration?: number;
  location?: string; visibility?: string; topic_name?: string; mentioned_user_ids?: number[];
}) {
  return api.post('/api/moments', {
    content: data.content || '',
    images: JSON.stringify(data.images || []),
    audio_url: data.audio_url || undefined,
    audio_duration: data.audio_duration || 0,
    location: data.location || '',
    visibility: data.visibility || 'public',
    topic_name: data.topic_name || '',
    mentioned_user_ids: data.mentioned_user_ids || [],
  });
}

// ====== 上传图片 ======
export function uploadMomentImage(file: File, onProgress?: (pct: number) => void) {
  const fd = new FormData();
  fd.append('image', file);
  return api.post('/api/moments/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (e.total && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
}

// ====== 上传语音 ======
export function uploadMomentAudio(file: Blob) {
  const fd = new FormData();
  fd.append('audio', file, 'recording.webm');
  return api.post('/api/moments/upload-audio', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
}

// ====== 动态详情 ======
export function getMomentDetail(id: number) {
  return api.get(`/api/moments/${id}`);
}

// ====== 删除动态 ======
export function deleteMoment(id: number) {
  return api.delete(`/api/moments/${id}`);
}

// ====== 点赞/取消 ======
export function toggleLike(momentId: number) {
  return api.post(`/api/moments/${momentId}/like`);
}

// ====== 评论 ======
export function getComments(momentId: number, page: number = 1, limit: number = 20) {
  return api.get(`/api/moments/${momentId}/comments`, { params: { page, limit } });
}

export function postComment(momentId: number, content: string, replyTo?: number) {
  return api.post(`/api/moments/${momentId}/comments`, { content, replyTo });
}

export function deleteComment(momentId: number, commentId: number) {
  return api.delete(`/api/moments/${momentId}/comments/${commentId}`);
}

// ====== 收藏 ======
export function toggleFavorite(momentId: number) {
  return api.post(`/api/moments/${momentId}/favorite`);
}

// ====== 话题 ======
export function getHotTopics() {
  return api.get('/api/moments/topics/hot');
}

export function getActiveTopics() {
  return api.get('/api/moments/topics/active');
}

export function getTopicDetail(topicName: string) {
  return api.get(`/api/moments/topics/${encodeURIComponent(topicName)}`);
}

export function getTopicFeed(topicName: string, sort: string = 'hot', page: number = 1, limit: number = 15) {
  return api.get(`/api/moments/topics/${encodeURIComponent(topicName)}/feed`, { params: { sort, page, limit } });
}

// ====== 通知 ======
export function getNotifications(type: string = 'all', page: number = 1, limit: number = 20) {
  return api.get('/api/moments/notifications', { params: { type, page, limit } });
}

export function getUnreadNotificationCount() {
  return api.get('/api/moments/notifications/unread-count');
}

export function markNotificationsReadByType(type: string) {
  return api.post('/api/moments/notifications/read-by-type', { type });
}

export function markAllNotificationsRead() {
  return api.post('/api/moments/notifications/read-all');
}

// ====== 推荐用户 ======
export function getRecommendUsers() {
  return api.get('/api/moments/recommend-users');
}

// ====== 我的动态 ======
export function getMyMoments(tab: string = 'published', page: number = 1, limit: number = 15) {
  return api.get('/api/moments/mine', { params: { tab, page, limit } });
}

// ====== 编辑动态 ======
export function updateMoment(id: number, data: {
  content?: string; images?: string[]; audio_url?: string; audio_duration?: number;
  location?: string; visibility?: string; topic_name?: string;
}) {
  return api.put(`/api/moments/${id}`, {
    content: data.content || '',
    images: data.images || [],
    audio_url: data.audio_url || null,
    audio_duration: data.audio_duration || 0,
    location: data.location || '',
    visibility: data.visibility || 'public',
    topic_name: data.topic_name || '',
  });
}

// ====== 搜索 ======
export function searchMoments(keyword: string, type: string = 'moment', page: number = 1, limit: number = 15, userId?: number) {
  const params: any = { keyword, type, page, limit };
  if (userId) params.userId = userId;
  return api.get('/api/moments/search', { params });
}

// ====== 查看他人动态 ======
export function getUserMoments(userId: number, page: number = 1, limit: number = 15) {
  return api.get(`/api/moments/user/${userId}`, { params: { page, limit } });
}

// ====== GPS 定位 ======
export function getGeoLocation(lat: number, lng: number) {
  return api.post('/api/moments/location/geo', { latitude: lat, longitude: lng });
}
