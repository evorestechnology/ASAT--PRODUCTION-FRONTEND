import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import BackButton from '../../components/BackButton';

function UserAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      try {
        const data = await apiFetch('/api/announcements?audience=user');
        setAnnouncements(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching user announcements:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '40px 20px 80px', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Montserrat', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <BackButton fallbackPath="/" />
      </div>

      {/* Header Banner */}
      <div style={{
        background: '#000000', padding: '36px 40px', borderRadius: 20, color: '#ffffff',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)', marginBottom: 36, display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{
              background: '#0052FF', color: '#fff', padding: '4px 12px', borderRadius: 20,
              fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px'
            }}>
              Official Bulletins
            </span>
          </div>
          <h1 style={{ margin: '0 0 8px', fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.5px' }}>
            Store Announcements & Updates
          </h1>
          <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.92rem', maxWidth: 650, lineHeight: 1.5 }}>
            Discover upcoming collection drops, special promo offers, delivery announcements, and platform releases.
          </p>
        </div>
      </div>

      {/* Announcements Stream */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#71717a' }}>
          <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2rem', marginBottom: 12, color: '#0052FF' }} />
          <div>Loading latest announcements...</div>
        </div>
      ) : announcements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', background: '#f4f4f5', borderRadius: 20, color: '#71717a' }}>
          <i className="fas fa-bullhorn" style={{ fontSize: '3rem', color: '#d4d4d8', marginBottom: 16 }} />
          <h3 style={{ margin: '0 0 6px', color: '#18181b', fontSize: '1.2rem', fontWeight: 800 }}>No Announcements Posted Yet</h3>
          <p style={{ margin: 0, fontSize: '0.88rem' }}>Check back soon for exciting news and drop updates!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {announcements.map(ann => (
            <article
              key={ann.id}
              style={{
                background: '#ffffff', borderRadius: 18, padding: '30px 36px', border: '1px solid #e4e4e7',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)', transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                <span style={{
                  background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe',
                  padding: '4px 14px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase'
                }}>
                  <i className="fas fa-volume-up" style={{ marginRight: 6 }} /> Official Notice
                </span>
                <span style={{ fontSize: '0.82rem', color: '#71717a', fontWeight: 500 }}>
                  <i className="far fa-calendar-alt" style={{ marginRight: 6 }} />
                  {new Date(ann.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>

              <h2 style={{ margin: '0 0 14px', fontSize: '1.35rem', fontWeight: 800, color: '#09090b', letterSpacing: '-0.3px' }}>
                {ann.title}
              </h2>

              <p style={{ margin: '0 0 20px', color: '#3f3f46', fontSize: '0.98rem', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
                {ann.content}
              </p>

              {/* Attachments */}
              {Array.isArray(ann.attachments) && ann.attachments.length > 0 && (
                <div style={{ background: '#fafafa', padding: 18, borderRadius: 12, border: '1px solid #f4f4f5', marginTop: 16 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#71717a', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.5px' }}>
                    <i className="fas fa-paperclip" style={{ marginRight: 6 }} /> Download Media & Documents ({ann.attachments.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {ann.attachments.map((att, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#ffffff', padding: '10px 16px', borderRadius: 10, border: '1px solid #e4e4e7' }}>
                        {att.type === 'image' ? (
                          <img src={att.url} alt={att.name} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8 }} />
                        ) : (
                          <i className="fas fa-file-pdf" style={{ fontSize: '1.8rem', color: '#ef4444' }} />
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#09090b', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {att.name}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#71717a' }}>{att.size || 'Attachment'}</span>
                        </div>
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={att.name}
                          style={{
                            marginLeft: 10, padding: '6px 16px', background: '#0052FF', color: '#ffffff',
                            borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none',
                            boxShadow: '0 2px 8px rgba(0, 82, 255, 0.25)'
                          }}
                        >
                          View / Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserAnnouncements;
