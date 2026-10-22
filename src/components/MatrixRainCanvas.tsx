import React, { useEffect, useRef } from 'react';

interface MatrixRainCanvasProps {
  opacity?: number;
  speed?: number;
}

export const MatrixRainCanvas: React.FC<MatrixRainCanvasProps> = ({
  opacity = 0.15,
  speed = 33,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Characters: Katakana, numbers, hex, quantum symbols
    const chars = '0123456789ABCDEFΞΨΩλπµ<>[]{}*+/=#';
    const fontSize = 14;
    const columns = Math.floor(width / fontSize);
    const drops: number[] = new Array(columns).fill(1).map(() => Math.floor(Math.random() * -50));

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    let lastTime = 0;
    const render = (time: number) => {
      animationFrameId = requestAnimationFrame(render);
      if (time - lastTime < speed) return;
      lastTime = time;

      // Subtle dark wash for trail effect
      ctx.fillStyle = 'rgba(2, 6, 23, 0.08)';
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Alternate neon green and cyan for Matrix Fusion
        if (Math.random() > 0.88) {
          ctx.fillStyle = '#38bdf8'; // Electric cyan head
        } else if (Math.random() > 0.6) {
          ctx.fillStyle = '#00ff66'; // Glowing phosphor green
        } else {
          ctx.fillStyle = '#059669'; // Deeper emerald tail
        }

        ctx.fillText(text, x, y);

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i]++;
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [speed]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000"
      style={{ opacity }}
    />
  );
};
