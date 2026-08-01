import React, { useState, useRef, useEffect } from 'react';
import { PenLine as IconPenLine, Eraser as IconEraser, Type as IconType, Highlighter as IconHighlighter, ArrowLeft as IconArrowLeft, Trash2 as IconTrash2, Link2 as IconLink2, X as IconX, ChevronRight as IconChevronRight, Undo2 as IconUndo, Redo2 as IconRedo, Bold as IconBold, Italic as IconItalic, Underline as IconUnderline, List as IconList, ListOrdered as IconListOrdered, Edit2 as IconEdit2, Check as IconCheck } from 'lucide-react';

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
  black: '#1c1917',
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308'
};

const HIGHLIGHT_COLORS = {
  yellow: 'rgba(250, 204, 21, 0.4)',
  pink: 'rgba(244, 114, 182, 0.4)',
  blue: 'rgba(96, 165, 250, 0.4)',
  green: 'rgba(74, 222, 128, 0.4)'
};

const SIZES = { thin: 1.5, medium: 3, thick: 6, extraThick: 10 };

const renderPathsToCanvas = (ctx, paths) => {
  paths.forEach(p => {
    ctx.beginPath();
    ctx.strokeStyle = p.color;
    ctx.lineWidth = p.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (p.isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1.0;
    } else if (p.isHighlighter) {
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.3;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
    }
    
    if (p.points.length > 0) {
      ctx.moveTo(p.points[0].x, p.points[0].y);
      if (p.points.length === 1) {
         ctx.lineTo(p.points[0].x, p.points[0].y);
      } else {
         for (let i = 1; i < p.points.length - 1; i++) {
            const pt = p.points[i];
            const nextPt = p.points[i + 1];
            const midX = (pt.x + nextPt.x) / 2;
            const midY = (pt.y + nextPt.y) / 2;
            ctx.quadraticCurveTo(pt.x, pt.y, midX, midY);
         }
         const last = p.points[p.points.length - 1];
         ctx.lineTo(last.x, last.y);
      }
      ctx.stroke();
    }
  });
};

export default function NoteEditor({ note, folderPath = [], onSave, onBack, onDelete }) {
  const mode = note?.type === 'draw' ? 'draw' : 'text';
  const isNewNote = !note?.title && (!note?.textContent || note?.textContent === '') && (!note?.drawingPaths || note?.drawingPaths === '[]');
  
  const [isEditing, setIsEditing] = useState(isNewNote);
  const [drawTool, setDrawTool] = useState('pen'); 
  const [drawColor, setDrawColor] = useState(COLORS.black);
  const [drawSize, setDrawSize] = useState(SIZES.thin);
  
  const [title, setTitle] = useState(note?.title || '');
  const [htmlContent, setHtmlContent] = useState(note?.richTextHTML || '');
  
  const editorRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  const [paths, setPaths] = useState(note?.drawingPaths ? JSON.parse(note.drawingPaths) : []);
  const [undoStack, setUndoStack] = useState([]);
  
  const [currentPath, setCurrentPath] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [eraserCursor, setEraserCursor] = useState(null);

  const stateRef = useRef({ title, htmlContent, paths, note });
  const isEditingRef = useRef(isEditing);
  const isNewNoteRef = useRef(isNewNote);
  const isForceExitingRef = useRef(false);

  useEffect(() => {
    stateRef.current = { title, htmlContent, paths, note };
  }, [title, htmlContent, paths, note]);

  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  useEffect(() => {
    if (paths.length === 0) setDrawTool('pen');
  }, [paths.length]);

  useEffect(() => {
    const saveAndExit = () => {
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

    const handlePopState = (e) => {
      const state = e.state || {};
      
      if (isForceExitingRef.current) {
          saveAndExit();
          return;
      }
      
      // If we hit back while editing an existing note, we exit edit mode.
      // The previous state should be noteOpen: true
      if (isEditingRef.current && !isNewNoteRef.current && state.noteOpen) {
         setIsEditing(false);
         return; 
      }
      
      saveAndExit();
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [onSave, onBack]);

  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);

  const getRequiredCanvasHeight = () => {
    let max_y = 0;
    paths.forEach(p => {
       p.points.forEach(pt => {
           if (pt.y > max_y) max_y = pt.y;
       });
    });
    if (currentPath) {
       currentPath.points.forEach(pt => {
           if (pt.y > max_y) max_y = pt.y;
       });
    }
    const windowH = typeof window !== 'undefined' ? window.innerHeight : 1000;
    return Math.max(windowH, max_y + windowH); 
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || mode !== 'draw') return;
    
    const resizeCanvas = () => {
      if (containerRef.current) {
        const ratio = window.devicePixelRatio || 1;
        const w = containerRef.current.offsetWidth;
        const h = getRequiredCanvasHeight();
        
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        
        canvas.width = w * ratio;
        canvas.height = h * ratio;
        
        const ctx = canvas.getContext('2d');
        ctx.scale(ratio, ratio);
        
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
  }, [mode, paths.length]); 

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || mode !== 'draw') return;
    const ctx = canvas.getContext('2d');
    const ratio = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    renderPathsToCanvas(ctx, paths);
  };

  useEffect(() => {
    redrawCanvas();
  }, [paths]);

  const execCmd = (cmd, val) => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) editorRef.current.focus();
  };

  const toggleHighlight = () => {
    document.execCommand('hiliteColor', false, 'yellow');
    if (editorRef.current) editorRef.current.focus();
  };

  const handleUndo = () => {
    if (mode === 'text') {
      execCmd('undo');
    } else if (paths.length > 0) {
      const p = paths[paths.length - 1];
      setPaths(prev => prev.slice(0, -1));
      setUndoStack(prev => [...prev, p]);
    }
  };

  const handleRedo = () => {
    if (mode === 'text') {
      execCmd('redo');
    } else if (undoStack.length > 0) {
      const p = undoStack[undoStack.length - 1];
      setUndoStack(prev => prev.slice(0, -1));
      setPaths(prev => [...prev, p]);
    }
  };
  
  const handleEditToggle = () => {
    if (!isEditing) {
       window.history.pushState({ noteState: 'editing' }, '');
       setIsEditing(true);
    } else {
       window.history.back(); // triggers popstate which will setIsEditing(false)
    }
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
    if (mode !== 'draw' || !isEditing) return;
    
    e.preventDefault();
    setIsDrawing(true);
    const coords = getCoordinates(e);
    
    const actualSize = drawTool === 'eraser' 
      ? (drawSize === SIZES.thin ? 20 : drawSize === SIZES.medium ? 35 : 50)
      : (drawTool === 'highlighter' ? 24 : drawSize);
      
    if (drawTool === 'eraser') {
      setEraserCursor({ x: coords.x, y: coords.y, radius: actualSize / 2 });
    }
    
    const newPath = {
      color: drawColor,
      size: actualSize,
      isHighlighter: drawTool === 'highlighter',
      isEraser: drawTool === 'eraser',
      points: [coords]
    };
    setCurrentPath(newPath);
    setUndoStack([]);
  };

  const draw = (e) => {
    if (!isDrawing || mode !== 'draw' || !isEditing) return;
    e.preventDefault();
    const coords = getCoordinates(e);

    const actualSize = drawTool === 'eraser' 
      ? (drawSize === SIZES.thin ? 20 : drawSize === SIZES.medium ? 35 : 50)
      : (drawTool === 'highlighter' ? 24 : drawSize);
      
    if (drawTool === 'eraser') {
      setEraserCursor({ x: coords.x, y: coords.y, radius: actualSize / 2 });
    }

    if (currentPath) {
      const newPath = {
        ...currentPath,
        points: [...currentPath.points, coords]
      };
      setCurrentPath(newPath);
      
      redrawCanvas();
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      renderPathsToCanvas(ctx, [newPath]);
      
      // Auto expand canvas height if near bottom
      const currentH = parseFloat(canvas.style.height || canvas.height);
      if (coords.y > currentH - 200) {
         const ratio = window.devicePixelRatio || 1;
         const w = containerRef.current.offsetWidth;
         const newH = currentH + window.innerHeight;
         canvas.style.height = newH + 'px';
         canvas.height = newH * ratio;
         ctx.scale(ratio, ratio);
         redrawCanvas();
         renderPathsToCanvas(ctx, [newPath]);
      }
    }
  };

  const stopDrawing = () => {
    if (drawTool === 'eraser') setEraserCursor(null);
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPath) {
      setPaths(prev => [...prev, currentPath]);
      setCurrentPath(null);
    }
  };

  const handleBackUI = () => {
    if (clearConfirm) {
      setClearConfirm(false);
      return;
    }
    
    window.history.back(); 
  };

  const handleBreadcrumbClick = (targetDepth) => {
    const currentDepth = folderPath.length + 1;
    const stepsBack = currentDepth - targetDepth;
    
    if (window.history.state?.noteOpen && stepsBack > 0) {
      isForceExitingRef.current = true;
      if (isEditing && !isNewNote) {
         window.history.go(-(stepsBack + 1));
      } else {
         window.history.go(-stepsBack);
      }
    } else {
      handleBackUI();
    }
  };

  return (
    <div className="flex flex-col bg-white z-[9999] fixed top-0 left-0 right-0 bottom-0 w-full h-[100dvh] sm:h-[100vh] overscroll-none" style={{ position: 'fixed' }}>
      {/* iOS Style Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-stone-200/50 px-2 py-3 flex items-center justify-between z-20 shrink-0 safe-top">
        <div className="flex items-center gap-1 flex-1 overflow-x-auto no-scrollbar mask-edges pr-4">
          <button onClick={handleBackUI} className="flex items-center text-[#4a3b32] px-2 py-1 active:opacity-50 shrink-0">
            <IconArrowLeft size={24} />
          </button>
          
          <button onClick={() => handleBreadcrumbClick(0)} className="text-lg font-semibold text-[#4a3b32] hover:opacity-80 shrink-0">
            Notes
          </button>
          
          {folderPath.map((f, idx) => (
            <React.Fragment key={f.id}>
              <IconChevronRight size={18} className="text-stone-400 shrink-0 mx-0.5" />
              <button 
                onClick={() => handleBreadcrumbClick(idx + 1)} 
                className="text-lg font-semibold text-[#4a3b32] hover:opacity-80 shrink-0 truncate max-w-[120px] sm:max-w-[200px]"
              >
                {f.name}
              </button>
            </React.Fragment>
          ))}
        </div>
        
        {/* Undo/Redo Buttons replacing Delete */}
        <div className="flex items-center justify-end gap-3 sm:gap-4 shrink-0 pr-2">
           {isEditing && (
             <>
               {mode === 'draw' && paths.length > 0 && (
                 <button onClick={() => setClearConfirm(true)} className="px-3 py-1 mr-2 text-xs font-bold text-red-500 bg-red-50 rounded-full hover:bg-red-100 transition-colors active:scale-95 shadow-sm border border-red-100" title="Clear Canvas">Clear</button>
               )}
               <button onClick={handleUndo} className="p-2 text-stone-500 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 rounded-full transition-colors active:scale-95 shadow-sm border border-stone-100" title="Undo">
                 <IconUndo size={18} />
               </button>
               <button onClick={handleRedo} className="p-2 text-stone-500 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 rounded-full transition-colors active:scale-95 shadow-sm border border-stone-100" title="Redo">
                 <IconRedo size={18} />
               </button>
             </>
           )}
           <button onClick={handleEditToggle} className={`p-2.5 ml-2 rounded-full transition-colors active:scale-95 shadow-sm border ${isEditing ? 'text-white bg-green-500 hover:bg-green-600 border-green-600' : 'text-stone-600 bg-white hover:bg-stone-50 border-stone-200'}`} title={isEditing ? "Finish Editing" : "Edit Note"}>
             {isEditing ? <IconCheck size={20} strokeWidth={3} /> : <IconEdit2 size={20} />}
           </button>
        </div>
      </div>

      {/* Tools Toolbar (Floating/Sticky) */}
      {isEditing && (
        <div className="bg-white border-b border-stone-100 px-4 py-2 flex items-center z-10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] shrink-0 overflow-x-auto no-scrollbar">
          {/* Dynamic Tools based on Note Type */}
          {mode === 'text' ? (
            <div className="flex items-center justify-end gap-1 sm:gap-2 overflow-x-auto no-scrollbar w-full">
              <button onMouseDown={e => e.preventDefault()} onTouchStart={e => e.preventDefault()} onClick={e => { e.preventDefault(); execCmd('bold'); }} className="p-2 text-stone-700 hover:bg-stone-100 rounded-lg shrink-0 transition-colors" title="Bold">
                <IconBold size={18} strokeWidth={2.5} />
              </button>
              <button onMouseDown={e => e.preventDefault()} onTouchStart={e => e.preventDefault()} onClick={e => { e.preventDefault(); execCmd('italic'); }} className="p-2 text-stone-700 hover:bg-stone-100 rounded-lg shrink-0 transition-colors" title="Italic">
                <IconItalic size={18} strokeWidth={2.5} />
              </button>
              <button onMouseDown={e => e.preventDefault()} onTouchStart={e => e.preventDefault()} onClick={e => { e.preventDefault(); execCmd('underline'); }} className="p-2 text-stone-700 hover:bg-stone-100 rounded-lg shrink-0 transition-colors" title="Underline">
                <IconUnderline size={18} strokeWidth={2.5} />
              </button>
              <div className="w-px h-5 bg-stone-200 mx-1 shrink-0"></div>
              <button onMouseDown={e => e.preventDefault()} onTouchStart={e => e.preventDefault()} onClick={e => { e.preventDefault(); execCmd('insertUnorderedList'); }} className="p-2 text-stone-700 hover:bg-stone-100 rounded-lg shrink-0 transition-colors" title="Bullet List">
                <IconList size={18} strokeWidth={2.5} />
              </button>
              <button onMouseDown={e => e.preventDefault()} onTouchStart={e => e.preventDefault()} onClick={e => { e.preventDefault(); execCmd('insertOrderedList'); }} className="p-2 text-stone-700 hover:bg-stone-100 rounded-lg shrink-0 transition-colors" title="Numbered List">
                <IconListOrdered size={18} strokeWidth={2.5} />
              </button>
              <div className="w-px h-5 bg-stone-200 mx-1 shrink-0"></div>
              <button onMouseDown={e => e.preventDefault()} onTouchStart={e => e.preventDefault()} onClick={e => { e.preventDefault(); toggleHighlight(); }} className="p-2 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700 rounded-lg shrink-0 transition-colors" title="Highlight">
                <IconHighlighter size={18} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-1 shrink-0 w-full px-1 py-1 overflow-x-auto no-scrollbar">
              {/* Colors (left) */}
              <div className="flex items-center gap-2 sm:gap-3 border-r border-stone-200/60 pl-1 sm:pl-2 pr-3 sm:pr-4 shrink-0">
                {drawTool === 'highlighter' ? (
                  Object.values(HIGHLIGHT_COLORS).map(c => (
                    <button 
                      key={c}
                      onClick={() => setDrawColor(c)}
                      className={`w-5 h-5 rounded-full transition-all border border-black/10 ${drawColor === c ? 'scale-125 shadow-md ring-2 ring-offset-2 ring-stone-300' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))
                ) : (
                  Object.values(COLORS).filter(c => c !== COLORS.yellow).map(c => (
                    <button 
                      key={c}
                      onClick={() => setDrawColor(c)}
                      className={`w-5 h-5 rounded-full transition-all border border-black/10 ${drawColor === c ? 'scale-125 shadow-md ring-2 ring-offset-2 ring-stone-300' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))
                )}
              </div>
              
              {/* Draw Tools (center) */}
              <div className="flex items-center gap-1 border-r border-stone-200/60 pl-3 pr-1 sm:pl-5 sm:pr-2 shrink-0">
                <button onClick={() => { setDrawTool('pen'); setDrawColor(COLORS.black); }} className={`p-1.5 sm:p-2 rounded-xl transition-all ${drawTool === 'pen' ? 'bg-stone-800 text-white shadow-md scale-105' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'}`} title="Pen">
                  <IconPenLine size={18} />
                </button>
                <button onClick={() => { setDrawTool('highlighter'); setDrawColor(HIGHLIGHT_COLORS.yellow); }} className={`p-1.5 sm:p-2 rounded-xl transition-all ${drawTool === 'highlighter' ? 'bg-yellow-100 text-yellow-700 shadow-sm scale-105 ring-1 ring-yellow-400' : 'text-stone-500 hover:bg-stone-100 hover:text-yellow-600'}`} title="Highlighter">
                  <IconHighlighter size={18} />
                </button>
                <button onClick={() => setDrawTool('eraser')} className={`p-1.5 sm:p-2 rounded-xl transition-all ${drawTool === 'eraser' ? 'bg-stone-200 text-stone-800 shadow-sm scale-105 ring-1 ring-stone-300' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'}`} title="Eraser">
                  <IconEraser size={18} />
                </button>
              </div>
              
              {/* Thickness (right) */}
              <div className="flex items-center justify-end gap-1 sm:gap-3 shrink-0 pl-2 sm:pl-4 pr-1 flex-1">
                {[SIZES.thin, SIZES.medium, SIZES.thick, SIZES.extraThick].map((s, i) => (
                  <button 
                    key={s}
                    onClick={() => setDrawSize(s)}
                    className={`w-6 h-6 rounded-full transition-all flex items-center justify-center border ${drawSize === s ? 'border-stone-400 bg-stone-100 shadow-sm scale-110' : 'border-transparent hover:bg-stone-100'}`}
                  >
                    <div className={`${drawTool === 'eraser' ? 'border-[1.5px] border-stone-400 bg-white' : 'bg-stone-800'} rounded-full`} style={{ width: 4 + (i*4), height: 4 + (i*4) }} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Editor Body */}
      <div 
        ref={containerRef}
        className="relative flex-1 overflow-auto bg-white"
        style={{ touchAction: (mode === 'draw' && isEditing) ? 'none' : 'auto' }} 
      >
        <div className="max-w-3xl mx-auto w-full relative min-h-full">
            {/* Title Input */}
            <input 
                type="text" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                readOnly={!isEditing}
                onClick={() => {
                   if (!isEditing) handleEditToggle();
                }}
                className="w-full px-6 sm:px-10 pt-8 pb-2 text-2xl font-bold font-sans text-stone-800 bg-transparent border-none outline-none placeholder-stone-300"
                placeholder="Title"
                style={{ zIndex: 3, position: 'relative' }}
            />

            {/* Layer 1: Text */}
            <div 
                ref={editorRef}
                contentEditable={mode === 'text' && isEditing}
                suppressContentEditableWarning
                onBlur={(e) => setHtmlContent(e.target.innerHTML)}
                onClick={() => {
                   if (mode === 'text' && !isEditing) handleEditToggle();
                }}
                className={`min-h-[500px] px-6 sm:px-10 pb-20 outline-none text-stone-800 leading-relaxed prose prose-stone max-w-none font-sans ${mode === 'draw' ? 'hidden' : 'block'} ${!isEditing ? 'cursor-pointer' : ''}`}
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
          className={`absolute top-0 left-0 w-full ${isEditing ? 'cursor-crosshair' : 'cursor-default'} ${mode === 'text' ? 'hidden' : 'block'}`}
          style={{ 
            zIndex: 2,
            pointerEvents: (mode === 'draw' && isEditing) ? 'auto' : 'none'
          }}
        />
        
        {eraserCursor && (
          <div 
            className="absolute rounded-full border-2 border-stone-400 bg-white/40 pointer-events-none shadow-sm"
            style={{
              zIndex: 3,
              left: eraserCursor.x - eraserCursor.radius,
              top: eraserCursor.y - eraserCursor.radius,
              width: eraserCursor.radius * 2,
              height: eraserCursor.radius * 2
            }}
          />
        )}
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
            onClick={() => { setPaths([]); setUndoStack([]); setClearConfirm(false); }}
            className="px-5 py-2.5 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm shadow-red-600/20"
          >
            Yes, Clear
          </button>
        </div>
      </Modal>
    </div>
  );
}
