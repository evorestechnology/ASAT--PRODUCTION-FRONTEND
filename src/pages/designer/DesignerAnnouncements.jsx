import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import BackButton from '../../components/BackButton';
import { useToast, ToastContainer, TOAST_CSS } from '../../components/useToast';

function DesignerAnnouncements() {
  const { toasts, showToast } = useToast();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      try {
        const data = await apiFetch('/api/announcements?audience=designer');
        setAnnouncements(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching designer announcements:', err);
        showToast('Failed to load announcements', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '30px 20px', fontFamily: "'Montserrat', sans-serif" }}>
      <style>{TOAST_CSS}</style>
      <ToastContainer toasts={toasts} />

      <div style={{ marginBottom: 20 }}>
        <BackButton fallbackPath="/designer" />
      </div>

      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2500 100%)', padding: '28px 32px', borderRadius: 16,
        color: '#ffffff', border: '1px solid rgba(212,175,55,0.3)', boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        marginBottom: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <i className="fas fa-bullhorn" style={{ fontSize: '1.8rem', color: 'var(--gold, #E8C97A)' }} />
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, fontFamily: "'Cinzel', serif" }}>
              Designer Announcements
            </h1>
          </div>
          <p style={{ margin: 0, color: '#cccccc', fontSize: '0.88rem' }}>
            Stay up to date with platform updates, contest rules, payout schedules, and artwork submission policies.
          </p>
        </div>
      </div>

      {/* Content Stream */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="dsn-spinner" style={{ margin: '0 auto 15px' }} />
          <p style={{ color: '#888', fontSize: '0.85rem' }}>Loading designer announcements...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '70px 20px', background: '#ffffff', borderRadius: 14, border: '1px solid #eee', color: '#999' }}>
          <i className="fas fa-bullhorn" style={{ fontSize: '3rem', color: '#ddd', marginBottom: 14 }} />
          <h3 style={{ margin: '0 0 6px', fontFamily: "'Cinzel', serif", color: '#444' }}>No Announcements Available</h3>
          <p style={{ margin: 0, fontSize: '0.82rem' }}>You're all caught up! New announcements will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {announcements.map(ann => (
            <div
              key={ann.id}
              style={{
                background: '#ffffff', borderRadius: 14, padding: '26px 30px', border: '1px solid #eaeaea',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)', transition: 'all 0.25s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 20,
                  background: 'rgba(212,175,55,0.12)', color: '#8a6d3b', border: '1px solid rgba(212,175,55,0.3)',
                  fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase'
                }}>
                  <i className="fas fa-bullhorn" /> Studio Broadcast
                </span>
                <span style={{ fontSize: '0.8rem', color: '#999' }}>
                  <i className="far fa-clock" style={{ marginRight: 5 }} />
                  {new Date(ann.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>

              <h2 style={{ margin: '0 0 12px', fontSize: '1.25rem', fontWeight: 700, color: '#111', fontFamily: "'Cinzel', serif" }}>
                {ann.title}
              </h2>

              <p style={{ margin: '0 0 16px', color: '#444', fontSize: '0.94rem', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
                {ann.content}
              </p>

              {/* Attachments Section */}
              {Array.isArray(ann.attachments) && ann.attachments.length > 0 && (
                <div style={{ background: '#fcfcfc', padding: 16, borderRadius: 10, border: '1px solid #eee', marginTop: 14 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#777', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.5px' }}>
                    <i className="fas fa-paperclip" style={{ marginRight: 6 }} /> Attached Documents & Media ({ann.attachments.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {ann.attachments.map((att, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#ffffff', padding: '10px 16px', borderRadius: 8, border: '1px solid #ddd' }}>
                        {att.type === 'image' ? (
                          <img src={att.url} alt={att.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                        ) : (
                          <i className="fas fa-file-pdf" style={{ fontSize: '1.6rem', color: '#dc2626' }} />
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#222', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {att.name}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#888' }}>{att.size || 'Attachment'}</span>
                        </div>
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={att.name}
                          style={{
                            marginLeft: 10, padding: '6px 14px', background: 'linear-gradient(135deg, #E8C97A 0%, #C5A059 100%)',
                            color: '#000', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none',
                            boxShadow: '0 2px 6px rgba(197, 160, 89, 0.25)'
                          }}
                        >
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DesignerAnnouncements;
