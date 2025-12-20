import React, { useEffect, useRef } from 'react';
import { Particle, TreeSettings } from '../types';
import { audioManager } from '../utils/audio';

interface TreeCanvasProps {
  settings: TreeSettings;
}

export const TreeCanvas: React.FC<TreeCanvasProps> = ({ settings }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const snowParticles = useRef<Particle[]>([]);
  const frameId = useRef<number>(0);
  const angle = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0, isDown: false, lastX: 0 });

  // -- Realistic Tree Generation --

  const createTreeParticles = (width: number, height: number): Particle[] => {
    const pts: Particle[] = [];
    // Tree dimensions
    const treeHeight = Math.min(width, height) * 0.8;
    const maxBaseRadius = treeHeight * 0.35;
    
    // 1. TRUNK (Cylinder in the center)
    const trunkHeight = treeHeight * 0.2; // Visible trunk at bottom
    for (let i = 0; i < 300; i++) {
        const h = (Math.random() * trunkHeight) - treeHeight/2;
        const r = (Math.random() * 8) + 2; // Trunk radius variation
        const theta = Math.random() * Math.PI * 2;
        pts.push({
            x: r * Math.cos(theta),
            y: h,
            z: r * Math.sin(theta),
            originalX: r * Math.cos(theta),
            originalY: h,
            originalZ: r * Math.sin(theta),
            color: `hsl(${25 + Math.random() * 10}, ${40 + Math.random() * 20}%, ${15 + Math.random() * 10}%)`, // Brown
            size: Math.random() * 2 + 1,
            type: 'needle', // Treat as needle for rendering logic
            phase: 0,
            alpha: 1
        });
    }

    // 2. BRANCHES & NEEDLES (Layered approach)
    const layers = 25; // Number of distinct branch layers
    
    for (let l = 0; l < layers; l++) {
        const progress = l / layers; // 0 (top) to 1 (bottom)
        const yLevel = (treeHeight * 0.9) * -0.5 + (treeHeight * 0.9) * progress; // Start higher up
        
        // Radius increases as we go down, with a slight curve for "spruce" shape
        const layerRadius = maxBaseRadius * Math.pow(progress, 0.8);
        
        // Number of branches in this layer
        const branchCount = 5 + Math.floor(progress * 15);
        
        for (let b = 0; b < branchCount; b++) {
            const branchAngle = (Math.PI * 2 * b) / branchCount + (l * 0.5); // Offset layers
            
            // "Droop" factor: lower branches hang down more
            const droop = Math.pow(progress, 2) * 50; 

            // Create needles along this branch
            const needlesPerBranch = 20 + Math.floor(progress * 40);
            
            for (let n = 0; n < needlesPerBranch; n++) {
                const nProgress = n / needlesPerBranch; // Distance from trunk
                const r = nProgress * layerRadius;
                
                // Add randomness to spread needles out from the "bone" of the branch
                const spread = 10 + nProgress * 20; 
                
                // Calculate position
                const lx = r * Math.cos(branchAngle) + (Math.random() - 0.5) * spread;
                const lz = r * Math.sin(branchAngle) + (Math.random() - 0.5) * spread;
                const ly = yLevel + (nProgress * droop) + (Math.random() - 0.5) * 10;

                pts.push({
                    x: lx,
                    y: ly,
                    z: lz,
                    originalX: lx,
                    originalY: ly,
                    originalZ: lz,
                    // Richer greens: Mix of emerald, forest, and pine
                    color: `hsl(${130 + Math.random() * 30}, ${50 + Math.random() * 30}%, ${15 + Math.random() * 25}%)`,
                    size: Math.random() * 1.5 + 0.8,
                    type: 'needle',
                    phase: Math.random() * Math.PI * 2,
                    alpha: 0.9
                });
            }

            // 3. DECORATIONS (Lights & Ornaments at tips/mid of branches)
            if (Math.random() > 0.3) {
                 // Spiral Lights wrapping around the tree implicitly by following branch structure
                 const lightR = layerRadius * (0.4 + Math.random() * 0.6);
                 const lightX = lightR * Math.cos(branchAngle);
                 const lightZ = lightR * Math.sin(branchAngle);
                 const lightY = yLevel + (lightR/layerRadius * droop);
                 
                 const isOrnament = Math.random() > 0.6;

                 pts.push({
                    x: lightX,
                    y: lightY,
                    z: lightZ,
                    originalX: lightX,
                    originalY: lightY,
                    originalZ: lightZ,
                    color: '#fff', // Dynamic in render
                    size: isOrnament ? (Math.random() * 3 + 2.5) : (Math.random() * 3 + 2),
                    type: isOrnament ? 'ornament' : 'light',
                    phase: Math.random() * Math.PI * 2,
                    alpha: 1
                 });
            }
        }
    }

    // 4. TOP STAR
    for(let i=0; i<40; i++) {
        pts.push({
            x: (Math.random() - 0.5) * 12,
            y: -(treeHeight * 0.9) / 2 - 5 - Math.random() * 10,
            z: (Math.random() - 0.5) * 12,
            originalX: 0,
            originalY: -(treeHeight * 0.9) / 2,
            originalZ: 0,
            color: '#FFD700',
            size: Math.random() * 3 + 1,
            type: 'star',
            phase: Math.random() * 10,
            alpha: 1
        })
    }

    return pts;
  };

  const createSnow = (width: number, height: number): Particle[] => {
    const snow: Particle[] = [];
    for (let i = 0; i < 250; i++) {
      snow.push({
        x: (Math.random() - 0.5) * width * 1.5,
        y: (Math.random() - 0.5) * height * 1.5,
        z: (Math.random() - 0.5) * 1000,
        originalX: 0, 
        originalY: 0, 
        originalZ: 0,
        color: 'white',
        size: Math.random() * 2 + 0.5,
        type: 'needle', 
        phase: Math.random() * Math.PI,
        alpha: Math.random() * 0.4 + 0.4
      });
    }
    return snow;
  };

  // -- Render Loop --

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); // Optimization
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      particles.current = createTreeParticles(width, height);
      snowParticles.current = createSnow(width, height);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const render = (time: number) => {
      // Clear with dark atmospheric background
      const gradient = ctx.createRadialGradient(width/2, height/2, 100, width/2, height/2, 800);
      gradient.addColorStop(0, '#0f172a'); // Slate 900
      gradient.addColorStop(1, '#020617'); // Slate 950
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Floor Reflection Glow
      ctx.fillStyle = 'rgba(20, 30, 50, 0.3)';
      ctx.beginPath();
      ctx.ellipse(width/2, height/2 + 250, 200, 40, 0, 0, Math.PI * 2);
      ctx.fill();

      const fov = 900;
      const centerX = width / 2;
      const centerY = height / 2 + 50;

      if (settings.isAutoRotating && !mouseRef.current.isDown) {
        angle.current += settings.rotationSpeed;
      }

      const cosA = Math.cos(angle.current);
      const sinA = Math.sin(angle.current);

      const projectedParticles = particles.current.map(p => {
        const rotX = p.originalX * cosA - p.originalZ * sinA;
        const rotZ = p.originalX * sinA + p.originalZ * cosA;
        return { ...p, x: rotX, z: rotZ }; 
      });

      projectedParticles.sort((a, b) => b.z - a.z);

      projectedParticles.forEach(p => {
        const zShift = p.z + 550;
        if (zShift <= 0) return;

        const scale = fov / zShift;
        const x2d = p.x * scale + centerX;
        const y2d = p.y * scale + centerY;
        const size = p.size * scale;

        // Skip drawing if off screen
        if (x2d < -50 || x2d > width + 50 || y2d < -50 || y2d > height + 50) return;

        ctx.beginPath();
        
        if (p.type === 'needle') {
           ctx.fillStyle = p.color;
           // Slight depth shading
           ctx.globalAlpha = Math.min(1, (zShift / 1000) * p.alpha); 
           ctx.arc(x2d, y2d, size, 0, Math.PI * 2);
           ctx.fill();
        } 
        else if (p.type === 'star') {
            const twinkle = Math.sin(time * 0.005 + p.phase) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(255, 215, 0, ${twinkle})`;
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 20 * scale;
            ctx.arc(x2d, y2d, size * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        } 
        else if (p.type === 'light') {
           // Light Logic
           let colorStr = '';
           if (settings.lightColor === 'warm') colorStr = '255, 200, 100'; // Warm Yellow
           else if (settings.lightColor === 'cool') colorStr = '200, 240, 255'; // Icy Blue
           else {
               // Multicolor festive
               const hues = [0, 60, 120, 240, 300]; // Red, Yellow, Green, Blue, Purple
               const hue = hues[Math.floor(p.phase * 10) % hues.length];
               colorStr = hue === 0 ? '255, 50, 50' : // Red
                          hue === 60 ? '255, 255, 50' : // Yellow
                          hue === 120 ? '50, 255, 50' : // Green
                          hue === 240 ? '50, 100, 255' : // Blue
                          '255, 50, 255'; // Purple
           }

           const blinkSpeed = 0.004;
           const blink = Math.sin(time * blinkSpeed + p.phase);
           
           if (blink > -0.5) { // Ensure lights aren't off for too long
               const intensity = (blink + 1) / 2; // Normalize 0-1
               
               // Glow effect (expensive, so use sparingly or optimize)
               ctx.fillStyle = `rgba(${colorStr}, ${intensity})`;
               
               // Draw the bulb
               ctx.arc(x2d, y2d, size, 0, Math.PI * 2);
               ctx.fill();

               // Draw the glow
               ctx.globalAlpha = 0.3 * intensity;
               ctx.beginPath();
               ctx.arc(x2d, y2d, size * 3, 0, Math.PI * 2);
               ctx.fillStyle = `rgba(${colorStr}, ${intensity})`;
               ctx.fill();
               ctx.globalAlpha = 1;
           }
        } 
        else if (p.type === 'ornament') {
            // Reflective Baubles
            const hue = (p.phase * 100) % 360;
            ctx.fillStyle = `hsl(${hue}, 60%, 40%)`;
            ctx.arc(x2d, y2d, size, 0, Math.PI * 2);
            ctx.fill();
            
            // Specular shine
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.beginPath();
            ctx.arc(x2d - size*0.3, y2d - size*0.3, size*0.25, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.globalAlpha = 1;
      });

      // Snow update and draw
      ctx.fillStyle = 'white';
      snowParticles.current.forEach(p => {
        p.y += (p.size * 0.4); 
        p.x += Math.sin(time * 0.001 + p.phase) * 0.5; // Sway
        
        if (p.y > height / 2 + 400) { 
            p.y = -height / 2 - 400;
        }
        
        const zShift = p.z + 800;
        const scale = fov / zShift;
        const x2d = p.x * scale + centerX;
        const y2d = p.y * scale + centerY;
        
        if (zShift > 0) {
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.arc(x2d, y2d, p.size * scale, 0, Math.PI * 2);
            ctx.fill();
        }
      });
      ctx.globalAlpha = 1;

      frameId.current = requestAnimationFrame(render);
    };

    frameId.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId.current);
    };
  }, [settings]);

  const handlePointerDown = (e: React.PointerEvent) => {
    mouseRef.current.isDown = true;
    mouseRef.current.lastX = e.clientX;
    audioManager.playInteractionSound(); 
  };

  const handlePointerUp = () => {
    mouseRef.current.isDown = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (mouseRef.current.isDown) {
      const deltaX = e.clientX - mouseRef.current.lastX;
      angle.current += deltaX * 0.005;
      mouseRef.current.lastX = e.clientX;
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full cursor-grab active:cursor-grabbing touch-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerMove={handlePointerMove}
    />
  );
};