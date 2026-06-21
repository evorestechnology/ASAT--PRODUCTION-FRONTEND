import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../api';
import '../../styles/admin.css';
import BackButton from '../../components/BackButton';

function MasterTickets() {
    const { user } = useAuth();
    const [filter, setFilter] = useState('all');
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saveStatus, setSaveStatus] = useState(null);

    // Selected ticket for chat
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [replyText, setReplyText] = useState('');
    const chatEndRef = useRef(null);

    const fetchTickets = async () => {
        try {
            const data = await apiFetch('/api/tickets/all');

            const list = (data || []).map(t => ({
                id: t.id,
                userId: t.user_id,
                subject: t.subject,
                category: t.category,
                description: t.description,
                status: t.status,
                orderId: t.order_id,
                lastReply: t.last_reply,
                assignedTo: t.assigned_to,
                createdAt: t.created_at,
                updatedAt: t.updated_at,
                role: t.category,
                raisedBy: t.category,
                username: t.user_id,
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
            return;
        }

        fetchMessages();
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
        if (filter === 'all') return true;
        const role = t.role || t.raisedBy || t.category || '';
        return role.toLowerCase() === filter.toLowerCase();
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

            <div className="adm-page__filters">
                {['all', 'designer', 'user', 'mfg'].map(f => (
                    <button key={f} className={`adm-page__filter-btn ${filter === f ? 'adm-page__filter-btn--active' : ''}`} onClick={() => setFilter(f)}>
                        {f === 'mfg' ? 'Manufacturer' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
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
                        width: '460px',
                        maxWidth: '90%',
                        height: '100%',
                        background: 'rgba(18, 18, 18, 0.96)',
                        borderLeft: '1px solid var(--gold)',
                        boxShadow: '-10px 0 45px rgba(0, 0, 0, 0.6)',
                        zIndex: 2000,
                        display: 'flex',
                        flexDirection: 'column',
                        fontFamily: "'Montserrat', sans-serif",
                        color: 'white'
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '24px 20px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <h3 style={{ fontFamily: "'Cinzel', serif", margin: 0, color: 'var(--gold)', fontSize: '1.1rem', letterSpacing: 1 }}>
                                    SUPPORT CHAT
                                </h3>
                                <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: 4 }}>
                                    Ticket ID: {selectedTicket.id} | User: @{selectedTicket.username || selectedTicket.userId}
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedTicket(null)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#aaa',
                                    fontSize: '1.2rem',
                                    cursor: 'pointer',
                                    transition: 'color 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.color = 'var(--gold)'}
                                onMouseLeave={(e) => e.target.style.color = '#aaa'}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        {/* Ticket Subject Box */}
                        <div style={{
                            padding: '12px 20px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            fontSize: '0.8rem',
                            color: '#ccc'
                        }}>
                            <strong>Subject:</strong> {selectedTicket.subject || selectedTicket.issue || selectedTicket.text || '—'}
                            {selectedTicket.orderId && (
                                <div style={{ marginTop: 4, color: '#aaa' }}>
                                    <strong>Associated Order:</strong> {selectedTicket.orderId}
                                </div>
                            )}
                        </div>

                        {/* Message Stream */}
                        <div style={{
                            flex: 1,
                            padding: '20px',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 100%)'
                        }}>
                            {messages.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    color: '#777',
                                    margin: 'auto',
                                    fontSize: '0.85rem'
                                }}>
                                    <i className="fas fa-comments" style={{ fontSize: '2rem', marginBottom: 12, color: '#333', display: 'block' }}></i>
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
                                                background: isAdmin ? 'var(--gold)' : 'rgba(255, 255, 255, 0.08)',
                                                color: isAdmin ? '#000' : '#fff',
                                                borderRadius: isAdmin ? '12px 12px 0 12px' : '12px 12px 12px 0',
                                                padding: '10px 14px',
                                                maxWidth: '80%',
                                                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                                                fontSize: '0.85rem',
                                                lineHeight: '1.4'
                                            }}
                                        >
                                            <div style={{ fontWeight: isAdmin ? 600 : 500 }}>{msg.text}</div>
                                            <div style={{
                                                fontSize: '0.65rem',
                                                textAlign: 'right',
                                                marginTop: 4,
                                                color: isAdmin ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)'
                                            }}>
                                                {formatDate(msg.createdAt)}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Footer */}
                        <form onSubmit={handleSendReply} style={{
                            padding: '20px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                            background: 'rgba(10, 10, 10, 0.8)',
                            display: 'flex',
                            gap: '10px'
                        }}>
                            <input
                                type="text"
                                placeholder="Type your support message..."
                                value={replyText}
                                onChange={e => setReplyText(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    borderRadius: '4px',
                                    color: 'white',
                                    outline: 'none',
                                    fontSize: '0.9rem',
                                    fontFamily: "'Montserrat', sans-serif",
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--gold)'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
                            />
                            <button
                                type="submit"
                                style={{
                                    padding: '0 24px',
                                    background: 'var(--gold)',
                                    color: 'black',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    fontFamily: "'Montserrat', sans-serif",
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6
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
