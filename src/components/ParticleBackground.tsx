import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  alphaSpeed: number;
}

export default function ParticleBackground({ isDarkMode }: { isDarkMode: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Beautiful glowing warm palette (eliminating blues and purples entirely)
    const colors = isDarkMode 
      ? [
          "rgba(255, 87, 34,",   // Hot Orange / Coral
          "rgba(255, 179, 0,",   // Golden Amber
          "rgba(233, 30, 99,",   // Sunset Pink
          "rgba(76, 175, 80,",   // Electric Lime Green
          "rgba(255, 145, 0,"    // Pure Neon Orange
        ]
      : [
          "rgba(255, 112, 67,",  // Peach Orange
          "rgba(255, 167, 38,",  // Amber Light
          "rgba(240, 98, 146,",  // Rose Quartz
          "rgba(139, 195, 74,",  // Sage Lime
          "rgba(255, 152, 0,"    // Warm Apricot
        ];

    const particles: Particle[] = [];
    const count = 28; // Increased density for high-end aesthetic

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 25 + 12,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.25 + 0.08,
        alphaSpeed: (Math.random() * 0.003 + 0.001) * (Math.random() > 0.5 ? 1 : -1)
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Warm charcoal sunset obsidian gradient for Dark Mode
      if (isDarkMode) {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGrad.addColorStop(0, "#080606");      // Pristine dark obsidian
        bgGrad.addColorStop(0.5, "#150d0a");    // Warm amber-rust depth
        bgGrad.addColorStop(1, "#050404");      // Velvet carbon black
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGrad.addColorStop(0, "#fffcf9");      // Ultra polished soft cream warm light
        bgGrad.addColorStop(1, "#f7ebe3");      // Soft rosy sunset glow
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Render floating warm particles
      particles.forEach((p) => {
        // Move particle with gentle wave motion
        p.x += p.vx;
        p.y += p.vy + Math.sin(Date.now() * 0.0005 + p.radius) * 0.05;

        // Boundary wrap
        if (p.x < -p.radius * 2) p.x = canvas.width + p.radius * 2;
        if (p.x > canvas.width + p.radius * 2) p.x = -p.radius * 2;
        if (p.y < -p.radius * 2) p.y = canvas.height + p.radius * 2;
        if (p.y > canvas.height + p.radius * 2) p.y = -p.radius * 2;

        // Oscillate transparency smoothly
        p.alpha += p.alphaSpeed;
        if (p.alpha > 0.32 || p.alpha < 0.06) {
          p.alphaSpeed = -p.alphaSpeed;
        }

        ctx.beginPath();
        const radGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        radGrad.addColorStop(0, `${p.color}${p.alpha})`);
        radGrad.addColorStop(0.7, `${p.color}${p.alpha * 0.3})`);
        radGrad.addColorStop(1, `${p.color}0)`);

        ctx.fillStyle = radGrad;
        ctx.arc(p.x, p.y, p.radius * 3.0, 0, Math.PI * 2);
        ctx.fill();
      });

      // Drifting high-fidelity neon grids (Slow digital scroll in dark, elegant blueprint scroll in light)
      const gridStep = 48;
      const dx = (Date.now() * 0.008) % gridStep;
      const dy = (Date.now() * 0.005) % gridStep;

      ctx.lineWidth = 1.2;

      if (isDarkMode) {
        ctx.strokeStyle = "rgba(255, 87, 34, 0.02)"; // Subtle warm orange grid lines
        for (let x = dx; x < canvas.width; x += gridStep) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = dy; y < canvas.height; y += gridStep) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
      } else {
        ctx.strokeStyle = "rgba(255, 112, 67, 0.015)"; // Gentle peach blueprint grid lines
        for (let x = dx; x < canvas.width; x += gridStep) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = dy; y < canvas.height; y += gridStep) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDarkMode]);

  return (
    <canvas
      id="arcade-particle-canvas"
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}
