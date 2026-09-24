import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AnnouncementHistory({ isOpen, onClose }) {
  const { idToken: token } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen && token) {
      fetchAnnouncements();
    }
  }, [isOpen, token]);

  // Click outside to close
  useEffect(() => {
    const handler = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        if (onClose) onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handler);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/announcements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch announcements history', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-[#1a1a1a] border border-asat-gold/30 rounded-xl shadow-2xl z-50 overflow-hidden" ref={modalRef}>
      <div className="bg-asat-gold px-4 py-3 flex justify-between items-center">
        <h3 className="font-cinzel text-black font-bold text-sm tracking-wide">
          <i className="fas fa-bell mr-2"></i> Notifications
        </h3>
        <button onClick={onClose} className="text-black hover:text-white transition">
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-asat-gray text-sm">Loading...</div>
        ) : announcements.length === 0 ? (
          <div className="p-4 text-center text-asat-gray text-sm">No announcements available.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {announcements.map(ann => (
              <div key={ann.id} className={`p-4 hover:bg-white/5 transition ${!ann.is_read ? 'bg-asat-gold/5' : ''}`}>
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`text-sm ${!ann.is_read ? 'text-white font-bold' : 'text-asat-light'}`}>
                    {ann.title}
                  </h4>
                  {!ann.is_read && (
                    <span className="w-2 h-2 rounded-full bg-asat-gold flex-shrink-0 mt-1.5 ml-2"></span>
                  )}
                </div>
                <p className="text-xs text-asat-gray line-clamp-2 mb-2">{ann.content}</p>
                
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[10px] text-asat-gray/60">
                    {new Date(ann.created_at).toLocaleDateString()}
                  </span>
                  
                  {ann.file_url && (
                    <a 
                      href={ann.file_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-[10px] text-asat-gold hover:underline"
                    >
                      <i className="fas fa-external-link-alt mr-1"></i> View {ann.type}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
