import React, { useEffect, useRef } from 'react';

/**
 * CyberBackgroundMesh
 * Lightweight, high-performance canvas that draws subtle drifting biometric constellation nodes
 * connected with hairline lasers, perfectly matching the active CSS theme color.
 */
export const CyberBackgroundMesh: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Particle nodes
    const NODE_COUNT = Math.min(Math.floor((width * height) / 22000), 55);
    interface Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      baseAlpha: number;
    }

    const nodes: Node[] = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 1.5 + 1,
        baseAlpha: Math.random() * 0.4 + 0.2,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Track mouse position for subtle interactive proximity
    let mouseX = -9999;
    let mouseY = -9999;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Read active accent color from CSS variable
    const getAccentRGB = (): [number, number, number] => {
      const computed = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      // Handle hex like #ff2a5f, #00f0ff, etc.
      if (computed.startsWith('#')) {
        const hex = computed.slice(1);
        if (hex.length === 6) {
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          return [
            Number.isNaN(r) ? 255 : r,
            Number.isNaN(g) ? 42 : g,
            Number.isNaN(b) ? 95 : b,
          ];
        }
      }
      return [34, 211, 238];
    };

    let cachedRGB = getAccentRGB();
    let frameCount = 0;

    const render = () => {
      frameCount++;
      if (frameCount % 60 === 0) {
        cachedRGB = getAccentRGB();
      }

      ctx.clearRect(0, 0, width, height);
      const [r, g, b] = cachedRGB;

      // Update and draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.x += node.vx;
        node.y += node.vy;

        // Screen boundary wrap
        if (node.x < 0) node.x = width;
        else if (node.x > width) node.x = 0;
        if (node.y < 0) node.y = height;
        else if (node.y > height) node.y = 0;

        // Distance to cursor
        const dxM = mouseX - node.x;
        const dyM = mouseY - node.y;
        const distM = Math.hypot(dxM, dyM);
        const mouseNear = distM < 160;

        // Draw node dot
        ctx.beginPath();
        ctx.arc(node.x, node.y, mouseNear ? node.size * 1.5 : node.size, 0, Math.PI * 2);
        ctx.fillStyle = mouseNear
          ? `rgba(${r}, ${g}, ${b}, 0.8)`
          : `rgba(${r}, ${g}, ${b}, ${node.baseAlpha})`;
        ctx.fill();

        // Connect nearby nodes with faint hairline strands
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeB = nodes[j];
          const dx = node.x - nodeB.x;
          const dy = node.y - nodeB.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 130) {
            const alpha = (1 - dist / 130) * 0.18;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(nodeB.x, nodeB.y);
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }

        // Connect to mouse if near
        if (mouseNear) {
          const alpha = (1 - distM / 160) * 0.35;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(mouseX, mouseY);
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-60 transition-opacity duration-500"
      aria-hidden="true"
    />
  );
};
