export interface User {
  id: string;
  name: string;
  avatar: string;
  status?: 'online' | 'offline' | 'busy';
  signature?: string;
  lastSeen?: string;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'voice';
  read?: boolean;
}

export interface Conversation {
  id: string;
  user: User;
  lastMessage: Message;
  unreadCount: number;
  pinned?: boolean;
}

export interface Contact {
  id: string;
  user: User;
  group: string;
  initial: string;
}

export interface Moment {
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
  is_favorited?: boolean;
  created_at: string;
}

export interface MomentComment {
  id: number;
  user_id: number;
  nickname: string;
  avatar: string;
  level: number;
  content: string;
  reply_to: number | null;
  created_at: string;
  replies: MomentComment[];
}

export interface Topic {
  id: number;
  name: string;
  cover_image: string;
  description: string;
  usage_count: number;
  status: 'new' | 'active' | 'hot';
  active_users?: { nickname: string; avatar: string }[];
  moment_count?: number;
}

export interface MomentNotification {
  id: number;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'favorite';
  is_read: boolean;
  created_at: string;
  from_user: { id: number; nickname: string; avatar: string; level: number };
  moment: { id: number; content: string; image: string } | null;
  comment_content?: string | null;
}

export type TabType = 'messages' | 'contacts' | 'moments' | 'profile';

// 群聊相关类型
export interface Group {
  id: number;
  name: string;
  avatar: string;
  owner_id: number;
  notice?: string;
  member_count?: number;
  role?: 'owner' | 'admin' | 'member';
}

export interface GroupMember {
  user_id: number;
  role: 'owner' | 'admin' | 'member';
  nickname: string;
  avatar: string;
  group_nickname?: string;
  joined_at?: string;
}

export interface GroupMessage {
  id: number;
  group_id: number;
  sender_id: number;
  content: string;
  type: 'text' | 'image' | 'audio' | 'system';
  is_recalled?: number;
  reply_to?: number | null;
  created_at: string;
  sender_nickname?: string;
  sender_avatar?: string;
}

export interface GroupConversation {
  group_id: number;
  group_name: string;
  group_avatar: string;
  last_message: string;
  last_message_type: string;
  last_time: string;
  unread_count: number;
  is_group: true;
  member_count?: number;
}
