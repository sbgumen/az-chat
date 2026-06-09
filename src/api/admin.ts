import api from './index';

export const adminApi = {
  getSettings: () => api.get('/api/admin/settings'),
  updateSettings: (data: { system_name?: string }) => api.put('/api/admin/settings', data),
  uploadLogo: (file: File) => {
    const fd = new FormData(); fd.append('logo', file);
    return api.post('/api/admin/settings/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  getPublicSettings: () => api.get('/api/admin/public-settings'),
  getAppConfig: () => api.get('/api/admin/app-config'),

  getUsers: (params: { page?: number; limit?: number; keyword?: string }) => api.get('/api/admin/users', { params }),
  createUser: (nickname: string, password?: string, phone?: string) => api.post('/api/admin/users', { nickname: nickname || undefined, password: password || undefined, phone: phone || undefined }),
  updateUser: (id: number, data: object) => api.put(`/api/admin/users/${id}`, data),
  banUser: (id: number, is_banned: boolean) => api.put(`/api/admin/users/${id}/ban`, { is_banned }),
  deleteUser: (id: number) => api.delete(`/api/admin/users/${id}`),

  getGroups: (params: { page?: number; limit?: number; keyword?: string; systemType?: string }) => api.get('/api/admin/groups', { params }),
  updateGroup: (id: number, data: object) => api.put(`/api/admin/groups/${id}`, data),
  banGroup: (id: number, is_banned: boolean) => api.put(`/api/admin/groups/${id}/ban`, { is_banned }),
  deleteGroup: (id: number) => api.delete(`/api/admin/groups/${id}`),
  addSystemGroupMembers: (groupId: number, userIds: number[]) => api.post(`/api/admin/groups/${groupId}/members`, { userIds }),
  removeSystemGroupMember: (groupId: number, userId: number) => api.delete(`/api/admin/groups/${groupId}/members/${userId}`),

  getLevelConfig: () => api.get('/api/admin/level-config'),
  updateLevelConfig: (data: object) => api.put('/api/admin/level-config', data),

  getCaptchaConfig: () => api.get('/api/admin/captcha-config'),
  updateCaptchaConfig: (data: object) => api.put('/api/admin/captcha-config', data),

  // 仪表盘
  getDashboard: () => api.get('/api/admin/dashboard'),

  // 等级管理
  getLevelRules: () => api.get('/api/admin/level-rules'),
  updateLevelRule: (level: number, data: { name?: string; exp_required?: number; coin_reward?: number }) =>
    api.put(`/api/admin/level-rules/${level}`, data),
  batchFillLevelRules: (data: { startLevel?: number; endLevel?: number; exp_required?: number; coin_reward?: number }) =>
    api.post('/api/admin/level-rules/batch', data),

  // 签到管理
  getSigninStats: () => api.get('/api/admin/signin-stats'),
  getSigninConfig: () => api.get('/api/admin/signin-config'),
  updateSigninConfig: (config: { streak_days: number; bonus_coins: number }[]) =>
    api.put('/api/admin/signin-config', { config }),

  // 动态管理
  getAdminMoments: (params: { page?: number; limit?: number; keyword?: string; userId?: number }) =>
    api.get('/api/admin/moments', { params }),
  deleteAdminMoment: (id: number) => api.delete(`/api/admin/moments/${id}`),

  // 预设背景
  getPresets: () => api.get('/api/admin/presets'),
  createPreset: (fd: FormData) => api.post('/api/admin/presets', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updatePreset: (id: number, data: { name?: string; animation_type?: string; is_active?: number; sort_order?: number }) =>
    api.put(`/api/admin/presets/${id}`, data),
  deletePreset: (id: number) => api.delete(`/api/admin/presets/${id}`),

  // 话题管理
  getAdminTopics: (params: { page?: number; limit?: number; keyword?: string }) =>
    api.get('/api/admin/topics', { params }),
  updateAdminTopic: (id: number, data: object) => api.put(`/api/admin/topics/${id}`, data),
  deleteAdminTopic: (id: number) => api.delete(`/api/admin/topics/${id}`),

  // 测试发送
  testSms: (phone: string, templateId: string) =>
    api.post('/api/admin/test-sms', { phone, template_id: templateId }),
  testEmail: (email: string, smtp: { smtp_host: string; smtp_port: string; smtp_user: string; smtp_pass: string; smtp_from: string }) =>
    api.post('/api/admin/test-email', { email, ...smtp }),
};
