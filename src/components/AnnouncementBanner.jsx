import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function AnnouncementBanner() {
  const { idToken: token, profile } = useAuth();
  const [announcement, setAnnouncement] = useState(null);

  useEffect(() => {
    if (token) {
      fetchAnnouncements();
    }
  }, [token]);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/announcements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        // Find the first unread announcement
        const unread = data.data.find(ann => !ann.is_read);
        if (unread) {
          setAnnouncement(unread);
        }
      }
    } catch (err) {
      console.error('Failed to fetch announcements', err);
    }
  };

  const dismissAnnouncement = async () => {
    if (!announcement) return;
    setAnnouncement(null); // Optimistic close
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/announcements/${announcement.id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to dismiss announcement', err);
    }
  };

  if (!announcement) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-sm w-full bg-[#1a1a1a] border border-asat-gold rounded-xl shadow-2xl z-50 overflow-hidden transform transition-all duration-500 ease-out translate-y-0 opacity-100">
      <div className="bg-asat-gold px-4 py-2 flex justify-between items-center">
        <h3 className="font-cinzel text-black font-bold text-sm tracking-wide">
          <i className="fas fa-bullhorn mr-2"></i> Announcement
        </h3>
        <button 
          onClick={dismissAnnouncement}
          className="text-black hover:text-white transition"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <div className="p-4">
        <h4 className="text-white font-bold mb-2">{announcement.title}</h4>
        <p className="text-asat-gray text-sm mb-4 whitespace-pre-wrap">{announcement.content}</p>
        
        {announcement.file_url && (
          <a 
            href={announcement.file_url} 
            target="_blank" 
            rel="noreferrer"
            className="inline-block w-full text-center bg-white/10 hover:bg-white/20 text-white py-2 rounded text-sm transition"
          >
            {announcement.type === 'image' ? (
              <><i className="fas fa-image mr-2"></i> View Image</>
            ) : announcement.type === 'pdf' ? (
              <><i className="fas fa-file-pdf mr-2"></i> View PDF</>
            ) : (
              <><i className="fas fa-file-alt mr-2"></i> View Document</>
            )}
          </a>
        )}
      </div>
    </div>
  );
}
