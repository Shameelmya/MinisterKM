import React, { useState, useRef, useEffect } from 'react';
import { PenTool as IconPenTool, Eraser as IconEraser, Type as IconType, Highlighter as IconHighlighter, ArrowLeft as IconArrowLeft, Trash2 as IconTrash2, Link2 as IconLink2, X as IconX } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 print:hidden">
      <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="bg-white w-full sm:w-[480px] rounded-t-3xl sm:rounded-2xl shadow-2xl relative z-10 animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-4 duration-300 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-stone-100">
          <h3 className="text-lg font-semibold text-stone-800">{title}</h3>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors">
            <IconX size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

const COLORS = {
  black: '#000000',
  blue: '#007AFF', // iOS Blue
  green: '#34C759', // iOS Green
  red: '#FF3B30', // iOS Red
  yellow: '#FFCC00' // iOS Yellow
};

const SIZES = {
  thin: 2,
  medium: 4,
  thick: 8
};

const renderPathsToCanvas = (ctx, paths) => {
  paths.forEach(p => {
    ctx.beginPath();
    ctx.strokeStyle = p.color;
    ctx.lineWidth = p.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (p.isHighlighter) {
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.3;
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

export default function NoteEditor({ note, onSave, onBack, onDelete, initialMode = 'type' }) {
  const [mode, setMode] = useState(initialMode);
  const [drawTool, setDrawTool] = useState('pen'); 
  const [drawColor, setDrawColor] = useState(COLORS.black);
  const [drawSize, setDrawSize] = useState(SIZES.medium);
  
  const [title, setTitle] = useState(note?.title || '');
  const [htmlContent, setHtmlContent] = useState(note?.richTextHTML || '');
  
  const editorRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  const [paths, setPaths] = useState(note?.drawingPaths ? JSON.parse(note.drawingPaths) : []);
  const [currentPath, setCurrentPath] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);

  // Reference to current state for popstate handler
  const stateRef = useRef({ title, htmlContent, paths, note });
  useEffect(() => {
    stateRef.current = { title, htmlContent, paths, note };
  }, [title, htmlContent, paths, note]);

  useEffect(() => {
    const handlePopState = () => {
      const { title, paths, note } = stateRef.current;
      const currentHtml = editorRef.current?.innerHTML || '';
      const textContent = editorRef.current?.innerText || '';
      
      if (title.trim() || textContent.trim() || paths.length > 0) {
        onSave({
          title: title.trim() || 'Untitled Note',
          richTextHTML: currentHtml,
          textContent,
          drawingPaths: JSON.stringify(paths)
        });
      } else {
        onBack();
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [onSave, onBack]);

  useEffect(() => {
    // Lock body scroll to prevent Android/iOS from panning the entire viewport
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      if (containerRef.current) {
        canvas.width = containerRef.current.offsetWidth;
        canvas.height = Math.max(containerRef.current.offsetHeight, containerRef.current.scrollHeight);
        redrawCanvas();
      }
    };

    window.addEventListener('resize', resizeCanvas);
    const observer = new MutationObserver(resizeCanvas);
    if (editorRef.current) {
      observer.observe(editorRef.current, { childList: true, characterData: true, subtree: true });
    }

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

  useEffect(() => {
    redrawCanvas();
  }, [paths]);

  const formatLinks = () => {
    if (!editorRef.current) return;
    let html = editorRef.current.innerHTML;
    
    const tempHtml = html.replace(/<a [^>]+>(.*?)<\/a>/g, '%%LINK%%$1%%/LINK%%');
    
    let newHtml = tempHtml.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" class="text-[#4a3b32] underline font-semibold" contenteditable="false">$1</a>');
    
    newHtml = newHtml.replace(/(?<!\d)(?:\+91|0)?[6-9]\d{9}(?!\d)/g, (match) => {
      return `<a href="tel:${match}" class="text-[#4a3b32] underline font-semibold" contenteditable="false">${match}</a>`;
    });
    
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
    
    e.preventDefault();
    setIsDrawing(true);
    const coords = getCoordinates(e);
    
    if (drawTool === 'eraser') {
      eraseAtPoint(coords);
    } else {
      const newPath = {
        color: drawTool === 'highlighter' ? COLORS.yellow : drawColor,
        size: drawTool === 'highlighter' ? 24 : drawSize,
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
      const newPath = {
        ...currentPath,
        points: [...currentPath.points, coords]
      };
      setCurrentPath(newPath);
      
      // Redraw everything to prevent highlighter overlapping at joints during fast drawing
      redrawCanvas();
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      renderPathsToCanvas(ctx, [newPath]);
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
    const ERASER_RADIUS = 25;
    setPaths(prev => prev.filter(p => {
      const hit = p.points.some(pt => {
        const dx = pt.x - coords.x;
        const dy = pt.y - coords.y;
        return Math.sqrt(dx*dx + dy*dy) < ERASER_RADIUS;
      });
      return !hit;
    }));
  };

  const handleBackUI = () => {
    // If the modal is open, just close the modal instead of going back
    if (clearConfirm) {
      setClearConfirm(false);
      return;
    }
    
    // Check if the history state is what we expect
    if (window.history.state?.noteOpen) {
      window.history.back(); // This triggers popstate, which auto-saves
    } else {
      // Fallback if somehow there's no state pushed
      const { title, paths, note } = stateRef.current;
      const currentHtml = editorRef.current?.innerHTML || '';
      const textContent = editorRef.current?.innerText || '';
      if (title.trim() || textContent.trim() || paths.length > 0) {
        onSave({
          title: title.trim() || 'Untitled Note',
          richTextHTML: currentHtml,
          textContent,
          drawingPaths: JSON.stringify(paths)
        });
      } else {
        onBack();
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white z-50 fixed inset-0">
      {/* iOS Style Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-stone-200/50 px-2 py-3 flex items-center justify-between z-20 shrink-0 safe-top">
        <div className="flex items-center gap-1 flex-1">
          <button onClick={handleBackUI} className="flex items-center text-[#4a3b32] px-2 py-1 active:opacity-50">
            <IconArrowLeft size={24} />
            <span className="text-lg ml-1">Notes</span>
          </button>
        </div>
        <div className="flex-1 flex justify-center">
            {/* Optional center title area if needed, we'll keep it clean */}
        </div>
        <div className="flex items-center justify-end gap-2 flex-1 pr-2">
          {note?.id && (
            <button onClick={onDelete} className="p-2 text-stone-400 hover:text-red-500 rounded-full transition-colors">
              <IconTrash2 size={22} />
            </button>
          )}
        </div>
      </div>

      {/* Tools Toolbar (Floating/Sticky) */}
      <div className="bg-white border-b border-stone-100 px-4 py-2.5 flex items-center gap-4 z-10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] shrink-0 overflow-x-auto no-scrollbar">
        {/* Mode Toggle */}
        <div className="flex bg-stone-100/80 p-1 rounded-xl shrink-0">
          <button 
            onClick={() => setMode('type')} 
            className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${mode === 'type' ? 'bg-white text-stone-800 shadow-sm scale-100' : 'text-stone-500 scale-95'}`}
          >
            <IconType size={18} /> <span className="hidden sm:inline">Type</span>
          </button>
          <button 
            onClick={() => setMode('draw')} 
            className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${mode === 'draw' ? 'bg-white text-stone-800 shadow-sm scale-100' : 'text-stone-500 scale-95'}`}
          >
            <IconPenTool size={18} /> <span className="hidden sm:inline">Draw</span>
          </button>
        </div>

        {/* Dynamic Tools based on Mode */}
        {mode === 'type' ? (
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar mask-edges">
            <button onClick={() => execCmd('formatBlock', 'H1')} className="px-3 py-1.5 text-base font-bold text-stone-700 hover:bg-stone-50 rounded-lg">H1</button>
            <button onClick={() => execCmd('formatBlock', 'H2')} className="px-3 py-1.5 text-base font-bold text-stone-700 hover:bg-stone-50 rounded-lg">H2</button>
            <div className="w-px h-5 bg-stone-200 mx-1"></div>
            <button onClick={() => execCmd('bold')} className="px-3 py-1.5 text-base font-bold text-stone-700 hover:bg-stone-50 rounded-lg">B</button>
            <button onClick={() => execCmd('italic')} className="px-3 py-1.5 text-base italic font-serif text-stone-700 hover:bg-stone-50 rounded-lg">I</button>
            <div className="w-px h-5 bg-stone-200 mx-1"></div>
            <button onClick={formatLinks} className="px-3 py-1.5 text-[#4a3b32] hover:bg-stone-50 rounded-lg flex items-center gap-1" title="Linkify URLs & Phones">
                <IconLink2 size={18} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4 shrink-0">
            {/* Draw Tools */}
            <div className="flex items-center bg-stone-50 p-1 rounded-xl border border-stone-100 shrink-0">
              <button onClick={() => setDrawTool('pen')} className={`p-2 rounded-lg transition-colors ${drawTool === 'pen' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400'}`}><IconPenTool size={20}/></button>
              <button onClick={() => setDrawTool('highlighter')} className={`p-2 rounded-lg transition-colors ${drawTool === 'highlighter' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400'}`}><IconHighlighter size={20}/></button>
              <button onClick={() => setDrawTool('eraser')} className={`p-2 rounded-lg transition-colors ${drawTool === 'eraser' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400'}`}><IconEraser size={20}/></button>
            </div>
            
            {/* Colors (only for pen) */}
            {drawTool === 'pen' && (
              <div className="flex items-center gap-2 px-2 shrink-0 border-l border-stone-200">
                {Object.values(COLORS).filter(c => c !== COLORS.yellow).map(c => (
                  <button 
                    key={c}
                    onClick={() => setDrawColor(c)}
                    className={`w-7 h-7 rounded-full transition-transform ${drawColor === c ? 'scale-125 shadow-sm ring-2 ring-offset-2 ring-stone-200' : 'scale-100'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}
            
            {/* Thickness */}
            {drawTool !== 'highlighter' && (
              <div className="flex items-center gap-3 px-3 shrink-0 border-l border-stone-200">
                {[SIZES.thin, SIZES.medium, SIZES.thick].map((s, i) => (
                  <button 
                    key={s}
                    onClick={() => setDrawSize(s)}
                    className={`rounded-full transition-all flex items-center justify-center ${drawSize === s ? 'bg-stone-800 ring-2 ring-stone-200 ring-offset-1' : 'bg-stone-300 hover:bg-stone-400'}`}
                    style={{ width: 8 + (i*4), height: 8 + (i*4) }}
                  />
                ))}
              </div>
            )}

            {/* Clear All */}
            {paths.length > 0 && (
                <button onClick={() => setClearConfirm(true)} className="text-sm font-semibold text-red-500 px-2 py-1 ml-auto shrink-0">Clear</button>
            )}
          </div>
        )}
      </div>

      {/* Editor Body */}
      <div 
        ref={containerRef}
        className="relative flex-1 overflow-auto bg-white"
        style={{ touchAction: mode === 'draw' ? 'none' : 'auto' }} // prevent scrolling while drawing on mobile
      >
        <div className="max-w-3xl mx-auto w-full relative min-h-full">
            {/* Title Input */}
            <input 
                type="text" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-6 sm:px-10 pt-8 pb-2 text-3xl font-bold text-stone-800 bg-transparent border-none outline-none placeholder-stone-300"
                placeholder="Title"
                style={{ zIndex: 3, position: 'relative' }}
            />

            {/* Layer 1: Text */}
            <div 
                ref={editorRef}
                contentEditable={mode === 'type'}
                suppressContentEditableWarning
                onBlur={(e) => setHtmlContent(e.target.innerHTML)}
                className="min-h-[500px] px-6 sm:px-10 pb-20 outline-none text-stone-800 leading-relaxed prose prose-stone max-w-none font-sans"
                style={{ 
                    zIndex: 1, 
                    position: 'relative' 
                }}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
        </div>

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
      
      {/* Modals */}
      <Modal isOpen={clearConfirm} onClose={() => setClearConfirm(false)} title="Clear all drawings?">
        <p className="text-stone-600 mb-6">
          Are you sure you want to clear all your handwriting and drawings? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button 
            onClick={() => setClearConfirm(false)}
            className="px-5 py-2.5 rounded-xl font-medium text-stone-600 hover:bg-stone-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => { setPaths([]); setClearConfirm(false); }}
            className="px-5 py-2.5 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm shadow-red-600/20"
          >
            Yes, Clear
          </button>
        </div>
      </Modal>
    </div>
  );
}
