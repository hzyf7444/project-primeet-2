'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Pen, 
  Eraser, 
  Square, 
  Circle, 
  Minus,
  Type,
  Palette,
  RotateCcw,
  Download,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface WhiteboardProps {
  onClose: () => void;
}

type Tool = 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line' | 'text';

interface DrawingData {
  tool: Tool;
  color: string;
  size: number;
  points: { x: number; y: number }[];
}

export function Whiteboard({ onClose }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<Tool>('pen');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentSize, setCurrentSize] = useState([3]);
  const [drawings, setDrawings] = useState<DrawingData[]>([]);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#A52A2A'
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Set background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Redraw all drawings
    drawings.forEach(drawing => {
      drawOnCanvas(ctx, drawing);
    });
  }, [drawings]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const drawOnCanvas = (ctx: CanvasRenderingContext2D, drawing: DrawingData) => {
    ctx.strokeStyle = drawing.color;
    ctx.lineWidth = drawing.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (drawing.tool === 'pen' || drawing.tool === 'eraser') {
      if (drawing.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }

      ctx.beginPath();
      drawing.points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
    } else if (drawing.points.length >= 2) {
      const start = drawing.points[0];
      const end = drawing.points[drawing.points.length - 1];

      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();

      switch (drawing.tool) {
        case 'rectangle':
          ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
          break;
        case 'circle':
          const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
          ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
          break;
        case 'line':
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          break;
      }
      ctx.stroke();
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    setIsDrawing(true);
    setStartPoint(pos);

    if (currentTool === 'pen' || currentTool === 'eraser') {
      const newDrawing: DrawingData = {
        tool: currentTool,
        color: currentColor,
        size: currentSize[0],
        points: [pos]
      };
      setDrawings(prev => [...prev, newDrawing]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const pos = getMousePos(e);

    if (currentTool === 'pen' || currentTool === 'eraser') {
      setDrawings(prev => {
        const updated = [...prev];
        const lastDrawing = updated[updated.length - 1];
        if (lastDrawing) {
          lastDrawing.points.push(pos);
        }
        return updated;
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return;

    const pos = getMousePos(e);
    setIsDrawing(false);

    if (currentTool !== 'pen' && currentTool !== 'eraser') {
      const newDrawing: DrawingData = {
        tool: currentTool,
        color: currentColor,
        size: currentSize[0],
        points: [startPoint, pos]
      };
      setDrawings(prev => [...prev, newDrawing]);
    }

    setStartPoint(null);
  };

  const clearCanvas = () => {
    setDrawings([]);
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'whiteboard.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  const tools = [
    { id: 'pen', icon: Pen, label: 'Kalem' },
    { id: 'eraser', icon: Eraser, label: 'Silgi' },
    { id: 'rectangle', icon: Square, label: 'Dikdörtgen' },
    { id: 'circle', icon: Circle, label: 'Daire' },
    { id: 'line', icon: Minus, label: 'Çizgi' },
    { id: 'text', icon: Type, label: 'Metin' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-4 bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Beyaz Tahta</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        {/* Tools */}
        <div className="flex items-center gap-2">
          {tools.map((tool) => (
            <Button
              key={tool.id}
              variant={currentTool === tool.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentTool(tool.id as Tool)}
              className="w-10 h-10 p-0"
            >
              <tool.icon className="w-4 h-4" />
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Colors */}
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <div className="flex gap-1">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setCurrentColor(color)}
                className={`w-6 h-6 rounded border-2 ${
                  currentColor === color ? 'border-gray-900 dark:border-white' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Brush Size */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Boyut:</span>
          <div className="w-24">
            <Slider
              value={currentSize}
              onValueChange={setCurrentSize}
              max={20}
              min={1}
              step={1}
            />
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400 w-8">{currentSize[0]}</span>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={clearCanvas}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Temizle
          </Button>
          <Button variant="outline" size="sm" onClick={downloadCanvas}>
            <Download className="w-4 h-4 mr-2" />
            İndir
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 p-4">
        <canvas
          ref={canvasRef}
          className="w-full h-full border border-gray-300 dark:border-gray-600 rounded cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setIsDrawing(false)}
        />
      </div>
    </motion.div>
  );
}