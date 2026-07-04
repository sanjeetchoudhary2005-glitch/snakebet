'use client';

import React, { useRef, useEffect, useState } from 'react';

interface CrashCanvas2DProps {
  multiplierRef: React.MutableRefObject<number>;
  gameState: 'waiting' | 'betting' | 'running' | 'crashed';
  crashPoint: number;
  overlayRef: React.RefObject<HTMLDivElement | null>;
  textRef: React.RefObject<HTMLSpanElement | null>;
  stateRef: React.RefObject<HTMLSpanElement | null>;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
}

interface Star {
  x: number;
  y: number;
  radius: number;
  phase: number;
  speed: number;
}

interface Cloud {
  x: number;
  y: number;
  scale: number;
  speed: number;
}

export function CrashCanvas2D({ 
  multiplierRef, 
  gameState, 
  crashPoint,
  overlayRef,
  textRef,
  stateRef
}: CrashCanvas2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Animation state
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const shakeForceRef = useRef<number>(0);
  const prevCoordsRef = useRef<{ x: number; y: number }>({ x: 80, y: 350 });

  // Generate background elements once
  useEffect(() => {
    // Stars
    const stars: Star[] = [];
    for (let i = 0; i < 70; i++) {
      stars.push({
        x: Math.random() * 1200,
        y: Math.random() * 450,
        radius: 0.5 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
        speed: 0.02 + Math.random() * 0.04
      });
    }
    starsRef.current = stars;

    // Clouds
    const clouds: Cloud[] = [];
    for (let i = 0; i < 6; i++) {
      clouds.push({
        x: Math.random() * 1200,
        y: 40 + Math.random() * 120,
        scale: 0.6 + Math.random() * 0.6,
        speed: 0.05 + Math.random() * 0.08
      });
    }
    cloudsRef.current = clouds;
  }, []);

  // Screen shake and explosion on crash
  useEffect(() => {
    if (gameState === 'crashed') {
      shakeForceRef.current = 15; // Trigger shake force
      
      // Spawn fiery explosion sparks at the current rocket position
      const px = prevCoordsRef.current.x;
      const py = prevCoordsRef.current.y;
      const explosionSparks: Particle[] = [];
      
      for (let i = 0; i < 45; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 8;
        explosionSparks.push({
          x: px,
          y: py,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1, // slight gravity bias
          radius: 1.5 + Math.random() * 3.5,
          alpha: 0.9,
          life: 0,
          maxLife: 40 + Math.floor(Math.random() * 40),
          color: i % 3 === 0 ? '#ff3300' : i % 3 === 1 ? '#ffcc00' : '#ffaa00'
        });
      }
      particlesRef.current = explosionSparks;
    } else {
      shakeForceRef.current = 0;
      particlesRef.current = [];
    }
  }, [gameState]);

  // Main canvas animation frame loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;

    const render = () => {
      // 1. Handle resize
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
      }

      const w = rect.width;
      const h = rect.height;

      // Clean drawing state
      ctx.restore();
      ctx.save();

      // 2. Camera Shake application
      if (shakeForceRef.current > 0.1) {
        const sx = (Math.random() - 0.5) * shakeForceRef.current;
        const sy = (Math.random() - 0.5) * shakeForceRef.current;
        ctx.translate(sx, sy);
        shakeForceRef.current *= 0.92; // decay shake force
      }

      // 3. Draw Sky Gradient background
      const skyGrad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, w);
      skyGrad.addColorStop(0, '#121530');
      skyGrad.addColorStop(1, '#080917');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // 4. Draw Stars (glowing pulsing circles)
      starsRef.current.forEach(star => {
        star.phase += star.speed;
        const alpha = 0.3 + Math.sin(star.phase) * 0.6;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        // Scale star coordinate space to current canvas size
        const sx = (star.x / 1200) * w;
        const sy = (star.y / 450) * h;
        ctx.arc(sx, sy, star.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 5. Draw Clouds (moving parallax vectors)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      cloudsRef.current.forEach(cloud => {
        cloud.x -= cloud.speed;
        if (cloud.x < -200) {
          cloud.x = w + 50;
        }

        const cx = (cloud.x / 1200) * w;
        const cy = cloud.y;
        const s = cloud.scale;

        ctx.beginPath();
        ctx.arc(cx, cy, 30 * s, 0, Math.PI * 2);
        ctx.arc(cx + 25 * s, cy - 10 * s, 35 * s, 0, Math.PI * 2);
        ctx.arc(cx + 55 * s, cy, 25 * s, 0, Math.PI * 2);
        ctx.arc(cx + 35 * s, cy + 15 * s, 30 * s, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      });

      // 6. Draw Layered Mountains Silhouette
      // Back mountains
      ctx.fillStyle = '#0a0d24';
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, h - 80);
      ctx.quadraticCurveTo(w * 0.15, h - 140, w * 0.35, h - 90);
      ctx.quadraticCurveTo(w * 0.55, h - 60, w * 0.7, h - 110);
      ctx.quadraticCurveTo(w * 0.85, h - 150, w, h - 70);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // Front mountains
      ctx.fillStyle = '#060715';
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, h - 40);
      ctx.quadraticCurveTo(w * 0.25, h - 90, w * 0.45, h - 50);
      ctx.quadraticCurveTo(w * 0.65, h - 30, w * 0.8, h - 70);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // 7. Define Trajectory Scaling
      const startX = 60;
      const startY = h - 60;
      const marginR = 100;
      const marginT = 80;

      // Scale limits based on current multiplier to keep rocket on screen
      const activeMult = gameState === 'running' ? (multiplierRef?.current ?? 1.0) : gameState === 'crashed' ? crashPoint : 1.0;
      const maxM = Math.max(activeMult * 1.25, 2.0);

      // Curve position calculator
      const getCoords = (m: number) => {
        const progressX = (m - 1) / (maxM - 1);
        const progressY = (Math.sqrt(m) - 1) / (Math.sqrt(maxM) - 1);
        
        const rx = startX + progressX * (w - startX - marginR);
        const ry = startY - progressY * (startY - marginT);
        return { x: rx, y: ry };
      };

      const rocketPos = getCoords(activeMult);

      // 8. Generate Particle trail behind rocket when flying
      if (gameState === 'running') {
        if (Math.random() < 0.7) {
          particlesRef.current.push({
            x: rocketPos.x,
            y: rocketPos.y,
            vx: -1.5 - Math.random() * 2,
            vy: 0.5 + (Math.random() - 0.5) * 1.5,
            radius: 1.5 + Math.random() * 3,
            alpha: 0.8,
            life: 0,
            maxLife: 20 + Math.floor(Math.random() * 20),
            color: 'rgba(255, 140, 46, '
          });
        }
      }

      // 9. Update & Draw exhaust trail/explosion particles
      particlesRef.current.forEach((p, idx) => {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        
        if (gameState === 'crashed') {
          p.vy += 0.15; // apply gravity to explosion embers
        }

        const lifePct = p.life / p.maxLife;
        p.alpha = Math.max(0, 0.8 * (1 - lifePct));

        // Draw particle
        ctx.beginPath();
        ctx.fillStyle = p.color.includes('rgba') ? `${p.color}${p.alpha})` : p.color;
        ctx.globalAlpha = p.alpha;
        ctx.arc(p.x, p.y, p.radius * (1 - lifePct * 0.4), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      // Filter out dead particles
      particlesRef.current = particlesRef.current.filter(p => p.life < p.maxLife);

      // 10. Draw Ascent Path Curve
      const pointsCount = 60;
      ctx.beginPath();
      ctx.moveTo(startX, startY);

      for (let i = 1; i <= pointsCount; i++) {
        const m = 1 + (activeMult - 1) * (i / pointsCount);
        const p = getCoords(m);
        ctx.lineTo(p.x, p.y);
      }

      // Configure Glow Styling
      const isCrash = gameState === 'crashed';
      const strokeGrad = ctx.createLinearGradient(startX, startY, rocketPos.x, rocketPos.y);
      if (isCrash) {
        strokeGrad.addColorStop(0, '#ff3333');
        strokeGrad.addColorStop(1, '#ff6b6b');
      } else {
        strokeGrad.addColorStop(0, '#ff8c2e');
        strokeGrad.addColorStop(1, '#ffd166');
      }

      ctx.strokeStyle = strokeGrad;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Soft shadow blur for glow
      ctx.shadowColor = isCrash ? '#ff3333' : '#ff8c2e';
      ctx.shadowBlur = 15;
      ctx.stroke();

      // Disable shadow before drawing fill area
      ctx.shadowBlur = 0;

      // 11. Draw Translucent Gradient Fill Under the Curve
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      for (let i = 1; i <= pointsCount; i++) {
        const m = 1 + (activeMult - 1) * (i / pointsCount);
        const p = getCoords(m);
        ctx.lineTo(p.x, p.y);
      }
      ctx.lineTo(rocketPos.x, startY);
      ctx.lineTo(startX, startY);
      ctx.closePath();

      const areaGrad = ctx.createLinearGradient(0, startY - 150, 0, startY);
      if (isCrash) {
        areaGrad.addColorStop(0, 'rgba(255, 51, 51, 0.12)');
        areaGrad.addColorStop(1, 'rgba(255, 51, 51, 0)');
      } else {
        areaGrad.addColorStop(0, 'rgba(255, 140, 46, 0.15)');
        areaGrad.addColorStop(1, 'rgba(255, 140, 46, 0)');
      }
      ctx.fillStyle = areaGrad;
      ctx.fill();

      // 12. Calculate rocket rotation tangent
      let angle = -Math.PI / 12; // default flat climb
      if (activeMult > 1.001) {
        const prevCoords = getCoords(activeMult - 0.05);
        angle = Math.atan2(rocketPos.y - prevCoords.y, rocketPos.x - prevCoords.x);
      }

      prevCoordsRef.current = rocketPos;

      // 13. Draw Rocket Vector Icon at tip
      if (gameState !== 'crashed') {
        ctx.save();
        ctx.translate(rocketPos.x, rocketPos.y);
        ctx.rotate(angle);

        // Rocket Shadow glow filter
        ctx.shadowColor = '#ffd166';
        ctx.shadowBlur = 8;

        // Draw dynamic engine fire flame
        if (gameState === 'running') {
          const flameSize = 12 + Math.random() * 8;
          ctx.beginPath();
          ctx.moveTo(-16, 0);
          ctx.lineTo(-16 - flameSize, -4);
          ctx.lineTo(-16 - flameSize - 4, 0);
          ctx.lineTo(-16 - flameSize, 4);
          ctx.closePath();
          
          const flameGrad = ctx.createRadialGradient(-16, 0, 1, -16 - flameSize, 0, flameSize);
          flameGrad.addColorStop(0, '#ffffff');
          flameGrad.addColorStop(0.3, '#ffcc00');
          flameGrad.addColorStop(1, 'rgba(255, 51, 0, 0)');
          ctx.fillStyle = flameGrad;
          ctx.fill();
        }

        // Draw clean Vector Rocket silhouette (SVG-like paths)
        // Main metal rocket core body (tapered capsule)
        ctx.beginPath();
        ctx.moveTo(18, 0);
        ctx.bezierCurveTo(12, -7, -10, -7, -16, -5);
        ctx.lineTo(-16, 5);
        ctx.bezierCurveTo(-10, 7, 12, 7, 18, 0);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Red trim decorative nose tip cone
        ctx.beginPath();
        ctx.moveTo(18, 0);
        ctx.bezierCurveTo(14, -4, 9, -5, 8, -5);
        ctx.lineTo(8, 5);
        ctx.bezierCurveTo(9, 5, 14, 4, 18, 0);
        ctx.closePath();
        ctx.fillStyle = '#ff3333';
        ctx.fill();

        // Metallic engine ring at back
        ctx.fillStyle = '#4b5563';
        ctx.fillRect(-17, -4, 2, 8);

        // Rocket Wings/Fins
        ctx.beginPath();
        ctx.moveTo(-6, -6);
        ctx.lineTo(-17, -14);
        ctx.lineTo(-17, -5);
        ctx.closePath();
        ctx.fillStyle = '#ff3333';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-6, 6);
        ctx.lineTo(-17, 14);
        ctx.lineTo(-17, 5);
        ctx.closePath();
        ctx.fillStyle = '#ff3333';
        ctx.fill();

        // Glowing Blue glass cockpit window
        ctx.beginPath();
        ctx.arc(3, 0, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#00e5ff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 5;
        ctx.fill();

        ctx.restore();
      }

      // 14. Position the floating HTML overlay dynamically relative to the rocket
      if (overlayRef && overlayRef.current) {
        const overlay = overlayRef.current;
        const ow = overlay.offsetWidth || 120;
        const oh = overlay.offsetHeight || 50;

        // Clamp coords inside canvas space
        const padding = 15;
        const tx = Math.max(padding + ow / 2, Math.min(w - padding - ow / 2, rocketPos.x));
        const ty = Math.max(padding + oh / 2, Math.min(h - padding - oh / 2, rocketPos.y - 45));

        overlay.style.left = `${tx}px`;
        overlay.style.top = `${ty}px`;
      }

      if (textRef && textRef.current) {
        textRef.current.innerText = `${activeMult.toFixed(2)}x`;
      }

      if (stateRef && stateRef.current) {
        stateRef.current.innerText = 
          gameState === 'betting' ? `Starting in ${activeMult.toFixed(0)}s` : 
          gameState === 'crashed' ? 'Crashed' : 
          'Flying';
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [gameState, crashPoint, overlayRef, textRef, stateRef]);

  return (
    <div className="w-full h-full absolute inset-0 overflow-hidden bg-[#0d1024] z-0">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block"
      />
    </div>
  );
}

export default CrashCanvas2D;
