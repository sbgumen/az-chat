import api from './index';

export function getFriends() {
  return api.get('/api/contacts');
}

export function sendFriendRequest(toUserId: number, message?: string) {
  return api.post('/api/contacts/request', { toUserId, message });
}

export function getFriendRequests() {
  return api.get('/api/contacts/requests');
}

export function getMyRequests() {
  return api.get('/api/contacts/my-requests');
}

export function acceptFriendRequest(requestId: number) {
  return api.post(`/api/contacts/accept/${requestId}`);
}

export function rejectFriendRequest(requestId: number) {
  return api.post(`/api/contacts/reject/${requestId}`);
}

export function deleteFriend(friendId: number) {
  return api.delete(`/api/contacts/${friendId}`);
}
