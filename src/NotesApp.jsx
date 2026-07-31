import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from './App'; 
import { Folder as IconFolder, FolderPlus as IconFolderPlus, Search as IconSearch, FileText as IconFileText, Trash2 as IconTrash2, PenTool as IconPenTool, Edit3 as IconEdit3, ChevronDown as IconChevronDown, X as IconX, ChevronRight as IconChevronRight, ArrowLeft as IconArrowLeft } from 'lucide-react';
import NoteEditor from './NoteEditor';

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

export default function NotesApp() {
  const [folders, setFolders] = useState([]);
  const [notes, setNotes] = useState([]);
  const [activeFolderId, setActiveFolderId] = useState(null); // null means root
  const [activeNote, setActiveNote] = useState(null);
  const [initialModeForNewNote, setInitialModeForNewNote] = useState('type');
  
  const getFolderPath = (folderId) => {
    const path = [];
    let currentId = folderId;
    while (currentId) {
      const folder = folders.find(f => f.id === currentId);
      if (folder) {
        path.unshift(folder);
        currentId = folder.parentId;
      } else {
        break;
      }
    }
    return path;
  };

  const navigateToFolder = (folderId) => {
    const depth = folderId ? getFolderPath(folderId).length : 0;
    window.history.pushState({ folderId, isFolderView: true, depth }, '');
    setActiveFolderId(folderId);
    setSearchQuery('');
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type, id }

  const isCreatingFolderRef = useRef(isCreatingFolder);
  useEffect(() => {
    isCreatingFolderRef.current = isCreatingFolder;
  }, [isCreatingFolder]);

  useEffect(() => {
    const handlePopState = (e) => {
      // NoteEditor handles its own popstate if a note is open.
      if (activeNote) return;

      if (isCreatingFolderRef.current) {
        setIsCreatingFolder(false);
        setNewFolderName('');
      }

      if (e.state && e.state.isFolderView !== undefined) {
        setActiveFolderId(e.state.folderId || null);
      } else {
        setActiveFolderId(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeNote]);
  
  const folderFormRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (folderFormRef.current && !folderFormRef.current.contains(e.target)) {
        if (isCreatingFolderRef.current) {
          window.history.back(); // Pops the state and relies on popstate listener to close
        }
      }
    };
    if (isCreatingFolder) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCreatingFolder]);

  // Fetch Folders
  useEffect(() => {
    const q = query(collection(db, 'folders'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setFolders(data);
    });
    return unsub;
  }, []);

  // Fetch all notes
  useEffect(() => {
    const q = query(collection(db, 'notes'), orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setNotes(data);
    });
    return unsub;
  }, []);

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await addDoc(collection(db, 'folders'), {
        name: newFolderName.trim(),
        parentId: activeFolderId || null,
        createdAt: serverTimestamp()
      });
      setNewFolderName('');
      window.history.back(); // Pop the creating folder state
    } catch (error) {
      alert("Error creating folder: " + error.message);
    }
  };

  const promptDeleteFolder = (e, folderId) => {
    e.stopPropagation();
    setDeleteConfirm({ type: 'folder', id: folderId });
  };

  const confirmDeleteFolder = async (folderId) => {
    const getAllFolderIdsToDelete = (fId) => {
      let ids = [fId];
      const children = folders.filter(f => f.parentId === fId);
      for (const child of children) {
        ids = [...ids, ...getAllFolderIdsToDelete(child.id)];
      }
      return ids;
    };
    
    const folderIdsToDelete = getAllFolderIdsToDelete(folderId);
    
    for (const id of folderIdsToDelete) {
      const folderNotes = notes.filter(n => n.folderId === id);
      for (const n of folderNotes) {
        await deleteDoc(doc(db, 'notes', n.id));
      }
      await deleteDoc(doc(db, 'folders', id));
    }
    
    if (folderIdsToDelete.includes(activeFolderId)) {
      setActiveFolderId(null);
    }
    setDeleteConfirm(null);
  };

  const handleCreateNote = async (startMode = 'type') => {
    const newNote = {
      folderId: activeFolderId,
      title: '',
      textContent: '',
      richTextHTML: '',
      drawingPaths: '[]',
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    };
    try {
      const docRef = await addDoc(collection(db, 'notes'), newNote);
      setInitialModeForNewNote(startMode);
      const depth = getFolderPath(activeFolderId).length + 1;
      window.history.pushState({ noteOpen: true, depth }, '');
      setActiveNote({ id: docRef.id, ...newNote });
    } catch (error) {
      alert("Error creating note: " + error.message);
    }
  };

  const handleSaveNote = async (noteData) => {
    if (!activeNote) return;
    try {
      await updateDoc(doc(db, 'notes', activeNote.id), {
        ...noteData,
        updatedAt: serverTimestamp()
      });
      setActiveNote(null);
    } catch (error) {
      alert("Error saving note: " + error.message);
    }
  };

  const promptDeleteNote = (e, noteId) => {
    e.stopPropagation();
    setDeleteConfirm({ type: 'note', id: noteId });
  };

  const confirmDeleteNote = async (noteId) => {
    try {
      await deleteDoc(doc(db, 'notes', noteId));
      if (activeNote && activeNote.id === noteId) setActiveNote(null);
      setDeleteConfirm(null);
    } catch (error) {
      alert("Error deleting note: " + error.message);
    }
  };

  const openExistingNote = (note) => {
    setInitialModeForNewNote('type'); // Default when opening
    const depth = getFolderPath(activeFolderId).length + 1;
    window.history.pushState({ noteOpen: true, depth }, '');
    setActiveNote(note);
  };

  // Filter notes
  const displayedNotes = notes.filter(note => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (note.title || '').toLowerCase().includes(q) || 
             (note.textContent || '').toLowerCase().includes(q);
    }
    return activeFolderId ? note.folderId === activeFolderId : !note.folderId;
  });

  const displayedFolders = folders.filter(f => {
    if (searchQuery.trim()) {
       return f.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return f.parentId === (activeFolderId || null);
  });

  if (activeNote) {
    return (
      <NoteEditor 
        note={activeNote} 
        folderPath={getFolderPath(activeFolderId)}
        onSave={handleSaveNote} 
        onBack={() => setActiveNote(null)} 
        onDelete={(e) => promptDeleteNote(e, activeNote.id)}
        initialMode={initialModeForNewNote}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f6f4f0] relative max-w-3xl mx-auto w-full">
      {/* App Style Header */}
      <div className="bg-[#f6f4f0] px-4 pt-6 pb-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar mask-edges flex-1 mr-2">
            {activeFolderId && (
              <button 
                onClick={() => {
                  const path = getFolderPath(activeFolderId);
                  const parentId = path.length > 1 ? path[path.length - 2].id : null;
                  navigateToFolder(parentId);
                }} 
                className="p-1 -ml-1 text-[#4a3b32] hover:bg-stone-200 rounded-lg shrink-0 mr-1"
              >
                 <IconArrowLeft size={22} />
              </button>
            )}
            <button onClick={() => navigateToFolder(null)} className="text-xl font-bold text-[#3a2e26] shrink-0 hover:opacity-80">
              Notes
            </button>
            {activeFolderId && getFolderPath(activeFolderId).map(f => (
              <React.Fragment key={f.id}>
                <IconChevronRight size={18} className="text-stone-400 shrink-0" />
                <button onClick={() => navigateToFolder(f.id)} className="text-xl font-bold text-[#3a2e26] shrink-0 hover:opacity-80 truncate max-w-[120px] sm:max-w-[200px]">
                  {f.name}
                </button>
              </React.Fragment>
            ))}
          </div>
          
          <button 
            onClick={() => {
              if (isCreatingFolder) {
                window.history.back();
              } else {
                window.history.pushState({ creatingFolder: true }, '');
                setIsCreatingFolder(true);
              }
            }}
            className="w-9 h-9 flex items-center justify-center bg-white rounded-full text-[#4a3b32] shadow-sm active:scale-95 transition-transform shrink-0"
          >
            <IconFolderPlus size={20} />
          </button>
        </div>

        {isCreatingFolder && (
          <form ref={folderFormRef} onSubmit={handleCreateFolder} className="mb-4 flex gap-2">
            <input 
              type="text" 
              autoFocus
              placeholder="New Folder Name"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              className="flex-1 px-4 py-3 bg-white border border-stone-200 rounded-xl shadow-sm outline-none text-base focus:border-[#4a3b32] focus:ring-2 focus:ring-[#4a3b32]/20 transition-all"
            />
            <button 
              type="submit"
              disabled={!newFolderName.trim()}
              className="px-5 py-3 bg-[#4a3b32] text-white font-semibold rounded-xl shadow-sm hover:bg-[#3a2e26] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Create
            </button>
          </form>
        )}

        <div className="relative">
          <IconSearch size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input 
            type="text" 
            placeholder="Search notes" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-full shadow-sm outline-none focus:border-[#4a3b32] focus:ring-2 focus:ring-[#4a3b32]/20 transition-all text-sm text-stone-800 placeholder-stone-400 h-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {/* Folders Grid - Only show on root level or search */}
        {displayedFolders.length > 0 && (
          <div className="mb-8">
            {!searchQuery && <h3 className="text-sm font-semibold text-gray-500 mb-3 px-1">Folders</h3>}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {displayedFolders.map(folder => (
                <div 
                  key={folder.id} 
                  onClick={() => navigateToFolder(folder.id)}
                  className="bg-white p-3 rounded-xl shadow-sm border-t-[5px] border-[#4a3b32] hover:shadow-md transition-all cursor-pointer relative group flex items-center gap-3"
                >
                  <div className="bg-stone-50 p-2 rounded-lg">
                    <IconFolder size={24} className="text-[#4a3b32] opacity-80" fill="currentColor" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-stone-800 text-sm line-clamp-1">{folder.name}</span>
                    <div className="text-[10px] text-stone-400 font-medium mt-0.5">{notes.filter(n => n.folderId === folder.id).length} notes</div>
                  </div>
                  
                  <button 
                    onClick={(e) => promptDeleteFolder(e, folder.id)}
                    className="p-2 text-stone-300 hover:text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-stone-100"
                  >
                    <IconTrash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes Grid */}
        <div>
          {!searchQuery && <h3 className="text-sm font-semibold text-gray-500 mb-3 px-1">{activeFolderId ? 'Notes in folder' : 'Notes'}</h3>}
          
          {displayedNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-12 pb-8 text-center animate-in fade-in duration-500">
              <div className="w-20 h-20 bg-stone-200/50 rounded-full flex items-center justify-center mb-4 text-stone-400">
                <IconFileText size={32} />
              </div>
              <h3 className="text-lg font-semibold text-stone-800 mb-1">
                No notes found
              </h3>
              <p className="text-stone-500 text-sm mb-6">Create a new note or folder to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {displayedNotes.map(note => (
                <div 
                  key={note.id} 
                  onClick={() => openExistingNote(note)}
                  className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer relative group border border-transparent hover:border-stone-100 flex flex-col justify-between"
                >
                  <button 
                    onClick={(e) => promptDeleteNote(e, note.id)}
                    className="absolute top-3 right-3 p-1.5 bg-stone-100/80 backdrop-blur rounded-full text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 hover:bg-stone-200"
                  >
                    <IconTrash2 size={14} />
                  </button>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-bold text-gray-800 text-base leading-tight mb-2 line-clamp-2">
                      {note.title || 'Untitled Note'}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-6 leading-relaxed">
                      {note.textContent || "No additional text..."}
                    </p>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                      {note.updatedAt?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-24 sm:bottom-8 right-4 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 z-40 print:hidden flex flex-col sm:flex-row gap-3 items-end sm:items-center justify-end">
        {/* Handwriting Note FAB */}
        <button 
          onClick={() => handleCreateNote('draw')}
          className="relative z-10 flex items-center justify-center gap-2 text-white shadow-lg shadow-red-600/30 transition-all duration-300 w-14 h-14 sm:w-auto sm:h-12 sm:px-6 rounded-full select-none bg-red-600 hover:bg-red-700 hover:-translate-y-1"
          title="New Handwriting Note"
        >
          <IconEdit3 size={24} className="sm:w-5 sm:h-5" />
          <span className="hidden sm:inline font-medium">Handwrite</span>
        </button>
        
        {/* Standard Text Note FAB */}
        <button 
          onClick={() => handleCreateNote('type')}
          className="flex items-center justify-center gap-2 bg-[#4a3b32] text-white shadow-lg shadow-[#4a3b32]/30 hover:shadow-xl hover:-translate-y-1 hover:bg-[#3a2e26] transition-all w-14 h-14 sm:w-auto sm:h-12 sm:px-6 rounded-full"
          title="New Note"
        >
          <IconPenTool size={24} className="sm:w-5 sm:h-5" />
          <span className="hidden sm:inline font-medium">Add Note</span>
        </button>
      </div>
      {/* Modals */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title={`Delete ${deleteConfirm?.type === 'folder' ? 'Folder' : 'Note'}?`}>
        <p className="text-stone-600 mb-6">
          {deleteConfirm?.type === 'folder' 
            ? "Are you sure you want to delete this folder? All notes inside it will also be permanently deleted."
            : "Are you sure you want to delete this note? This action cannot be undone."}
        </p>
        <div className="flex gap-3 justify-end">
          <button 
            onClick={() => setDeleteConfirm(null)}
            className="px-5 py-2.5 rounded-xl font-medium text-stone-600 hover:bg-stone-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              if (deleteConfirm.type === 'folder') confirmDeleteFolder(deleteConfirm.id);
              else confirmDeleteNote(deleteConfirm.id);
            }}
            className="px-5 py-2.5 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm shadow-red-600/20"
          >
            Yes, Delete
          </button>
        </div>
      </Modal>

    </div>
  );
}
