import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown, ChevronRight, Search, HelpCircle, FileText, Shield, MessageSquare } from 'lucide-react';
import { useSmartBack } from '../../hooks/useSmartBack';

interface Faq { q: string; a: string; }

const faqs: Faq[] = [
  { q: '如何注册 AZ-Chat 账号？', a: '打开应用后，在登录页面输入您的手机号码，点击获取验证码，输入短信验证码即可自动注册。首次登录需要设置昵称。' },
  { q: '如何添加好友？', a: '在联系人页面点击搜索框，输入对方的手机号、用户ID或昵称搜索，找到后点击进入主页，点击"加为好友"发送申请，待对方同意后即可成为好友。' },
  { q: '如何创建群聊？', a: '在消息页或联系人页点击右上角新建按钮，选择"创建群聊"，勾选您想邀请的好友，设置群名称后即可创建。' },
  { q: '如何修改个人资料？', a: '进入个人主页，点击右上角编辑按钮进入编辑页面，可以修改昵称、头像、性别、身高、体重、生日、签名和标签。' },
  { q: '如何发布动态？', a: '在动态页面点击右下角发布按钮，可以输入文字、上传图片（最多9张）、录制语音（最长60秒），还可以添加话题、@好友、选择位置和可见范围。' },
  { q: '朋友圈和推荐有什么区别？', a: '"推荐"展示全平台公开动态和好友可见动态，使用瀑布流卡片设计；"关注"只展示您关注的用户发布的动态，采用时间线排列。' },
  { q: '忘记密码怎么办？', a: '如果您已设置过登录密码且忘记了，可以使用手机验证码登录（无需密码）。登录后在"设置 → 账号安全"中可以修改密码。' },
  { q: '如何设置隐私权限？', a: '进入个人主页 → 设置 → 隐私设置，您可以单独控制性别、体重、身高、生日、在线状态等信息的可见范围。' },
  { q: '等级和金币怎么获得？', a: '每日签到可获得经验和金币；发送消息每条+2经验（每日上限50条）；添加好友双方各获得30经验。每100经验升1级，每次升级获得2金币。' },
  { q: '等级有什么作用？', a: '等级提升可解锁专属权益：LV10获得彩虹昵称效果，LV20解锁鎏金暖阳主页风格，LV25解锁樱吹雪风格，LV30解锁水晶棱镜、极光幻境、暗夜霓虹三种风格。' },
  { q: '如何注销账号？', a: '注销账号需要通过身份验证。请联系客服（帮助中心 → 联系我们），我们将核实您的身份后协助您注销账号。注销后所有数据将被永久删除，不可恢复。' },
  { q: '遇到违规用户怎么办？', a: '如发现违规内容或骚扰行为，您可以通过联系我们页面提交举报信息。我们会尽快核实并根据用户协议采取相应措施，包括但不限于删除内容、限制功能或封禁账号。' },
];

export function HelpPage() {
  const goBack = useSmartBack('/profile/settings');
  const navigate = useNavigate();
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? faqs.filter(f => f.q.includes(query.trim()) || f.a.includes(query.trim()))
    : faqs;

  return (
    <motion.div className="fixed inset-0 z-[220] flex flex-col overflow-hidden"
      style={{ background: '#FFFBFA' }}
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}>

      <div className="flex items-center gap-3 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
        <button onClick={goBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-cream-200">
          <ChevronLeft size={22} className="text-cream-800" /></button>
        <h1 className="font-display text-lg font-semibold text-cream-900 flex-1">帮助中心</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {/* 法律文件入口 */}
        <div className="flex gap-2 mt-4 mb-3">
          <button onClick={() => navigate('/legal/terms')}
            className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-cream-200/60 shadow-sm active:scale-[0.98] transition-transform">
            <FileText size={16} className="text-warm-500" />
            <span className="text-[12px] font-semibold text-cream-800">用户协议</span>
            <ChevronRight size={14} className="text-cream-400 ml-auto" />
          </button>
          <button onClick={() => navigate('/legal/privacy')}
            className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-cream-200/60 shadow-sm active:scale-[0.98] transition-transform">
            <Shield size={16} className="text-warm-500" />
            <span className="text-[12px] font-semibold text-cream-800">隐私政策</span>
            <ChevronRight size={14} className="text-cream-400 ml-auto" />
          </button>
        </div>

        {/* 联系我们入口 */}
        <button onClick={() => navigate('/profile/contact')}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-cream-200/60 shadow-sm mb-4 active:scale-[0.98] transition-transform">
          <MessageSquare size={16} className="text-warm-500" />
          <span className="text-[12px] font-semibold text-cream-800">联系我们</span>
          <span className="text-[11px] text-cream-400 ml-auto">客服支持</span>
          <ChevronRight size={14} className="text-cream-400" />
        </button>

        {/* Search */}
        <div className="flex items-center gap-2.5 rounded-2xl px-4 py-3 mb-4"
          style={{ background: 'rgba(0,0,0,0.03)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)' }}>
          <Search size={16} className="text-cream-400 flex-shrink-0" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="搜索常见问题..." className="flex-1 bg-transparent text-sm text-cream-900 placeholder:text-cream-400 outline-none" />
        </div>

        {/* FAQ list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <HelpCircle size={36} className="text-cream-300" />
            <p className="text-cream-400 text-sm">未找到相关问题</p>
            <p className="text-cream-400 text-[12px]">试试其他关键词或联系客服</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 pb-8">
            {filtered.map((faq, i) => {
              const isOpen = openIdx === i;
              return (
                <motion.div key={i} className="rounded-2xl overflow-hidden"
                  style={{ background: isOpen ? '#fff' : 'rgba(255,255,255,0.6)', boxShadow: isOpen ? '0 2px 12px rgba(0,0,0,0.06)' : '0 1px 4px rgba(0,0,0,0.03)' }}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-4 text-left"
                    onClick={() => setOpenIdx(openIdx === i ? null : i)}>
                    <span className="text-[11px] font-bold text-cream-300 flex-shrink-0 w-5">{String(i + 1).padStart(2, '0')}</span>
                    <span className={`text-[14px] font-semibold flex-1 transition-colors ${isOpen ? 'text-warm-500' : 'text-cream-800'}`}>{faq.q}</span>
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={16} className={isOpen ? 'text-warm-400' : 'text-cream-400'} />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-4 pb-4">
                        <div className="ml-8 pl-3 rounded-xl py-3 px-3"
                          style={{ background: 'rgba(212,165,116,0.07)', borderLeft: '2px solid rgba(212,165,116,0.4)' }}>
                          <p className="text-[13px] text-cream-700 leading-relaxed">{faq.a}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default HelpPage;
