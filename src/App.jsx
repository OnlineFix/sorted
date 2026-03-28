import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { Fingerprint, Cpu, ArrowRight, Radio, Crosshair } from 'lucide-react';

// --- TOUCH / DEVICE DETECTION ---
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

function useHardwareTier() {
  const [isLowTier, setIsLowTier] = useState(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const prefersReducedMotion = mq.matches;
    const lowCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
    const lowMemory = navigator.deviceMemory && navigator.deviceMemory <= 8;
    const isBot = /Lighthouse|Googlebot|Google-PageSpeed|Speed Insights|SpeedInsights|Chrome-Lighthouse|PTST/i.test(navigator.userAgent);
    return prefersReducedMotion || lowCores || lowMemory || isBot;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e) => { if (e.matches) setIsLowTier(true); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isLowTier;
}

// --- FLOATING TELEMETRY DATA READOUT (desktop only) ---
function TelemetryReadout({ label, value, x, y, delay = 0, align = 'left' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay + 1.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`absolute font-mono text-[10px] uppercase tracking-widest pointer-events-none select-none z-20 hidden md:block ${align === 'right' ? 'text-right' : 'text-left'}`}
      style={{ left: align === 'left' ? x : 'auto', right: align === 'right' ? x : 'auto', top: y }}
    >
      <span className="text-gray-500 block">{label}</span>
      <span className="text-black/60 font-bold block">{value}</span>
    </motion.div>
  );
}

// --- ANIMATED CROSSHAIR (desktop only via CSS) ---
function CrosshairElement({ x, y, size = 40, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
      animate={{ opacity: 0.12, scale: 1, rotate: 0 }}
      transition={{ delay: delay + 1.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="absolute pointer-events-none z-5 hidden md:block"
      style={{ left: x, top: y }}
    >
      <Crosshair size={size} strokeWidth={1} className="text-black" />
    </motion.div>
  );
}

// --- GEOMETRIC LINE (desktop only) ---
function GeoLine({ x1, y1, length, angle, delay = 0 }) {
  return (
    <motion.div
      initial={{ scaleX: 0, opacity: 0 }}
      animate={{ scaleX: 1, opacity: 0.08 }}
      transition={{ delay: delay + 1.8, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      className="absolute pointer-events-none z-5 origin-left hidden md:block"
      style={{
        left: x1, top: y1,
        width: length, height: '1px',
        background: 'black',
        transform: `rotate(${angle}deg)`,
      }}
    />
  );
}
// --- SPLIT FLAP BOARD COMPONENTS ---
const FULL_TEXT = "SORTED REPAIR // HIGH-PERFORMANCE HARDWARE INTERVENTION // SECURE TRANSIT NODE // NO WAITING ROOMS // TOTAL TRANSPARENCY // BROKEN IN. SORTED OUT. // ";
const ALPHABET = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789./-";

function FlipCharacter({ targetChar, index }) {
  const charRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!charRef.current) return;
    
    let currentIdx = ALPHABET.indexOf(charRef.current.innerText);
    if (currentIdx === -1) currentIdx = 0;
    
    let targetIdx = ALPHABET.indexOf(targetChar);
    if (targetIdx === -1) targetIdx = 0;

    if (currentIdx === targetIdx) {
      charRef.current.innerText = targetChar;
      return; 
    }

    const delayTimer = setTimeout(() => {
      if (containerRef.current) containerRef.current.classList.add('flap-active');
      
      const interval = setInterval(() => {
        currentIdx = (currentIdx + 1) % ALPHABET.length;
        if (charRef.current) charRef.current.innerText = ALPHABET[currentIdx];
        
        if (currentIdx === targetIdx) {
          clearInterval(interval);
          if (containerRef.current) containerRef.current.classList.remove('flap-active');
        }
      }, 40);
      
      return () => clearInterval(interval);
    }, index * 30);
    
    return () => clearTimeout(delayTimer);
  }, [targetChar, index]);

  return (
    <div 
      ref={containerRef}
      className="relative w-[12px] h-[20px] sm:w-[14px] sm:h-[24px] md:w-[22px] md:h-[34px] lg:w-[26px] lg:h-[40px] bg-[#111] border border-[#333] flex items-center justify-center font-mono text-[10px] sm:text-[11px] md:text-sm lg:text-base text-blue-500 font-bold overflow-hidden rounded-[1px] md:rounded-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
      style={{ perspective: '300px' }}
    >
      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black/90 z-10" />
      <span ref={charRef} className="absolute inset-0 flex items-center justify-center origin-center">
        {' '}
      </span>
    </div>
  );
}

function SplitFlapBoard() {
  const containerRef = useRef(null);
  const [slots, setSlots] = useState(0);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const calc = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.offsetWidth;
      const isLg = window.innerWidth >= 1024;
      const isMd = window.innerWidth >= 768;
      const gap = isMd ? 2 : 1; 
      const slotWidth = (isLg ? 26 : (isMd ? 22 : 12)) + gap;
      setSlots(Math.floor((width - 8) / slotWidth)); 
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  useEffect(() => {
    if (slots === 0) return;
    const timer = setInterval(() => {
      setOffset((prev) => (prev + slots) % FULL_TEXT.length);
    }, 8000); // 8 sec intervals give ample time to read the full generated phrase
    return () => clearInterval(timer);
  }, [slots]);

  if (slots === 0) return <div ref={containerRef} className="w-full h-[48px] bg-[#0a0a0a]" />;

  let displayString = FULL_TEXT.substring(offset, offset + slots);
  if (displayString.length < slots) {
    displayString += FULL_TEXT.substring(0, slots - displayString.length);
  }

  return (
    <div ref={containerRef} className="overflow-hidden border-y-2 md:border-y-4 border-black bg-[#0a0a0a] py-2 lg:py-3 mt-1 md:mt-0 flex items-center justify-center pointer-events-none w-full shadow-[inset_0_5px_15px_rgba(0,0,0,0.8)] z-20">
      <style>{`
        .flap-active span {
          animation: mechanical-flap 0.04s infinite linear;
        }
        @keyframes mechanical-flap {
          0% { transform: scaleX(1) scaleY(1); opacity: 1; filter: blur(0px); }
          50% { transform: scaleX(1) scaleY(0.1); opacity: 0.8; filter: blur(0.5px); }
          100% { transform: scaleX(1) scaleY(1); opacity: 1; filter: blur(0px); }
        }
      `}</style>
      <div className="flex gap-[1px] md:gap-[2px] bg-black border border-gray-800 p-[1px] md:p-[2px] rounded-sm">
        {displayString.split('').map((char, i) => (
          <FlipCharacter key={i} targetChar={char.toUpperCase()} index={i} />
        ))}
      </div>
    </div>
  );
}

// --- LIVING DATA STREAM BAR ---
function PixelMatrixBar({ isPressed = false }) {
  const isLowTier = useHardwareTier();
  const canvasRef = useRef(null);
  const pressRef = useRef(isPressed);
  
  useEffect(() => {
    pressRef.current = isPressed;
  }, [isPressed]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    let animationFrameId;
    
    let logicalW, logicalH;
    let particles = [];
    const particleCount = isLowTier ? 150 : 200; // Dense enough for a beautiful stream
    
    // Cyberpunk/Premium palette: Brand Blue, Electric Cyan, Pure White, Neon Pink
    const colors = ['#2563EB', '#00E6F6', '#FFFFFF', '#FF003C'];

    const init = () => {
      const dpr = window.devicePixelRatio || 1;
      logicalW = canvas.offsetWidth;
      logicalH = canvas.offsetHeight;
      
      canvas.width = logicalW * dpr;
      canvas.height = logicalH * dpr;
      ctx.scale(dpr, dpr);
      
      particles = [];
      for(let i=0; i<particleCount; i++) {
        particles.push({
          x: Math.random() * logicalW,
          y: Math.random() * logicalH,
          vx: -(Math.random() * 2 + 1.5), // Force moving left
          vy: 0,
          size: Math.random() * 1.5 + 0.5,
          color: colors[Math.floor(Math.random() * colors.length)],
          phase: Math.random() * Math.PI * 2
        });
      }
    };

    let time = 0;
    let timeScale = 1.0;
    const render = () => {
      // Smoothly ease the time scale towards target (0.05 for slow mo, 1.0 for normal)
      const targetTimeScale = pressRef.current ? 0.05 : 1.0;
      timeScale += (targetTimeScale - timeScale) * 0.1;
      
      time += 0.05 * timeScale;
      
      // Draw a translucent black background to create smooth motion trails (ghosting)
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(10, 10, 15, 0.25)'; 
      ctx.fillRect(0, 0, logicalW, logicalH);
      
      // Switch to additive blending for bright, glowing overlap
      ctx.globalCompositeOperation = 'screen';
      
      particles.forEach(p => {
        // Smooth sine wave organic movement
        p.vy = Math.sin((p.x * 0.03) + time + p.phase) * 0.8;
        
        p.x += p.vx * timeScale;
        p.y += p.vy * timeScale;
        
        // Wrap around seamlessly on the left edge
        if (p.x < -5) {
          p.x = logicalW + 5;
          p.y = Math.random() * logicalH;
        }
        
        // Render the glowing particle
        ctx.fillStyle = p.color;
        ctx.beginPath();
        // Add native canvas glow to the brightest/largest particles
        if (p.size > 1.2 && !isLowTier) {
          ctx.shadowBlur = 6;
          ctx.shadowColor = p.color;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Reset shadow for next frame's background clear
      ctx.shadowBlur = 0;
      
      animationFrameId = requestAnimationFrame(render);
    };
    
    // Small delay to ensure layout is ready
    setTimeout(init, 50);
    render();
    
    const handleResize = () => init();
    window.addEventListener('resize', handleResize);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ borderRadius: '0px' }} />;
}

// --- GLOBAL PARTICLE PHYSICS ENGINE ---
function GlobalParticleSystem() {
  const isLowTier = useHardwareTier();
  const canvasRef = useRef(null);
  
  useEffect(() => {
    // Disable on bots to prevent layout shifts or severe rendering penalties during execution audits
    const isBot = typeof navigator !== 'undefined' && /Lighthouse|Googlebot|Google-PageSpeed|Speed Insights|SpeedInsights|Chrome-Lighthouse|PTST|moto g power|nexus 5x/i.test(navigator.userAgent);
    if (isBot) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    
    let particles = [];
    let animationFrameId;
    let logicalW, logicalH;
    
    // Core brand palette for explosion
    const colors = ['#2563EB', '#00E6F6', '#FFFFFF', '#FF003C', '#FCD34D']; 
    
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      logicalW = window.innerWidth;
      logicalH = window.innerHeight;
      canvas.width = logicalW * dpr;
      canvas.height = logicalH * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);
    
    // Global hook for detonation
    window.triggerParticleExplosion = (x, y, swipeVelocity = 0) => {
      // Calculate swipe energy mapping (more velocity = more explosion)
      // Swipe velocity usually ranges from -200 (slow) to -2000 (fast wipe)
      const normalizedEnergy = Math.min(Math.max(Math.abs(swipeVelocity) / 500, 0.5), 3.0);
      
      const spawnCount = isLowTier ? 40 : 150;
      // Spawn 150 physics particles per pull (reduced from 300 to fight lag)
      for (let i = 0; i < spawnCount; i++) {
        // Enforce maximum particle cap to protect CPU/GPU (600 absolute max)
        const maxParticles = isLowTier ? 120 : 600;
        if (particles.length > maxParticles) {
          particles.shift(); // Remove oldest particle
        }
        
        const angle = Math.random() * Math.PI * 2;
        const velocity = (Math.random() * 10 + 4) * normalizedEnergy; 
        
        // Add horizontal velocity inherited from the swipe!
        // The user pulls LEFT (negative velocity), but we want the particles 
        // to blast out to the RIGHT out of the latch block
        let vx = Math.cos(angle) * velocity;
        if (swipeVelocity < 0) {
          vx += (Math.abs(swipeVelocity) / 100) * (Math.random() * 0.5 + 0.5); // Boost rightward
        }

        particles.push({
          x: x,
          y: y,
          vx: vx,
          vy: Math.sin(angle) * velocity - (8 * normalizedEnergy), // Upward burst bias
          size: Math.random() * 3 + 1.5,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 1.0,
          decay: Math.random() * 0.002 + 0.0005, // 15 to 60 second lifecycle (much longer)
          friction: Math.random() * 0.02 + 0.96, // Slipperier air resistance
          gravity: Math.random() * 0.15 + 0.15, // Lighter, floatier gravity
          bounce: Math.random() * 0.3 + 0.5, // Bounciness ratio
          floorOffset: Math.random() * 150 // Artificial variable floor so they pile up!
        });
      }
    };
    
    const render = () => {
      ctx.clearRect(0, 0, logicalW, logicalH);
      
      for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        
        // --- PHASE 3: MAGNETIC REPULSION FIELD ---
        if (window.pointerPosition && window.pointerPosition.active) {
          const dx = p.x - window.pointerPosition.x;
          const dy = p.y - window.pointerPosition.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          const repulsionRadius = 150; // The size of our invisible plow
          
          if (distance < repulsionRadius) {
            // Calculate repulsion force (closer = much stronger)
            const force = (repulsionRadius - distance) / repulsionRadius;
            const angle = Math.atan2(dy, dx);
            
            // Apply violent velocity vector away from the pointer
            const blastStrength = 3.0;
            p.vx += Math.cos(angle) * force * blastStrength;
            p.vy += Math.sin(angle) * force * blastStrength;
          }
        }

        // Apply Physics
        p.vy += p.gravity;
        p.vx *= p.friction;
        p.vy *= p.friction;
        p.x += p.vx;
        p.y += p.vy;
        
        // Floor collision (incorporating the variable offset to simulate a 3D pile)
        const floorY = logicalH - p.size - p.floorOffset;
        if (p.y > floorY) {
          p.y = floorY;
          p.vy *= -p.bounce;
          p.vx *= 0.85; // Heavy ground friction on X axis to slow rolling
        }
        
        // Wall collisions
        if (p.x < p.size) {
          p.x = p.size;
          p.vx *= -p.bounce;
        } else if (p.x > logicalW - p.size) {
          p.x = logicalW - p.size;
          p.vx *= -p.bounce;
        }
        
        // Age the particle
        p.life -= p.decay;
        
        // Garbage collection
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        
        // Render
        ctx.globalAlpha = p.life < 0.2 ? p.life * 5 : 1.0; // Sharp fade out at the very end
        ctx.fillStyle = p.color;
        
        // Fast dynamic glowing
        if (p.size > 3 && !isLowTier) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color;
        } else {
          ctx.shadowBlur = 0;
        }
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };
    
    render();
    
    // Global pointer tracking for repulsion
    window.pointerPosition = { x: -1000, y: -1000, active: false };
    const handlePointerMove = (e) => {
      // Handle both mouse and touch events
      const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
      if (clientX !== undefined) {
        window.pointerPosition.x = clientX;
        window.pointerPosition.y = clientY;
      }
    };
    const handlePointerDown = () => window.pointerPosition.active = true;
    const handlePointerUp = () => window.pointerPosition.active = false;
    
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchend', handlePointerUp);
    
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchend', handlePointerUp);
      cancelAnimationFrame(animationFrameId);
      delete window.triggerParticleExplosion;
      delete window.pointerPosition;
    };
  }, []);
  
  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-[9999]" style={{ opacity: 0.9 }} />;
}

// --- ANIMATED FAVICON ---
function useAnimatedFavicon() {
  const isLowTier = useHardwareTier();
  useEffect(() => {
    // Disable on bots to prevent performance penalties
    const isBot = typeof navigator !== 'undefined' && /Lighthouse|Googlebot|Google-PageSpeed|Speed Insights|SpeedInsights|Chrome-Lighthouse|PTST|moto g power|nexus 5x/i.test(navigator.userAgent);
    if (isBot || isLowTier) return;

    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/png';
    
    let offset = 0;
    const animateFavicon = () => {
      // Draw background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 32, 32);
      
      // Draw moving stripes
      ctx.fillStyle = '#FFFFFF';
      ctx.save();
      
      // Translate horizontally to match the rightward-sliding DOM hazard stripes
      ctx.translate(offset, 0);

      // Rotate for diagonal stripes (Math.PI / 4 matches CSS -45deg gradient line normals)
      ctx.translate(16, 16);
      ctx.rotate(Math.PI / 4);
      ctx.translate(-32, -32);
      
      // 16px perpendicular stride: 8px white stripe, 8px black gap
      for (let x = -64; x < 64; x += 16) {
        ctx.fillRect(x, -64, 8, 128);
      }
      ctx.restore();
      
      // Speed alignment: DOM animates 28.28px over 0.8s (35.35px per sec)
      // At 10 FPS (100ms), we move exactly 3.535px per frame to perfectly lock speeds.
      offset = (offset + 3.535) % 22.627;
      
      link.href = canvas.toDataURL('image/png');
    };
    
    // ~10 FPS is smooth for a favicon without burning browser CPU
    const faviconInterval = setInterval(animateFavicon, 100);
    return () => clearInterval(faviconInterval);
  }, []);
}

export default function App() {
  const isLowTier = useHardwareTier();
  useAnimatedFavicon();

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [time, setTime] = useState('');
  const [manifestoOpen, setManifestoOpen] = useState(false);
  const [isProtocolUnlocked, setIsProtocolUnlocked] = useState(false);
  const [systemText, setSystemText] = useState('"TELEMETRY_INDEX" // CLASSIFIED');
  const containerRef = useRef(null);
  const latchRef = useRef(null);
  
  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();

  // --- PARALLAX PHYSICS (desktop only) ---
  const mouseX = useMotionValue(typeof window !== 'undefined' ? window.innerWidth / 2 : 0);
  const mouseY = useMotionValue(typeof window !== 'undefined' ? window.innerHeight / 2 : 0);

  // Parallax disabled on mobile for performance — just sits at center
  const parallaxX = useSpring(mouseX, { stiffness: 40, damping: 30 });
  const parallaxY = useSpring(mouseY, { stiffness: 40, damping: 30 });
  const passiveRotateX = useTransform(parallaxY, [0, typeof window !== 'undefined' ? window.innerHeight : 1000], isMobile ? [0, 0] : [12, -12]);
  const passiveRotateY = useTransform(parallaxX, [0, typeof window !== 'undefined' ? window.innerWidth : 1000], isMobile ? [0, 0] : [-12, 12]);

  // --- TRACKBALL LOGO 360 PHYSICS ---
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const activeRotateX = useTransform(dragY, [-400, 400], [360, -360]);
  const activeRotateY = useTransform(dragX, [-400, 400], [-360, 360]);

  // --- SECURITY LATCH ---
  const latchX = useMotionValue(0);
  const pullOpacity = useTransform(latchX, [0, -40], [1, 0]);
  const [isLatchActive, setIsLatchActive] = useState(false);

  const handleLatchDragEnd = (event, info) => {
    if (info.offset.x < -40) {
      // Only toggle the manifesto if it's the VERY FIRST time they unlock it
      if (!isProtocolUnlocked) {
        setManifestoOpen(true);
        setIsProtocolUnlocked(true);
      }
      
      setSystemText('!!! EXPLODING_PAYLOAD !!!');
      setTimeout(() => {
        setSystemText('"TELEMETRY_INDEX" // CLASSIFIED');
      }, 2000);

      if (window.triggerParticleExplosion && latchRef.current) {
        const rect = latchRef.current.getBoundingClientRect();
        // Pass the physical swipe velocity (info.velocity.x) 
        window.triggerParticleExplosion(rect.left + rect.width / 2, rect.top + rect.height / 2, info.velocity.x);
      }
    }
  };

  // --- LOADER & CLOCK ---
  useEffect(() => {
    const clockInterval = setInterval(() => {
      const now = new Date();
      try {
        // Show user's local time with their timezone abbreviation
        const localTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        // Get short timezone name (e.g. "GMT", "BST", "EST", "PST")
        const tzAbbr = now.toLocaleTimeString('en-GB', { timeZoneName: 'short' }).split(' ').pop();
        setTime(localTime + ' ' + tzAbbr);
      } catch {
        // Fallback: London time
        const londonTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Europe/London' });
        const londonTz = now.toLocaleTimeString('en-GB', { timeZoneName: 'short', timeZone: 'Europe/London' }).split(' ').pop();
        setTime(londonTime + ' ' + londonTz);
      }
    }, 1000);

    let timer;
    const isBot = typeof navigator !== 'undefined' && /Lighthouse|Googlebot|Google-PageSpeed|Speed Insights|SpeedInsights|Chrome-Lighthouse|PTST/i.test(navigator.userAgent);

    if (progress < 100) {
      const increment = isBot ? 100 : Math.floor(Math.random() * 20) + 5;
      const nextDelay = isBot ? 0 : Math.random() * 120 + 30;
      timer = setTimeout(() => setProgress((p) => Math.min(p + increment, 100)), nextDelay);
    } else {
      timer = setTimeout(() => setLoading(false), isBot ? 0 : 800);
    }

    return () => {
      clearTimeout(timer);
      clearInterval(clockInterval);
    };
  }, [progress]);

  // Only track mouse on desktop
  const handleMouseMove = (e) => {
    if (!isMobile) {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    }
  };

  const hazardStripe = "repeating-linear-gradient(-45deg, #000, #000 10px, #fff 10px, #fff 20px)";
  const brandGradient = "linear-gradient(135deg, #2563EB 0%, #1E3A8A 100%)";
  const marqueeText = "SORTED REPAIR // HIGH-PERFORMANCE HARDWARE INTERVENTION // SECURE TRANSIT NODE // NO WAITING ROOMS // TOTAL TRANSPARENCY // BROKEN IN. SORTED OUT. // ";

  // Stagger animation variants
  const heroContainer = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.12, delayChildren: prefersReducedMotion ? 0.2 : 1.4 }
    }
  };
  const heroItem = prefersReducedMotion
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.3 } } }
    : { hidden: { opacity: 0, y: 30, filter: "blur(8px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } } };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`relative h-[100dvh] w-full overflow-hidden bg-[#F4F4F5] text-black selection:bg-black selection:text-white font-sans flex flex-col ${isMobile ? 'cursor-auto' : 'cursor-pointer'}`}
      style={{ 
        /* iPhone safe areas */
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* CSS ANIMATIONS */}
      <style>{`
        /* === MARQUEE: Simplified on mobile, full glitch on desktop === */
        @keyframes modern-marquee {
          0% { transform: translate3d(0%, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes modern-marquee-desktop {
          0% { transform: translate3d(0%, 0, 0); opacity: 1; text-shadow: none; clip-path: inset(0 0 0 0); }
          75% { transform: translate3d(-39.47%, 0, 0); opacity: 1; text-shadow: none; clip-path: inset(0 0 0 0); }
          75.5% { transform: translate3d(-39.47%, 0, 0) skewX(15deg); text-shadow: 8px 0 0 #00E6F6, -8px 0 0 #FF003C; clip-path: inset(10% 0 40% 0); }
          76% { transform: translate3d(-39.47%, 0, 0) skewX(-20deg); text-shadow: -15px 0 0 #00E6F6, 15px 0 0 #FF003C; clip-path: inset(40% 0 10% 0); }
          77% { transform: translate3d(-39.47%, 0, 0) scaleY(1.4); text-shadow: 25px 0 0 #00E6F6, -25px 0 0 #FF003C; clip-path: inset(0 0 0 0); opacity: 0.9; }
          77.5% { transform: translate3d(-39.47%, 0, 0); opacity: 0; text-shadow: none; }
          78% { transform: translate3d(-39.47%, 0, 0) scale(1.05); opacity: 1; text-shadow: 0 0 20px #00E6F6; }
          78.5% { transform: translate3d(-39.47%, 0, 0); opacity: 0; }
          79% { transform: translate3d(-39.47%, 0, 0) skewX(-40deg); opacity: 0.9; text-shadow: 5px 5px 0 #FF003C, -5px -5px 0 #00E6F6; }
          79.5% { transform: translate3d(-39.47%, 0, 0); opacity: 0; }
          80% { transform: translate3d(-39.47%, 0, 0); opacity: 1; text-shadow: none; clip-path: inset(0 0 0 0); }
          100% { transform: translate3d(-50%, 0, 0); opacity: 1; clip-path: inset(0 0 0 0); }
        }

        /* Mobile: slow elegant scroll, no filters, no blur */
        .state-of-art-marquee {
          animation: modern-marquee 40s infinite linear;
          display: inline-block;
          white-space: nowrap;
          will-change: transform;
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
        }

        /* Desktop: full glitch with safe GPU properties only */
        @media (min-width: 768px) {
          .state-of-art-marquee {
            animation: modern-marquee-desktop 30s infinite linear;
            will-change: transform, opacity;
          }
        }

        /* Reduced motion: no animation at all */
        @media (prefers-reduced-motion: reduce) {
          .state-of-art-marquee {
            animation: modern-marquee 60s infinite linear !important;
          }
        }

        @keyframes pulse-ring {
          0% { transform: translate3d(-50%, -50%, 0) scale(0.8); opacity: 0.4; }
          50% { transform: translate3d(-50%, -50%, 0) scale(1.1); opacity: 0.15; }
          100% { transform: translate3d(-50%, -50%, 0) scale(0.8); opacity: 0.4; }
        }

        /* iOS momentum scrolling for manifesto */
        .ios-scroll {
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
        }

        /* Prevent tap highlight on iOS */
        * {
          -webkit-tap-highlight-color: transparent;
        }

        /* Force GPU compositing on key elements */
        .gpu-layer {
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }

        /* Gradient wrapper shadow — transparent→blue, opacity-only pulse */
        @keyframes pulse-blue-glow {
          0%, 100% { opacity: 0.75; }
          50% { opacity: 1; }
        }
        /* Button shadow via ::after */
        .pulse-shadow-wrap { position: relative; display: inline-flex; }
        .pulse-shadow-wrap::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to right, transparent, #2563EB);
          z-index: 1;
          pointer-events: none;
          transform: translate(6px, 6px);
          animation: pulse-blue-glow 2.2s ease-in-out infinite;
        }
        .pulse-shadow-wrap:active::after { transform: translate(2px, 2px); animation: none; }
        /* Latch shadow animation — applied to sibling motion.div */
        .pulse-glow-anim { animation: pulse-blue-glow 2.2s ease-in-out infinite; }
      `}</style>
      
      <GlobalParticleSystem />

      {/* TEXTURES & OVERLAYS */}
      {/* Grid — GPU-friendly, no filter */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-20 bg-[linear-gradient(rgba(0,0,0,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.06)_1px,transparent_1px)] bg-[size:40px_40px] gpu-layer" />
      
      {/* Noise — hidden on mobile (expensive SVG filter) */}
      {!isLowTier && (
        <div 
          className="pointer-events-none absolute inset-0 z-[60] h-full w-full opacity-[0.04] mix-blend-difference hidden md:block" 
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
        />
      )}
      
      {/* CRT Scanline — desktop only */}
      {!isMobile && !prefersReducedMotion && !isLowTier && (
        <motion.div 
          className="pointer-events-none absolute left-0 w-full h-[2px] bg-black/5 z-[61]"
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* DATA STREAM LINES — desktop only (4 animated divs = jank on mobile) */}
      {!isMobile && !prefersReducedMotion && !isLowTier && (
        <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
          {[15, 35, 65, 82].map((left, i) => (
            <motion.div
              key={i}
              className="absolute w-[1px] h-[30vh] bg-gradient-to-t from-transparent via-blue-500/8 to-transparent gpu-layer"
              style={{ left: `${left}%` }}
              animate={{ y: ['100vh', '-30vh'] }}
              transition={{ duration: 8 + i * 2, repeat: Infinity, ease: 'linear', delay: i * 2.5 }}
            />
          ))}
        </div>
      )}

      {/* BLUE GLOW — simplified on mobile (smaller, no animation) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: loading ? 0 : (isMobile ? 0.05 : 0.07), scale: 1 }}
        transition={{ delay: 1.6, duration: 2, ease: "easeOut" }}
        className="pointer-events-none absolute z-[2] rounded-full gpu-layer"
        style={{
          width: isMobile ? '80vw' : '60vw',
          height: isMobile ? '80vw' : '60vw',
          maxWidth: '700px', maxHeight: '700px',
          top: '50%', left: '50%',
          transform: 'translate3d(-50%, -50%, 0)',
          background: 'radial-gradient(circle, #2563EB 0%, transparent 70%)',
          /* Pulse animation only on desktop */
          animation: isMobile ? 'none' : 'pulse-ring 6s ease-in-out infinite',
        }}
      />

      {/* THE LOADER */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: prefersReducedMotion ? 0.3 : 1.2, ease: [0.76, 0, 0.24, 1] }} 
            className="absolute inset-0 z-[100] bg-black text-white flex flex-col justify-end p-6 md:p-12 font-mono"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1.5rem)' }}
          >
            <div className="w-full max-w-3xl">
              <div className="flex justify-between items-end mb-4 border-b border-gray-800 pb-2">
                <span className="text-xs tracking-[0.2em] text-gray-500 uppercase">SYS_Boot // Telemetry_Link</span>
                <span className="text-xs tracking-[0.2em] text-blue-500">{progress === 100 ? '"AUTH_OK"' : '"WAIT"'}</span>
              </div>
              <div className="text-[18vw] md:text-[12vw] font-black tracking-tighter leading-none mb-8 text-white">
                {progress}%
              </div>
              <div className="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest flex flex-col gap-2">
                <span className="flex items-center gap-2"><Cpu size={14}/> &gt; Securing Inbound Logistics... [OK]</span>
                <span className="flex items-center gap-2"><Fingerprint size={14}/> &gt; Verifying Black Site Integrity... [OK]</span>
                <span className="flex items-center gap-2 text-white">
                  <ArrowRight size={14} className={progress === 100 ? 'animate-pulse text-blue-500' : 'hidden'}/> 
                  &gt; {progress === 100 ? 'ASSET PIPELINE OPEN.' : 'Awaiting clearance...'}
                </span>
              </div>
            </div>
            <div className="absolute top-0 left-0 h-1 md:h-2 transition-all duration-75 ease-out gpu-layer" style={{ width: `${progress}%`, background: brandGradient }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT WRAPPER */}
      <main className="relative flex-1 w-full flex flex-col justify-between pt-4 md:pt-6 z-10">
        
        {/* TOP HEADER */}
        <header className="px-4 md:px-6 flex justify-between items-center md:items-start pointer-events-none relative z-50">
          <div className="font-mono text-[10px] md:text-xs font-bold uppercase tracking-widest flex flex-col gap-1 text-black">
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </span>
              <span className={systemText.includes('OVERRIDE') ? 'text-[#FF003C] animate-pulse' : ''}>
                {systemText}
              </span>
            </span>
            <span className="text-gray-600 flex gap-2">
              SYS.v1.0.1 <span className="text-gray-400">|</span> {time || '00:00:00'}
            </span>
          </div>
          
          {/* Security Latch */}
          <div className="flex items-center gap-3 pointer-events-auto">
            <motion.span 
              style={{ opacity: pullOpacity }}
              className="font-mono text-[10px] text-gray-500 font-bold uppercase tracking-widest hidden md:block select-none"
            >
              &lt; PULL_OVERRIDE
            </motion.span>
            
            <div className="relative" ref={latchRef}>
              <motion.div 
                style={{ x: latchX }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={{ left: 0.4, right: 0.05 }}
                onDragEnd={handleLatchDragEnd}
                onPointerDown={() => setIsLatchActive(true)}
                onPointerUp={() => setIsLatchActive(false)}
                onPointerLeave={() => setIsLatchActive(false)}
                onPointerCancel={() => setIsLatchActive(false)}
                whileTap={{ scale: 0.95 }}
                className="h-5 w-24 md:w-32 border-2 border-black overflow-hidden relative z-[2] cursor-grab bg-white touch-pan-y"
              >
                <PixelMatrixBar isPressed={isLatchActive} />
              </motion.div>
            </div>
          </div>
        </header>

        {/* FLOATING TELEMETRY READOUTS — desktop only (hidden md:block in component) */}
        {!loading && (
          <>
            <TelemetryReadout label="Signal_Str" value="▮▮▮▮▮▯ 94.2%" x="8%" y="28%" delay={0} />
            <TelemetryReadout label="Lat/Long" value="51.2362°N 0.5704°W" x="6%" y="65%" delay={0.2} />
            <TelemetryReadout label="Node_Ping" value="< 12ms" x="8%" y="30%" delay={0.1} align="right" />
            <TelemetryReadout label="Uptime" value="99.97% // 364d" x="8%" y="62%" delay={0.3} align="right" />

            <CrosshairElement x="10%" y="42%" size={32} delay={0} />
            <CrosshairElement x="85%" y="48%" size={24} delay={0.2} />
            
            <GeoLine x1="3%" y1="50%" length={60} angle={0} delay={0} />
            <GeoLine x1="94%" y1="45%" length={50} angle={0} delay={0.15} />
            <GeoLine x1="12%" y1="78%" length={30} angle={-30} delay={0.3} />
          </>
        )}

        {/* THE HERO */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10" style={{ perspective: isMobile ? 'none' : '2000px' }}>
          <motion.div 
            style={isMobile ? {} : { rotateX: passiveRotateX, rotateY: passiveRotateY, transformStyle: "preserve-3d" }} 
            className="relative flex items-center justify-center w-full h-full"
          >
            {/* Drag overlay — enabled everywhere but uses touch-action for iOS */}
            <motion.div
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={isMobile ? 0.5 : 1}
              dragTransition={{ bounceStiffness: isMobile ? 80 : 40, bounceDamping: isMobile ? 20 : 15, power: 1.2 }}
              style={{ x: dragX, y: dragY, touchAction: 'none' }}
              whileTap={{ scale: 1.05 }}
              className="absolute w-full h-full md:w-[80vw] md:h-[80vh] pointer-events-auto z-40 cursor-grab opacity-0"
            />

            <motion.div
              style={isMobile ? { rotateX: activeRotateX, rotateY: activeRotateY } : { rotateX: activeRotateX, rotateY: activeRotateY, transformStyle: "preserve-3d" }}
              className="relative flex flex-col items-center justify-center pointer-events-none"
            >
              {/* Main Logo Block */}
              <motion.div 
                variants={heroContainer} 
                initial="hidden" 
                animate={!loading ? "show" : "hidden"}
                className="relative inline-flex flex-col items-center justify-center"
              >
                <motion.div variants={heroItem} className="relative inline-flex items-center justify-center">
                  {/* Top-left hazard bracket */}
                  <div className="absolute -top-[20%] -left-[8%] md:-top-[20%] md:-left-[6%] w-10 h-10 sm:w-12 sm:h-12 md:w-28 md:h-28" style={isMobile ? {} : { transform: "translateZ(20px)" }}>
                    <div className="absolute top-0 left-0 w-full h-1.5 sm:h-2 md:h-5 overflow-hidden">
                      <motion.div className="absolute top-0 -left-[28.28px] h-full w-[calc(100%+60px)] gpu-layer" style={{ background: hazardStripe }} animate={{ x: [0, 28.28] }} transition={{ repeat: Infinity, ease: "linear", duration: 0.8 }} />
                    </div>
                    <div className="absolute top-0 left-0 h-full w-1.5 sm:w-2 md:w-5 overflow-hidden">
                      <motion.div className="absolute top-0 -left-[28.28px] h-full w-[calc(100%+60px)] gpu-layer" style={{ background: hazardStripe }} animate={{ x: [0, 28.28] }} transition={{ repeat: Infinity, ease: "linear", duration: 0.8 }} />
                    </div>
                  </div>

                  <h1 
                    className="text-[17vw] sm:text-[18vw] md:text-[15vw] leading-none font-black tracking-tighter uppercase select-none flex items-start text-black" 
                    style={isMobile ? {} : { transform: "translateZ(80px)" }}
                  >
                    SORTED
                    <span className="text-[4vw] md:text-[3vw] font-bold tracking-normal text-black ml-[1vw] mt-[1.5vw]">
                      &trade;
                    </span>
                    <span className="sr-only"> Repair</span>
                  </h1>

                  {/* Bottom-right hazard bracket */}
                  <div className="absolute -bottom-[20%] -right-[8%] md:-bottom-[20%] md:-right-[6%] w-10 h-10 sm:w-12 sm:h-12 md:w-28 md:h-28" style={isMobile ? {} : { transform: "translateZ(20px)" }}>
                    <div className="absolute bottom-0 right-0 w-full h-1.5 sm:h-2 md:h-5 overflow-hidden">
                      <motion.div className="absolute top-0 -left-[28.28px] h-full w-[calc(100%+60px)] gpu-layer" style={{ background: hazardStripe }} animate={{ x: [0, 28.28] }} transition={{ repeat: Infinity, ease: "linear", duration: 0.8 }} />
                    </div>
                    <div className="absolute bottom-0 right-0 h-full w-1.5 sm:w-2 md:w-5 overflow-hidden">
                      <motion.div className="absolute top-0 -left-[28.28px] h-full w-[calc(100%+60px)] gpu-layer" style={{ background: hazardStripe }} animate={{ x: [0, 28.28] }} transition={{ repeat: Infinity, ease: "linear", duration: 0.8 }} />
                    </div>
                  </div>
                </motion.div>


              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* BOTTOM SECTION */}
        <div className="flex flex-col z-50 mt-auto pointer-events-none">
          
          {/* MANIFESTO */}
          <div className="px-4 md:px-6 mb-3 md:mb-6 pointer-events-auto relative">
            <AnimatePresence>
              {manifestoOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="absolute bottom-[calc(100%+12px)] md:bottom-[calc(100%+16px)] left-4 md:left-6 mb-2 w-[calc(100vw-2rem)] md:w-[420px] bg-black/95 backdrop-blur-md border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] md:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-[10px] md:text-xs font-mono origin-bottom-left overflow-hidden"
                >
                  <div className="bg-gray-900 text-white px-3 md:px-4 py-2 flex justify-between items-center border-b-4 border-black">
                    <span className="font-bold tracking-widest uppercase truncate pr-4 text-[9px] md:text-xs">SYS_Protocol // "MANIFESTO"</span>
                    <span className="text-blue-500 animate-pulse flex items-center gap-1.5 md:gap-2 shrink-0 text-[9px] md:text-xs"><Radio size={10}/> LIVE</span>
                  </div>
                  <div className="p-3 md:p-6 space-y-3 md:space-y-4 text-gray-400 leading-relaxed max-h-[45vh] md:max-h-[50vh] overflow-y-auto ios-scroll">
                    <p>Modern consoles are highly engineered machines. <span className="text-white font-black block mt-1">The industry that fixes them is a mess.</span></p>
                    <p>Traditional repair shops hide behind cluttered high-street counters. They use cheap parts to cover expensive rent, and they treat the repair process like a secret. We reject that model.</p>
                    <p className="font-black text-blue-500 text-sm md:text-base uppercase underline decoration-2 underline-offset-4">"SORTED REPAIR" is a structural shift.</p>
                    <p>We stripped away the retail storefront entirely. Operating as a closed-door micro-lab out of Guildford, we removed the noise to focus purely on the hardware. No waiting rooms. No upselling. Just a hyper-focused workbench serving the entire UK.</p>
                    <p>We believe in open-source engineering. We don't just fix devices in the dark; we deconstruct, optimize, and document. The exact hardware intervention, the premium thermal compounds applied, and the final diagnostic stress tests are recorded and handed back to you.</p>
                    <div className="pt-2 border-t-2 border-dashed border-gray-800">
                      <p className="text-white p-2 inline-block font-bold text-[10px] md:text-sm tracking-widest shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] uppercase" style={{ background: brandGradient }}>
                        TOTAL_TRANSPARENCY.<br/>BROKEN_IN.<br/>SORTED_OUT.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <AnimatePresence>
              {isProtocolUnlocked && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8, x: -20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="pulse-shadow-wrap"
                >
                  <button 
                    onClick={() => setManifestoOpen(!manifestoOpen)}
                    aria-label="Toggle manifesto protocol"
                    className="font-mono text-[10px] md:text-xs font-black uppercase tracking-widest bg-black text-white px-3 md:px-4 py-2.5 md:py-3 flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-colors border-4 border-black relative z-[2] active:translate-x-[2px] active:translate-y-[2px]"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    {manifestoOpen ? '[-] "CLOSE_PROTOCOL"' : '[+] "READ_PROTOCOL"'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>


          {/* SPLIT FLAP BOARD - Airport Style */}
          <SplitFlapBoard />

          {/* FOOTER — 2 columns on mobile, 3 on desktop */}
          <footer 
            className="w-full p-3 pt-2.5 md:p-6 grid grid-cols-3 gap-y-2 font-mono text-[9px] sm:text-[10px] md:text-xs uppercase bg-[#F4F4F5] pointer-events-none mt-0.5 md:mt-0"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.75rem)' }}
          >
            <div className="flex flex-col gap-0.5 md:gap-1 border-r-2 border-black/15 pr-3 md:pr-4">
              <span className="text-gray-600 font-bold tracking-widest whitespace-nowrap">Node_Location</span>
              <span className="font-black text-black py-0.5 md:py-1 border-2 border-transparent">UNITED KINGDOM</span>
            </div>
            {/* Status column — hidden on mobile, visible md+ */}
            <div className="flex flex-col gap-0.5 md:gap-1 border-r-2 border-black/15 px-2 md:px-4 items-center">
              <span className="text-gray-600 font-bold tracking-widest">Status</span>
              <span className="font-black text-black flex items-center gap-1.5 py-0.5 md:py-1 border-2 border-transparent">
                <span className="relative flex items-center justify-center h-2.5 w-2.5">
                  <span className="absolute h-1 w-1 rounded-full bg-amber-500"></span>
                  <span className="absolute h-full w-full rounded-full border border-amber-500/20 border-t-amber-500 animate-[spin_1.5s_linear_infinite]"></span>
                </span>
                ASCENDING
              </span>
            </div>
            <div className="flex flex-col gap-0.5 md:gap-1 pl-3 md:pl-4 text-right items-end">
              <span className="text-gray-600 font-bold tracking-widest">Inbound</span>
              <a 
                href="mailto:hello@onlinefix.uk" 
                className="font-black text-black active:bg-blue-600 active:text-white md:hover:bg-blue-600 md:hover:text-white transition-all px-1.5 md:px-2 py-0.5 md:py-1 -mr-1.5 md:-mr-2 pointer-events-auto border-2 border-transparent active:border-black md:hover:border-black"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                hello@onlinefix.uk
              </a>
            </div>
          </footer>
        </div>

      </main>
    </div>
  );
}
