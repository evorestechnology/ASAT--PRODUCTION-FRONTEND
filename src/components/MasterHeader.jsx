import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/admin.css';

function MasterHeader() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    const navLinks = [
        { to: '/master', label: 'Dashboard', icon: 'fas fa-th-large', end: true },
        { to: '/master/orders', label: 'Orders', icon: 'fas fa-receipt' },
        { to: '/master/wallet', label: 'Wallet', icon: 'fas fa-wallet' },
        { to: '/master/designers', label: 'Designers', icon: 'fas fa-users' },
        { to: '/master/manufacturers', label: 'Manufacturers', icon: 'fas fa-industry' },
        { to: '/master/designs', label: 'Designs', icon: 'fas fa-palette' },
        { to: '/master/products', label: 'Base Products', icon: 'fas fa-boxes' },
        { to: '/master/categories', label: 'Categories', icon: 'fas fa-tags' },
        { to: '/master/activity', label: 'Activity', icon: 'fas fa-chart-line' },
        { to: '/master/tickets', label: 'Tickets', icon: 'fas fa-headset' },
        { to: '/master/settings', label: 'Settings', icon: 'fas fa-cog' },
    ];


    return (
        <header className="adm-header">
            <div className="adm-header__top">
                <span className="adm-header__role">Master Admin</span>
                <div className="adm-header__brand" onClick={() => navigate('/master')}>
                    <div className="adm-header__logo">As Simple as That</div>
                    <div className="adm-header__tagline">**A Designer Paradise**</div>
                </div>
                <div className="adm-header__actions">
                    <button className="adm-header__logout" onClick={async () => {
                        try {
                            await logout();
                            navigate('/master/login');
                        } catch (err) {
                            console.error('Logout error:', err);
                        }
                    }}>
                        <i className="fas fa-sign-out-alt"></i> Logout
                    </button>
                    <button className="adm-header__hamburger" onClick={() => setMobileOpen(p => !p)}>
                        <i className={mobileOpen ? 'fas fa-times' : 'fas fa-bars'}></i>
                    </button>
                </div>
            </div>
            <nav className={`adm-header__nav ${mobileOpen ? 'adm-header__nav--open' : ''}`}>
                {navLinks.map(l => (
                    <NavLink key={l.to} to={l.to} end={l.end}
                        className={({ isActive }) => `adm-header__link ${isActive ? 'adm-header__link--active' : ''}`}
                        onClick={() => setMobileOpen(false)}>
                        <i className={l.icon}></i>
                        <span>{l.label}</span>
                    </NavLink>
                ))}
            </nav>
        </header>
    );
}

export default MasterHeader;
