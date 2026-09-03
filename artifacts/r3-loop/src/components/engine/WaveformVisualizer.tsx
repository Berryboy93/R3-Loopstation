import { useRef, useEffect } from 'react';

interface WaveformVisualizerProps {
  getTimeDomainData: () => Float32Array | null;
  width?: number;
  height?: number;
}

export function WaveformVisualizer({
  getTimeDomainData,
  width = 800,
  height = 120,
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const data = getTimeDomainData();
      if (!data) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#10b981';
      ctx.beginPath();

      const sliceWidth = width / data.length;
      let x = 0;

      for (let i = 0; i < data.length; i++) {
        const v = data[i] * 2; // amplify
        const y = (v * height) / 2 + height / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.stroke();
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [getTimeDomainData, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full rounded-lg border border-zinc-800 bg-zinc-950"
      style={{ imageRendering: 'crisp-edges' }}
    />
  );
}
