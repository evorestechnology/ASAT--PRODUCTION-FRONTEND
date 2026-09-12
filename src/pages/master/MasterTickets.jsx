import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../api';
import '../../styles/admin.css';
import BackButton from '../../components/BackButton';

const parseEvidence = (text) => {
    if (!text) return [];
    const lines = text.split('\n');
    const links = [];
    lines.forEach(line => {
        const match = line.match(/(https?:\/\/[^\s]+)/);
        if (match) {
            const url = match[1];
            let label = 'Evidence File';
            if (line.toLowerCase().includes('video')) label = 'Unboxing Video';
            else if (line.toLowerCase().includes('photo') || line.toLowerCase().includes('image')) label = 'Product Image';
            links.push({ url, label });
        }
    });
    return links;
};

function MasterTickets() {
    const { user } = useAuth();
    const [filter, setFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saveStatus, setSaveStatus] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Selected ticket for chat
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [replyText, setReplyText] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loadingOrder, setLoadingOrder] = useState(false);
    const chatEndRef = useRef(null);

    const fetchTickets = async () => {
        try {
            const data = await apiFetch('/api/tickets/all');

            const list = (data || []).map(t => ({
                id: t.id,
                userId: t.user_id,
                subject: t.subject,
                category: t.category,
                description: t.description || t.subject,
                status: t.status,
                orderId: t.order_id,
                lastReply: t.last_reply,
                assignedTo: t.assigned_to,
                createdAt: t.created_at,
                updatedAt: t.updated_at,
                role: t.user_profile?.role || 'user',
                raisedBy: t.user_profile?.role || 'user',
                username: t.user_profile?.username || t.user_id,
                email: t.user_profile?.email || '',
            }));

            setTickets(list);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching tickets:', err);
            setError('Failed to fetch support tickets.');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchMessages = async () => {
        if (!selectedTicket) return;
        try {
            const data = await apiFetch(`/api/tickets/${selectedTicket.id}/messages`);
            const list = (data || []).map(m => ({
                id: m.id,
                ticketId: m.ticket_id,
                senderId: m.sender_id,
                senderRole: m.sender_role,
                text: m.text,
                createdAt: m.created_at
            }));
            setMessages(list);
        } catch (err) {
            console.error('Error fetching chat messages:', err);
        }
    };

    // Listen to messages for the selected ticket
    useEffect(() => {
        if (!selectedTicket) {
            setMessages([]);
            setSelectedOrder(null);
            return;
        }

        fetchMessages();

        if (selectedTicket.orderId || selectedTicket.order_id) {
            const fetchOrderDetails = async () => {
                setLoadingOrder(true);
                try {
                    const data = await apiFetch(`/api/orders/${selectedTicket.orderId || selectedTicket.order_id}`);
                    setSelectedOrder(data);
                } catch (err) {
                    console.error('Error fetching order details for ticket:', err);
                    setSelectedOrder(null);
                } finally {
                    setLoadingOrder(false);
                }
            };
            fetchOrderDetails();
        } else {
            setSelectedOrder(null);
        }
    }, [selectedTicket]);

    // Scroll to bottom on new message
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleStatusChange = async (ticketId, newStatus) => {
        setSaveStatus(null);
        try {
            await apiFetch(`/api/tickets/${ticketId}`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });
            setSaveStatus({ type: 'success', text: `Ticket status updated to ${newStatus}.` });
            fetchTickets();
            if (selectedTicket && selectedTicket.id === ticketId) {
                setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null);
            }
            setTimeout(() => setSaveStatus(null), 5000);
        } catch (err) {
            console.error('Error changing ticket status:', err);
            setSaveStatus({ type: 'error', text: 'Failed to update status: ' + (err.error || err.message) });
            setTimeout(() => setSaveStatus(null), 5000);
        }
    };

    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedTicket) return;
        setSaveStatus(null);

        try {
            await apiFetch(`/api/tickets/${selectedTicket.id}/messages`, {
                method: 'POST',
                body: JSON.stringify({ text: replyText.trim() })
            });

            setReplyText('');
            fetchMessages();
            fetchTickets();
        } catch (err) {
            console.error('Error sending support reply:', err);
            setSaveStatus({ type: 'error', text: 'Failed to send message: ' + (err.error || err.message) });
            setTimeout(() => setSaveStatus(null), 5000);
        }
    };

    const formatDate = (createdAt) => {
        if (!createdAt) return '—';
        const date = new Date(createdAt);
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getStatusType = (status) => {
        if (!status) return 'pending';
        const s = status.toLowerCase();
        if (s === 'open' || s === 'active') return 'active';
        if (s === 'closed') return 'danger';
        return 'info';
    };

    const filteredTickets = tickets.filter(t => {
        if (filter !== 'all') {
            const role = t.role || t.raisedBy || t.category || '';
            if (role.toLowerCase() !== filter.toLowerCase()) return false;
        }

        if (statusFilter !== 'all') {
            const status = (t.status || 'open').toLowerCase();
            if (statusFilter === 'ongoing') {
                if (status !== 'open' && status !== 'active') return false;
            } else if (statusFilter === 'closed') {
                if (status !== 'closed') return false;
            }
        }

        if (searchTerm.trim() !== '') {
            const q = searchTerm.toLowerCase();
            const idStr = (t.id || '').toLowerCase();
            const subjectStr = (t.subject || '').toLowerCase();
            const descriptionStr = (t.description || '').toLowerCase();
            const statusStr = (t.status || '').toLowerCase();
            const nameStr = (t.raised_by_name || t.fullName || t.name || '').toLowerCase();
            const emailStr = (t.raised_by_email || t.email || '').toLowerCase();

            return (
                idStr.includes(q) ||
                subjectStr.includes(q) ||
                descriptionStr.includes(q) ||
                statusStr.includes(q) ||
                nameStr.includes(q) ||
                emailStr.includes(q)
            );
        }
        return true;
    });

    return (
        <main className="adm-page">
            <BackButton />
            <h1 className="adm-page__title">SUPPORT TICKETS</h1>
            <p className="adm-page__subtitle">Manage support issues from designers, users, and manufacturers</p>
            
            {saveStatus && (
                <div className={`save-toast save-toast--${saveStatus.type}`}>
                    {saveStatus.type === 'success' ? '✦ ' : '⚠️ '} {saveStatus.text}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <div className="adm-page__filters" style={{ margin: 0 }}>
                        {['all', 'designer', 'user', 'mfg'].map(f => (
                            <button key={f} className={`adm-page__filter-btn ${filter === f ? 'adm-page__filter-btn--active' : ''}`} onClick={() => setFilter(f)}>
                                {f === 'mfg' ? 'Manufacturer' : f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div className="adm-page__filters" style={{ margin: 0 }}>
                        {['all', 'ongoing', 'closed'].map(sf => (
                            <button key={sf} className={`adm-page__filter-btn ${statusFilter === sf ? 'adm-page__filter-btn--active' : ''}`} onClick={() => setStatusFilter(sf)}>
                                {sf === 'all' ? 'All Status' : sf.charAt(0).toUpperCase() + sf.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="adm-search-wrap">
                    <input
                        type="text"
                        placeholder="Search tickets..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="adm-search-input"
                    />
                    <i className="fas fa-search adm-search-icon"></i>
                </div>
            </div>

            {loading ? (
                <div className="adm-loading">
                    <div className="adm-spinner"></div>
                    <p>Loading real-time tickets...</p>
                </div>
            ) : error ? (
                <div className="adm-error-alert">
                    <i className="fas fa-exclamation-triangle"></i> {error}
                </div>
            ) : (
                <div className="adm-table-wrap">
                    <table className="adm-table">
                        <thead>
                            <tr>
                                <th>Issue ID</th>
                                <th>Category / Role</th>
                                <th>Username</th>
                                <th>Issue / Subject</th>
                                <th>Order ID</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Chat</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTickets.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="adm-table__empty">
                                        <i className="fas fa-headset"></i>No matching support tickets found.
                                    </td>
                                </tr>
                            ) : (
                                filteredTickets.map(t => (
                                    <tr key={t.id}>
                                        <td>{t.id}</td>
                                        <td>
                                            <span className="adm-badge adm-badge--info" style={{ textTransform: 'capitalize' }}>
                                                {t.role || t.raisedBy || t.category || 'user'}
                                            </span>
                                        </td>
                                        <td>@{t.username || t.userId || '—'}</td>
                                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.subject || t.issue || t.text}>
                                            {t.subject || t.issue || t.text || '—'}
                                        </td>
                                        <td>{t.orderId || '—'}</td>
                                        <td>{formatDate(t.createdAt || t.date)}</td>
                                        <td>
                                            <span className={`adm-badge adm-badge--${getStatusType(t.status)}`}>
                                                {t.status || 'open'}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="adm-action-btn" onClick={() => setSelectedTicket(t)}>
                                                <i className="fas fa-comments" style={{ marginRight: 4 }}></i> Open
                                            </button>
                                        </td>
                                        <td>
                                            <select
                                                className="adm-action-btn"
                                                style={{ padding: '4px 8px', outline: 'none' }}
                                                value={t.status || 'open'}
                                                onChange={(e) => handleStatusChange(t.id, e.target.value)}
                                            >
                                                <option value="open">Open / Active</option>
                                                <option value="closed">Closed</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Premium Chat Side Drawer */}
            {selectedTicket && (
                <>
                    {/* Backdrop */}
                    <div
                        onClick={() => setSelectedTicket(null)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'rgba(0, 0, 0, 0.4)',
                            backdropFilter: 'blur(6px)',
                            zIndex: 1999
                        }}
                    ></div>

                    {/* Chat Panel */}
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        right: 0,
                        width: '480px',
                        maxWidth: '90%',
                        height: '100%',
                        background: '#ffffff',
                        borderLeft: '1px solid #e5e7eb',
                        boxShadow: '-10px 0 45px rgba(0, 0, 0, 0.12)',
                        zIndex: 2000,
                        display: 'flex',
                        flexDirection: 'column',
                        fontFamily: "'Montserrat', sans-serif",
                        color: '#111827'
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '22px 24px',
                            borderBottom: '1px solid #f3f4f6',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#ffffff'
                        }}>
                            <div>
                                <h3 style={{ fontFamily: "'Cinzel', serif", margin: 0, color: '#111827', fontSize: '1.1rem', fontWeight: 700, letterSpacing: '1px' }}>
                                    SUPPORT CHAT
                                </h3>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4 }}>
                                    Ticket ID: <span style={{ fontWeight: 600, color: '#111827' }}>#{selectedTicket.id}</span> • User: <span style={{ fontWeight: 600, color: '#111827' }}>@{selectedTicket.username || selectedTicket.userId}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedTicket(null)}
                                style={{
                                    background: '#f3f4f6',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: 34,
                                    height: 34,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#6b7280',
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#dc2626'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#6b7280'; }}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        {/* Ticket Subject Box */}
                        <div style={{
                            padding: '14px 24px',
                            background: '#f9fafb',
                            borderBottom: '1px solid #e5e7eb',
                            fontSize: '0.82rem',
                            color: '#374151'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <span><strong style={{ color: '#111827' }}>Subject:</strong> {selectedTicket.subject || selectedTicket.issue || selectedTicket.text || '—'}</span>
                                <span className={`adm-badge adm-badge--${getStatusType(selectedTicket.status)}`}>
                                    {selectedTicket.status || 'open'}
                                </span>
                            </div>
                            {selectedTicket.orderId && (
                                <div style={{ marginTop: 10, padding: '12px', background: '#ffffff', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px', border: '1px solid #e5e7eb' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontWeight: 600, color: '#111827' }}>Associated Order:</span>
                                        <span style={{ fontFamily: 'monospace', color: '#6b7280' }}>#{selectedTicket.orderId}</span>
                                    </div>
                                    {loadingOrder ? (
                                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Loading order details...</div>
                                    ) : selectedOrder ? (
                                        <div style={{ fontSize: '0.75rem', color: '#4b5563', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div>Status: <span style={{ textTransform: 'uppercase', color: '#111827', fontWeight: 700 }}>{selectedOrder.status}</span></div>
                                            <div>Total: <span style={{ fontWeight: 700, color: '#111827' }}>{selectedOrder.total_amount ? `₹${selectedOrder.total_amount}` : '—'}</span></div>
                                            {selectedOrder.items && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                                                    <strong>Items:</strong>
                                                    {selectedOrder.items.map((item, idx) => (
                                                        <div key={idx} style={{ paddingLeft: '8px', color: '#6b7280' }}>
                                                            • {item.name} (Qty: {item.qty || 1}, Size: {item.size})
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '0.75rem', color: '#dc2626' }}>Failed to load order details.</div>
                                    )}
                                    
                                    {/* Evidence Previews */}
                                    {(() => {
                                        const evidence = parseEvidence(selectedTicket.text || selectedTicket.description || '');
                                        if (evidence.length > 0) {
                                            return (
                                                <div style={{ marginTop: '8px', borderTop: '1px solid #f3f4f6', paddingTop: '8px' }}>
                                                    <strong style={{ color: '#111827', fontSize: '0.75rem' }}>Uploaded Evidence:</strong>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                                                        {evidence.map((ev, idx) => {
                                                            const isImage = ev.url.match(/\.(jpeg|jpg|gif|png)/i) || ev.label === 'Product Image';
                                                            const isVideo = ev.url.match(/\.(mp4|webm|ogg|mov)/i) || ev.label === 'Unboxing Video';
                                                            return (
                                                                <div key={idx} style={{ background: '#f9fafb', padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                                                                    <div style={{ fontSize: '0.72rem', color: '#C5A059', fontWeight: 600, marginBottom: '4px' }}>{ev.label}</div>
                                                                    {isImage ? (
                                                                        <img src={ev.url} alt="Evidence" style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #e5e7eb' }} />
                                                                    ) : isVideo ? (
                                                                        <video src={ev.url} controls style={{ width: '100%', maxHeight: '180px', borderRadius: '4px', background: '#000' }} />
                                                                    ) : (
                                                                        <a href={ev.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline', fontSize: '0.75rem' }}>
                                                                            View File
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            )}
                        </div>

                        {/* Message Stream */}
                        <div style={{
                            flex: 1,
                            padding: '20px 24px',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '14px',
                            background: '#f8fafc'
                        }}>
                            {messages.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    color: '#9ca3af',
                                    margin: 'auto',
                                    fontSize: '0.85rem'
                                }}>
                                    <i className="fas fa-comments" style={{ fontSize: '2.2rem', marginBottom: 12, color: '#d1d5db', display: 'block' }}></i>
                                    No messages yet. Send a reply below to initiate the chat.
                                </div>
                            ) : (
                                messages.map((msg, i) => {
                                    const isAdmin = msg.senderRole === 'admin' || msg.senderId === 'admin';
                                    return (
                                        <div
                                            key={msg.id || i}
                                            style={{
                                                alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: isAdmin ? 'flex-end' : 'flex-start',
                                                maxWidth: '82%'
                                            }}
                                        >
                                            <div style={{
                                                fontSize: '0.68rem',
                                                fontWeight: 700,
                                                letterSpacing: '0.5px',
                                                textTransform: 'uppercase',
                                                marginBottom: 3,
                                                color: isAdmin ? '#92661d' : '#6b7280'
                                            }}>
                                                {isAdmin ? '✦ Admin Support' : `@${selectedTicket.username || selectedTicket.userId || 'User'}`}
                                            </div>
                                            <div
                                                style={{
                                                    background: isAdmin ? '#111114' : '#ffffff',
                                                    color: isAdmin ? '#ffffff' : '#111827',
                                                    border: isAdmin ? 'none' : '1px solid #e5e7eb',
                                                    borderRadius: isAdmin ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                                                    padding: '11px 16px',
                                                    boxShadow: isAdmin ? '0 2px 8px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.04)',
                                                    fontSize: '0.85rem',
                                                    lineHeight: '1.45',
                                                    wordBreak: 'break-word'
                                                }}
                                            >
                                                <div>{msg.text}</div>
                                                <div style={{
                                                    fontSize: '0.65rem',
                                                    textAlign: 'right',
                                                    marginTop: 5,
                                                    color: isAdmin ? 'rgba(255,255,255,0.6)' : '#9ca3af'
                                                }}>
                                                    {formatDate(msg.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Footer */}
                        <form onSubmit={handleSendReply} style={{
                            padding: '18px 24px',
                            borderTop: '1px solid #e5e7eb',
                            background: '#ffffff',
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'center'
                        }}>
                            <input
                                type="text"
                                placeholder="Type your support response..."
                                value={replyText}
                                onChange={e => setReplyText(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '11px 16px',
                                    background: '#f9fafb',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '24px',
                                    color: '#111827',
                                    outline: 'none',
                                    fontSize: '0.85rem',
                                    fontFamily: "'Montserrat', sans-serif",
                                    transition: 'border-color 0.2s, box-shadow 0.2s'
                                }}
                                onFocus={(e) => { e.target.style.borderColor = '#111114'; e.target.style.boxShadow = '0 0 0 3px rgba(17,17,20,0.06)'; }}
                                onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                            />
                            <button
                                type="submit"
                                style={{
                                    padding: '10px 24px',
                                    background: '#111114',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '24px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontFamily: "'Montserrat', sans-serif",
                                    fontSize: '0.8rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                    letterSpacing: '0.5px',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <i className="fas fa-paper-plane"></i> Send
                            </button>
                        </form>
                    </div>
                </>
            )}
        </main>
    );
}

export default MasterTickets;
