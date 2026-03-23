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
      <span className="text-gray-400 block">{label}</span>
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
// --- HIGH-DENSITY PIXEL BAR ---
function PixelMatrixBar() {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    let animationFrameId;
    
    // Cyberpunk palette: White, Cyan, Red, Blue, Black/Dark
    const colors = [
      [255, 255, 255], // White
      [0, 230, 246],   // Cyan
      [255, 0, 60],    // Red
      [37, 99, 235],   // Blue
      [10, 10, 15]     // Dark
    ];
    
    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width = Math.floor(canvas.offsetWidth * dpr);
      const h = canvas.height = Math.floor(canvas.offsetHeight * dpr);
      
      if (w === 0 || h === 0) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }
      
      const imageData = ctx.createImageData(w, h);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const rand = Math.random();
        let c = colors[4]; // Default to dark
        
        if (rand > 0.95) c = colors[0];
        else if (rand > 0.85) c = colors[1];
        else if (rand > 0.75) c = colors[2];
        else if (rand > 0.40) c = colors[3];
        
        data[i] = c[0];
        data[i+1] = c[1];
        data[i+2] = c[2];
        data[i+3] = 255; // fully opaque
      }
      
      ctx.putImageData(imageData, 0, 0);
      animationFrameId = requestAnimationFrame(render);
    };
    
    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover rounded-none pointer-events-none" />;
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [time, setTime] = useState('');
  const [manifestoOpen, setManifestoOpen] = useState(false);
  const [systemText, setSystemText] = useState('"TELEMETRY_INDEX" // CLASSIFIED');
  const containerRef = useRef(null);
  
  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();

  // --- PARALLAX & CURSOR PHYSICS (desktop only) ---
  const mouseX = useMotionValue(typeof window !== 'undefined' ? window.innerWidth / 2 : 0);
  const mouseY = useMotionValue(typeof window !== 'undefined' ? window.innerHeight / 2 : 0);
  
  const cursorX = useSpring(mouseX, { stiffness: 1000, damping: 40 });
  const cursorY = useSpring(mouseY, { stiffness: 1000, damping: 40 });
  const cursorRingX = useSpring(mouseX, { stiffness: 200, damping: 25 });
  const cursorRingY = useSpring(mouseY, { stiffness: 200, damping: 25 });

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

  const handleLatchDragEnd = (event, info) => {
    if (info.offset.x < -40) {
      setManifestoOpen((prev) => !prev);
      setSystemText('!!! OVERRIDE_GRANTED !!!');
      setTimeout(() => {
        setSystemText('"TELEMETRY_INDEX" // CLASSIFIED');
      }, 2000);
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
    if (progress < 100) {
      const increment = Math.floor(Math.random() * 20) + 5;
      const nextDelay = Math.random() * 120 + 30;
      timer = setTimeout(() => setProgress((p) => Math.min(p + increment, 100)), nextDelay);
    } else {
      timer = setTimeout(() => setLoading(false), 800);
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
  const marqueeText = "HIGH-PERFORMANCE HARDWARE INTERVENTION // SECURE TRANSIT NODE // NO WAITING ROOMS // NO UPSELLING // TOTAL TRANSPARENCY // BROKEN IN. SORTED OUT. // ";

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
      className={`relative h-[100dvh] w-full overflow-hidden bg-[#F4F4F5] text-black selection:bg-black selection:text-white font-sans flex flex-col ${isMobile ? 'cursor-auto' : 'cursor-none'}`}
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
          animation: modern-marquee 22s infinite linear;
          display: inline-block;
          white-space: nowrap;
          will-change: transform;
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
        }

        /* Desktop: full glitch with safe GPU properties only */
        @media (min-width: 768px) {
          .state-of-art-marquee {
            animation: modern-marquee-desktop 15s infinite linear;
            will-change: transform, opacity;
          }
        }

        /* Reduced motion: no animation at all */
        @media (prefers-reduced-motion: reduce) {
          .state-of-art-marquee {
            animation: modern-marquee 30s infinite linear !important;
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

      {/* CUSTOM CURSOR — desktop only, completely removed from DOM on mobile */}
      {!isMobile && (
        <>
          <motion.div 
            className="fixed top-0 left-0 w-2 h-2 bg-black rounded-full pointer-events-none z-[999]"
            style={{ x: cursorX, y: cursorY, translateX: '-50%', translateY: '-50%' }}
          />
          <motion.div 
            className="fixed top-0 left-0 w-8 h-8 border border-black/30 rounded-full pointer-events-none z-[998]"
            style={{ x: cursorRingX, y: cursorRingY, translateX: '-50%', translateY: '-50%' }}
          />
        </>
      )}

      {/* TEXTURES & OVERLAYS */}
      {/* Grid — GPU-friendly, no filter */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-20 bg-[linear-gradient(rgba(0,0,0,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.06)_1px,transparent_1px)] bg-[size:40px_40px] gpu-layer" />
      
      {/* Noise — hidden on mobile (expensive SVG filter) */}
      <div 
        className="pointer-events-none absolute inset-0 z-[60] h-full w-full opacity-[0.04] mix-blend-difference hidden md:block" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />
      
      {/* CRT Scanline — desktop only */}
      {!isMobile && !prefersReducedMotion && (
        <motion.div 
          className="pointer-events-none absolute left-0 w-full h-[2px] bg-black/5 z-[61]"
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* DATA STREAM LINES — desktop only (4 animated divs = jank on mobile) */}
      {!isMobile && !prefersReducedMotion && (
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
      <div className="relative flex-1 w-full flex flex-col justify-between pt-4 md:pt-6 z-10">
        
        {/* TOP HEADER */}
        <header className="px-4 md:px-6 flex justify-between items-start pointer-events-none relative z-50">
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
            <span className="text-gray-500 flex gap-2">
              SYS.v1.0.1 <span className="text-gray-300">|</span> {time || '00:00:00'}
            </span>
          </div>
          
          {/* Security Latch */}
          <div className="flex items-center gap-3 pointer-events-auto">
            <motion.span 
              style={{ opacity: pullOpacity }}
              className="font-mono text-[10px] text-gray-400 font-bold uppercase tracking-widest hidden md:block select-none"
            >
              &lt; PULL_OVERRIDE
            </motion.span>
            
            <div className="relative">
              {/* Shadow sibling — shares latchX so it drags and snaps back in sync */}
              <motion.div
                style={{ x: latchX }}
                className="absolute inset-0 pointer-events-none"
                aria-hidden="true"
              >
                <div
                  className="absolute inset-0 pulse-glow-anim"
                  style={{ background: 'linear-gradient(to right, transparent, #2563EB)', transform: 'translate(4px, 4px)' }}
                />
              </motion.div>
              <motion.div 
                style={{ x: latchX }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={{ left: 0.4, right: 0.05 }}
                onDragEnd={handleLatchDragEnd}
                whileTap={{ scale: 0.95 }}
                className="h-5 w-24 md:w-32 border-2 border-black overflow-hidden relative z-[2] cursor-grab bg-white touch-pan-y"
              >
                <PixelMatrixBar />
              </motion.div>
            </div>
          </div>
        </header>

        {/* FLOATING TELEMETRY READOUTS — desktop only (hidden md:block in component) */}
        {!loading && (
          <>
            <TelemetryReadout label="Signal_Str" value="▮▮▮▮▮▯ 94.2%" x="8%" y="28%" delay={0} />
            <TelemetryReadout label="Lat/Long" value="51.2362°N 0.5704°W" x="6%" y="65%" delay={0.2} />
            <TelemetryReadout label="Node_Ping" value="< 12ms" x="85%" y="30%" delay={0.1} align="right" />
            <TelemetryReadout label="Uptime" value="99.97% // 364d" x="82%" y="62%" delay={0.3} align="right" />

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

                {/* Subtitle */}
                <motion.p 
                  variants={heroItem}
                  className="font-mono text-[8px] sm:text-[9px] md:text-xs uppercase tracking-[0.2em] sm:tracking-[0.35em] text-gray-500 mt-5 sm:mt-6 md:mt-10 text-center select-none px-4"
                  style={isMobile ? {} : { transform: "translateZ(40px)" }}
                >
                  High-Performance Hardware Intervention
                </motion.p>

                {/* Accent line */}
                <motion.div
                  variants={heroItem}
                  className="mt-2.5 sm:mt-3 md:mt-4 h-[2px] sm:h-[3px] w-12 sm:w-16 md:w-24"
                  style={{ background: brandGradient, ...(isMobile ? {} : { transform: "translateZ(40px)" }) }}
                />
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
                  className="absolute bottom-[calc(100%+12px)] md:bottom-[calc(100%+16px)] left-4 md:left-6 mb-2 w-[calc(100vw-2rem)] md:w-[420px] bg-white/95 backdrop-blur-md border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] md:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-[10px] md:text-xs font-mono origin-bottom-left overflow-hidden"
                >
                  <div className="bg-black text-white px-3 md:px-4 py-2 flex justify-between items-center border-b-4 border-black">
                    <span className="font-bold tracking-widest uppercase truncate pr-4 text-[9px] md:text-xs">SYS_Protocol // "MANIFESTO"</span>
                    <span className="text-blue-500 animate-pulse flex items-center gap-1.5 md:gap-2 shrink-0 text-[9px] md:text-xs"><Radio size={10}/> LIVE</span>
                  </div>
                  <div className="p-3 md:p-6 space-y-3 md:space-y-4 text-black leading-relaxed max-h-[45vh] md:max-h-[50vh] overflow-y-auto ios-scroll">
                    <p>Modern consoles are highly engineered machines. <span className="bg-black text-white px-1 font-black">The industry that fixes them is a mess.</span></p>
                    <p>Traditional repair shops hide behind cluttered high-street counters. They use cheap parts to cover expensive rent, and they treat the repair process like a secret. We reject that model.</p>
                    <p className="font-black text-blue-600 text-sm md:text-base uppercase underline decoration-2 underline-offset-4">"SORTED" is a structural shift.</p>
                    <p>We stripped away the retail storefront entirely. Operating as a closed-door micro-lab out of Guildford, we removed the noise to focus purely on the hardware. No waiting rooms. No upselling. Just a hyper-focused workbench serving the entire UK.</p>
                    <p>We believe in open-source engineering. We don't just fix devices in the dark; we deconstruct, optimize, and document. The exact hardware intervention, the premium thermal compounds applied, and the final diagnostic stress tests are recorded and handed back to you.</p>
                    <div className="pt-2 border-t-2 border-dashed border-gray-300">
                      <p className="text-white p-2 inline-block font-bold text-[10px] md:text-sm tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase" style={{ background: brandGradient }}>
                        TOTAL_TRANSPARENCY.<br/>BROKEN_IN.<br/>SORTED_OUT.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
                        <div className="pulse-shadow-wrap">
              <button 
                onClick={() => setManifestoOpen(!manifestoOpen)}
                className="font-mono text-[10px] md:text-xs font-black uppercase tracking-widest bg-black text-white px-3 md:px-4 py-2.5 md:py-3 flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-colors border-4 border-black relative z-[2] active:translate-x-[2px] active:translate-y-[2px] md:cursor-none"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {manifestoOpen ? '[-] "CLOSE_PROTOCOL"' : '[+] "READ_PROTOCOL"'}
              </button>
            </div>
          </div>


          {/* MARQUEE — GPU-accelerated, simplified on mobile */}
          <div className="overflow-hidden whitespace-nowrap border-y-2 md:border-y-4 border-black bg-black text-white py-2 md:py-4 mt-1 md:mt-0 flex items-center pointer-events-none w-full gpu-layer">
            <div className="state-of-art-marquee flex whitespace-nowrap font-mono text-[10px] sm:text-sm md:text-xl font-bold uppercase tracking-[0.15em] md:tracking-widest">
              <span>{marqueeText.repeat(4)}</span>
            </div>
          </div>

          {/* FOOTER — 2 columns on mobile, 3 on desktop */}
          <footer 
            className="w-full p-3 pt-2.5 md:p-6 grid grid-cols-3 gap-y-2 font-mono text-[9px] sm:text-[10px] md:text-xs uppercase bg-[#F4F4F5] pointer-events-none mt-0.5 md:mt-0"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.75rem)' }}
          >
            <div className="flex flex-col gap-0.5 md:gap-1 border-r-2 border-black/15 pr-3 md:pr-4">
              <span className="text-gray-400 font-bold tracking-widest">Node_Location</span>
              <span className="font-black text-black">GU_UK</span>
            </div>
            {/* Status column — hidden on mobile, visible md+ */}
            <div className="flex flex-col gap-0.5 md:gap-1 border-r-2 border-black/15 px-2 md:px-4 items-center">
              <span className="text-gray-400 font-bold tracking-widest">Status</span>
              <span className="font-black text-black flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                </span>
                ASCENDING
              </span>
            </div>
            <div className="flex flex-col gap-0.5 md:gap-1 pl-3 md:pl-4 text-right justify-start md:justify-end items-end">
              <span className="text-gray-400 font-bold tracking-widest">Inbound</span>
              <a 
                href="mailto:hello@onlinefix.uk" 
                className="font-black text-black active:bg-blue-600 active:text-white md:hover:bg-blue-600 md:hover:text-white transition-all px-1.5 md:px-2 py-0.5 md:py-1 -mr-1.5 md:-mr-2 pointer-events-auto md:cursor-none border-2 border-transparent active:border-black md:hover:border-black"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                "hello@onlinefix.uk"
              </a>
            </div>
          </footer>
        </div>

      </div>
    </div>
  );
}
