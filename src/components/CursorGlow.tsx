import React, { useEffect, useState, useRef } from 'react';

interface CursorGlowProps {
  enabled?: boolean;
}

export const CursorGlow: React.FC<CursorGlowProps> = ({ enabled = true }) => {
  const [visible, setVisible] = useState(false);
  const [isOverInteractive, setIsOverInteractive] = useState(false);
  const [isOverLocked, setIsOverLocked] = useState(false);
  const glowRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: -100, y: -100 });
  const currentPos = useRef({ x: -100, y: -100 });
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Detect touch device
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch) return;

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);

      // Check if hovering over interactive or locked element
      const target = e.target as HTMLElement | null;
      if (target) {
        const isLocked = Boolean(target.closest('[data-locked-profile="true"]') || target.closest('.is-locked-badge'));
        const isInteractive = Boolean(
          target.closest('button') ||
          target.closest('a') ||
          target.closest('input') ||
          target.closest('.interactive-target')
        );
        setIsOverLocked(isLocked);
        setIsOverInteractive(isInteractive);
      }
    };

    const handleMouseLeave = () => {
      setVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);

    // Smooth physics loop
    const animate = () => {
      // Linear interpolation (lerp)
      const ease = 0.22;
      currentPos.current.x += (mousePos.current.x - currentPos.current.x) * ease;
      currentPos.current.y += (mousePos.current.y - currentPos.current.y) * ease;

      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${currentPos.current.x}px, ${currentPos.current.y}px, 0)`;
      }

      rafId.current = requestAnimationFrame(animate);
    };

    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [enabled, visible]);

  if (!enabled || !visible) return null;

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed top-0 left-0 z-30 transition-opacity duration-300 will-change-transform"
      style={{
        width: 0,
        height: 0,
        opacity: visible ? 1 : 0,
      }}
      aria-hidden="true"
    >
      {/* Outer ambient soft aura */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-300"
        style={{
          width: isOverInteractive ? '540px' : '440px',
          height: isOverInteractive ? '540px' : '440px',
          background: isOverLocked
            ? 'radial-gradient(circle, rgba(245, 158, 11, 0.18) 0%, rgba(217, 119, 6, 0.06) 45%, transparent 70%)'
            : 'radial-gradient(circle, var(--glow) 0%, var(--accent-soft) 45%, transparent 75%)',
          filter: 'blur(20px)',
        }}
      />

      {/* Inner high-tech core reticle */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-200"
        style={{
          width: isOverInteractive ? '48px' : '32px',
          height: isOverInteractive ? '48px' : '32px',
          border: isOverLocked
            ? '1.5px solid rgba(245, 158, 11, 0.7)'
            : '1.5px solid var(--accent-line)',
          background: isOverLocked
            ? 'rgba(245, 158, 11, 0.15)'
            : 'var(--accent-soft)',
          boxShadow: isOverLocked
            ? '0 0 15px rgba(245, 158, 11, 0.6)'
            : '0 0 16px var(--glow)',
        }}
      />

      {/* Cyber optic laser point */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
        style={{
          background: isOverLocked ? '#f59e0b' : 'var(--accent)',
          boxShadow: isOverLocked
            ? '0 0 10px 2px rgba(245, 158, 11, 0.8)'
            : '0 0 10px 2px var(--accent-line)',
        }}
      />
    </div>
  );
};
