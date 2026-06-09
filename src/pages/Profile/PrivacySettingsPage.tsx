import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Phone, User, Ruler, Cake, MessageCircle, Users, Eye } from 'lucide-react';
import { Weight } from 'lucide-react';
import { getProfile, updateProfile } from '../../api/user';
import { useSmartBack } from '../../hooks/useSmartBack';

interface PrivacyState {
  phone: boolean;
  gender: boolean;
  weight: boolean;
  height: boolean;
  birthday: boolean;
  allowDmFromStranger: boolean;
  followers: boolean;
  following: boolean;
  onlineStatus: boolean;
}

const privacyFields = [
  { key: 'phone' as const, icon: Phone, label: '手机号', description: '' },
  { key: 'gender' as const, icon: User, label: '性别', description: '' },
  { key: 'weight' as const, icon: Weight, label: '体重', description: '' },
  { key: 'height' as const, icon: Ruler, label: '身高', description: '' },
  { key: 'birthday' as const, icon: Cake, label: '生日', description: '' },
  { key: 'followers' as const, icon: Users, label: '粉丝列表', description: '关闭后别人无法查看你的粉丝列表' },
  { key: 'following' as const, icon: Users, label: '关注列表', description: '关闭后别人无法查看你的关注列表' },
  { key: 'allowDmFromStranger' as const, icon: MessageCircle, label: '允许非好友私聊', description: '关闭后非好友无法给你发消息' },
  { key: 'onlineStatus' as const, icon: Eye, label: '在线状态', description: '关闭后其他人将无法看到你的在线状态' },
];

interface Props {}

export function PrivacySettingsPage({}: Props) {
  const goBack = useSmartBack('/profile/settings');

  const [privacy, setPrivacy] = useState<PrivacyState>({
    phone: true,
    gender: true,
    weight: true,
    height: true,
    birthday: true,
    followers: true,
    following: true,
    allowDmFromStranger: true,
    onlineStatus: true,
  });

  useEffect(() => {
    getProfile().then((res) => {
      const data = res.data;
      if (data) {
        const raw = data.privacy;
        const parsed = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null;
        setPrivacy({
          phone: parsed?.phone ?? true,
          gender: parsed?.gender ?? true,
          weight: parsed?.weight ?? true,
          height: parsed?.height ?? true,
          birthday: parsed?.birthday ?? true,
          allowDmFromStranger: parsed?.allowDmFromStranger ?? true,
          followers: parsed?.followers ?? true,
          following: parsed?.following ?? true,
          onlineStatus: data.hide_online_status === 1 ? false : true,
        });
      }
    });
  }, []);

  const handleToggle = (field: keyof PrivacyState) => {
    const updated = { ...privacy, [field]: !privacy[field] };
    setPrivacy(updated);
    if (field === 'onlineStatus') {
      // hide_online_status is a separate column, not in the privacy JSON
      updateProfile({ hide_online_status: !updated.onlineStatus });
    } else {
      updateProfile({ privacy: updated });
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col bg-cream-100"
        
      
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 border-b border-cream-200">
        <button
          onClick={goBack}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-cream-200 transition-colors"
        >
          <ChevronLeft size={22} className="text-cream-800" />
        </button>
        <h1 className="font-display text-lg font-semibold text-cream-900">隐私设置</h1>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 flex flex-col gap-3">
        <div className="bg-white rounded-2xl border border-cream-200/60 shadow-soft">
          {privacyFields.map((field, i) => {
            const Icon = field.icon;
            return (
              <div
                key={field.key}
                className={`w-full flex items-center justify-between px-4 py-3.5 ${i < privacyFields.length - 1 ? 'border-b border-cream-100' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cream-100 flex items-center justify-center text-warm-500">
                    <Icon size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-cream-900">{field.label}</span>
                    {field.description && (
                      <span className="text-[11px] text-cream-500">{field.description}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleToggle(field.key)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${privacy[field.key] ? 'bg-warm-500' : 'bg-cream-300'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${privacy[field.key] ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
