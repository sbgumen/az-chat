import api from './index';

// 禁言 API
export function muteMember(groupId: number, userId: number, duration: number) {
  return api.post(`/api/groups/${groupId}/mute`, { userId, duration });
}
export function unmuteMember(groupId: number, userId: number) {
  return api.post(`/api/groups/${groupId}/unmute`, { userId });
}
export function getGroupMutes(groupId: number) {
  return api.get(`/api/groups/${groupId}/mutes`);
}

export function createGroup(name: string, memberIds: number[]) {
  return api.post('/api/groups/create', { name, memberIds }).then((res: any) => res.data ?? res);
}
export function createSystemGroup(name: string, systemMode: string, memberIds?: number[]) {
  return api.post('/api/groups/create-system', { name, systemMode, memberIds }).then((res: any) => res.data ?? res);
}
export function getMyGroups() { return api.get('/api/groups/my'); }
export function getGroupDetail(groupId: number) { return api.get(`/api/groups/${groupId}`); }
export function updateGroup(groupId: number, data: { name?: string; notice?: string; avatar?: string; description?: string; tags?: string[]; join_type?: number }) {
  return api.put(`/api/groups/${groupId}`, data);
}
export function setGroupAdmin(groupId: number, userId: number, isAdmin: boolean) {
  return api.post(`/api/groups/${groupId}/set-admin`, { userId, isAdmin });
}
export function inviteMembers(groupId: number, userIds: number[]) {
  return api.post(`/api/groups/${groupId}/invite`, { userIds });
}
export function kickMember(groupId: number, userId: number) {
  return api.post(`/api/groups/${groupId}/kick`, { userId });
}
export function leaveGroup(groupId: number) { return api.post(`/api/groups/${groupId}/leave`); }
export function dismissGroup(groupId: number) { return api.post(`/api/groups/${groupId}/dismiss`); }
export function getGroupMessages(groupId: number, page = 1, limit = 50) {
  return api.get(`/api/groups/${groupId}/messages`, { params: { page, limit } });
}
export function markGroupRead(groupId: number) { return api.post(`/api/groups/${groupId}/read`); }
export function requestJoinGroup(groupId: number, message = '') {
  return api.post('/api/groups/request', { groupId, message });
}
export function getGroupRequests() { return api.get('/api/groups/requests'); }
export function getMyGroupRequests() { return api.get('/api/groups/my-requests'); }
export function acceptGroupRequest(reqId: number) { return api.post(`/api/groups/requests/${reqId}/accept`); }
export function rejectGroupRequest(reqId: number) { return api.post(`/api/groups/requests/${reqId}/reject`); }
export function searchGroup(keyword: string) { return api.get('/api/groups/search', { params: { keyword } }); }
export function uploadGroupImage(file: File, onProgress?: (pct: number) => void) {
  const formData = new FormData(); formData.append('image', file);
  return api.post('/api/groups/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
}
export function uploadGroupAudio(file: File) {
  const formData = new FormData(); formData.append('audio', file);
  return api.post('/api/groups/upload-audio', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
}
export function uploadGroupAvatar(file: File) {
  const formData = new FormData(); formData.append('avatar', file);
  return api.post('/api/groups/upload-avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
}
export function recallGroupMessage(msgId: number) {
  return api.post(`/api/groups/recall/${msgId}`);
}
export function getGroupNotices(groupId: number) {
  return api.get(`/api/groups/${groupId}/notices`);
}
export function createGroupNotice(groupId: number, title: string, content: string, images?: string[]) {
  return api.post(`/api/groups/${groupId}/notices`, { title, content, images });
}
export function editGroupNotice(groupId: number, noticeId: number, title: string, content: string, images?: string[]) {
  return api.put(`/api/groups/${groupId}/notices/${noticeId}`, { title, content, images });
}
export function uploadNoticeImage(groupId: number, file: File) {
  const fd = new FormData();
  fd.append('image', file);
  return api.post(`/api/groups/${groupId}/notices/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
}
export function setBroadcastNotice(groupId: number, noticeId: number, is_broadcast: boolean) {
  return api.put(`/api/groups/${groupId}/notices/${noticeId}/broadcast`, { is_broadcast });
}
export function markNoticeRead(groupId: number, noticeId: number) {
  return api.post(`/api/groups/${groupId}/notices/${noticeId}/read`);
}
export function getBroadcastNotice(groupId: number) {
  return api.get(`/api/groups/${groupId}/notices/broadcast`);
}
export function deleteGroupNotice(groupId: number, noticeId: number) {
  return api.delete(`/api/groups/${groupId}/notices/${noticeId}`);
}
export function clearGroupMention(groupId: number) {
  return api.post(`/api/groups/${groupId}/clear-mention`);
}

