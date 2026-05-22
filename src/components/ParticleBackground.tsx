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

    // Vibrant multicolor palette
    const colors = isDarkMode 
      ? [
          "rgba(255, 215, 0,",     // Gold
          "rgba(255, 140, 0,",     // Dark Orange
          "rgba(192, 192, 192,",   // Silver
          "rgba(255, 165, 0,",     // Orange
          "rgba(218, 165, 32,",    // Goldenrod
          "rgba(255, 69, 0,",      // Red-Orange
          "rgba(255, 223, 100,",   // Light Gold
          "rgba(200, 160, 60,",    // Deep Gold
        ]
      : [
          "rgba(232, 160, 178,",   // Rose Gold
          "rgba(245, 208, 214,",   // Light Rose
          "rgba(255, 228, 196,",   // Champagne
          "rgba(218, 185, 168,",   // Warm Taupe
          "rgba(255, 200, 170,",   // Peach
          "rgba(220, 180, 200,",   // Lilac Rose
          "rgba(240, 200, 180,",   // Warm Blush
          "rgba(200, 160, 140,",   // Warm Sand
        ];

    const particles: Particle[] = [];
    const count = 45; // More particles for richer look

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 40 + 20, // Larger particles
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.5 + 0.15, // MUCH more visible: 0.15-0.65
        alphaSpeed: (Math.random() * 0.005 + 0.002) * (Math.random() > 0.5 ? 1 : -1)
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isDarkMode) {
        // Rich dark background with warm depth
        const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        bgGrad.addColorStop(0, "#0a0605");
        bgGrad.addColorStop(0.3, "#0d0906");
        bgGrad.addColorStop(0.6, "#0a0704");
        bgGrad.addColorStop(1, "#080505");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Strong gold glow top-center
        const glow1 = ctx.createRadialGradient(
          canvas.width * 0.5, canvas.height * 0.15, 0,
          canvas.width * 0.5, canvas.height * 0.15, canvas.width * 0.5
        );
        glow1.addColorStop(0, "rgba(255, 215, 0, 0.12)");
        glow1.addColorStop(0.4, "rgba(255, 140, 0, 0.06)");
        glow1.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = glow1;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Orange glow bottom-left
        const glow2 = ctx.createRadialGradient(
          canvas.width * 0.2, canvas.height * 0.85, 0,
          canvas.width * 0.2, canvas.height * 0.85, canvas.width * 0.4
        );
        glow2.addColorStop(0, "rgba(255, 100, 0, 0.08)");
        glow2.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = glow2;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Silver glow bottom-right
        const glow3 = ctx.createRadialGradient(
          canvas.width * 0.8, canvas.height * 0.7, 0,
          canvas.width * 0.8, canvas.height * 0.7, canvas.width * 0.35
        );
        glow3.addColorStop(0, "rgba(192, 192, 192, 0.06)");
        glow3.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = glow3;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        // Warm ivory with rose-gold
        const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGrad.addColorStop(0, "#fdf8f5");
        bgGrad.addColorStop(0.5, "#faf0ec");
        bgGrad.addColorStop(1, "#f5e6e0");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Rose-gold corner glow
        const cornerGlow = ctx.createRadialGradient(
          canvas.width * 0.8, canvas.height * 0.2, 0,
          canvas.width * 0.8, canvas.height * 0.2, canvas.width * 0.5
        );
        cornerGlow.addColorStop(0, "rgba(232, 160, 178, 0.12)");
        cornerGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = cornerGlow;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Warm peach glow bottom
        const peachGlow = ctx.createRadialGradient(
          canvas.width * 0.3, canvas.height * 0.8, 0,
          canvas.width * 0.3, canvas.height * 0.8, canvas.width * 0.4
        );
        peachGlow.addColorStop(0, "rgba(255, 200, 170, 0.1)");
        peachGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = peachGlow;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Render floating particles — VISIBLE and vibrant
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy + Math.sin(Date.now() * 0.0004 + p.radius) * 0.06;

        // Boundary wrap
        if (p.x < -p.radius * 3) p.x = canvas.width + p.radius * 2;
        if (p.x > canvas.width + p.radius * 3) p.x = -p.radius * 2;
        if (p.y < -p.radius * 3) p.y = canvas.height + p.radius * 2;
        if (p.y > canvas.height + p.radius * 3) p.y = -p.radius * 2;

        // Oscillate transparency — visible range
        p.alpha += p.alphaSpeed;
        if (p.alpha > 0.55 || p.alpha < 0.12) {
          p.alphaSpeed = -p.alphaSpeed;
        }

        ctx.beginPath();
        const radGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2.5);
        radGrad.addColorStop(0, `${p.color}${p.alpha})`);
        radGrad.addColorStop(0.5, `${p.color}${p.alpha * 0.4})`);
        radGrad.addColorStop(1, `${p.color}0)`);

        ctx.fillStyle = radGrad;
        ctx.arc(p.x, p.y, p.radius * 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Subtle scrolling grid
      const gridStep = 55;
      const dx = (Date.now() * 0.006) % gridStep;
      const dy = (Date.now() * 0.004) % gridStep;

      ctx.lineWidth = 0.8;

      if (isDarkMode) {
        ctx.strokeStyle = "rgba(255, 215, 0, 0.04)";
      } else {
        ctx.strokeStyle = "rgba(210, 160, 140, 0.025)";
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
