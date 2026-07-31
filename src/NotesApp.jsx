import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from './App'; // We need to export db from App.jsx!
import { Folder as IconFolder, Plus as IconPlus, Search as IconSearch, FileText as IconFileText, MoreVertical as IconMoreVertical, Trash2 as IconTrash2 } from 'lucide-react';
import NoteEditor from './NoteEditor';

export default function NotesApp() {
  const [folders, setFolders] = useState([]);
  const [notes, setNotes] = useState([]);
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [activeNote, setActiveNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Fetch Folders
  useEffect(() => {
    const q = query(collection(db, 'folders'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setFolders(data);
      if (data.length > 0 && !activeFolderId && !searchQuery) {
        setActiveFolderId(data[0].id);
      }
    });
    return unsub;
  }, [activeFolderId, searchQuery]);

  // Fetch all notes (needed for global search)
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

  const handleDeleteFolder = async (folderId) => {
    if(!window.confirm("Are you sure? This will delete the folder and all notes inside it!")) return;
    // Delete notes inside
    const folderNotes = notes.filter(n => n.folderId === folderId);
    for (const n of folderNotes) {
      await deleteDoc(doc(db, 'notes', n.id));
    }
    await deleteDoc(doc(db, 'folders', folderId));
    if (activeFolderId === folderId) setActiveFolderId(null);
  };

  const handleCreateNote = async () => {
    if (!activeFolderId) {
      alert("Please select or create a folder first.");
      return;
    }
    const newNote = {
      folderId: activeFolderId,
      title: 'Untitled Note',
      textContent: '',
      richTextHTML: '',
      drawingPaths: '[]',
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    };
    try {
      const docRef = await addDoc(collection(db, 'notes'), newNote);
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

  const handleDeleteNote = async (noteId) => {
    if(!window.confirm("Delete this note?")) return;
    try {
      await deleteDoc(doc(db, 'notes', noteId));
      if (activeNote && activeNote.id === noteId) setActiveNote(null);
    } catch (error) {
      alert("Error deleting note: " + error.message);
    }
  };

  // Filter notes based on active folder OR global search
  const displayedNotes = notes.filter(note => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (note.title || '').toLowerCase().includes(q) || 
             (note.textContent || '').toLowerCase().includes(q);
    }
    return note.folderId === activeFolderId;
  });

  if (activeNote) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <NoteEditor 
          note={activeNote} 
          onSave={handleSaveNote} 
          onBack={() => setActiveNote(null)} 
          onDelete={() => handleDeleteNote(activeNote.id)}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full bg-stone-50 overflow-hidden relative">
      {/* Sidebar (Folders) */}
      <div className="w-20 sm:w-64 bg-white border-r border-stone-200 flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-stone-200">
          <h2 className="text-sm font-bold text-stone-500 uppercase tracking-wider hidden sm:block mb-2">Folders</h2>
          <button 
            onClick={() => setIsCreatingFolder(true)}
            className="w-full flex items-center justify-center sm:justify-start gap-2 p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors font-medium text-sm"
          >
            <IconPlus size={18} /> <span className="hidden sm:inline">New Folder</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isCreatingFolder && (
            <form onSubmit={handleCreateFolder} className="p-2">
              <input 
                type="text" 
                autoFocus
                placeholder="Folder name..."
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onBlur={() => !newFolderName && setIsCreatingFolder(false)}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded outline-none focus:border-stone-500"
              />
            </form>
          )}

          {folders.map(folder => (
            <div key={folder.id} className="group relative flex items-center">
              <button
                onClick={() => { setActiveFolderId(folder.id); setSearchQuery(''); }}
                className={`flex-1 flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                  activeFolderId === folder.id && !searchQuery ? 'bg-[#4a3b32] text-white shadow-sm' : 'text-stone-700 hover:bg-stone-100'
                }`}
                title={folder.name}
              >
                <IconFolder size={20} className={activeFolderId === folder.id && !searchQuery ? 'text-amber-200' : 'text-stone-400'} />
                <span className="hidden sm:inline font-medium truncate text-sm">{folder.name}</span>
              </button>
              <button 
                onClick={() => handleDeleteFolder(folder.id)}
                className="absolute right-2 p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded hidden sm:group-hover:block"
                title="Delete Folder"
              >
                <IconTrash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content (Notes List) */}
      <div className="flex-1 flex flex-col h-full bg-stone-50">
        {/* Header */}
        <div className="bg-white border-b border-stone-200 p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input 
              type="text" 
              placeholder="Search all notes..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-stone-100 border-none rounded-xl outline-none focus:ring-2 focus:ring-stone-300 transition-all text-sm font-medium"
            />
          </div>
          <button 
            onClick={handleCreateNote}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#4a3b32] text-white rounded-xl font-medium hover:bg-[#3a2e26] transition-colors shadow-sm whitespace-nowrap"
          >
            <IconPlus size={18} /> New Note
          </button>
        </div>

        {/* Notes Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {searchQuery && <h3 className="text-sm font-bold text-stone-500 mb-4">Search Results ({displayedNotes.length})</h3>}
          
          {displayedNotes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-400">
              <IconFileText size={48} className="mb-4 opacity-20" />
              <p>{searchQuery ? "No notes found matching your search." : "No notes in this folder. Create one!"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedNotes.map(note => (
                <div 
                  key={note.id} 
                  onClick={() => setActiveNote(note)}
                  className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col h-40"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-stone-800 truncate pr-4 text-lg">{note.title || 'Untitled'}</h3>
                    <div className="p-1 rounded-md hover:bg-stone-100 text-stone-400 group-hover:text-stone-600 transition-colors" onClick={e => { e.stopPropagation(); handleDeleteNote(note.id); }}>
                       <IconTrash2 size={16} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  
                  {searchQuery && (
                    <div className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded inline-block mb-2 w-fit">
                      In: {folders.find(f => f.id === note.folderId)?.name || 'Unknown'}
                    </div>
                  )}

                  <p className="text-sm text-stone-500 line-clamp-3 leading-relaxed flex-1">
                    {note.textContent || "No text content..."}
                  </p>
                  
                  <div className="mt-4 text-[11px] font-medium text-stone-400 uppercase tracking-wide">
                    {note.updatedAt?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
