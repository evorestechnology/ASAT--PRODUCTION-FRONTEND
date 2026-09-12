import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';

function DesignerHeader() {
    const navigate = useNavigate();
    const { user, profile, logout } = useAuth();
    const [profileOpen, setProfileOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [designerName, setDesignerName] = useState('');
    const profileRef = useRef(null);

    useEffect(() => {
        if (profile?.full_name || profile?.username) {
            setDesignerName(profile.full_name || profile.username);
        } else if (user) {
            apiFetch('/api/designers/me')
                .then(d => {
                    if (d?.full_name || d?.username) {
                        setDesignerName(d.full_name || d.username);
                    }
                })
                .catch(() => {});
        }
    }, [profile, user]);

    useEffect(() => {
        const handler = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
        };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, []);

    const navLinks = [
        { to: '/designer', label: 'Dashboard', icon: 'fas fa-th-large', end: true },
        { to: '/designer/orders', label: 'Orders', icon: 'fas fa-shopping-bag' },
        { to: '/designer/earnings', label: 'Earnings', icon: 'fas fa-coins' },
        { to: '/designer/designs', label: 'Designs', icon: 'fas fa-palette' },
        { to: '/designer/base-products', label: 'Base Products', icon: 'fas fa-tshirt' },
        { to: '/designer/tutorials', label: 'Tutorials', icon: 'fas fa-play-circle' },
        { to: '/designer/ranking', label: 'Ranking', icon: 'fas fa-trophy' },
    ];

    return (
        <header className="dsn-header">
            <div className="dsn-header__inner">
                <div className="dsn-header__left" onClick={() => navigate('/designer')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                        <img 
                            src="/logo.png" 
                            alt="ASAT Designer Paradise" 
                            style={{ 
                                height: '24px', 
                                width: 'auto', 
                                objectFit: 'contain', 
                                display: 'block' 
                            }} 
                        />
                        {designerName && (
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px', 
                                marginTop: '4px',
                                lineHeight: 1 
                            }}>
                                <span style={{
                                    color: 'var(--gold, #C5A059)',
                                    fontFamily: "'Montserrat', sans-serif",
                                    fontSize: '0.62rem',
                                    fontWeight: '700',
                                    letterSpacing: '1.5px',
                                    textTransform: 'uppercase'
                                }}>
                                    Designer
                                </span>
                                <span style={{ color: '#bbb', fontSize: '0.55rem' }}>•</span>
                                <span style={{
                                    color: '#222222',
                                    fontFamily: "'Montserrat', sans-serif",
                                    fontSize: '0.7rem',
                                    fontWeight: '600',
                                    letterSpacing: '0.8px',
                                    textTransform: 'uppercase',
                                    maxWidth: '220px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {designerName}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <nav className={`dsn-header__nav ${mobileOpen ? 'dsn-header__nav--open' : ''}`}>
                    {navLinks.map(l => (
                        <NavLink key={l.to} to={l.to} end={l.end}
                            className={({ isActive }) => `dsn-header__link ${isActive ? 'dsn-header__link--active' : ''}`}
                            onClick={() => setMobileOpen(false)}>
                            <span>{l.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="dsn-header__right">
                    <div className="dsn-header__profile" ref={profileRef}>
                        <button className="dsn-header__avatar" onClick={() => setProfileOpen(p => !p)}>
                            <i className="far fa-user-circle"></i>
                        </button>
                        {profileOpen && (
                            <div className="dsn-header__dropdown">
                                <Link to="/designer/profile" onClick={() => setProfileOpen(false)}><i className="fas fa-id-badge"></i> Profile</Link>
                                <Link to="/designer/analytics" onClick={() => setProfileOpen(false)}><i className="fas fa-chart-line"></i> Analytics</Link>
                                <Link to="/designer/support" onClick={() => setProfileOpen(false)}><i className="fas fa-headset"></i> Support</Link>
                                <Link to="/designer/terms" onClick={() => setProfileOpen(false)}><i className="fas fa-file-signature"></i> Terms</Link>
                                <div className="dsn-header__divider"></div>
                                <button className="dsn-header__logout" onClick={async () => {
                                    setProfileOpen(false);
                                    try {
                                        await logout();
                                        navigate('/designer/login');
                                    } catch (err) {
                                        console.error('Logout error:', err);
                                    }
                                }}>
                                    <i className="fas fa-sign-out-alt"></i> Logout
                                </button>
                            </div>
                        )}
                    </div>
                    <button className="dsn-header__hamburger" onClick={() => setMobileOpen(p => !p)}>
                        <i className={mobileOpen ? 'fas fa-times' : 'fas fa-bars'}></i>
                    </button>
                </div>
            </div>
        </header>
    );
}

export default DesignerHeader;
