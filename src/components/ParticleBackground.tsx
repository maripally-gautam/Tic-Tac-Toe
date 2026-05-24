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
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const colors = isDarkMode 
      ? [
          "rgba(255, 215, 0,",     // Gold
          "rgba(255, 180, 50,",    // Warm gold
          "rgba(200, 170, 80,",    // Muted gold
        ]
      : [
          "rgba(200, 130, 150,",   // Rose
          "rgba(210, 170, 160,",   // Warm taupe
          "rgba(190, 155, 140,",   // Sand
          "rgba(220, 175, 185,",   // Blush
        ];

    const particles: Particle[] = [];
    const count = isDarkMode ? 12 : 14;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 30 + 15,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.2 + 0.05,
        alphaSpeed: (Math.random() * 0.003 + 0.001) * (Math.random() > 0.5 ? 1 : -1)
      });
    }

    const draw = () => {
      const time = Date.now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isDarkMode) {
        // Clean dark background — minimal, elegant
        const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        bgGrad.addColorStop(0, "#0c0908");
        bgGrad.addColorStop(0.5, "#0a0806");
        bgGrad.addColorStop(1, "#080606");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Subtle gold glow — very subtle
        const glow1 = ctx.createRadialGradient(
          canvas.width * 0.5, canvas.height * 0.2, 0,
          canvas.width * 0.5, canvas.height * 0.2, canvas.width * 0.45
        );
        glow1.addColorStop(0, "rgba(255, 215, 0, 0.04)");
        glow1.addColorStop(0.5, "rgba(255, 180, 50, 0.02)");
        glow1.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = glow1;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        // Warm, rich light background with depth
        const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        bgGrad.addColorStop(0, "#faf5f2");
        bgGrad.addColorStop(0.3, "#f8ede8");
        bgGrad.addColorStop(0.6, "#f5e4dd");
        bgGrad.addColorStop(1, "#f0dbd3");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Rose-gold top-right glow
        const glow1 = ctx.createRadialGradient(
          canvas.width * 0.75, canvas.height * 0.15, 0,
          canvas.width * 0.75, canvas.height * 0.15, canvas.width * 0.5
        );
        glow1.addColorStop(0, "rgba(200, 130, 150, 0.1)");
        glow1.addColorStop(0.5, "rgba(210, 165, 140, 0.05)");
        glow1.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = glow1;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Warm peach bottom-left
        const glow2 = ctx.createRadialGradient(
          canvas.width * 0.25, canvas.height * 0.85, 0,
          canvas.width * 0.25, canvas.height * 0.85, canvas.width * 0.4
        );
        glow2.addColorStop(0, "rgba(220, 170, 150, 0.08)");
        glow2.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = glow2;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Render floating particles — subtle ambient orbs
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy + Math.sin(time * 0.0003 + p.radius) * 0.04;

        // Boundary wrap
        if (p.x < -p.radius * 3) p.x = canvas.width + p.radius * 2;
        if (p.x > canvas.width + p.radius * 3) p.x = -p.radius * 2;
        if (p.y < -p.radius * 3) p.y = canvas.height + p.radius * 2;
        if (p.y > canvas.height + p.radius * 3) p.y = -p.radius * 2;

        // Oscillate alpha gently
        p.alpha += p.alphaSpeed;
        if (p.alpha > 0.25 || p.alpha < 0.04) {
          p.alphaSpeed = -p.alphaSpeed;
        }

        ctx.beginPath();
        const radGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2);
        radGrad.addColorStop(0, `${p.color}${p.alpha})`);
        radGrad.addColorStop(0.6, `${p.color}${p.alpha * 0.3})`);
        radGrad.addColorStop(1, `${p.color}0)`);

        ctx.fillStyle = radGrad;
        ctx.arc(p.x, p.y, p.radius * 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Subtle grid — very faint
      const gridStep = 60;
      const dx = (time * 0.004) % gridStep;
      const dy = (time * 0.003) % gridStep;

      ctx.lineWidth = 0.5;

      if (isDarkMode) {
        ctx.strokeStyle = "rgba(255, 215, 0, 0.02)";
      } else {
        ctx.strokeStyle = "rgba(180, 130, 120, 0.025)";
      }

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
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
