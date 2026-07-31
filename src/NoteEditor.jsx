import React, { useState, useRef, useEffect } from 'react';
import { PenTool as IconPenTool, Eraser as IconEraser, Type as IconType, Highlighter as IconHighlighter, ArrowLeft as IconArrowLeft, Check as IconCheck, Trash2 as IconTrash2 } from 'lucide-react';

const COLORS = {
  black: '#000000',
  blue: '#2563eb',
  green: '#16a34a',
  red: '#dc2626'
};

const SIZES = {
  thin: 2,
  medium: 4,
  thick: 8
};

// SVG path parser helper to render old drawings
const renderPathsToCanvas = (ctx, paths) => {
  paths.forEach(p => {
    ctx.beginPath();
    ctx.strokeStyle = p.color;
    ctx.lineWidth = p.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (p.isHighlighter) {
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.4;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
    }
    
    if (p.points.length > 0) {
      ctx.moveTo(p.points[0].x, p.points[0].y);
      for (let i = 1; i < p.points.length; i++) {
        ctx.lineTo(p.points[i].x, p.points[i].y);
      }
      ctx.stroke();
    }
  });
};

export default function NoteEditor({ note, onSave, onBack, onDelete }) {
  const [mode, setMode] = useState('type'); // 'type' | 'draw'
  const [drawTool, setDrawTool] = useState('pen'); // 'pen' | 'highlighter' | 'eraser'
  const [drawColor, setDrawColor] = useState(COLORS.black);
  const [drawSize, setDrawSize] = useState(SIZES.medium);
  
  const [title, setTitle] = useState(note?.title || 'Untitled Note');
  const [htmlContent, setHtmlContent] = useState(note?.richTextHTML || '');
  
  const editorRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  // Drawing state
  const [paths, setPaths] = useState(note?.drawingPaths ? JSON.parse(note.drawingPaths) : []);
  const [currentPath, setCurrentPath] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      if (containerRef.current) {
        // Make canvas match scroll height of container
        canvas.width = containerRef.current.offsetWidth;
        canvas.height = Math.max(containerRef.current.offsetHeight, containerRef.current.scrollHeight);
        redrawCanvas();
      }
    };

    window.addEventListener('resize', resizeCanvas);
    // Observe DOM mutations to resize canvas if text grows
    const observer = new MutationObserver(resizeCanvas);
    if (editorRef.current) {
      observer.observe(editorRef.current, { childList: true, characterData: true, subtree: true });
    }

    // Initial resize with delay to ensure DOM is ready
    setTimeout(resizeCanvas, 100);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      observer.disconnect();
    };
  }, []);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    renderPathsToCanvas(ctx, paths);
  };

  // Redraw when paths change
  useEffect(() => {
    redrawCanvas();
  }, [paths]);

  // Handle Text Links auto-format
  const formatLinks = () => {
    if (!editorRef.current) return;
    let html = editorRef.current.innerHTML;
    
    // Protect existing links to avoid nested a tags
    const tempHtml = html.replace(/<a [^>]+>(.*?)<\/a>/g, '%%LINK%%$1%%/LINK%%');
    
    // Format URLs
    let newHtml = tempHtml.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" class="text-blue-500 underline" contenteditable="false">$1</a>');
    
    // Format Phone numbers (10 digits)
    newHtml = newHtml.replace(/(?<!\d)(?:\+91|0)?[6-9]\d{9}(?!\d)/g, (match) => {
      return `<a href="tel:${match}" class="text-blue-500 underline" contenteditable="false">${match}</a>`;
    });
    
    // Restore protected links (this is a simplified naive approach for safety)
    newHtml = newHtml.replace(/%%LINK%%(.*?)%%\/?LINK%%/g, '$1');
    
    if (html !== newHtml) {
      editorRef.current.innerHTML = newHtml;
      setHtmlContent(newHtml);
    }
  };

  const execCmd = (cmd, val) => {
    document.execCommand(cmd, false, val);
    editorRef.current.focus();
  };

  // Drawing Handlers
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    if (mode !== 'draw') return;
    
    // Stylus detection: if pointerType exists and is not pen/mouse, maybe block? 
    // Usually people want to draw with finger too if they don't have a pen, so we allow all touch in 'draw' mode.
    
    e.preventDefault();
    setIsDrawing(true);
    const coords = getCoordinates(e);
    
    if (drawTool === 'eraser') {
      eraseAtPoint(coords);
    } else {
      const newPath = {
        color: drawColor,
        size: drawSize,
        isHighlighter: drawTool === 'highlighter',
        points: [coords]
      };
      setCurrentPath(newPath);
    }
  };

  const draw = (e) => {
    if (!isDrawing || mode !== 'draw') return;
    e.preventDefault();
    const coords = getCoordinates(e);

    if (drawTool === 'eraser') {
      eraseAtPoint(coords);
    } else if (currentPath) {
      setCurrentPath(prev => ({
        ...prev,
        points: [...prev.points, coords]
      }));
      
      // Real-time draw
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.strokeStyle = currentPath.color;
      ctx.lineWidth = currentPath.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (currentPath.isHighlighter) {
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = 0.4;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;
      }
      const lastPoint = currentPath.points[currentPath.points.length - 1];
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPath && drawTool !== 'eraser') {
      setPaths(prev => [...prev, currentPath]);
      setCurrentPath(null);
    }
  };

  const eraseAtPoint = (coords) => {
    // Simple eraser: remove any path that has a point within erase radius (20px)
    const ERASER_RADIUS = 20;
    setPaths(prev => prev.filter(p => {
      const hit = p.points.some(pt => {
        const dx = pt.x - coords.x;
        const dy = pt.y - coords.y;
        return Math.sqrt(dx*dx + dy*dy) < ERASER_RADIUS;
      });
      return !hit; // keep if not hit
    }));
  };

  const handleSave = () => {
    if (editorRef.current) {
      // force text update
      const currentHtml = editorRef.current.innerHTML;
      const textContent = editorRef.current.innerText || '';
      onSave({
        title,
        richTextHTML: currentHtml,
        textContent,
        drawingPaths: JSON.stringify(paths)
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#fcfaf8]">
      {/* Header Toolbar */}
      <div className="bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between shadow-sm z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 text-stone-500 hover:bg-stone-100 rounded-full transition-colors">
            <IconArrowLeft size={20} />
          </button>
          <input 
            type="text" 
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="text-lg font-bold text-stone-800 bg-transparent border-none outline-none placeholder-stone-400 w-48 sm:w-64"
            placeholder="Note Title"
          />
        </div>
        <div className="flex items-center gap-2">
          {note?.id && (
            <button onClick={onDelete} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors mr-2">
              <IconTrash2 size={20} />
            </button>
          )}
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-[#4a3b32] text-white rounded-lg font-medium hover:bg-[#3a2e26] transition-colors shadow-sm">
            <IconCheck size={18} /> <span className="hidden sm:inline">Save Note</span>
          </button>
        </div>
      </div>

      {/* Tools Toolbar */}
      <div className="bg-white border-b border-stone-200 px-4 py-2 flex flex-wrap items-center gap-4 z-10 sticky top-[61px]">
        {/* Mode Toggle */}
        <div className="flex bg-stone-100 p-1 rounded-lg">
          <button 
            onClick={() => setMode('type')} 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'type' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500'}`}
          >
            <IconType size={16} /> Type
          </button>
          <button 
            onClick={() => setMode('draw')} 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'draw' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500'}`}
          >
            <IconPenTool size={16} /> Draw
          </button>
        </div>

        <div className="h-6 w-px bg-stone-200 hidden sm:block"></div>

        {/* Dynamic Tools based on Mode */}
        {mode === 'type' ? (
          <div className="flex items-center gap-2">
            <button onClick={() => execCmd('formatBlock', 'H1')} className="px-2 py-1 text-sm font-bold text-stone-600 hover:bg-stone-100 rounded">H1</button>
            <button onClick={() => execCmd('formatBlock', 'H2')} className="px-2 py-1 text-sm font-bold text-stone-600 hover:bg-stone-100 rounded">H2</button>
            <button onClick={() => execCmd('bold')} className="px-2 py-1 text-sm font-bold text-stone-600 hover:bg-stone-100 rounded">B</button>
            <button onClick={() => execCmd('italic')} className="px-2 py-1 text-sm italic text-stone-600 hover:bg-stone-100 rounded">I</button>
            <button onClick={() => execCmd('insertUnorderedList')} className="px-2 py-1 text-sm font-bold text-stone-600 hover:bg-stone-100 rounded">• List</button>
            <button onClick={formatLinks} className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded hover:bg-blue-100 ml-2">Linkify Links/Phones</button>
          </div>
        ) : (
          <div className="flex items-center gap-4 flex-1">
            {/* Draw Tools */}
            <div className="flex items-center gap-1">
              <button onClick={() => setDrawTool('pen')} className={`p-1.5 rounded ${drawTool === 'pen' ? 'bg-stone-200 text-stone-900' : 'text-stone-500'}`}><IconPenTool size={18}/></button>
              <button onClick={() => setDrawTool('highlighter')} className={`p-1.5 rounded ${drawTool === 'highlighter' ? 'bg-stone-200 text-stone-900' : 'text-stone-500'}`}><IconHighlighter size={18}/></button>
              <button onClick={() => setDrawTool('eraser')} className={`p-1.5 rounded ${drawTool === 'eraser' ? 'bg-stone-200 text-stone-900' : 'text-stone-500'}`}><IconEraser size={18}/></button>
            </div>
            
            {/* Colors */}
            <div className="flex items-center gap-2">
              {Object.values(COLORS).map(c => (
                <button 
                  key={c}
                  onClick={() => setDrawColor(c)}
                  className={`w-6 h-6 rounded-full border-2 ${drawColor === c ? 'border-stone-400 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Thickness */}
            <div className="flex items-center gap-2">
              {Object.entries(SIZES).map(([name, size]) => (
                <button 
                  key={name}
                  onClick={() => setDrawSize(size)}
                  className={`w-8 h-8 flex items-center justify-center rounded ${drawSize === size ? 'bg-stone-200' : 'hover:bg-stone-100'}`}
                >
                  <div className="bg-stone-800 rounded-full" style={{ width: size, height: size }}></div>
                </button>
              ))}
            </div>
            
            {/* Clear All */}
            <button onClick={() => { if(window.confirm('Clear all drawings?')) setPaths([]); }} className="ml-auto text-xs font-medium text-red-500 hover:bg-red-50 px-2 py-1 rounded">Clear Drawings</button>
          </div>
        )}
      </div>

      {/* Editor Body */}
      <div 
        ref={containerRef}
        className="relative flex-1 overflow-auto bg-[#fcfaf8]"
        style={{ touchAction: mode === 'draw' ? 'none' : 'auto' }} // prevent scrolling while drawing on mobile
      >
        {/* Layer 1: Text */}
        <div 
          ref={editorRef}
          contentEditable={mode === 'type'}
          suppressContentEditableWarning
          onBlur={(e) => setHtmlContent(e.target.innerHTML)}
          className="min-h-full p-6 sm:p-10 outline-none text-stone-800 leading-relaxed max-w-4xl mx-auto prose prose-stone"
          style={{ 
            fontFamily: "'Inter', sans-serif",
            fontSize: "1.1rem",
            zIndex: 1, 
            position: 'relative' 
          }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {/* Layer 2: Canvas */}
        <canvas
          ref={canvasRef}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          onPointerCancel={stopDrawing}
          className="absolute top-0 left-0 w-full h-full cursor-crosshair"
          style={{ 
            zIndex: 2,
            pointerEvents: mode === 'draw' ? 'auto' : 'none'
          }}
        />
      </div>
    </div>
  );
}
