import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from './App'; 
import { Folder as IconFolder, FolderPlus as IconFolderPlus, Search as IconSearch, FileText as IconFileText, Trash2 as IconTrash2, PenTool as IconPenTool, Edit3 as IconEdit3, ChevronDown as IconChevronDown } from 'lucide-react';
import NoteEditor from './NoteEditor';

export default function NotesApp() {
  const [folders, setFolders] = useState([]);
  const [notes, setNotes] = useState([]);
  const [activeFolderId, setActiveFolderId] = useState(null); // null means root/all
  const [activeNote, setActiveNote] = useState(null);
  const [initialModeForNewNote, setInitialModeForNewNote] = useState('type');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

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
        name: newFolderName,
        createdAt: serverTimestamp()
      });
      setNewFolderName('');
      setIsCreatingFolder(false);
    } catch (error) {
      alert("Error creating folder: " + error.message);
    }
  };

  const handleDeleteFolder = async (e, folderId) => {
    e.stopPropagation();
    if(!window.confirm("Delete this folder and all notes inside it?")) return;
    const folderNotes = notes.filter(n => n.folderId === folderId);
    for (const n of folderNotes) {
      await deleteDoc(doc(db, 'notes', n.id));
    }
    await deleteDoc(doc(db, 'folders', folderId));
    if (activeFolderId === folderId) setActiveFolderId(null);
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

  const handleDeleteNote = async (e, noteId) => {
    e.stopPropagation();
    if(!window.confirm("Delete this note?")) return;
    try {
      await deleteDoc(doc(db, 'notes', noteId));
      if (activeNote && activeNote.id === noteId) setActiveNote(null);
    } catch (error) {
      alert("Error deleting note: " + error.message);
    }
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

  if (activeNote) {
    return (
      <NoteEditor 
        note={activeNote} 
        onSave={handleSaveNote} 
        onBack={() => setActiveNote(null)} 
        onDelete={(e) => handleDeleteNote(e, activeNote.id)}
        initialMode={initialModeForNewNote}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F2F2F7] relative">
      {/* iOS Style Header */}
      <div className="bg-[#F2F2F7] px-4 pt-6 pb-2 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => setActiveFolderId(null)} 
            className="text-3xl font-bold text-black"
          >
            {activeFolderId ? folders.find(f => f.id === activeFolderId)?.name || 'Folder' : 'Notes'}
          </button>
          
          <button 
            onClick={() => setIsCreatingFolder(!isCreatingFolder)}
            className="w-9 h-9 flex items-center justify-center bg-white rounded-full text-[#007AFF] shadow-sm active:scale-95 transition-transform"
          >
            <IconFolderPlus size={20} />
          </button>
        </div>

        {isCreatingFolder && (
          <form onSubmit={handleCreateFolder} className="mb-4 flex gap-2">
            <input 
              type="text" 
              autoFocus
              placeholder="New Folder Name"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm outline-none text-base focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 transition-all"
            />
            <button 
              type="submit"
              disabled={!newFolderName.trim()}
              className="px-5 py-3 bg-[#007AFF] text-white font-semibold rounded-xl shadow-sm hover:bg-[#0056b3] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Create
            </button>
          </form>
        )}

        <div className="relative">
          <IconSearch size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search notes" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-200/60 border-none rounded-xl outline-none focus:bg-white focus:shadow-sm transition-all text-[17px] text-black placeholder-gray-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {/* Folders Grid - Only show on root level or search */}
        {(!activeFolderId || searchQuery) && folders.length > 0 && (
          <div className="mb-8">
            {!searchQuery && <h3 className="text-sm font-semibold text-gray-500 mb-3 px-1">Folders</h3>}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {folders.map(folder => (
                <div 
                  key={folder.id} 
                  onClick={() => { setActiveFolderId(folder.id); setSearchQuery(''); }}
                  className="bg-white p-4 rounded-2xl shadow-sm hover:shadow transition-all cursor-pointer relative group flex flex-col items-center aspect-[4/3] justify-center"
                >
                  <IconFolder size={32} className="text-[#007AFF] mb-2 opacity-80" fill="currentColor" />
                  <span className="font-semibold text-gray-800 text-center text-sm line-clamp-2 w-full">{folder.name}</span>
                  <div className="text-xs text-gray-400 mt-1">{notes.filter(n => n.folderId === folder.id).length} notes</div>
                  <div className="text-[10px] text-gray-300 mt-1 uppercase tracking-wider font-medium">
                    {folder.createdAt?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  
                  <button 
                    onClick={(e) => handleDeleteFolder(e, folder.id)}
                    className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-red-500 rounded-full bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <IconTrash2 size={14} />
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
            <div className="py-12 flex flex-col items-center justify-center text-gray-400">
              <IconFileText size={48} className="mb-3 opacity-20" />
              <p>No notes found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {displayedNotes.map(note => (
                <div 
                  key={note.id} 
                  onClick={() => { setInitialModeForNewNote('type'); setActiveNote(note); }}
                  className="bg-white p-4 rounded-2xl shadow-sm hover:shadow transition-all cursor-pointer group flex flex-col aspect-[3/4] relative"
                >
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-bold text-gray-800 text-base leading-tight mb-2 line-clamp-2">
                      {note.title || 'Untitled Note'}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-6 leading-relaxed">
                      {note.textContent || "No additional text..."}
                    </p>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      {note.updatedAt?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <button 
                      onClick={(e) => handleDeleteNote(e, note.id)}
                      className="p-1 text-gray-300 hover:text-red-500 rounded-full"
                    >
                      <IconTrash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-24 sm:bottom-10 right-6 flex items-center justify-end gap-3 z-30 flex-col">
        {/* Handwriting Note FAB */}
        <button 
          onClick={() => handleCreateNote('draw')}
          className="w-14 h-14 flex items-center justify-center bg-white text-[#007AFF] rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:scale-105 active:scale-95 transition-all border border-gray-100"
          title="New Handwriting Note"
        >
          <IconEdit3 size={24} />
        </button>
        
        {/* Standard Text Note FAB */}
        <button 
          onClick={() => handleCreateNote('type')}
          className="w-14 h-14 flex items-center justify-center bg-[#007AFF] text-white rounded-full shadow-[0_4px_20px_rgba(0,122,255,0.3)] hover:scale-105 active:scale-95 transition-all"
          title="New Note"
        >
          <IconPenTool size={24} />
        </button>
      </div>
    </div>
  );
}
