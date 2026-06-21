import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/admin.css';

function MfgHeader() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    const navLinks = [
        { to: '/mfg', label: 'Dashboard', icon: 'fas fa-th-large', end: true },
        { to: '/mfg/products', label: 'Products', icon: 'fas fa-tshirt' },
        { to: '/mfg/print-styles', label: 'Print Styles', icon: 'fas fa-print' },
        { to: '/mfg/orders', label: 'Live Orders', icon: 'fas fa-bolt' },
        { to: '/mfg/history', label: 'Order History', icon: 'fas fa-history' },
        { to: '/mfg/wallet', label: 'Wallet', icon: 'fas fa-wallet' },
        { to: '/mfg/profile', label: 'Profile', icon: 'fas fa-industry' },
    ];


    return (
        <header className="adm-header">
            <div className="adm-header__top">
                <span className="adm-header__role">Manufacturer</span>
                <div className="adm-header__brand" onClick={() => navigate('/mfg')}>
                    <div className="adm-header__logo">As Simple as That</div>
                    <div className="adm-header__tagline">**A Designer Paradise**</div>
                </div>
                <div className="adm-header__actions">
                    <button className="adm-header__logout" onClick={async () => {
                        try {
                            await logout();
                            navigate('/');
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

export default MfgHeader;
