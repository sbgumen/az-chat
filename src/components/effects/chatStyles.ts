export type ChatStyleKey = 'latte' | 'mocha' | 'morning' | 'linen' | 'qq' | 'wechat';

export interface ChatStyleDef {
  key: ChatStyleKey;
  label: string;
  description: string;
  bg: string;                 // 聊天背景色
  headerBg: string;           // 顶部栏背景
  selfBubble: string;         // 己方气泡色
  selfBubbleGradient: string; // 己方气泡渐变 (CSS gradient)
  selfText: string;           // 己方气泡文字色
  otherBubble: string;        // 对方气泡背景
  otherBubbleBorder: string;  // 对方气泡边框
  otherText: string;          // 对方气泡文字色
  inputBg: string;            // 输入框背景
  inputBorder: string;        // 输入框边框
  inputFocusBorder: string;   // 输入框聚焦边框
  sendBtnGradient: string;    // 发送按钮渐变
  sendBtnText: string;        // 发送按钮文字色
  sendBtnShadow: string;      // 发送按钮阴影
  iconColor: string;          // 底部图标颜色
  iconHover: string;          // 底部图标悬停色
  timeLabelBg: string;        // 时间标签背景
  timeLabelText: string;      // 时间标签文字
  tabBarBg: string;           // 底部栏背景
  tabBarBorder: string;       // 底部栏边框
}

export const CHAT_STYLES: Record<ChatStyleKey, ChatStyleDef> = {
  latte: {
    key: 'latte',
    label: '温暖拿铁',
    description: '清爽暖调，适合日常聊天',
    bg: '#faf8f5',
    headerBg: 'rgba(255,255,255,0.95)',
    selfBubble: '#d4a574',
    selfBubbleGradient: 'linear-gradient(135deg, #d4a574, #c49563)',
    selfText: '#ffffff',
    otherBubble: '#ffffff',
    otherBubbleBorder: 'rgba(220, 210, 195, 0.5)',
    otherText: '#4a3728',
    inputBg: '#f2ede6',
    inputBorder: 'rgba(200, 185, 165, 0.6)',
    inputFocusBorder: '#d4a574',
    sendBtnGradient: 'linear-gradient(135deg, #d4a574, #c49563)',
    sendBtnText: '#ffffff',
    sendBtnShadow: '0 2px 8px rgba(212, 165, 116, 0.3)',
    iconColor: '#a09080',
    iconHover: '#d4a574',
    timeLabelBg: 'rgba(220, 210, 195, 0.4)',
    timeLabelText: '#8b7b6b',
    tabBarBg: '#ffffff',
    tabBarBorder: 'rgba(220, 210, 195, 0.4)',
  },
  mocha: {
    key: 'mocha',
    label: '焦糖摩卡',
    description: '深邃暖调，质感沉稳',
    bg: '#f5f0ea',
    headerBg: 'rgba(255,255,255,0.95)',
    selfBubble: '#b8956a',
    selfBubbleGradient: 'linear-gradient(135deg, #b8956a, #a07d55)',
    selfText: '#ffffff',
    otherBubble: '#ffffff',
    otherBubbleBorder: 'rgba(210, 200, 185, 0.5)',
    otherText: '#3d2e1f',
    inputBg: '#ebe4d8',
    inputBorder: 'rgba(195, 180, 165, 0.6)',
    inputFocusBorder: '#b8956a',
    sendBtnGradient: 'linear-gradient(135deg, #b8956a, #a07d55)',
    sendBtnText: '#ffffff',
    sendBtnShadow: '0 2px 8px rgba(184, 149, 106, 0.3)',
    iconColor: '#9b8b7a',
    iconHover: '#b8956a',
    timeLabelBg: 'rgba(210, 200, 185, 0.4)',
    timeLabelText: '#8b7b6b',
    tabBarBg: '#ffffff',
    tabBarBorder: 'rgba(210, 200, 185, 0.4)',
  },
  morning: {
    key: 'morning',
    label: '雾蓝清晨',
    description: '清爽现代，类QQ风格',
    bg: '#f7f9fc',
    headerBg: 'rgba(255,255,255,0.95)',
    selfBubble: '#8b9dc3',
    selfBubbleGradient: 'linear-gradient(135deg, #8b9dc3, #7a8eb5)',
    selfText: '#ffffff',
    otherBubble: '#ffffff',
    otherBubbleBorder: 'rgba(220, 225, 235, 0.5)',
    otherText: '#333333',
    inputBg: '#eff1f5',
    inputBorder: 'rgba(200, 210, 225, 0.6)',
    inputFocusBorder: '#8b9dc3',
    sendBtnGradient: 'linear-gradient(135deg, #8b9dc3, #7a8eb5)',
    sendBtnText: '#ffffff',
    sendBtnShadow: '0 2px 8px rgba(139, 157, 195, 0.3)',
    iconColor: '#8a9aaa',
    iconHover: '#8b9dc3',
    timeLabelBg: 'rgba(220, 225, 235, 0.4)',
    timeLabelText: '#8a9aaa',
    tabBarBg: '#ffffff',
    tabBarBorder: 'rgba(220, 225, 235, 0.4)',
  },
  linen: {
    key: 'linen',
    label: '驼色亚麻',
    description: '日系侘寂，宁静质感',
    bg: '#f7f5f0',
    headerBg: 'rgba(255,255,255,0.95)',
    selfBubble: '#9b8c7c',
    selfBubbleGradient: 'linear-gradient(135deg, #9b8c7c, #8a7b6c)',
    selfText: '#ffffff',
    otherBubble: '#ffffff',
    otherBubbleBorder: 'rgba(215, 210, 200, 0.5)',
    otherText: '#3d382f',
    inputBg: '#eee9df',
    inputBorder: 'rgba(200, 190, 180, 0.6)',
    inputFocusBorder: '#9b8c7c',
    sendBtnGradient: 'linear-gradient(135deg, #9b8c7c, #8a7b6c)',
    sendBtnText: '#ffffff',
    sendBtnShadow: '0 2px 8px rgba(155, 140, 124, 0.3)',
    iconColor: '#a0988c',
    iconHover: '#9b8c7c',
    timeLabelBg: 'rgba(215, 210, 200, 0.4)',
    timeLabelText: '#8a8075',
    tabBarBg: '#ffffff',
    tabBarBorder: 'rgba(215, 210, 200, 0.4)',
  },
  qq: {
    key: 'qq',
    label: 'QQ 经典',
    description: '完全还原 QQ 聊天风格',
    bg: '#f6f6f6',
    headerBg: 'rgba(255,255,255,0.95)',
    selfBubble: '#0299fd',
    selfBubbleGradient: '#0299fd',
    selfText: '#ffffff',
    otherBubble: '#ffffff',
    otherBubbleBorder: 'rgba(0, 0, 0, 0.04)',
    otherText: '#333333',
    inputBg: '#f2f2f2',
    inputBorder: 'rgba(0, 0, 0, 0.06)',
    inputFocusBorder: '#0299fd',
    sendBtnGradient: '#0299fd',
    sendBtnText: '#ffffff',
    sendBtnShadow: '0 2px 6px rgba(0, 202, 252, 0.25)',
    iconColor: '#999999',
    iconHover: '#0299fd',
    timeLabelBg: 'rgba(0, 0, 0, 0.04)',
    timeLabelText: '#b0b0b0',
    tabBarBg: '#fafafa',
    tabBarBorder: 'rgba(0, 0, 0, 0.06)',
  },
  wechat: {
    key: 'wechat',
    label: '微信经典',
    description: '微信风格绿色气泡',
    bg: '#ededed',
    headerBg: 'rgba(255,255,255,0.95)',
    selfBubble: '#95ec69',
    selfBubbleGradient: '#95ec69',
    selfText: '#000000',
    otherBubble: '#ffffff',
    otherBubbleBorder: 'rgba(0, 0, 0, 0.04)',
    otherText: '#333333',
    inputBg: '#ffffff',
    inputBorder: 'rgba(0, 0, 0, 0.06)',
    inputFocusBorder: '#07c160',
    sendBtnGradient: '#07c160',
    sendBtnText: '#ffffff',
    sendBtnShadow: '0 2px 6px rgba(7, 193, 96, 0.25)',
    iconColor: '#888888',
    iconHover: '#07c160',
    timeLabelBg: 'rgba(0, 0, 0, 0.04)',
    timeLabelText: '#b0b0b0',
    tabBarBg: '#f7f7f7',
    tabBarBorder: 'rgba(0, 0, 0, 0.06)',
  },
};
