import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import BackButton from '../../components/BackButton';
import { useToast, ToastContainer, TOAST_CSS } from '../../components/useToast';

function MasterAnnouncements() {
  const { toasts, showToast } = useToast();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAudience, setFilterAudience] = useState('all');

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form inputs
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState('user');
  const [attachments, setAttachments] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/announcements');
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
      showToast('Error loading announcements', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploadingFile(true);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const isImage = file.type.startsWith('image/');
        const newAtt = {
          id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          name: file.name,
          url: event.target.result,
          type: isImage ? 'image' : 'document',
          size: `${(file.size / 1024).toFixed(0)} KB`
        };
        setAttachments(prev => [...prev, newAtt]);
        setUploadingFile(false);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (attId) => {
    setAttachments(prev => prev.filter(a => a.id !== attId));
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showToast('Please enter both title and announcement text', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch('/api/announcements', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          target_audience: targetAudience,
          attachments: attachments
        })
      });

      if (res && res.success) {
        showToast('Announcement posted successfully!', 'success');
        setTitle('');
        setContent('');
        setTargetAudience('user');
        setAttachments([]);
        setShowModal(false);
        fetchAnnouncements();
      } else {
        showToast(res?.error || 'Failed to post announcement', 'error');
      }
    } catch (err) {
      console.error('Error creating announcement:', err);
      showToast('Failed to post announcement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    try {
      const res = await apiFetch(`/api/announcements/${id}`, {
        method: 'DELETE'
      });

      if (res && res.success) {
        showToast('Announcement deleted', 'info');
        setDeleteConfirmId(null);
        fetchAnnouncements();
      } else {
        showToast(res?.error || 'Failed to delete announcement', 'error');
      }
    } catch (err) {
      console.error('Error deleting announcement:', err);
      showToast('Failed to delete announcement', 'error');
    }
  };

  const filteredAnnouncements = announcements.filter(a => {
    if (filterAudience === 'all') return true;
    return a.target_audience === filterAudience || a.target_audience === 'all';
  });

  const getAudienceBadge = (aud) => {
    if (aud === 'user') return { label: 'Public Users', bg: '#e0f2fe', color: '#0369a1', icon: 'fa-user' };
    if (aud === 'designer') return { label: 'Designers Only', bg: '#fef3c7', color: '#b45309', icon: 'fa-paint-brush' };
    return { label: 'All Users & Designers', bg: '#f3e8ff', color: '#6b21a8', icon: 'fa-globe' };
  };

  return (
    <div style={{ padding: '30px 40px', maxWidth: 1280, margin: '0 auto', fontFamily: "'Inter', 'Montserrat', sans-serif" }}>
      <style>{TOAST_CSS}</style>
      <ToastContainer toasts={toasts} />
      
      <div style={{ marginBottom: 20 }}>
        <BackButton fallbackPath="/master" />
      </div>

      {/* Header Banner */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', padding: '24px 32px', borderRadius: 16,
        color: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', marginBottom: 30
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <i className="fas fa-bullhorn" style={{ fontSize: '1.6rem', color: '#f59e0b' }} />
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Announcements Center</h1>
          </div>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
            Broadcast platform updates, contests, and catalog notices to users and designers.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 24px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.9rem',
            cursor: 'pointer', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)', transition: 'transform 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <i className="fas fa-plus" /> Create Announcement
        </button>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 30 }}>
        <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Posted</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{announcements.length}</div>
        </div>
        <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ color: '#0284c7', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Public User Notices</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0369a1', marginTop: 4 }}>
            {announcements.filter(a => a.target_audience === 'user' || a.target_audience === 'all').length}
          </div>
        </div>
        <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ color: '#d97706', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Designer Broadcasts</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#b45309', marginTop: 4 }}>
            {announcements.filter(a => a.target_audience === 'designer' || a.target_audience === 'all').length}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, borderBottom: '2px solid #e2e8f0', paddingBottom: 12 }}>
        {[
          { key: 'all', label: 'All Announcements', icon: 'fa-layer-group' },
          { key: 'user', label: 'User Public', icon: 'fa-user' },
          { key: 'designer', label: 'Designer Portal', icon: 'fa-paint-brush' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterAudience(tab.key)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px',
              borderRadius: 20, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', border: 'none',
              background: filterAudience === tab.key ? '#0f172a' : '#f1f5f9',
              color: filterAudience === tab.key ? '#fff' : '#64748b',
              transition: 'all 0.2s ease'
            }}
          >
            <i className={`fas ${tab.icon}`} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Announcements List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: 12 }} />
          <div>Loading announcements...</div>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 16, border: '1px dashed #cbd5e1', color: '#64748b' }}>
          <i className="fas fa-bullhorn" style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: 14 }} />
          <h3 style={{ margin: '0 0 6px', color: '#334155' }}>No announcements found</h3>
          <p style={{ margin: 0, fontSize: '0.88rem' }}>Create a new announcement to notify users or designers.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {filteredAnnouncements.map(ann => {
            const badge = getAudienceBadge(ann.target_audience);
            return (
              <div
                key={ann.id}
                style={{
                  background: '#ffffff', borderRadius: 14, padding: 24, border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)', transition: 'box-shadow 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20,
                      background: badge.bg, color: badge.color, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase'
                    }}>
                      <i className={`fas ${badge.icon}`} /> {badge.label}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      <i className="far fa-clock" style={{ marginRight: 4 }} />
                      {new Date(ann.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>

                  <button
                    onClick={() => setDeleteConfirmId(ann.id)}
                    style={{
                      background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                      padding: '6px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700,
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }}
                  >
                    <i className="fas fa-trash-alt" /> Delete
                  </button>
                </div>

                <h3 style={{ margin: '0 0 10px', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{ann.title}</h3>
                <p style={{ margin: '0 0 16px', color: '#334155', fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {ann.content}
                </p>

                {/* Attachments */}
                {Array.isArray(ann.attachments) && ann.attachments.length > 0 && (
                  <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', marginTop: 12 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 10 }}>
                      <i className="fas fa-paperclip" style={{ marginRight: 6 }} /> Attachments ({ann.attachments.length})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                      {ann.attachments.map((att, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', padding: '8px 14px', borderRadius: 8, border: '1px solid #cbd5e1' }}>
                          {att.type === 'image' ? (
                            <img src={att.url} alt={att.name} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6 }} />
                          ) : (
                            <i className="fas fa-file-alt" style={{ fontSize: '1.4rem', color: '#0284c7' }} />
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {att.name}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{att.size || 'Attachment'}</span>
                          </div>
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={att.name}
                            style={{
                              marginLeft: 8, padding: '4px 10px', background: '#f1f5f9', color: '#0f172a',
                              borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none'
                            }}
                          >
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Announcement */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 640, padding: 30,
            boxShadow: '0 20px 50px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                <i className="fas fa-bullhorn" style={{ color: '#f59e0b', marginRight: 8 }} /> Post Announcement
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#94a3b8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement}>
              {/* Target Audience */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  Target Audience *
                </label>
                <select
                  value={targetAudience}
                  onChange={e => setTargetAudience(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1',
                    fontSize: '0.9rem', color: '#0f172a', outline: 'none'
                  }}
                >
                  <option value="user">Public Users (No login required)</option>
                  <option value="designer">Designers Portal (Requires login)</option>
                  <option value="all">All (Both Users & Designers)</option>
                </select>
              </div>

              {/* Title */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  Announcement Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Platform Maintenance Notice / New Contest"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1',
                    fontSize: '0.9rem', color: '#0f172a', outline: 'none', boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              {/* Content Text */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  Announcement Content *
                </label>
                <textarea
                  rows={5}
                  placeholder="Write full announcement description or guidelines here..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #cbd5e1',
                    fontSize: '0.9rem', color: '#0f172a', outline: 'none', resize: 'vertical', boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              {/* File / Doc Upload */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  Add Attachments (Images or Documents)
                </label>
                <div style={{
                  border: '2px dashed #cbd5e1', padding: 20, borderRadius: 10, textAlign: 'center',
                  background: '#f8fafc', cursor: 'pointer'
                }}>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    id="ann-file-upload"
                  />
                  <label htmlFor="ann-file-upload" style={{ cursor: 'pointer', display: 'block' }}>
                    <i className="fas fa-cloud-upload-alt" style={{ fontSize: '1.8rem', color: '#0284c7', marginBottom: 8 }} />
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Click to upload images or documents</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>Supports PNG, JPG, PDF, DOCX</div>
                  </label>
                </div>

                {/* Attached Files List */}
                {attachments.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
                    {attachments.map(att => (
                      <div key={att.id} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
                        background: '#e0f2fe', borderRadius: 20, border: '1px solid #7dd3fc', fontSize: '0.78rem', fontWeight: 700, color: '#0369a1'
                      }}>
                        <i className={att.type === 'image' ? 'fas fa-image' : 'fas fa-file-pdf'} />
                        <span style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name}</span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(att.id)}
                          style={{ background: 'none', border: 'none', color: '#0369a1', cursor: 'pointer', fontWeight: 800, padding: 0 }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '10px 24px', borderRadius: 8, border: 'none',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#fff', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                  }}
                >
                  {submitting ? 'Posting...' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 20
        }}>
          <div style={{ background: '#fff', padding: 28, borderRadius: 14, maxWidth: 400, width: '100%', textAlign: 'center' }}>
            <i className="fas fa-exclamation-triangle" style={{ fontSize: '2.5rem', color: '#dc2626', marginBottom: 12 }} />
            <h3 style={{ margin: '0 0 8px', color: '#0f172a' }}>Delete Announcement?</h3>
            <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '0.88rem' }}>
              Are you sure you want to permanently remove this announcement?
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteAnnouncement(deleteConfirmId)}
                style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MasterAnnouncements;
