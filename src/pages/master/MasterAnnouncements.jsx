import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast, ToastContainer, TOAST_CSS } from '../../components/useToast';
import { supabase } from '../../supabase';
import '../../styles/admin.css';
import BackButton from '../../components/BackButton';

export default function MasterAnnouncements() {
  const { idToken: token } = useAuth();
  const { toasts, showToast } = useToast();
  
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'text',
    target_audience: 'all',
    is_active: true,
    file_url: ''
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/announcements/master`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.data);
      } else {
        showToast(data.error || 'Failed to fetch announcements', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `announcements/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('asat-uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('asat-uploads').getPublicUrl(filePath);
      
      setFormData({ ...formData, file_url: data.publicUrl });
      showToast('File uploaded successfully', 'success');
    } catch (error) {
      showToast('Error uploading file', 'error');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId 
        ? `${import.meta.env.VITE_API_URL}/api/announcements/${editingId}`
        : `${import.meta.env.VITE_API_URL}/api/announcements`;
        
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        showToast(editingId ? 'Announcement updated' : 'Announcement created', 'success');
        setShowModal(false);
        fetchAnnouncements();
      } else {
        showToast(data.error || 'Failed to save announcement', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/announcements/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Deleted successfully', 'success');
        fetchAnnouncements();
      } else {
        showToast(data.error || 'Failed to delete', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    }
  };

  const openEdit = (ann) => {
    setEditingId(ann.id);
    setFormData({
      title: ann.title,
      content: ann.content,
      type: ann.type,
      target_audience: ann.target_audience,
      is_active: ann.is_active,
      file_url: ann.file_url || ''
    });
    setShowModal(true);
  };

  const openNew = () => {
    setEditingId(null);
    setFormData({
      title: '',
      content: '',
      type: 'text',
      target_audience: 'all',
      is_active: true,
      file_url: ''
    });
    setShowModal(true);
  };

  return (
    <main className="adm-page">
      <style>{TOAST_CSS}</style>
      <ToastContainer toasts={toasts} />
      <BackButton />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 className="adm-page__title">ANNOUNCEMENTS</h1>
          <p className="adm-page__subtitle">Manage global and targeted alerts</p>
        </div>
        <button
          className="adm-settings__btn"
          style={{ background: '#C5A059', color: '#121212', fontWeight: 600, padding: '12px 20px' }}
          onClick={openNew}
        >
          <i className="fas fa-plus" style={{ marginRight: 6 }}></i> New Announcement
        </button>
      </div>

      {loading ? (
        <div className="adm-loading"><div className="adm-spinner"></div><p>Loading announcements...</p></div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Audience</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {announcements.map(ann => (
                <tr key={ann.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{ann.title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#9ca3af', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ann.content}
                    </div>
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>
                    <span style={{ padding: '4px 8px', background: '#374151', borderRadius: '4px', fontSize: '0.75rem' }}>{ann.type}</span>
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{ann.target_audience}</td>
                  <td>
                    {ann.is_active ? (
                      <span className="adm-status adm-status--active">Active</span>
                    ) : (
                      <span className="adm-status adm-status--danger">Inactive</span>
                    )}
                  </td>
                  <td>{new Date(ann.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => openEdit(ann)} style={{ background: 'none', border: 'none', color: '#C5A059', cursor: 'pointer', fontSize: '1rem' }} title="Edit">
                        <i className="fas fa-edit"></i>
                      </button>
                      <button onClick={() => handleDelete(ann.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem' }} title="Delete">
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {announcements.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#9ca3af' }}>
                    No announcements found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: 32, width: '90%', maxWidth: 600, boxShadow: '0 8px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: '1rem', color: '#111114', margin: 0, fontWeight: 700 }}>
                {editingId ? 'Edit Announcement' : 'New Announcement'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#888' }}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontFamily: "'Montserrat', sans-serif", fontSize: '0.65rem', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: '#666', marginBottom: 5 }}>Title *</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 4, fontFamily: "'Montserrat', sans-serif", fontSize: '0.82rem', color: '#333', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: "'Montserrat', sans-serif", fontSize: '0.65rem', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: '#666', marginBottom: 5 }}>Content *</label>
                <textarea 
                  required
                  rows="4"
                  value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 4, fontFamily: "'Montserrat', sans-serif", fontSize: '0.82rem', color: '#333', boxSizing: 'border-box', outline: 'none', resize: 'vertical', minHeight: '100px' }}
                ></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontFamily: "'Montserrat', sans-serif", fontSize: '0.65rem', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: '#666', marginBottom: 5 }}>Type</label>
                  <select 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 4, fontFamily: "'Montserrat', sans-serif", fontSize: '0.82rem', color: '#333', boxSizing: 'border-box', outline: 'none', backgroundColor: '#fff' }}
                  >
                    <option value="text">Text Only</option>
                    <option value="image">Image</option>
                    <option value="pdf">PDF</option>
                    <option value="document">Document</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontFamily: "'Montserrat', sans-serif", fontSize: '0.65rem', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: '#666', marginBottom: 5 }}>Target Audience</label>
                  <select 
                    value={formData.target_audience}
                    onChange={e => setFormData({...formData, target_audience: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 4, fontFamily: "'Montserrat', sans-serif", fontSize: '0.82rem', color: '#333', boxSizing: 'border-box', outline: 'none', backgroundColor: '#fff' }}
                  >
                    <option value="all">All Users</option>
                    <option value="designers">Designers Only</option>
                    <option value="users">Customers Only</option>
                    <option value="specific">Specific Tagged Users</option>
                  </select>
                </div>
              </div>

              {formData.type !== 'text' && (
                <div>
                  <label style={{ display: 'block', fontFamily: "'Montserrat', sans-serif", fontSize: '0.65rem', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: '#666', marginBottom: 5 }}>Upload File (Optional)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <input 
                      type="file" 
                      onChange={handleFileUpload}
                      disabled={uploading}
                      style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.82rem', color: '#333' }}
                    />
                    {uploading && <span style={{ color: '#C5A059', fontSize: '0.82rem', fontWeight: 600 }}>Uploading...</span>}
                  </div>
                  {formData.file_url && (
                    <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#10b981', wordBreak: 'break-all', fontFamily: "'Montserrat', sans-serif" }}>
                      Current file: <a href={formData.file_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>View</a>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px', marginBottom: '10px' }}>
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={formData.is_active}
                  onChange={e => setFormData({...formData, is_active: e.target.checked})}
                  style={{ width: '16px', height: '16px', accentColor: '#C5A059', cursor: 'pointer', margin: 0 }}
                />
                <label htmlFor="isActive" style={{ marginLeft: '10px', fontFamily: "'Montserrat', sans-serif", fontSize: '0.85rem', cursor: 'pointer', color: '#333', fontWeight: 600 }}>Active (Visible to users)</label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '15px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  style={{ padding: '10px 20px', background: '#f5f5f7', color: '#555', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", fontSize: '0.75rem', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{ padding: '10px 24px', background: '#C5A059', color: '#000', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", fontSize: '0.75rem', fontWeight: 700 }}
                >
                  {editingId ? 'Update' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
