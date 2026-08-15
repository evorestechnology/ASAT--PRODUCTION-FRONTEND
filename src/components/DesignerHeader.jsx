import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function DesignerHeader() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [profileOpen, setProfileOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const profileRef = useRef(null);

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
                <div className="dsn-header__left" onClick={() => navigate('/designer')}>
                    <img src="/logo.png" alt="AS SIMPLE AS THAT" className="dsn-header__logo-img" />
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
