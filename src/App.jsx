import React, { useState, useEffect, createContext, useContext, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore, persistentLocalCache, collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';

const IconCalendar = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
);
const IconChevronLeft = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="15 18 9 12 15 6"></polyline></svg>
);
const IconChevronRight = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6"></polyline></svg>
);
const IconPlus = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
const IconCheckCircle = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);
const IconCircle = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle></svg>
);
const IconEdit2 = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
);
const IconTrash2 = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);
const IconPrinter = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
);
const IconLogOut = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
);
const IconPhone = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
);
const IconX = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
const IconBookOpen = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
);
const IconUser = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);
const IconSort = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="14" y2="15"></line><line x1="10" y1="3" x2="10" y2="21"></line><polyline points="7 6 10 3 13 6"></polyline><polyline points="7 18 10 21 13 18"></polyline></svg>
);
const IconRefresh = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 21v-5h5"></path></svg>
);
const IconLink = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
);

const IconMic = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
);

const firebaseConfig = {
  apiKey: "AIzaSyB-944yLcCXCT_ZPuvsSTRroNV-Gxdiw3c",
  authDomain: "km-shaji-diary.firebaseapp.com",
  projectId: "km-shaji-diary",
  storageBucket: "km-shaji-diary.firebasestorage.app",
  messagingSenderId: "205371244740",
  appId: "1:205371244740:web:9e86b088a0ad93f83cc991"
};

const firebaseApp = initializeApp(firebaseConfig);
let db;
try {
  db = initializeFirestore(firebaseApp, {
    localCache: persistentLocalCache()
  });
} catch (error) {
  db = getFirestore(firebaseApp);
}

const AuthContext = createContext(null);
const AppContext = createContext(null);

const ROLES = {
  PS_EDIT: 'ps_edit',
  PS_VIEW: 'ps_view'
};

const getPermissions = (role) => ({
  canAdd: role === ROLES.PS_EDIT,
  canEdit: role === ROLES.PS_EDIT,
  canDelete: role === ROLES.PS_EDIT,
  canComplete: role === ROLES.PS_EDIT,
  canViewPriority: role === ROLES.PS_EDIT,
});

const formatDate = (date) => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

const LoginCover = () => {
  const { login } = useContext(AuthContext);
  const [selectedRole, setSelectedRole] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash !== '#login' && selectedRole) {
        setSelectedRole(null);
        setError('');
        setPassword('');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [selectedRole]);

  const selectRole = (role) => {
    setSelectedRole(role);
    window.location.hash = 'login';
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    
    let isValid = false;
    if (selectedRole === ROLES.PS_EDIT && password === 'hisham@edit') {
      isValid = true;
    } else if (selectedRole === ROLES.PS_VIEW && password === 'view@diary') {
      isValid = true;
    }

    if (isValid) {
      login(selectedRole);
    } else {
      setError('Incorrect password');
    }
  };

  const roleLabels = {
    [ROLES.PS_EDIT]: 'Admin',
    [ROLES.PS_VIEW]: 'View Only'
  };

  return (
    <div className="fixed inset-0 bg-stone-50 flex flex-col items-center justify-center p-4 sm:p-6 print:hidden">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-stone-200 flex flex-col max-h-full">
        <div className="bg-[#4a3b32] pt-12 pb-8 px-6 text-center text-stone-50 relative overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="w-40 h-40 rounded-full mx-auto mb-3 overflow-hidden bg-transparent">
              <img src="/minister.png" alt="Minister" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">Minister's Day</h1>
            <p className="text-amber-100/90 mt-1 text-[13px] font-medium tracking-wide">KM Shaji - Hon. LSGD Minister, Keralam</p>
          </div>
        </div>
        
        <div className="p-6 sm:pb-8 flex-shrink-0 overflow-y-auto">
          {!selectedRole ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-6 text-center">Select Role</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => selectRole(ROLES.PS_EDIT)}
                  className="w-full py-4 px-2 text-center rounded-2xl bg-[#4a3b32] hover:bg-[#3a2e26] text-white transition-all font-bold text-sm tracking-wide shadow-lg shadow-[#4a3b32]/30 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Admin
                </button>
                <button
                  onClick={() => selectRole(ROLES.PS_VIEW)}
                  className="w-full py-4 px-2 text-center rounded-2xl bg-white hover:bg-stone-50 text-stone-700 border-2 border-stone-200 transition-all font-bold text-sm tracking-wide shadow-sm hover:shadow hover:-translate-y-0.5 active:translate-y-0"
                >
                  View Only
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center text-sm font-medium text-stone-500 mb-2">
                <button 
                  type="button" 
                  onClick={() => window.history.back()}
                  className="flex items-center hover:text-stone-800 transition-colors"
                >
                  <IconChevronLeft size={16} className="mr-1" /> Back
                </button>
                <span className="mx-auto bg-stone-100 px-3 py-1 rounded-full text-stone-700 text-xs">
                  {roleLabels[selectedRole]}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Secure Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-[#4a3b32] focus:ring-1 focus:ring-[#4a3b32] outline-none transition-all"
                  placeholder="Enter password"
                  autoFocus
                />
                {error && <p className="text-red-600 text-xs mt-2 font-medium">{error}</p>}
              </div>
              
              <button
                type="submit"
                disabled={!password}
                className="w-full py-3.5 bg-[#4a3b32] text-white rounded-xl font-medium hover:bg-[#3a2e26] transition-colors flex justify-center items-center"
              >
                Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

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

const ProgramForm = ({ initialData, onSubmit, onCancel, isSaving }) => {
  const [entryMode, setEntryMode] = useState(initialData?.type || 'schedule');
  
  let initialHour = '';
  let initialMin = '';
  let initialAmPm = 'AM';

  if (initialData?.time) {
    const [hStr, mStr] = initialData.time.split(':');
    let h = parseInt(hStr, 10);
    initialAmPm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    initialHour = h.toString();
    initialMin = mStr;
  }

  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(initialMin);
  const [ampm, setAmpm] = useState(initialAmPm);
  const [eventName, setEventName] = useState(initialData?.eventName || '');
  const [contactNumber, setContactNumber] = useState(initialData?.contactNumber || '');
  const [link, setLink] = useState(initialData?.link || '');
  const [priority, setPriority] = useState(initialData?.priority || 'medium');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!eventName.trim()) return;

    let timeString = null;
    if (entryMode === 'schedule' && hour && minute) {
      let h24 = parseInt(hour, 10);
      if (ampm === 'PM' && h24 < 12) h24 += 12;
      if (ampm === 'AM' && h24 === 12) h24 = 0;
      timeString = `${h24.toString().padStart(2, '0')}:${minute.padStart(2, '0')}`;
    }

    onSubmit({ 
      type: entryMode,
      time: timeString, 
      eventName: eventName.trim(), 
      contactNumber: contactNumber.trim(),
      link: entryMode === 'todo' ? link.trim() : null,
      priority 
    });
  };

  const hours = Array.from({length: 12}, (_, i) => (i + 1).toString());
  const minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Type Toggle */}
      <div className="flex bg-stone-100 p-1.5 rounded-xl">
        <button
          type="button"
          onClick={() => setEntryMode('schedule')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${entryMode === 'schedule' ? 'bg-white text-[#4a3b32] shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
        >
          Schedule Entry
        </button>
        <button
          type="button"
          onClick={() => setEntryMode('todo')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${entryMode === 'todo' ? 'bg-white text-[#4a3b32] shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
        >
          To-Do Entry
        </button>
      </div>

      {/* Priority Selection */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">Priority</label>
        <div className="flex gap-2">
          {['high', 'medium', 'low'].map(level => (
            <button
              key={level}
              type="button"
              onClick={() => setPriority(level)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all capitalize border ${
                priority === level 
                  ? level === 'high' ? 'bg-red-50 border-red-200 text-red-700 shadow-sm'
                  : level === 'medium' ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm'
                  : 'bg-green-50 border-green-200 text-green-700 shadow-sm'
                  : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Time Selection (Only for Schedule) */}
      {entryMode === 'schedule' && (
        <div className="animate-in fade-in duration-300">
          <label className="block text-sm font-medium text-stone-700 mb-2">Time <span className="text-stone-400 font-normal">(Optional)</span></label>
          <div className="flex gap-3">
            <div className="flex-1">
              <select
                value={hour}
                onChange={(e) => {
                  const val = e.target.value;
                  setHour(val);
                  if (val) {
                    if (!minute) setMinute('00');
                    if (!ampm) setAmpm('AM');
                  }
                }}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-[#4a3b32] focus:ring-1 focus:ring-[#4a3b32] outline-none bg-white appearance-none text-stone-700"
              >
                <option value="">Hr</option>
                {hours.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div className="text-stone-400 flex items-center font-bold">:</div>
            <div className="flex-1">
              <select
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-[#4a3b32] focus:ring-1 focus:ring-[#4a3b32] outline-none bg-white appearance-none text-stone-700"
              >
                <option value="">Min</option>
                {minutes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <select
                value={ampm}
                onChange={(e) => setAmpm(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-[#4a3b32] focus:ring-1 focus:ring-[#4a3b32] outline-none bg-white appearance-none text-stone-700 font-medium"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          {entryMode === 'schedule' ? 'Programme / Event Name' : 'Description'} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <textarea
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            required
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-[#4a3b32] focus:ring-1 focus:ring-[#4a3b32] outline-none transition-all resize-none"
            placeholder="Enter details..."
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Contact Number <span className="text-stone-400 font-normal">(Optional)</span></label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
            <IconPhone size={16} />
          </div>
          <input
            type="tel"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 focus:border-[#4a3b32] focus:ring-1 focus:ring-[#4a3b32] outline-none transition-all"
            placeholder="Mobile or office number"
          />
        </div>
      </div>

      {/* Link Selection (Only for To-Do) */}
      {entryMode === 'todo' && (
        <div className="animate-in fade-in duration-300">
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Link <span className="text-stone-400 font-normal">(Optional)</span></label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
              <IconLink size={16} />
            </div>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 focus:border-[#4a3b32] focus:ring-1 focus:ring-[#4a3b32] outline-none transition-all"
              placeholder="https://..."
            />
          </div>
        </div>
      )}

      <div className="pt-2 flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3.5 bg-stone-100 text-stone-700 rounded-xl font-medium hover:bg-stone-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving || !eventName.trim()}
          className="flex-1 py-3.5 bg-[#4a3b32] text-white rounded-xl font-medium hover:bg-[#3a2e26] transition-colors disabled:opacity-50 flex justify-center items-center"
        >
          {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save'}
        </button>
      </div>
    </form>
  );
};

const CalendarModal = ({ isOpen, onClose, selectedDate, onSelectDate }) => {
  const [viewDate, setViewDate] = useState(new Date(selectedDate));
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setViewDate(new Date(selectedDate));
      setShowPicker(false);
    }
  }, [isOpen, selectedDate]);

  if (!isOpen) return null;

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const monthName = viewDate.toLocaleString('default', { month: 'long' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const monthsList = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Date">
      <div className="flex items-center justify-between mb-6 bg-stone-50 p-2 rounded-xl border border-stone-200">
        <button onClick={prevMonth} className="p-2 text-stone-600 hover:bg-stone-200 rounded-lg transition-colors"><IconChevronLeft size={20}/></button>
        <button onClick={() => setShowPicker(!showPicker)} className="font-semibold text-stone-800 hover:bg-stone-200 px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1">
          {monthName} {year}
        </button>
        <button onClick={nextMonth} className="p-2 text-stone-600 hover:bg-stone-200 rounded-lg transition-colors"><IconChevronRight size={20}/></button>
      </div>

      {showPicker ? (
        <div className="animate-in fade-in zoom-in-95 duration-200 min-h-[250px] flex flex-col justify-center">
          <div className="mb-6 flex justify-center">
            <select 
              value={year} 
              onChange={(e) => setViewDate(new Date(parseInt(e.target.value), month, 1))}
              className="px-4 py-2.5 bg-stone-100 border border-stone-200 rounded-lg font-bold text-stone-800 outline-none text-lg text-center w-32 appearance-none"
            >
              {Array.from({length: 20}, (_, i) => new Date().getFullYear() - 10 + i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {monthsList.map((mName, idx) => (
              <button
                key={mName}
                onClick={() => {
                  setViewDate(new Date(year, idx, 1));
                  setShowPicker(false);
                }}
                className={`py-3 text-sm rounded-xl font-medium transition-colors ${
                  idx === month ? 'bg-[#4a3b32] text-white shadow-md' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {mName.slice(0,3)}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setShowPicker(false)}
            className="w-full py-2.5 text-stone-500 font-medium hover:bg-stone-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="animate-in fade-in duration-200">
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-xs font-semibold text-stone-400 uppercase tracking-wider py-1">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((d, i) => {
              if (!d) return <div key={i} className="h-10" />;
              
              const isSelected = d.toDateString() === selectedDate.toDateString();
              const isToday = d.toDateString() === new Date().toDateString();

              return (
                <button
                  key={i}
                  onClick={() => {
                    onSelectDate(d);
                    onClose();
                  }}
                  className={`h-10 w-full rounded-full flex items-center justify-center text-sm transition-colors ${
                    isSelected ? 'bg-[#4a3b32] text-white font-bold shadow-md' :
                    isToday ? 'bg-amber-100 text-amber-900 font-semibold' :
                    'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
          
          <div className="mt-6">
            <button 
              onClick={() => { onSelectDate(new Date()); onClose(); }}
              className="w-full py-3 bg-stone-100 text-stone-700 rounded-xl font-medium hover:bg-stone-200 transition-colors"
            >
              Go to Today
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

const PrintModal = ({ isOpen, onClose, onPrint, canViewPriority, viewMode, isExporting }) => {
  const [timeFilter, setTimeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  
  const handlePrint = () => {
    onPrint({ timeFilter, priorityFilter, viewMode });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Export ${viewMode === 'todo' ? 'To-Dos' : 'Schedule'}`}>
      <div className="space-y-6">
        
        {/* Time Scope - Only show if Schedule */}
        {viewMode === 'schedule' && (
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-3">Time Scope</label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'all', label: 'All Programmes' },
                { id: 'am', label: 'Before Noon Only' },
                { id: 'pm', label: 'After Noon Only' },
              ].map(opt => (
                <label key={opt.id} className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${timeFilter === opt.id ? 'border-[#4a3b32] bg-stone-100' : 'border-stone-200'}`}>
                  <input 
                    type="radio" 
                    name="timeFilter" 
                    checked={timeFilter === opt.id} 
                    onChange={() => setTimeFilter(opt.id)} 
                    className="w-4 h-4 text-[#4a3b32] focus:ring-[#4a3b32] border-stone-300"
                  />
                  <span className={`ml-3 text-sm font-medium ${timeFilter === opt.id ? 'text-[#4a3b32]' : 'text-stone-700'}`}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Priority Filter */}
        {canViewPriority && (
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-3">Priority Filter</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'all', label: 'All Priorities' },
                { id: 'high', label: 'High Only' },
                { id: 'medium', label: 'Medium Only' },
                { id: 'low', label: 'Low Only' },
              ].map(opt => (
                <label key={opt.id} className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${priorityFilter === opt.id ? 'border-[#4a3b32] bg-stone-50' : 'border-stone-200'}`}>
                  <input 
                    type="radio" 
                    name="priorityFilter" 
                    checked={priorityFilter === opt.id} 
                    onChange={() => setPriorityFilter(opt.id)} 
                    className="w-4 h-4 text-[#4a3b32] focus:ring-[#4a3b32] border-stone-300"
                  />
                  <span className={`ml-3 text-sm font-medium ${priorityFilter === opt.id ? 'text-[#4a3b32]' : 'text-stone-700'}`}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        
        <button
          onClick={handlePrint}
          disabled={isExporting}
          className="w-full py-3.5 bg-[#4a3b32] text-white rounded-xl font-medium hover:bg-[#3a2e26] transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
        >
          {isExporting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <IconPrinter size={18} />}
          {isExporting ? 'Generating PDF...' : 'Download PDF'}
        </button>
      </div>
    </Modal>
  );
};

const ProgramCard = ({ program }) => {
  const { permissions, deleteProgram, toggleCompletion, setEditProgram } = useContext(AppContext);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const timerRef = useRef(null);

  const handlePointerDown = () => {
    if (!showOptions) {
      timerRef.current = setTimeout(() => {
        setShowOptions(true);
        if (window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate(50);
        }
      }, 500);
    }
  };

  const handlePointerUp = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleToggle = async () => {
    if (!permissions.canComplete) return;
    setIsUpdating(true);
    await toggleCompletion(program.id, program.completed);
    setIsUpdating(false);
  };

  const handleDeleteClick = () => {
    if (window.confirm("Are you sure you want to delete this entry? This action cannot be undone.")) {
      deleteProgram(program.id);
    }
  };

  let displayTime = '—';
  let ampm = '';
  if (program.time && program.type !== 'todo') {
    const [h, m] = program.time.split(':');
    const hour = parseInt(h, 10);
    ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    displayTime = `${displayHour}:${m}`;
  }

  const priorityStyles = {
    high: 'bg-red-50 text-red-600 border-red-100',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    low: 'bg-green-50 text-green-700 border-green-200'
  };

  const priorityName = program.priority || 'medium';
  const showPriority = permissions.canViewPriority && !program.completed;
  const isTodo = program.type === 'todo';

  return (
    <div 
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ WebkitTouchCallout: 'none', userSelect: 'none' }}
      className={`group bg-white rounded-2xl p-4 sm:p-5 shadow-sm border transition-all duration-300 flex items-start gap-4 relative overflow-hidden ${
        program.completed 
          ? 'border-stone-100 bg-stone-50/50' 
          : 'border-stone-200 hover:shadow-md hover:border-stone-300'
      }`}
    >
      
      {/* Priority Indicator strip on the left */}
      {permissions.canViewPriority && (
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
          program.completed ? 'bg-stone-200' :
          priorityName === 'high' ? 'bg-red-400' :
          priorityName === 'medium' ? 'bg-amber-500' : 'bg-green-400'
        }`}></div>
      )}

      {/* Time / Type Column */}
      <div className="w-16 sm:w-20 flex-shrink-0 pl-1 text-center sm:text-left flex flex-col justify-center items-center sm:items-start pt-1">
        {isTodo ? (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${program.completed ? 'bg-stone-100 text-stone-300' : 'bg-amber-50 text-amber-700'}`}>
            <IconBookOpen size={16} />
          </div>
        ) : program.time ? (
          <>
            <span className={`text-base sm:text-lg font-bold tracking-tight ${program.completed ? 'text-stone-400' : 'text-stone-800'}`}>
              {displayTime}
            </span>
            <span className={`text-xs font-semibold ${program.completed ? 'text-stone-400' : 'text-amber-800'}`}>
              {ampm}
            </span>
          </>
        ) : (
          <span className="text-stone-300 text-xl font-light pl-2">—</span>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 pt-1">
        
        <p className={`text-base sm:text-[17px] font-medium leading-snug whitespace-pre-wrap break-words ${
          program.completed ? 'text-stone-500 line-through decoration-stone-300' : 'text-stone-900'
        }`}>
          {program.eventName}
        </p>
        
        {program.contactNumber && (
          <div className="mt-2 flex items-center text-sm">
            <IconPhone size={14} className={`mr-1.5 flex-shrink-0 ${program.completed ? 'text-stone-400' : 'text-[#4a3b32]'}`} />
            <a 
              href={`tel:${program.contactNumber}`} 
              className={`truncate font-medium transition-colors ${program.completed ? 'text-stone-400 cursor-default pointer-events-none' : 'text-[#4a3b32] hover:text-[#2d241f] hover:underline'}`}
              onClick={(e) => program.completed && e.preventDefault()}
            >
              {program.contactNumber}
            </a>
          </div>
        )}

        {isTodo && program.link && (
          <div className="mt-1 flex items-center text-sm">
            <IconLink size={14} className={`mr-1.5 flex-shrink-0 ${program.completed ? 'text-stone-400' : 'text-blue-600'}`} />
            <a 
              href={program.link.startsWith('http') ? program.link : `https://${program.link}`} 
              target="_blank"
              rel="noopener noreferrer"
              className={`truncate font-medium transition-colors ${program.completed ? 'text-stone-400 cursor-default pointer-events-none' : 'text-blue-600 hover:text-blue-800 hover:underline'}`}
              onClick={(e) => program.completed && e.preventDefault()}
            >
              {program.link}
            </a>
          </div>
        )}
      </div>

      {/* Actions & Priority */}
      <div className="flex flex-col items-center justify-start gap-1 flex-shrink-0 relative pt-0.5">
        {showPriority && (
          <span className={`text-[8px] font-bold px-1.5 py-[2px] rounded-md border uppercase tracking-wider leading-none ${priorityStyles[priorityName]}`}>
            {priorityName}
          </span>
        )}
        
        <div className="relative flex items-center justify-center mt-1">
          {showOptions && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={(e) => { e.stopPropagation(); setShowOptions(false); }}
                onPointerDown={(e) => { e.stopPropagation(); setShowOptions(false); }}
              />
              <div className="absolute right-12 top-1/2 -translate-y-1/2 z-50 bg-white rounded-full shadow-lg border border-stone-200 p-1 flex items-center gap-1 animate-in fade-in zoom-in-95 duration-200">
                {permissions.canEdit && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditProgram(program); setShowOptions(false); }}
                    className="p-2 text-stone-500 hover:text-amber-700 hover:bg-amber-50 rounded-full transition-colors"
                    aria-label="Edit"
                  >
                    <IconEdit2 size={18} />
                  </button>
                )}
                
                {permissions.canDelete && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(); setShowOptions(false); }}
                    className="p-2 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    aria-label="Delete"
                  >
                    <IconTrash2 size={18} />
                  </button>
                )}
              </div>
            </>
          )}
          
          {permissions.canComplete && (
            <button 
              onClick={handleToggle}
              disabled={isUpdating}
              className={`p-1.5 rounded-full transition-all focus:outline-none ${
                program.completed 
                  ? 'text-green-600 hover:bg-green-50' 
                  : 'text-stone-300 hover:text-stone-500 hover:bg-stone-100'
              }`}
            >
              {isUpdating ? (
                <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
              ) : program.completed ? (
                <IconCheckCircle size={22} className="sm:w-6 sm:h-6" />
              ) : (
                <IconCircle size={22} className="sm:w-6 sm:h-6" />
              )}
            </button>
          )}
          
          {!permissions.canComplete && program.completed && (
            <div className="p-1.5">
              <IconCheckCircle size={20} className="text-green-600" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MainApp = () => {
  const { user, logout } = useContext(AuthContext);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [programsCache, setProgramsCache] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [viewMode, setViewMode] = useState('schedule'); // 'schedule' | 'todo'
  const [sortBy, setSortBy] = useState('time');
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editProgram, setEditProgram] = useState(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [voicePrefill, setVoicePrefill] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const recognitionRef = useRef(null);
  
  const [printConfig, setPrintConfig] = useState({ timeFilter: 'all', priorityFilter: 'all', viewMode: 'schedule' });

  const permissions = useMemo(() => getPermissions(user.role), [user.role]);
  const dateStr = currentDate.toISOString().split('T')[0];

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash !== '#add' && isAddOpen) setIsAddOpen(false);
      if (hash !== '#edit' && editProgram) setEditProgram(null);
      if (hash !== '#calendar' && isCalendarOpen) setIsCalendarOpen(false);
      if (hash !== '#export' && isPrintOpen) setIsPrintOpen(false);
      if (hash !== '#logout' && isLogoutConfirmOpen) setIsLogoutConfirmOpen(false);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isAddOpen, editProgram, isCalendarOpen, isPrintOpen, isLogoutConfirmOpen]);

  const openModal = (hash, setter, value = true) => {
    setter(value);
    window.location.hash = hash;
  };

  const closeModal = (hash, setter) => {
    if (window.location.hash === hash) window.history.back();
    else setter(false);
  };
  const programs = programsCache[dateStr] || [];

  const fetchPrograms = async (dateKey, forceRefresh = false) => {
    if (!forceRefresh && programsCache[dateKey]) {
      setIsLoading(false);
      return; 
    }
    
    if (forceRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    
    try {
      const q = query(collection(db, 'programs'), where('date', '==', dateKey));
      const snapshot = await getDocs(q);
      const data = [];
      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setProgramsCache(prev => ({ ...prev, [dateKey]: data }));
    } catch (err) {
      console.error("Firestore error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPrograms(dateStr);
  }, [dateStr]);

  const displayPrograms = useMemo(() => {
    // First filter by active view mode
    let filtered = programs.filter(p => {
      if (viewMode === 'schedule') return !p.type || p.type === 'schedule';
      return p.type === 'todo';
    });

    let sorted = [...filtered];

    if (sortBy === 'time' && viewMode === 'schedule') {
      sorted.sort((a, b) => {
        if (!a.time && !b.time) return a.createdAt - b.createdAt;
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      });
    } else if (sortBy === 'priority' && permissions.canViewPriority) {
      const weight = { high: 3, medium: 2, low: 1 };
      sorted.sort((a, b) => {
        const wA = weight[a.priority || 'medium'];
        const wB = weight[b.priority || 'medium'];
        if (wB !== wA) return wB - wA;
        
        if (!a.time && !b.time) return a.createdAt - b.createdAt;
        if (!a.time) return 1;
        if (!b.time) return -1;
        return (a.time || '').localeCompare(b.time || '');
      });
    } else if (viewMode === 'todo') {
      // Default sorting for To-Dos (Priority then Creation Date)
      const weight = { high: 3, medium: 2, low: 1 };
      sorted.sort((a, b) => {
        if (permissions.canViewPriority) {
          const wA = weight[a.priority || 'medium'];
          const wB = weight[b.priority || 'medium'];
          if (wB !== wA) return wB - wA;
        }
        return (a.createdAt || 0) - (b.createdAt || 0);
      });
    }
    
    return sorted;
  }, [programs, sortBy, permissions.canViewPriority, viewMode]);

  const printPrograms = useMemo(() => {
    let filtered = programs.filter(p => {
      if (printConfig.viewMode === 'schedule') return !p.type || p.type === 'schedule';
      return p.type === 'todo';
    });

    if (printConfig.viewMode === 'schedule' && printConfig.timeFilter !== 'all') {
      filtered = filtered.filter(p => {
        if (!p.time) return false; 
        const hour = parseInt(p.time.split(':')[0], 10);
        if (printConfig.timeFilter === 'am') return hour < 12;
        if (printConfig.timeFilter === 'pm') return hour >= 12;
        return true;
      });
    }

    if (printConfig.priorityFilter !== 'all' && permissions.canViewPriority) {
      filtered = filtered.filter(p => (p.priority || 'medium') === printConfig.priorityFilter);
    }
    
    // Sort logic similar to display
    const weight = { high: 3, medium: 2, low: 1 };
    filtered.sort((a, b) => {
      const wA = weight[a.priority || 'medium'];
      const wB = weight[b.priority || 'medium'];
      if (wB !== wA) return wB - wA;
      if (!a.time && !b.time) return a.createdAt - b.createdAt;
      if (!a.time) return 1;
      if (!b.time) return -1;
      return (a.time || '').localeCompare(b.time || '');
    });

    return filtered;
  }, [programs, printConfig, permissions.canViewPriority]);

  const navDate = (days) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const handleAdd = async (data) => {
    setIsSaving(true);
    try {
      const newDoc = { 
        ...data, 
        date: dateStr,
        completed: false,
        createdAt: Date.now()
      };
      const docRef = await addDoc(collection(db, 'programs'), newDoc);
      setProgramsCache(prev => ({
        ...prev,
        [dateStr]: [...(prev[dateStr] || []), { id: docRef.id, ...newDoc }]
      }));
      closeModal('#add', setIsAddOpen);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async (data) => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'programs', editProgram.id), data);
      setProgramsCache(prev => ({
        ...prev,
        [dateStr]: prev[dateStr].map(p => p.id === editProgram.id ? { ...p, ...data } : p)
      }));
      closeModal('#edit', setEditProgram);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProgram = async (id) => {
    try {
      await deleteDoc(doc(db, 'programs', id));
      setProgramsCache(prev => ({
        ...prev,
        [dateStr]: prev[dateStr].filter(p => p.id !== id)
      }));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleCompletion = async (id, status) => {
    try {
      await updateDoc(doc(db, 'programs', id), { completed: !status });
      setProgramsCache(prev => ({
        ...prev,
        [dateStr]: prev[dateStr].map(p => p.id === id ? { ...p, completed: !status } : p)
      }));
    } catch (e) {
      console.error(e);
    }
  };

  const handlePdfExport = async (config) => {
    setPrintConfig(config);
    setIsExporting(true);
    
    setTimeout(async () => {
      try {
        const element = document.getElementById('pdf-export-content');
        if (!element) return;

        
        const html2pdf = (await import('html2pdf.js')).default;
        
        const opt = {
          margin:       15,
          filename:     `KM_Shaji_${config.viewMode === 'todo' ? 'ToDo' : 'Schedule'}_${dateStr}.pdf`,
          image:        { type: 'jpeg', quality: 1 },
          html2canvas:  { scale: 2, useCORS: true, logging: false },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        await html2pdf().from(element).set(opt).save();
      } catch (err) {
        console.error("PDF Export failed:", err);
      } finally {
        setIsExporting(false);
      }
    }, 400); // Give React time to render the hidden table with new config
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    if (isProcessingVoice) return;
    
    if (!recognitionRef.current) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Your browser does not support voice input. Please use Google Chrome or Safari.");
        return;
      }
      
      const recognition = new SpeechRecognition();
      recognition.lang = 'ml-IN'; 
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      
      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (!transcript || transcript.trim() === '') return;
        processVoiceWithGemini(transcript);
      };
      
      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
      };
      
      recognitionRef.current = recognition;
    }

    try {
      recognitionRef.current.start();
    } catch (err) {
      // already started
    }
  };

  const handlePointerUp = (e) => {
    e.preventDefault();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {}
    }
  };

  const processVoiceWithGemini = async (transcript) => {
    setIsProcessingVoice(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        alert("Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your environment variables.");
        return;
      }
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an AI assistant parsing voice commands into JSON for a schedule app.
Return RAW JSON ONLY, no markdown formatting (\`\`\`json) or comments.
Fields to output:
- type: 'schedule' or 'todo'. If user says 'starting to do' or 'todo' or it sounds like a task, set 'todo'. Otherwise 'schedule'.
- eventName: The name of the program, place, or person (e.g. "കല്യാണം- അഹമ്മദ്ക്ക, കോഴിക്കോട്").
- contactNumber: The phone number if mentioned, else "".
- time: The time in 24-hour format "HH:MM" if mentioned (e.g., 11:00 AM -> 11:00, 2:00 PM -> 14:00), else "".

User said: "${transcript}"`
            }]
          }]
        })
      });
      
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API failed: ${response.status} ${errText}`);
      }
      
      const data = await response.json();
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error("No response from AI.");
      }
      let jsonStr = data.candidates[0].content.parts[0].text;
      jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsedData = JSON.parse(jsonStr);
      setVoicePrefill(parsedData);
      openModal('#add', setIsAddOpen);
    } catch (error) {
      console.error(error);
      alert("Voice Error: " + error.message + "\nPlease try speaking clearly or type instead.");
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const contextValue = {
    programs, permissions, deleteProgram, toggleCompletion, setEditProgram
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="min-h-screen bg-stone-100 text-stone-900 font-sans flex flex-col pb-20 sm:pb-0">
        
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-200 print:hidden shadow-sm">
          <div className="max-w-4xl mx-auto px-4 h-[72px] flex items-center justify-between gap-2">
            
            {/* Identity (Left) */}
            <div className="flex items-center gap-3 hidden md:flex">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-inner overflow-hidden border-2 border-[#4a3b32]/20">
                <img src="/minister.png" alt="Minister" className="w-full h-full object-cover" />
              </div>
              <div className="leading-tight">
                <h1 className="font-semibold text-sm text-stone-900 tracking-tight">Minister's Day</h1>
                <p className="text-[10px] text-stone-500 font-medium">Schedule App</p>
              </div>
            </div>

            {/* Navigation & Toggle (Center) */}
            <div className="flex-1 flex flex-col sm:flex-row justify-center items-center gap-1 sm:gap-6">
               <div className="flex items-center gap-4">
                 <button 
                  onClick={() => navDate(-1)}
                  className="p-1.5 text-stone-400 hover:text-stone-900 transition-colors"
                >
                  <IconChevronLeft size={20} />
                </button>
                <button 
                  onClick={() => openModal('#calendar', setIsCalendarOpen)}
                  className="flex flex-col items-center group px-2"
                >
                   <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest group-hover:text-[#4a3b32] transition-colors">
                    {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
                  </span>
                  <span className="text-sm sm:text-base font-bold tracking-tight text-stone-800 group-hover:text-[#4a3b32] transition-colors">
                    {currentDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </button>
                <button 
                  onClick={() => navDate(1)}
                  className="p-1.5 text-stone-400 hover:text-stone-900 transition-colors"
                >
                  <IconChevronRight size={20} />
                </button>
               </div>
               
               {/* View Toggle */}
               <div className="hidden sm:flex items-center bg-stone-100 p-1 rounded-full border border-stone-200">
                  <button 
                    onClick={() => setViewMode('schedule')} 
                    className={`px-3 py-1 text-[10px] sm:text-xs font-bold rounded-full transition-all ${viewMode === 'schedule' ? 'bg-white shadow-sm text-[#4a3b32]' : 'text-stone-500 hover:text-stone-700'}`}
                  >
                    Schedule
                  </button>
                  <button 
                    onClick={() => setViewMode('todo')} 
                    className={`px-3 py-1 text-[10px] sm:text-xs font-bold rounded-full transition-all ${viewMode === 'todo' ? 'bg-white shadow-sm text-[#4a3b32]' : 'text-stone-500 hover:text-stone-700'}`}
                  >
                    To Do
                  </button>
               </div>
            </div>
            
            {/* Actions (Right) */}
            <div className="flex items-center gap-1 sm:gap-2 justify-end">
              <button 
                onClick={() => fetchPrograms(dateStr, true)}
                className={`p-2 text-[#7a6b63] hover:text-[#3a2e26] hover:bg-[#eae6e1] rounded-lg transition-all ${isRefreshing ? 'animate-spin text-[#4a3b32]' : ''}`}
                title="Refresh Data"
              >
                <IconRefresh size={18} />
              </button>
              <button 
                onClick={() => openModal('#export', setIsPrintOpen)}
                className="p-2 flex items-center gap-2 text-[#7a6b63] hover:text-[#3a2e26] hover:bg-[#eae6e1] rounded-lg transition-colors text-sm font-medium"
                title="Print Schedule"
              >
                <IconPrinter size={18} />
                <span className="hidden sm:inline">Export</span>
              </button>
              <div className="w-px h-5 bg-[#d6cfc7] mx-1 hidden sm:block"></div>
              <button 
                onClick={() => openModal('#logout', setIsLogoutConfirmOpen)}
                className="p-2 text-[#7a6b63] hover:text-[#3a2e26] hover:bg-[#eae6e1] rounded-lg transition-colors"
                title="Logout"
              >
                <IconLogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-3xl w-full mx-auto px-4 pt-6 sm:pt-8 print:hidden">
          
          {/* Controls Bar */}
          <div className="flex justify-end mb-4 h-10">
            {permissions.canViewPriority && displayPrograms.length > 0 && viewMode === 'schedule' && (
              <button
                onClick={() => setSortBy(prev => prev === 'time' ? 'priority' : 'time')}
                className="flex items-center h-6 px-3 bg-white border border-stone-200 rounded-full shadow-sm hover:bg-stone-50 transition-colors text-[10px] font-medium text-stone-500"
              >
                Sort: {sortBy === 'time' ? 'By Time' : 'By Priority'}
              </button>
            )}
          </div>

          {/* Diary / To-Do List */}
          <div className="space-y-3 sm:space-y-4 mb-24 relative min-h-[300px]">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-stone-200 border-t-[#4a3b32] rounded-full animate-spin"></div>
              </div>
            ) : displayPrograms.length > 0 ? (
              displayPrograms.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center pt-16 pb-8 text-center animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-stone-200/50 rounded-full flex items-center justify-center mb-4 text-stone-400">
                  <IconCalendar size={32} />
                </div>
                <h3 className="text-lg font-semibold text-stone-800 mb-1">
                  No {viewMode === 'todo' ? 'To-Dos' : 'programmes'} found
                </h3>
                <p className="text-stone-500 text-sm mb-6">There are no entries for this date.</p>
              </div>
            )}
          </div>
        </main>

        {/* Floating Action Buttons */}
        {permissions.canAdd && (
          <div className="fixed bottom-20 sm:bottom-8 right-4 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 z-40 print:hidden flex flex-col sm:flex-row gap-3">
            <div className="relative flex items-center justify-center">
              {isListening && (
                <>
                  <div className="absolute w-14 h-14 bg-red-500 rounded-full animate-ripple opacity-60"></div>
                  <div className="absolute w-14 h-14 bg-red-500 rounded-full animate-ripple opacity-60" style={{ animationDelay: '0.6s' }}></div>
                  <div className="absolute w-14 h-14 bg-red-500 rounded-full animate-ripple opacity-60" style={{ animationDelay: '1.2s' }}></div>
                </>
              )}
              <button 
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                disabled={isProcessingVoice}
                style={{ WebkitTouchCallout: 'none', userSelect: 'none' }}
                className={`relative z-10 flex items-center justify-center gap-2 text-white shadow-lg shadow-red-600/30 transition-all w-14 h-14 sm:w-auto sm:h-12 sm:px-6 rounded-full select-none ${isListening ? 'bg-red-600 scale-110' : isProcessingVoice ? 'bg-amber-400' : 'bg-red-600 hover:bg-red-700 hover:-translate-y-1'}`}
              >
                {isProcessingVoice ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <IconMic size={24} className="sm:w-5 sm:h-5" />
                )}
                <span className="hidden sm:inline font-medium">{isListening ? 'Listening...' : isProcessingVoice ? 'Thinking...' : 'Hold to Speak'}</span>
              </button>
            </div>
            <button 
              onClick={() => { setVoicePrefill(null); openModal('#add', setIsAddOpen); }}
              className="flex items-center justify-center gap-2 bg-[#4a3b32] text-white shadow-lg shadow-[#4a3b32]/30 hover:shadow-xl hover:-translate-y-1 hover:bg-[#3a2e26] transition-all w-14 h-14 sm:w-auto sm:h-12 sm:px-6 rounded-full"
            >
              <IconPlus size={24} className="sm:w-5 sm:h-5" />
              <span className="hidden sm:inline font-medium">Add</span>
            </button>
          </div>
        )}

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 w-full bg-white border-t border-stone-200 pb-safe sm:hidden z-30 print:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <div className="flex justify-around items-center h-16">
            <button onClick={() => { window.scrollTo(0, 0); setViewMode('schedule'); }} className={`flex flex-col items-center justify-center w-full h-full ${viewMode === 'schedule' ? 'text-[#4a3b32]' : 'text-[#8a7f78] hover:text-[#3a2e26]'}`}>
              <IconBookOpen size={20} className="mb-1" />
              <span className="text-[10px] font-semibold">Schedule</span>
            </button>
            <button onClick={() => { window.scrollTo(0, 0); setViewMode('todo'); }} className={`flex flex-col items-center justify-center w-full h-full ${viewMode === 'todo' ? 'text-[#4a3b32]' : 'text-[#8a7f78] hover:text-[#3a2e26]'}`}>
              <IconCheckCircle size={20} className="mb-1" />
              <span className="text-[10px] font-semibold">To-Do</span>
            </button>
            <button onClick={() => openModal('#calendar', setIsCalendarOpen)} className="flex flex-col items-center justify-center w-full h-full text-[#8a7f78] hover:text-[#3a2e26]">
              <IconCalendar size={20} className="mb-1" />
              <span className="text-[10px] font-medium">Calendar</span>
            </button>
            <button onClick={() => openModal('#logout', setIsLogoutConfirmOpen)} className="flex flex-col items-center justify-center w-full h-full text-[#8a7f78] hover:text-[#3a2e26]">
              <IconUser size={20} className="mb-1" />
              <span className="text-[10px] font-medium">Exit</span>
            </button>
          </div>
        </nav>

        {/* Modals */}
        <Modal isOpen={isAddOpen} onClose={() => closeModal('#add', setIsAddOpen)} title="New Entry">
          <ProgramForm onSubmit={handleAdd} onCancel={() => closeModal('#add', setIsAddOpen)} isSaving={isSaving} initialData={voicePrefill} />
        </Modal>

        <Modal isOpen={!!editProgram} onClose={() => closeModal('#edit', setEditProgram)} title="Edit Entry">
          {editProgram && (
            <ProgramForm 
              initialData={editProgram} 
              onSubmit={handleEdit} 
              onCancel={() => closeModal('#edit', setEditProgram)} 
              isSaving={isSaving} 
            />
          )}
        </Modal>

        <PrintModal 
          isOpen={isPrintOpen} 
          onClose={() => closeModal('#export', setIsPrintOpen)}
          onPrint={handlePdfExport}
          canViewPriority={permissions.canViewPriority}
          viewMode={viewMode}
          isExporting={isExporting}
        />

        <CalendarModal 
          isOpen={isCalendarOpen} 
          onClose={() => closeModal('#calendar', setIsCalendarOpen)} 
          selectedDate={currentDate} 
          onSelectDate={setCurrentDate} 
        />

        <Modal isOpen={isLogoutConfirmOpen} onClose={() => closeModal('#logout', setIsLogoutConfirmOpen)} title="Confirm Logout">
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-[#eae6e1] rounded-full flex items-center justify-center mx-auto mb-4 text-[#4a3b32]">
              <IconLogOut size={28} />
            </div>
            <h3 className="text-lg font-semibold text-[#3a2e26] mb-2">Are you sure you want to exit?</h3>
            <p className="text-[#7a6b63] text-sm mb-8">You will need to sign in again to access the schedule.</p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => closeModal('#logout', setIsLogoutConfirmOpen)}
                className="flex-1 py-3 bg-[#eae6e1] text-[#4a3b32] rounded-xl font-medium hover:bg-[#dcd7d1] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={logout}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </Modal>

        {/* PDF EXPORT CONTENT - HIDDEN BEHIND APP */}
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-50] overflow-hidden">
          <div className="w-[640px] mx-auto bg-white text-black p-8 font-sans" id="pdf-export-content">
            {/* Header */}
            <div className="mb-6 flex flex-col items-center border-b border-stone-200 pb-6">
              <h1 className="text-3xl font-bold tracking-tight text-[#4a3b32] mb-1.5">KM Shaji</h1>
              <h2 className="text-base font-normal text-stone-600 mb-4">Hon. LSG Department Minister</h2>
              
              <h3 className="text-lg font-bold text-stone-900">
                {printConfig.viewMode === 'todo' ? 'To-Do List' : 'Programme Schedule'} • {formatDate(currentDate)}
              </h3>
              
              {(printConfig.timeFilter !== 'all' || printConfig.priorityFilter !== 'all') && (
                <p className="text-[11px] text-stone-400 mt-2 font-medium uppercase tracking-wider">
                  Filtered: 
                  {printConfig.timeFilter !== 'all' && printConfig.viewMode === 'schedule' && ` ${printConfig.timeFilter === 'am' ? 'Morning Only' : 'Afternoon Only'}`}
                  {printConfig.timeFilter !== 'all' && printConfig.priorityFilter !== 'all' && printConfig.viewMode === 'schedule' && ' | '}
                  {printConfig.priorityFilter !== 'all' && ` ${printConfig.priorityFilter.charAt(0).toUpperCase() + printConfig.priorityFilter.slice(1)} Priority Only`}
                </p>
              )}
            </div>

            {/* Table Container */}
            <div className="mb-8">
              <table className="w-full text-center border-collapse bg-white border border-stone-400">
                <thead className="bg-[#4a3b32] text-white">
                  <tr>
                    {printConfig.viewMode === 'schedule' && (
                      <th className="pt-1.5 pb-3 px-3 font-bold text-[12px] tracking-wide border border-stone-400 w-24 align-middle">Time</th>
                    )}
                    <th className="pt-1.5 pb-3 px-3 font-bold text-[12px] tracking-wide border border-stone-400 align-middle">
                      {printConfig.viewMode === 'schedule' ? 'Programme' : 'Description'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {printPrograms.length === 0 ? (
                    <tr>
                      <td colSpan={printConfig.viewMode === 'schedule' ? "2" : "1"} className="p-8 text-center text-stone-500 font-medium border border-stone-400">
                        No entries scheduled for this day.
                      </td>
                    </tr>
                  ) : (
                    printPrograms.map(p => {
                      let displayTime = "—";
                      if (p.time && p.type !== 'todo') {
                        const [h, m] = p.time.split(':');
                        const hour = parseInt(h, 10);
                        const ampm = hour >= 12 ? 'PM' : 'AM';
                        const displayHour = hour % 12 || 12;
                        displayTime = `${displayHour}:${m} ${ampm}`;
                      }

                      return (
                        <tr key={p.id} className="page-break-inside-avoid">
                          {printConfig.viewMode === 'schedule' && (
                            <td className="pt-2 pb-4 px-4 font-bold text-lg text-black border border-stone-400 align-middle text-left whitespace-nowrap">{displayTime}</td>
                          )}
                          <td className="pt-2 pb-4 px-4 align-middle text-left text-lg border border-stone-400 text-black">
                            {p.completed && (
                              <div className="mb-1.5">
                                <span className="text-[9px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded uppercase font-bold tracking-wider">Completed</span>
                              </div>
                            )}
                            <div className={p.completed ? "line-through text-stone-400 whitespace-pre-wrap" : "font-normal leading-relaxed whitespace-pre-wrap"}>
                              {p.eventName}
                              {p.contactNumber && `\nMob: ${p.contactNumber}`}
                            </div>
                            {p.type === 'todo' && p.link && <div className="font-normal break-all mt-1">{p.link}</div>}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Footer */}
            <div className="pt-4 border-t border-stone-200 flex justify-between items-center text-[10px] text-stone-400 uppercase tracking-widest">
              <span>Official Schedule Document</span>
              <span>Generated on {new Date().toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

      </div>
    </AppContext.Provider>
  );
};

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = sessionStorage.getItem('appUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const login = (role) => {
    const newUser = { id: 'local-user', role };
    setUser(newUser);
    sessionStorage.setItem('appUser', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('appUser');
  };

  return (
    <>
      <style>{`
        /* Essential base styles */
        body { margin: 0; font-family: system-ui, -apple-system, sans-serif; -webkit-tap-highlight-color: transparent; }
        
        /* Safe area padding for mobile notches */
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
        
        /* PRINT SPECIFIC CSS */
        @media print {
          @page { size: A4 portrait; margin: 20mm; }
          body { background: white !important; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          
          /* Hide everything except print container */
          body > #root > div > :not(.print\\:block) { display: none !important; }
          
          /* Table styling */
          .print-table th { -webkit-print-color-adjust: exact; background-color: #f5f5f4 !important; }
          .page-break-inside-avoid { page-break-inside: avoid; }
        }
      `}</style>
      <AuthContext.Provider value={{ user, login, logout }}>
        {user ? <MainApp /> : <LoginCover />}
      </AuthContext.Provider>
    </>
  );
}