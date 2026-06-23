import React, { useState, useEffect, useRef } from 'react';
import BackButton from '../../components/BackButton';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast, ToastContainer, TOAST_CSS } from '../../components/useToast';

const styles = `
    .support-page {
        min-height: 80vh;
        background: var(--light);
        padding: 40px 5%;
        font-family: 'Montserrat', sans-serif;
    }
    .support-container {
        max-width: 1200px;
        margin: 0 auto;
    }
    .support-layout {
        display: grid;
        grid-template-columns: 1.2fr 1fr;
        gap: 40px;
        margin-top: 30px;
    }
    @media (max-width: 900px) {
        .support-layout {
            grid-template-columns: 1fr;
        }
    }
    .glass-card {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.5);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
        padding: 30px;
    }
    .support-title {
        font-family: 'Cinzel', serif;
        font-size: 2rem;
        letter-spacing: 2px;
        color: var(--dark);
        margin-bottom: 8px;
    }
    .support-subtitle {
        font-size: 0.85rem;
        color: #666;
        letter-spacing: 1px;
        margin-bottom: 20px;
    }
    
    /* Tickets List */
    .ticket-list {
        display: flex;
        flex-direction: column;
        gap: 15px;
        max-height: 500px;
        overflow-y: auto;
        padding-right: 5px;
    }
    .ticket-item {
        background: white;
        border: 1px solid rgba(0,0,0,0.05);
        border-radius: 8px;
        padding: 18px;
        cursor: pointer;
        transition: 0.3s;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .ticket-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(197, 160, 89, 0.1);
        border-color: var(--gold);
    }
    .ticket-item-left {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }
    .ticket-subj {
        font-family: 'Cinzel', serif;
        font-size: 0.9rem;
        font-weight: 700;
        color: var(--dark);
        letter-spacing: 1px;
    }
    .ticket-desc {
        font-size: 0.78rem;
        color: #666;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        max-width: 300px;
    }
    .ticket-date {
        font-size: 0.7rem;
        color: #aaa;
    }
    .ticket-badge {
        font-size: 0.65rem;
        text-transform: uppercase;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 50px;
        letter-spacing: 0.5px;
    }
    .ticket-badge.open {
        background: #e8f5e9;
        color: #2e7d32;
    }
    .ticket-badge.closed {
        background: #f5f5f5;
        color: #9e9e9e;
    }

    /* Form Fields */
    .field-group {
        margin-bottom: 20px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .field-group label {
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--dark);
        letter-spacing: 0.5px;
    }
    .field-input, .field-select, .field-textarea {
        background: white;
        border: 1px solid #ddd;
        border-radius: 6px;
        padding: 12px 15px;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.85rem;
        outline: none;
        transition: 0.3s;
    }
    .field-input:focus, .field-select:focus, .field-textarea:focus {
        border-color: var(--gold);
    }
    .submit-btn {
        background: var(--dark);
        color: white;
        border: none;
        padding: 14px;
        width: 100%;
        font-family: 'Cinzel', serif;
        font-size: 0.9rem;
        letter-spacing: 2px;
        cursor: pointer;
        transition: 0.3s;
        border-radius: 6px;
    }
    .submit-btn:hover {
        background: var(--gold);
    }

    /* Support Drawer (Glassmorphic) */
    .drawer-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(5px);
        z-index: 1000;
        display: flex;
        justify-content: flex-end;
    }
    .drawer-content {
        width: 450px;
        max-width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(20px);
        border-left: 1px solid rgba(255, 255, 255, 0.4);
        box-shadow: -10px 0 30px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        animation: slideIn 0.3s ease-out;
    }
    @keyframes slideIn {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
    }
    .drawer-header {
        padding: 24px;
        border-bottom: 1px solid rgba(0,0,0,0.06);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .drawer-title {
        font-family: 'Cinzel', serif;
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--dark);
        letter-spacing: 1px;
    }
    .close-drawer-btn {
        background: transparent;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        color: #888;
        transition: 0.2s;
    }
    .close-drawer-btn:hover {
        color: #d32f2f;
    }

    /* Chat Area */
    .chat-messages {
        flex: 1;
        padding: 24px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 15px;
    }
    .chat-bubble-wrap {
        display: flex;
        flex-direction: column;
        max-width: 75%;
    }
    .chat-bubble-wrap.me {
        align-self: flex-end;
        align-items: flex-end;
    }
    .chat-bubble-wrap.other {
        align-self: flex-start;
        align-items: flex-start;
    }
    .chat-bubble {
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 0.82rem;
        line-height: 1.4;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
    }
    .chat-bubble-wrap.me .chat-bubble {
        background: var(--dark);
        color: white;
        border-bottom-right-radius: 2px;
    }
    .chat-bubble-wrap.other .chat-bubble {
        background: white;
        color: #333;
        border: 1px solid rgba(0,0,0,0.05);
        border-bottom-left-radius: 2px;
    }
    .chat-time {
        font-size: 0.65rem;
        color: #aaa;
        margin-top: 4px;
    }

    .chat-input-area {
        padding: 20px;
        border-top: 1px solid rgba(0,0,0,0.06);
        background: rgba(255, 255, 255, 0.5);
        display: flex;
        gap: 10px;
    }
    .chat-input {
        flex: 1;
        background: white;
        border: 1px solid #ddd;
        border-radius: 20px;
        padding: 10px 18px;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.82rem;
        outline: none;
    }
    .chat-input:focus {
        border-color: var(--gold);
    }
    .send-chat-btn {
        background: var(--gold);
        color: white;
        border: none;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: 0.2s;
    }
    .send-chat-btn:hover {
        background: var(--dark);
    }
    
    .spinner {
        border: 3px solid rgba(197, 160, 89, 0.1);
        border-top: 3px solid var(--gold);
        border-radius: 50%;
        width: 30px;
        height: 30px;
        animation: spin 1s linear infinite;
        margin: 20px auto;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;

function MfgSupport() {
    const { user } = useAuth();
    const { toasts, showToast } = useToast();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTicket, setActiveTicket] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [category, setCategory] = useState('Production Issue');
    const [message, setMessage] = useState('');
    const [replyText, setReplyText] = useState('');
    const chatEndRef = useRef(null);

    const fetchTickets = async () => {
        if (!user) return;
        try {
            const data = await apiFetch('/api/tickets');

            const list = (data || []).map(t => {
                return {
                    id: t.id,
                    subject: t.subject,
                    text: t.description || t.subject || '',
                    status: t.status || 'open',
                    date: t.created_at ? new Date(t.created_at).getTime() : Date.now()
                };
            });
            setTickets(list);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching mfg tickets:", err);
            setLoading(false);
        }
    };

    const fetchChatMessages = async () => {
        if (!activeTicket) return;
        try {
            const data = await apiFetch(`/api/tickets/${activeTicket.id}/messages`);

            const list = (data || []).map(m => {
                return {
                    id: m.id,
                    senderId: m.sender_id,
                    senderRole: m.sender_role,
                    text: m.text,
                    date: m.created_at ? new Date(m.created_at).getTime() : Date.now()
                };
            });
            setChatMessages(list);
            // Scroll to bottom
            setTimeout(() => {
                chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } catch (err) {
            console.error("Error fetching ticket messages:", err);
        }
    };

    // 1. Fetch tickets real-time
    useEffect(() => {
        if (!user) return;
        fetchTickets();
    }, [user]);

    // 2. Fetch ticket messages real-time
    useEffect(() => {
        if (!activeTicket) return;
        fetchChatMessages();
    }, [activeTicket]);

    const handleSubmitTicket = async (e) => {
        e.preventDefault();
        if (!user) return;
        if (!message.trim()) {
            showToast("Please describe your issue.", 'warning');
            return;
        }

        try {
            await apiFetch('/api/tickets', {
                method: 'POST',
                body: JSON.stringify({
                    subject: category,
                    category: category,
                    description: message
                })
            });

            setMessage('');
            showToast("Ticket raised successfully!", 'success');
            fetchTickets();
        } catch (err) {
            console.error("Error creating ticket:", err);
            showToast("Failed to raise ticket. Please try again.", 'error');
        }
    };

    const handleSendReply = async () => {
        if (!replyText.trim() || !activeTicket) return;

        try {
            await apiFetch(`/api/tickets/${activeTicket.id}/messages`, {
                method: 'POST',
                body: JSON.stringify({ text: replyText })
            });

            setReplyText('');
            fetchChatMessages();
        } catch (err) {
            console.error("Error sending reply message:", err);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSendReply();
    };

    const formatDateStr = (dateVal) => {
        if (!dateVal) return 'Pending';
        return new Date(dateVal).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    const formatBubbleTime = (dateVal) => {
        if (!dateVal) return 'Sending...';
        return new Date(dateVal).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <>
            <style>{styles}</style>
            <style>{TOAST_CSS}</style>
            <ToastContainer toasts={toasts} />
            <div className="support-page">
                <div className="support-container">
                    <BackButton />
                    <h1 className="support-title">MFG SUPPORT CENTER</h1>
                    <p className="support-subtitle">Raise a support case or chat with admin live in real-time</p>

                    <div className="support-layout">
                        {/* Previous tickets pane */}
                        <div className="glass-card">
                            <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.2rem', marginBottom: '20px', letterSpacing: '1px' }}>
                                PREVIOUS TICKETS
                            </h3>
                            
                            {loading ? (
                                <div className="spinner" />
                            ) : tickets.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#bbb' }}>
                                    <i className="fas fa-history" style={{ fontSize: '2.5rem', marginBottom: '12px', display: 'block', color: '#ddd' }} />
                                    <p style={{ fontSize: '0.82rem' }}>You have no support history.</p>
                                </div>
                            ) : (
                                <div className="ticket-list">
                                    {tickets.map(t => (
                                        <div className="ticket-item" key={t.id} onClick={() => setActiveTicket(t)}>
                                            <div className="ticket-item-left">
                                                <span className="ticket-subj">{t.subject}</span>
                                                <span className="ticket-desc">{t.text}</span>
                                                <span className="ticket-date">{formatDateStr(t.date)}</span>
                                            </div>
                                            <span className={`ticket-badge ${t.status || 'open'}`}>
                                                {t.status || 'open'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Raise New Ticket Form */}
                        <div className="glass-card">
                            <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.2rem', marginBottom: '20px', letterSpacing: '1px' }}>
                                RAISE NEW TICKET
                            </h3>
                            <form onSubmit={handleSubmitTicket}>
                                <div className="field-group">
                                    <label>Support Category</label>
                                    <select 
                                        className="field-select"
                                        value={category} 
                                        onChange={e => setCategory(e.target.value)}
                                    >
                                        <option>Production Issue</option>
                                        <option>Payment Enquiry</option>
                                        <option>System Issue</option>
                                        <option>Others</option>
                                    </select>
                                </div>
                                <div className="field-group">
                                    <label>Elaborate your request</label>
                                    <textarea 
                                        className="field-textarea"
                                        rows="5" 
                                        placeholder="Describe the issue or query in detail..."
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                    />
                                </div>
                                <button type="submit" className="submit-btn">SUBMIT TICKET</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat side drawer overlay */}
            {activeTicket && (
                <div className="drawer-overlay" onClick={() => setActiveTicket(null)}>
                    <div className="drawer-content" onClick={e => e.stopPropagation()}>
                        <div className="drawer-header">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                <span className="drawer-title">{activeTicket.subject}</span>
                                <span style={{ fontSize: '0.72rem', color: '#888' }}>
                                    Ticket ID: {activeTicket.id.slice(0, 10).toUpperCase()}
                                </span>
                            </div>
                            <button className="close-drawer-btn" onClick={() => setActiveTicket(null)}>
                                <i className="fas fa-times" />
                            </button>
                        </div>

                        {/* Message log */}
                        <div className="chat-messages">
                            {/* Original ticket issue as the first message */}
                            <div className="chat-bubble-wrap other">
                                <div className="chat-bubble" style={{ background: '#f5f5f5', borderLeft: '3px solid var(--gold)' }}>
                                    {activeTicket.text}
                                </div>
                                <span className="chat-time">{formatDateStr(activeTicket.date)}</span>
                            </div>

                            {chatMessages.map(msg => (
                                <div 
                                    className={`chat-bubble-wrap ${msg.senderId === user.id ? 'me' : 'other'}`} 
                                    key={msg.id}
                                >
                                    <div className="chat-bubble">
                                        {msg.text}
                                    </div>
                                    <span className="chat-time">{formatBubbleTime(msg.date)}</span>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Reply box if the ticket is open */}
                        {activeTicket.status?.toLowerCase() !== 'closed' ? (
                            <div className="chat-input-area">
                                <input 
                                    type="text" 
                                    className="chat-input"
                                    placeholder="Type message..." 
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                />
                                <button className="send-chat-btn" onClick={handleSendReply}>
                                    <i className="fas fa-paper-plane" />
                                </button>
                            </div>
                        ) : (
                            <div style={{ padding: '20px', textAlign: 'center', background: '#f9f9f9', color: '#888', fontSize: '0.8rem', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                                <i className="fas fa-lock" style={{ marginRight: '6px' }} />
                                This support ticket has been closed by admin.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

export default MfgSupport;
