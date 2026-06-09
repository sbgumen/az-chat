import api from './index';

export function getConversations() {
  return api.get('/api/messages/conversations');
}

export function getMessages(userId: number, page = 1, limit = 50) {
  return api.get(`/api/messages/${userId}`, { params: { page, limit } });
}

export function markRead(userId: number) {
  return api.post(`/api/messages/read/${userId}`);
}

export function uploadImage(file: File, onProgress?: (pct: number) => void) {
  const formData = new FormData();
  formData.append('image', file);
  return api.post('/api/messages/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
}

export function uploadAudio(file: File) {
  const formData = new FormData();
  formData.append('audio', file);
  return api.post('/api/messages/upload-audio', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
}

export function recallMessage(msgId: number) {
  return api.post(`/api/messages/recall/${msgId}`);
}

export function getGroupConversations() {
  return api.get('/api/messages/group-conversations');
}

// 搜索私聊聊天记录
export function searchMessages(userId: number, keyword: string) {
  return api.get(`/api/messages/search/${userId}`, { params: { keyword } });
}

// 搜索群聊聊天记录
export function searchGroupMessages(groupId: number, keyword: string) {
  return api.get(`/api/messages/group-search/${groupId}`, { params: { keyword } });
}

// 获取会话设置
export function getConversationSettings(targetId: number, type: 'private' | 'group' = 'private') {
  return api.get(`/api/messages/settings/${targetId}`, { params: { type } });
}

// 更新会话设置
export function updateConversationSettings(targetId: number, data: { type?: string; is_pinned?: number; is_muted?: number }) {
  return api.post(`/api/messages/settings/${targetId}`, data);
}

// 获取置顶列表
export function getPinnedList() {
  return api.get('/api/messages/pinned/list');
}

// 获取免打扰列表
export function getMutedList() {
  return api.get('/api/messages/muted/list');
}
