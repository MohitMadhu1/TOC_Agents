import React, { useEffect, useRef } from 'react';

/**
 * Premium Liquid Ribbon Simulation - Signature Version
 * Restored 1D interaction with ultra-slow viscosity for a prestigious feel.
 */
const FluidBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    const ribbons: any[] = [];
    const ribbonCount = 10;

    class SilkRibbon {
      yBase: number;
      amplitude: number;
      frequency: number;
      phase: number;
      speed: number;
      color: string;
      maxWidth: number;

      constructor(index: number) {
        this.yBase = (index / ribbonCount) * height;
        this.amplitude = Math.random() * 80 + 40;
        this.frequency = 0.001 + Math.random() * 0.0005;
        this.phase = Math.random() * Math.PI * 2;
        this.speed = (Math.random() - 0.5) * 0.004;
        this.maxWidth = 4 + Math.random() * 10;
        this.color = index % 3 === 0 ? "#C5A021" : "#002366";
      }

      draw(mouseX: number, time: number) {
        if (!ctx) return;
        
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.15;

        const points: {x: number, y: number}[] = [];

        for (let x = 0; x <= width; x += 15) {
          const wave = Math.sin(x * this.frequency + this.phase) * this.amplitude;
          // Wider, softer interaction curve
          const interactive = Math.exp(-Math.pow(x - mouseX, 2) / 100000) * 45;
          const y = this.yBase + wave + interactive;
          points.push({x, y});
          
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        for (let x = width; x >= 0; x -= 15) {
          const idx = Math.floor(x / 15);
          const p = points[idx] || points[points.length-1];
          const thickness = Math.abs(Math.sin(x * 0.005 + time)) * this.maxWidth + 2;
          ctx.lineTo(x, p.y + thickness);
        }

        ctx.closePath();
        ctx.fill();

        // Add 'Pop' Glow to the top edge
        ctx.beginPath();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 0.8;
        ctx.globalAlpha = 0.6;
        ctx.shadowBlur = 25;
        ctx.shadowColor = this.color;
        
        for (let i = 0; i < points.length; i++) {
          if (i === 0) ctx.moveTo(points[i].x, points[i].y);
          else ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
        
        // Reset shadow for next draw
        ctx.shadowBlur = 0;
      }

      update() {
        this.phase += this.speed;
      }
    }

    for (let i = 0; i < ribbonCount; i++) {
        ribbons.push(new SilkRibbon(i));
    }

    let targetMouseX = width / 2;
    let currentMouseX = width / 2;
    window.addEventListener('mousemove', (e) => targetMouseX = e.clientX);

    let time = 0;
    let animationFrameId: number;
    const animate = () => {
      time += 0.015;
      
      // Ultra-Slow Viscosity
      currentMouseX += (targetMouseX - currentMouseX) * 0.012;

      ctx.globalAlpha = 1;
      ctx.fillStyle = '#000816';
      ctx.fillRect(0, 0, width, height);

      ribbons.forEach(r => {
        r.update();
        r.draw(currentMouseX, time);
      });

      animationFrameId = window.requestAnimationFrame(animate);
    };

    animate();
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', handleResize);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10 pointer-events-none"
    />
  );
};

export default FluidBackground;
