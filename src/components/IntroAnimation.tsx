import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'az_intro_shown';
const TAGLINES = ['连接你我，温暖每一刻', '随时随地，畅聊无界', '安全私密，真实连接'];

function useTypewriter() {
  const [display, setDisplay] = useState('');
  const state = useRef({ textIdx: 0, charIdx: 0, deleting: false });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const { textIdx, charIdx, deleting } = state.current;
      const current = TAGLINES[textIdx];

      if (!deleting && charIdx < current.length) {
        state.current.charIdx++;
        setDisplay(current.slice(0, state.current.charIdx));
        timer = setTimeout(tick, 75);
      } else if (!deleting && charIdx === current.length) {
        timer = setTimeout(() => { state.current.deleting = true; tick(); }, 2000);
      } else if (deleting && charIdx > 0) {
        state.current.charIdx--;
        setDisplay(current.slice(0, state.current.charIdx));
        timer = setTimeout(tick, 38);
      } else {
        state.current.deleting = false;
        state.current.textIdx = (textIdx + 1) % TAGLINES.length;
        timer = setTimeout(tick, 300);
      }
    };

    timer = setTimeout(tick, 75);
    return () => clearTimeout(timer);
  }, []); // stable — no deps needed

  return display;
}

export function IntroAnimation({ onDone, appName }: { onDone: () => void; appName?: string }) {
  const name = appName || 'AZ-Chat';
  const logoUrl = localStorage.getItem('az_syslogo') || '/logo.png';
  const fullLogoUrl = logoUrl.startsWith('http') ? logoUrl : `${import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`}${logoUrl}`;
  const [phase, setPhase] = useState<'in' | 'show' | 'entering' | 'exit'>('in');
  const [exited, setExited] = useState(false);
  const tagline = useTypewriter();

  useEffect(() => {
    const t = setTimeout(() => setPhase('show'), 600);
    return () => clearTimeout(t);
  }, []);

  const handleEnter = () => {
    if (phase !== 'show') return;
    setPhase('entering');
    setTimeout(() => setPhase('exit'), 900);
    setTimeout(() => { setExited(true); onDone(); }, 1600);
  };

  if (exited) return null;

  return (
    <AnimatePresence>
      {!exited && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden select-none"
          style={{ background: '#0d0805' }}
          animate={phase === 'entering' ? { scale: 1.08, opacity: 0.6 } : phase === 'exit' ? { opacity: 0, scale: 1.15 } : { scale: 1, opacity: 1 }}
          transition={{ duration: phase === 'exit' ? 0.7 : 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Animated aurora background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              className="absolute rounded-full"
              style={{
                width: '70vw', height: '70vw',
                top: '-20%', left: '-10%',
                background: 'radial-gradient(circle, rgba(200,149,108,0.15) 0%, transparent 70%)',
                filter: 'blur(40px)',
              }}
              animate={{ x: [0, 60, -30, 0], y: [0, 40, -20, 0], scale: [1, 1.2, 0.9, 1] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute rounded-full"
              style={{
                width: '60vw', height: '60vw',
                bottom: '-15%', right: '-10%',
                background: 'radial-gradient(circle, rgba(212,165,116,0.12) 0%, transparent 70%)',
                filter: 'blur(50px)',
              }}
              animate={{ x: [0, -50, 30, 0], y: [0, -30, 20, 0], scale: [1, 0.85, 1.15, 1] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            />
            <motion.div
              className="absolute rounded-full"
              style={{
                width: '40vw', height: '40vw',
                top: '30%', right: '5%',
                background: 'radial-gradient(circle, rgba(91,173,122,0.08) 0%, transparent 70%)',
                filter: 'blur(30px)',
              }}
              animate={{ x: [0, -40, 20, 0], y: [0, 50, -30, 0] }}
              transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
            />
          </div>

          {/* Orbiting rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[180, 260, 340].map((size, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border"
                style={{
                  width: size, height: size,
                  borderColor: `rgba(200,149,108,${0.12 - i * 0.03})`,
                  borderWidth: 1,
                }}
                animate={{ rotate: i % 2 === 0 ? 360 : -360, scale: [1, 1.04, 1] }}
                transition={{
                  rotate: { duration: 20 + i * 8, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 4 + i, repeat: Infinity, ease: 'easeInOut' },
                }}
              >
                {/* Dot on ring */}
                <div
                  className="absolute rounded-full"
                  style={{
                    width: 4, height: 4,
                    background: `rgba(200,149,108,${0.6 - i * 0.15})`,
                    top: -2, left: '50%', transform: 'translateX(-50%)',
                    boxShadow: `0 0 8px rgba(200,149,108,0.8)`,
                  }}
                />
              </motion.div>
            ))}
          </div>

          {/* Floating particles */}
          {PARTICLES.map((p, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full pointer-events-none"
              style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%`, background: p.color }}
              animate={{ y: [0, -p.drift, 0], opacity: [0, p.opacity, 0] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Logo with pulse glow */}
            <motion.div
              className="relative mb-8"
              initial={{ opacity: 0, scale: 0.5, y: 30 }}
              animate={phase !== 'in' ? { opacity: 1, scale: 1, y: 0 } : {}}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                className="absolute inset-0 rounded-[28px]"
                style={{ background: 'linear-gradient(135deg,#C8956C,#D4A574)', filter: 'blur(20px)', opacity: 0.5 }}
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              <img
                src={fullLogoUrl}
                alt={name}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                className="relative w-24 h-24 rounded-[28px] object-cover"
                style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 20px 60px rgba(200,149,108,0.35)' }}
              />
            </motion.div>

            {/* Title — letter stagger */}
            <motion.div
              className="flex overflow-hidden mb-3"
              initial="hidden"
              animate={phase !== 'in' ? 'visible' : 'hidden'}
            >
              {name.split('').map((ch, i) => (
                <motion.span
                  key={i}
                  className="font-display text-[44px] tracking-[0.1em] text-white"
                  style={{ textShadow: '0 0 30px rgba(200,149,108,0.5)' }}
                  variants={{
                    hidden: { opacity: 0, y: 40 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.5, delay: 0.1 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                >
                  {ch}
                </motion.span>
              ))}
            </motion.div>

            {/* Typewriter tagline */}
            <motion.div
              className="h-6 flex items-center mb-10"
              initial={{ opacity: 0 }}
              animate={phase !== 'in' ? { opacity: 1 } : {}}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <span className="text-[13px] tracking-[0.25em] font-body" style={{ color: 'rgba(200,149,108,0.85)' }}>
                {tagline}
              </span>
              <span
                className="inline-block w-px h-[14px] ml-0.5 align-middle"
                style={{ background: 'rgba(200,149,108,0.8)', animation: 'az-blink 1s step-end infinite' }}
              />
            </motion.div>

            {/* Enter button */}
            <motion.button
              initial={{ opacity: 0, y: 16 }}
              animate={phase !== 'in' ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1, duration: 0.5 }}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEnter}
              style={{ position: 'relative', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
            >
              <div
                className="relative px-12 py-3.5 rounded-full text-white text-[14px] font-medium tracking-[0.2em] overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #C8956C 0%, #D4A574 100%)',
                  boxShadow: '0 8px 32px rgba(200,149,108,0.45), inset 0 0 0 1px rgba(255,255,255,0.12)',
                }}
              >
                进 入
                <span className="az-shimmer" />
              </div>
            </motion.button>
          </div>

          <style>{`
            @keyframes az-blink { 0%,100%{opacity:1} 50%{opacity:0} }
            @keyframes az-shimmer { 0%{transform:translateX(-150%)} 100%{transform:translateX(250%)} }
            .az-shimmer {
              position:absolute; inset:0; pointer-events:none;
              background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.25) 50%,transparent 100%);
              animation:az-shimmer 2.5s ease-in-out infinite;
              animation-delay:1.2s;
              overflow:hidden;
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 1,
  opacity: Math.random() * 0.45 + 0.1,
  drift: Math.random() * 50 + 20,
  dur: Math.random() * 5 + 4,
  delay: Math.random() * 4,
  color: i % 2 === 0
    ? `rgba(200,149,108,${(Math.random() * 0.5 + 0.2).toFixed(2)})`
    : `rgba(255,210,160,${(Math.random() * 0.3 + 0.1).toFixed(2)})`,
}));

// Multi-storage: localStorage + cookie fallback for WeChat/QQ browsers
function hasShown(): boolean {
  try { if (localStorage.getItem(STORAGE_KEY)) return true; } catch {}
  try { if (sessionStorage.getItem(STORAGE_KEY)) return true; } catch {}
  return document.cookie.includes(STORAGE_KEY + '=1');
}
function markShown() {
  try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
  try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch {}
  try { document.cookie = `${STORAGE_KEY}=1;max-age=31536000;path=/`; } catch {}
}

export function useIntroAnimation() {
  const [show, setShow] = useState(() => !hasShown());
  const done = () => { markShown(); setShow(false); };
  return { show, done };
}
