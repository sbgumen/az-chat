import api from './index';

export function getCaptcha() {
  return api.get('/api/auth/captcha');
}

export function sendCode(phone: string, captchaToken: string, captchaAnswer: string) {
  return api.post('/api/auth/send-code', { phone, captchaToken, captchaAnswer });
}

export function sendEmailCode(email: string, captchaToken: string, captchaAnswer: string) {
  return api.post('/api/auth/send-email-code', { email, captchaToken, captchaAnswer });
}

export function loginByPhone(phone: string, code: string, nickname?: string) {
  return api.post('/api/auth/login', { phone, code, nickname });
}

export function loginByEmail(email: string, code: string) {
  return api.post('/api/auth/login-email', { email, code });
}

export function loginById(userId: string, password: string, captchaToken?: string, captchaAnswer?: string) {
  return api.post('/api/auth/login-id', { userId, password, captchaToken, captchaAnswer });
}

export function registerByPassword(nickname: string, password: string, captchaToken: string, captchaAnswer: string) {
  return api.post('/api/auth/register-password', { nickname, password, captchaToken, captchaAnswer });
}

export function checkPhone(phone: string) {
  return api.get('/api/auth/check-phone', { params: { phone } });
}

export function checkEmail(email: string) {
  return api.get('/api/auth/check-email', { params: { email } });
}

export function registerUser(tempToken: string, nickname: string) {
  return api.post('/api/auth/register', { tempToken, nickname });
}
