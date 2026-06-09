import { motion } from 'framer-motion';
import { useState } from 'react';

const EMOJI_CATEGORIES = [
  { name: '表情', emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊','😇','🥰','😍','🤩','😘','😗','😚','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','😮‍💨','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥴','😵','🤯','🥵','🥶','😎','🤓','🧐','😕','😟','🙁','😮','😯','😲','😳','🥺','😢','😭','😤','😡','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖','😺','😸','😹','😻','😼','😽','🙀','😿','😾'] },
  { name: '手势', emojis: ['👋','🤚','✋','🖐','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','🤲','🤝','🙏','✍️','💅','🤳','💪','🦵','🦶','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁','👅','👄'] },
  { name: '爱心', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','♥️'] },
  { name: '日常', emojis: ['🎂','🍰','🧁','🍕','🍔','🍟','🌭','🍿','🥤','🧋','☕','🍵','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🎁','🎈','🎉','🎊','🎀','🏆','🥇','🥈','🥉','⚽','🏀','🏈','⚾','🎾','🏐','🎱','🏓','🎮','🎲','🎸','🎹','🎺','🎵','🎶','📱','💻','⌚','📷','🔋','💡','💰','💎','🔑','🔨','🛠','📌','✂️','📝','🔍'] },
  { name: '自然', emojis: ['🌈','☀️','🌤','⛅','🌧','⛈','🌩','❄️','☃️','⛄','🌊','🔥','💧','✨','🌟','⭐','🌙','🌍','🌸','🌺','🌻','🌹','🍀','🌿','🌵','🎄','🌲','🍂','🍁','🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🦋','🐞','🐝','🐛','🦄','🐴','🐌','🐢','🐙','🦑','🦐','🐠','🐟','🐡','🦈','🐳','🐋','🐊','🦖'] },
];

type Category = typeof EMOJI_CATEGORIES[number];

interface Props {
  onSelect: (emoji: string) => void;
  isLv30?: boolean;
}

const PANEL_H = 280;

export function EmojiPicker({ onSelect, isLv30 }: Props) {
  const [activeCat, setActiveCat] = useState<Category>(EMOJI_CATEGORIES[0]);
  const bg = isLv30 ? 'rgba(20,20,40,0.95)' : 'rgba(255,255,255,0.98)';
  const subtle = isLv30 ? 'rgba(255,255,255,0.3)' : '#c0b0a0';

  return (
    <motion.div
      initial={{ height: 0 }} animate={{ height: PANEL_H }} exit={{ height: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      className="overflow-hidden flex-shrink-0"
      style={{ background: bg, backdropFilter: 'blur(20px)', borderTop: isLv30 ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}
    >
      <div className="flex flex-col h-full">
        {/* Category tabs */}
        <div className="flex flex-shrink-0" style={{ borderBottom: isLv30 ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)' }}>
          {EMOJI_CATEGORIES.map(cat => (
            <button key={cat.name} onClick={() => setActiveCat(cat)}
              className="flex-1 py-2.5 text-[12px] font-medium transition-colors"
              style={{ color: activeCat.name === cat.name ? '#d4a574' : subtle, borderBottom: activeCat.name === cat.name ? '2px solid #d4a574' : '2px solid transparent' }}>
              {cat.name}
            </button>
          ))}
        </div>
        {/* Emoji grid */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="grid grid-cols-8 gap-1">
            {activeCat.emojis.map((e, i) => (
              <motion.button key={e + i}
                className="aspect-square flex items-center justify-center rounded-xl text-2xl active:scale-90 transition-transform"
                whileTap={{ scale: 0.85 }}
                onClick={() => onSelect(e)}>
                {e}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default EmojiPicker;
