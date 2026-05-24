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

interface ParticleBackgroundProps {
  isDarkMode: boolean;
  active?: boolean;
}

export default function ParticleBackground({ isDarkMode, active = true }: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animationFrameId = 0;
    let timeoutId = 0;

    const resizeCanvas = () => {
      const scale = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(window.innerWidth * scale);
      canvas.height = Math.floor(window.innerHeight * scale);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const colors = isDarkMode
      ? ["rgba(255, 215, 0,", "rgba(255, 180, 50,", "rgba(200, 170, 80,"]
      : ["rgba(200, 130, 150,", "rgba(210, 170, 160,", "rgba(190, 155, 140,"];

    const particles: Particle[] = Array.from({ length: isDarkMode ? 8 : 10 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      radius: Math.random() * 24 + 12,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.14 + 0.04,
      alphaSpeed: (Math.random() * 0.002 + 0.0008) * (Math.random() > 0.5 ? 1 : -1),
    }));

    const drawBase = () => {
      if (isDarkMode) {
        const bgGrad = ctx.createLinearGradient(0, 0, window.innerWidth, window.innerHeight);
        bgGrad.addColorStop(0, "#0c0908");
        bgGrad.addColorStop(0.55, "#0a0806");
        bgGrad.addColorStop(1, "#080606");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

        const glow = ctx.createRadialGradient(
          window.innerWidth * 0.5,
          window.innerHeight * 0.18,
          0,
          window.innerWidth * 0.5,
          window.innerHeight * 0.18,
          window.innerWidth * 0.42
        );
        glow.addColorStop(0, "rgba(255, 215, 0, 0.035)");
        glow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      } else {
        const bgGrad = ctx.createLinearGradient(0, 0, window.innerWidth, window.innerHeight);
        bgGrad.addColorStop(0, "#faf5f2");
        bgGrad.addColorStop(0.45, "#f8ede8");
        bgGrad.addColorStop(1, "#f0dbd3");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      }
    };

    const draw = () => {
      drawBase();

      if (active) {
        const time = Date.now();
        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy + Math.sin(time * 0.0003 + p.radius) * 0.035;

          if (p.x < -p.radius * 3) p.x = window.innerWidth + p.radius * 2;
          if (p.x > window.innerWidth + p.radius * 3) p.x = -p.radius * 2;
          if (p.y < -p.radius * 3) p.y = window.innerHeight + p.radius * 2;
          if (p.y > window.innerHeight + p.radius * 3) p.y = -p.radius * 2;

          p.alpha += p.alphaSpeed;
          if (p.alpha > 0.2 || p.alpha < 0.035) p.alphaSpeed = -p.alphaSpeed;

          const radGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 1.7);
          radGrad.addColorStop(0, `${p.color}${p.alpha})`);
          radGrad.addColorStop(0.65, `${p.color}${p.alpha * 0.25})`);
          radGrad.addColorStop(1, `${p.color}0)`);

          ctx.beginPath();
          ctx.fillStyle = radGrad;
          ctx.arc(p.x, p.y, p.radius * 1.7, 0, Math.PI * 2);
          ctx.fill();
        });

        timeoutId = window.setTimeout(() => {
          animationFrameId = requestAnimationFrame(draw);
        }, 33);
      }
    };

    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.clearTimeout(timeoutId);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDarkMode, active]);

  return (
    <canvas
      id="arcade-particle-canvas"
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
