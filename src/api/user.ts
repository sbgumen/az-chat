import api from './index';

export function getProfile() {
  return api.get('/api/user/profile');
}

export function getUserProfile(userId: number) {
  return api.get(`/api/user/profile/${userId}`);
}

export function updateProfile(data: { nickname?: string; gender?: number; weight?: number; height?: number; birthday?: string; signature?: string; tags?: string[]; privacy?: Record<string, boolean>; hide_online_status?: boolean; email?: string }) {
  return api.put('/api/user/profile', data);
}

export function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append('avatar', file);
  return api.put('/api/user/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
}

export function searchUser(keyword: string) {
  return api.get('/api/user/search', { params: { keyword } });
}

export function setPassword(data: { oldPassword?: string; code?: string; codeType?: 'phone' | 'email'; newPassword: string }) {
  return api.post('/api/user/password', data);
}

export function getPasswordOptions() {
  return api.get('/api/user/password-options');
}

export function rebindPhone(newPhone: string, code: string) {
  return api.post('/api/user/rebind-phone', { newPhone, code });
}

export function bindPhone(phone: string, code: string) {
  return api.post('/api/user/bind-phone', { phone, code });
}

export function bindEmail(email: string, code: string) {
  return api.post('/api/user/bind-email', { email, code });
}

export function getLevelInfo() {
  return api.get('/api/user/level');
}

export function signIn() {
  return api.post('/api/user/sign-in');
}

export function followUser(userId: number) {
  return api.post(`/api/user/follow/${userId}`);
}

export function unfollowUser(userId: number) {
  return api.post(`/api/user/unfollow/${userId}`);
}

export function getFollowing() {
  return api.get('/api/user/following');
}

export function getFollowers() {
  return api.get('/api/user/followers');
}

export function getRecommendUsers() {
  return api.get('/api/user/recommend/users');
}

export function getRecommendGroups() {
  return api.get('/api/user/recommend/groups');
}

export function getLevelRanking() {
  return api.get('/api/user/level/ranking');
}
export function getLevelRankingGlobal() {
  return api.get('/api/user/level/ranking/global');
}

export function getPopularRanking() {
  return api.get('/api/user/ranking/popular');
}
export function getPopularRankingGlobal() {
  return api.get('/api/user/ranking/popular/global');
}

export function addMessageExp() {
  return api.post('/api/user/exp/message');
}

export function saveFcmToken(token: string) {
  return api.post('/api/user/fcm-token', { token });
}

// 相册 API
export function getMyAlbums() {
  return api.get('/api/album/my');
}
export function getUserAlbums(userId: number) {
  return api.get(`/api/album/user/${userId}`);
}
export function getAlbumPhotos(albumId: number, page?: number, limit?: number) {
  return api.get(`/api/album/${albumId}/photos`, { params: page && limit ? { page, limit } : undefined });
}
export function createAlbum(name: string) {
  return api.post('/api/album', { name });
}
export function uploadAlbumPhoto(albumId: number, file: File, caption?: string) {
  const fd = new FormData();
  fd.append('photo', file);
  if (caption) fd.append('caption', caption);
  return api.post(`/api/album/${albumId}/photos`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
}
export function deleteAlbumPhoto(photoId: number) {
  return api.delete(`/api/album/photos/${photoId}`);
}
export function setAlbumCarousel(albumId: number, photoIds: number[]) {
  return api.put(`/api/album/${albumId}/carousel`, { photoIds });
}
export function deleteAlbum(albumId: number) {
  return api.delete(`/api/album/${albumId}`);
}
export function renameAlbum(albumId: number, name: string) {
  return api.put(`/api/album/${albumId}/name`, { name });
}
export function setAlbumVisibility(albumId: number, visibility: 'public' | 'friends' | 'private') {
  return api.put(`/api/album/${albumId}/visibility`, { visibility });
}
// 相册收藏
export function toggleAlbumFavorite(albumId: number) {
  return api.post(`/api/album-favorites/toggle/${albumId}`);
}
export function getAlbumFavorites() {
  return api.get('/api/album-favorites');
}
export function checkAlbumFavorite(albumId: number) {
  return api.get(`/api/album-favorites/check/${albumId}`);
}
// 相册评论
export function getAlbumComments(albumId: number) {
  return api.get(`/api/album-comments/${albumId}`);
}
export function addAlbumComment(albumId: number, content: string, replyTo?: number) {
  return api.post(`/api/album-comments/${albumId}`, { content, replyTo });
}
export function deleteAlbumComment(commentId: number) {
  return api.delete(`/api/album-comments/${commentId}`);
}
export function getAlbumUnread() {
  return api.get('/api/album/my/unread');
}
export function clearAlbumUnread(albumId: number) {
  return api.delete(`/api/album/my/unread/${albumId}`);
}

export function uploadBanner(file: File) {
  const form = new FormData();
  form.append('banner', file);
  return api.post('/api/user/banner', form);
}

export function saveBannerSettings(settings: {
  banner_type: string;
  banner_preset?: string;
  banner_image?: string;
}) {
  return api.put('/api/user/banner-settings', settings);
}

export function getBannerCustomUrls() {
  return api.get('/api/user/banner-custom-urls');
}

export function saveBannerCustomUrl(url: string) {
  return api.post('/api/user/banner-custom-urls', { url });
}

export function deleteBannerCustomUrl(url: string) {
  return api.delete('/api/user/banner-custom-urls', { data: { url } });
}

export function getLv30Style() {
  return api.get('/api/user/lv30-style');
}

export function saveLv30Style(style: string) {
  return api.put('/api/user/lv30-style', { style });
}

export function getChatStyle() {
  return api.get('/api/user/chat-style');
}

export function saveChatStyle(style: string) {
  return api.put('/api/user/chat-style', { style });
}

export function fetchOnlineStatus(userIds: number[]) {
  return api.get('/api/user/online-status', { params: { ids: userIds.join(',') } });
}

export function getFollowFeedUnread() {
  return api.get('/api/user/follow-feed-unread');
}

export function clearFollowFeedUnread() {
  return api.post('/api/user/follow-feed-unread/clear');
}

export function getUserPresets() {
  return api.get('/api/user/presets');
}

export function getUserLevelRules() {
  return api.get('/api/user/level-rules');
}

