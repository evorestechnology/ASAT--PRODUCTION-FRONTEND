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
        { to: '/designer', label: 'Dashboard', icon: 'fas fa-chart-pie', end: true },
        { to: '/designer/orders', label: 'Orders', icon: 'fas fa-receipt' },
        { to: '/designer/earnings', label: 'Earnings', icon: 'fas fa-coins' },
        { to: '/designer/designs', label: 'Designs', icon: 'fas fa-palette' },
        { to: '/designer/base-products', label: 'Base Products', icon: 'fas fa-tshirt' },
        { to: '/designer/tutorials', label: 'Tutorials', icon: 'fas fa-play-circle' },
        { to: '/designer/ranking', label: 'Ranking', icon: 'fas fa-trophy' },
    ];

    const initial = designerName ? designerName.charAt(0).toUpperCase() : 'D';

    return (
        <header className="dsn-header">
            <div className="dsn-header__inner">
                {/* Brand & Designer Identity */}
                <div className="dsn-header__left" onClick={() => navigate('/designer')} title="ASAT Designer Paradise">
                    <img 
                        src="/logo.png" 
                        alt="ASAT Designer Paradise" 
                        className="dsn-header__logo-img"
                    />
                    {designerName && (
                        <div className="dsn-header__identity-badge">
                            <span className="dsn-header__identity-tag">DESIGNER</span>
                            <span className="dsn-header__identity-name" title={designerName}>
                                {designerName}
                            </span>
                        </div>
                    )}
                </div>

                {/* Capsule Nav */}
                <nav className={`dsn-header__nav ${mobileOpen ? 'dsn-header__nav--open' : ''}`}>
                    <div className="dsn-header__nav-capsule">
                        {navLinks.map(l => (
                            <NavLink 
                                key={l.to} 
                                to={l.to} 
                                end={l.end}
                                className={({ isActive }) => `dsn-header__link ${isActive ? 'dsn-header__link--active' : ''}`}
                                onClick={() => setMobileOpen(false)}
                            >
                                <i className={`${l.icon} dsn-header__nav-icon`}></i>
                                <span>{l.label}</span>
                            </NavLink>
                        ))}
                    </div>
                </nav>

                {/* Right Profile Pill */}
                <div className="dsn-header__right">
                    <div className="dsn-header__profile" ref={profileRef}>
                        <button 
                            className={`dsn-header__profile-pill ${profileOpen ? 'dsn-header__profile-pill--active' : ''}`} 
                            onClick={() => setProfileOpen(p => !p)}
                            title="Account Menu"
                        >
                            <div className="dsn-header__avatar-badge">
                                {initial}
                            </div>
                            <span className="dsn-header__profile-name">
                                {designerName ? designerName.split(' ')[0] : 'Account'}
                            </span>
                            <i className={`fas fa-chevron-down dsn-header__profile-caret ${profileOpen ? 'dsn-header__profile-caret--open' : ''}`}></i>
                        </button>

                        {profileOpen && (
                            <div className="dsn-header__dropdown">
                                <div className="dsn-header__dropdown-user">
                                    <div className="dsn-header__dropdown-avatar">{initial}</div>
                                    <div className="dsn-header__dropdown-meta">
                                        <div className="dsn-header__dropdown-name">{designerName || 'Designer'}</div>
                                        <div className="dsn-header__dropdown-email">{user?.email || profile?.email || ''}</div>
                                    </div>
                                </div>
                                <div className="dsn-header__divider"></div>
                                <Link to="/designer/profile" onClick={() => setProfileOpen(false)}>
                                    <i className="fas fa-id-badge"></i> Profile &amp; Settings
                                </Link>
                                <Link to="/designer/analytics" onClick={() => setProfileOpen(false)}>
                                    <i className="fas fa-chart-line"></i> Analytics
                                </Link>
                                <Link to="/designer/support" onClick={() => setProfileOpen(false)}>
                                    <i className="fas fa-headset"></i> Support Desk
                                </Link>
                                <Link to="/designer/terms" onClick={() => setProfileOpen(false)}>
                                    <i className="fas fa-file-signature"></i> Guidelines &amp; Terms
                                </Link>
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

                    <button 
                        className="dsn-header__hamburger" 
                        onClick={() => setMobileOpen(p => !p)}
                        aria-label="Toggle Navigation"
                    >
                        <i className={mobileOpen ? 'fas fa-times' : 'fas fa-bars'}></i>
                    </button>
                </div>
            </div>
        </header>
    );
}

export default DesignerHeader;
