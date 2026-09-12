import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MFG_NAV_GROUPS = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'fas fa-chart-pie',
        to: '/mfg',
        exact: true
    },
    {
        id: 'orders',
        label: 'Orders',
        icon: 'fas fa-boxes',
        children: [
            { to: '/mfg/orders', label: 'Live Orders', icon: 'fas fa-bolt', desc: 'Active production queue' },
            { to: '/mfg/history', label: 'Order History', icon: 'fas fa-history', desc: 'Completed & delivered orders' },
        ]
    },
    {
        id: 'production',
        label: 'Catalog & Print',
        icon: 'fas fa-industry',
        children: [
            { to: '/mfg/products', label: 'Base Products', icon: 'fas fa-tshirt', desc: 'Stock garments & colors' },
            { to: '/mfg/print-styles', label: 'Print Styles', icon: 'fas fa-print', desc: 'DTG, screen print & finishes' },
        ]
    },
    {
        id: 'wallet',
        label: 'Wallet',
        icon: 'fas fa-wallet',
        to: '/mfg/wallet',
        exact: true
    },
    {
        id: 'support',
        label: 'Support',
        icon: 'fas fa-headset',
        to: '/mfg/support',
        exact: true
    }
];

function MfgHeader() {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, profile, user } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const dropdownTimeoutRef = useRef(null);
    const profileRef = useRef(null);

    const displayName = profile?.full_name || profile?.company_name || user?.user_metadata?.full_name || 'Manufacturer';
    const email = profile?.email || user?.email || 'mfg@asat.com';
    const initial = displayName ? displayName.charAt(0).toUpperCase() : 'M';

    useEffect(() => {
        const handler = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, []);

    useEffect(() => {
        setActiveDropdown(null);
        setMobileOpen(false);
        setProfileOpen(false);
    }, [location.pathname]);

    const handleMouseEnter = (groupId) => {
        if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
        setActiveDropdown(groupId);
    };

    const handleMouseLeave = () => {
        dropdownTimeoutRef.current = setTimeout(() => {
            setActiveDropdown(null);
        }, 150);
    };

    const isGroupActive = (group) => {
        if (group.exact) {
            return location.pathname === group.to;
        }
        if (group.children) {
            return group.children.some(child => location.pathname === child.to || location.pathname.startsWith(child.to + '/'));
        }
        return false;
    };

    return (
        <header className="mfg-header">
            <style>{`
                .mfg-header {
                    height: 68px;
                    background: rgba(255, 255, 255, 0.96);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    border-bottom: 1px solid rgba(0, 0, 0, 0.07);
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                    transition: all 0.25s ease;
                    box-shadow: 0 2px 14px rgba(0, 0, 0, 0.03);
                }
                .mfg-header__inner {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    height: 100%;
                    width: 100%;
                    max-width: 1440px;
                    margin: 0 auto;
                    padding: 0 clamp(16px, 2.5vw, 36px);
                    box-sizing: border-box;
                }
                .mfg-header__left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    cursor: pointer;
                    user-select: none;
                    transition: opacity 0.2s ease;
                }
                .mfg-header__left:hover {
                    opacity: 0.9;
                }
                .mfg-header__logo-img {
                    height: 26px;
                    width: auto;
                    object-fit: contain;
                    display: block;
                }
                .mfg-header__badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 3px 10px 3px 6px;
                    background: rgba(197, 160, 89, 0.08);
                    border: 1px solid rgba(197, 160, 89, 0.25);
                    border-radius: 20px;
                    line-height: 1;
                }
                .mfg-header__badge-tag {
                    font-family: 'Montserrat', sans-serif;
                    font-size: 0.58rem;
                    font-weight: 800;
                    letter-spacing: 1.2px;
                    color: #927333;
                    text-transform: uppercase;
                    background: rgba(197, 160, 89, 0.18);
                    padding: 2.5px 6px;
                    border-radius: 12px;
                }
                .mfg-header__badge-title {
                    font-family: 'Montserrat', sans-serif;
                    font-size: 0.68rem;
                    font-weight: 600;
                    color: #1f2937;
                    letter-spacing: 0.4px;
                    text-transform: uppercase;
                }
                .mfg-header__nav {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex: 1;
                    margin: 0 16px;
                }
                .mfg-header__nav-capsule {
                    display: inline-flex;
                    align-items: center;
                    gap: 3px;
                    background: #f4f4f6;
                    padding: 4px;
                    border-radius: 100px;
                    border: 1px solid rgba(0, 0, 0, 0.05);
                }
                .mfg-nav__item {
                    position: relative;
                }
                .mfg-nav__link {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 14px;
                    border-radius: 100px;
                    font-family: 'Montserrat', sans-serif;
                    font-size: 0.74rem;
                    font-weight: 500;
                    color: #4b5563;
                    text-decoration: none;
                    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                    white-space: nowrap;
                    border: none;
                    background: transparent;
                    cursor: pointer;
                }
                .mfg-nav__link:hover {
                    color: #111827;
                    background: rgba(255, 255, 255, 0.7);
                }
                .mfg-nav__link--active {
                    color: #ffffff !important;
                    background: #111114 !important;
                    font-weight: 600 !important;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.16);
                }
                .mfg-nav__link--active i {
                    color: #C5A059 !important;
                }
                .mfg-nav__icon {
                    font-size: 0.7rem;
                    color: #9ca3af;
                    transition: color 0.2s ease;
                }
                .mfg-nav__chevron {
                    font-size: 0.55rem;
                    color: #9ca3af;
                    margin-left: 2px;
                    transition: transform 0.2s ease;
                }
                .mfg-nav__chevron--open {
                    transform: rotate(180deg);
                }

                /* Dropdown Menu */
                .mfg-dropdown-menu {
                    position: absolute;
                    top: calc(100% + 8px);
                    left: 50%;
                    transform: translateX(-50%);
                    background: #ffffff;
                    border: 1px solid rgba(0, 0, 0, 0.08);
                    border-radius: 14px;
                    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.1);
                    min-width: 210px;
                    padding: 6px;
                    z-index: 1050;
                    animation: mfgDropIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes mfgDropIn {
                    from { opacity: 0; transform: translate(-50%, -6px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
                .mfg-dropdown-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 12px;
                    border-radius: 8px;
                    font-family: 'Montserrat', sans-serif;
                    font-size: 0.74rem;
                    color: #374151;
                    text-decoration: none;
                    transition: all 0.15s ease;
                }
                .mfg-dropdown-item:hover {
                    background: #f9fafb;
                    color: #111827;
                }
                .mfg-dropdown-item--active {
                    background: rgba(197, 160, 89, 0.1) !important;
                    color: #927333 !important;
                    font-weight: 600;
                }
                .mfg-dropdown-item--active i {
                    color: #C5A059 !important;
                }
                .mfg-dropdown-item__icon {
                    width: 16px;
                    text-align: center;
                    font-size: 0.75rem;
                    color: #9ca3af;
                }
                .mfg-dropdown-item__content {
                    display: flex;
                    flex-direction: column;
                }
                .mfg-dropdown-item__label {
                    font-weight: 600;
                }
                .mfg-dropdown-item__desc {
                    font-size: 0.62rem;
                    color: #9ca3af;
                    margin-top: 1px;
                }

                /* Profile Area */
                .mfg-header__right {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .mfg-header__profile {
                    position: relative;
                }
                .mfg-header__profile-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 3px 10px 3px 4px;
                    background: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-radius: 100px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
                }
                .mfg-header__profile-pill:hover,
                .mfg-header__profile-pill--active {
                    border-color: #C5A059;
                    box-shadow: 0 2px 10px rgba(197, 160, 89, 0.18);
                }
                .mfg-header__avatar-badge {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #1f1f23 0%, #09090b 100%);
                    color: #C5A059;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Montserrat', sans-serif;
                    font-size: 0.72rem;
                    font-weight: 700;
                    border: 1px solid rgba(197, 160, 89, 0.4);
                }
                .mfg-header__profile-name {
                    font-family: 'Montserrat', sans-serif;
                    font-size: 0.72rem;
                    font-weight: 600;
                    color: #1f2937;
                    max-width: 110px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .mfg-header__profile-caret {
                    font-size: 0.6rem;
                    color: #9ca3af;
                    transition: transform 0.2s ease;
                }
                .mfg-header__profile-caret--open {
                    transform: rotate(180deg);
                    color: #C5A059;
                }
                .mfg-profile-dropdown {
                    position: absolute;
                    top: calc(100% + 12px);
                    right: 0;
                    background: #ffffff;
                    border: 1px solid rgba(0, 0, 0, 0.08);
                    border-radius: 14px;
                    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.1);
                    min-width: 220px;
                    z-index: 1100;
                    overflow: hidden;
                    padding: 6px 0;
                    animation: mfgProfileDropIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes mfgProfileDropIn {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .mfg-profile-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 16px 8px;
                }
                .mfg-profile-header__avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: #111114;
                    color: #C5A059;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Montserrat', sans-serif;
                    font-size: 0.8rem;
                    font-weight: 700;
                    border: 1px solid rgba(197, 160, 89, 0.3);
                }
                .mfg-profile-header__meta {
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .mfg-profile-header__name {
                    font-family: 'Montserrat', sans-serif;
                    font-size: 0.76rem;
                    font-weight: 600;
                    color: #111827;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .mfg-profile-header__email {
                    font-family: 'Montserrat', sans-serif;
                    font-size: 0.65rem;
                    color: #9ca3af;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .mfg-profile-link {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 9px 16px;
                    font-family: 'Montserrat', sans-serif;
                    font-size: 0.75rem;
                    color: #374151;
                    text-decoration: none;
                    transition: all 0.15s ease;
                }
                .mfg-profile-link:hover {
                    background: #f9fafb;
                    color: #111827;
                }
                .mfg-profile-link:hover i {
                    color: #C5A059;
                }
                .mfg-profile-link i {
                    width: 16px;
                    text-align: center;
                    color: #9ca3af;
                    font-size: 0.78rem;
                }
                .mfg-profile-divider {
                    height: 1px;
                    background: #f3f4f6;
                    margin: 4px 0;
                }
                .mfg-profile-logout {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 9px 16px;
                    font-family: 'Montserrat', sans-serif;
                    font-size: 0.75rem;
                    color: #dc2626;
                    background: transparent;
                    border: none;
                    width: 100%;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.15s ease;
                }
                .mfg-profile-logout:hover {
                    background: #fef2f2;
                    color: #b91c1c;
                }
                .mfg-header__hamburger {
                    display: none;
                    background: none;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 1.1rem;
                    cursor: pointer;
                    color: #1f2937;
                    padding: 6px 10px;
                    transition: all 0.2s;
                }

                /* Mobile Drawer */
                .mfg-mobile-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.65);
                    backdrop-filter: blur(8px);
                    z-index: 9999;
                    display: flex;
                    justify-content: flex-end;
                    animation: mfgFadeIn 0.2s ease;
                }
                .mfg-mobile-drawer {
                    width: 82%;
                    max-width: 320px;
                    height: 100%;
                    background: #ffffff;
                    display: flex;
                    flex-direction: column;
                    box-shadow: -10px 0 30px rgba(0,0,0,0.15);
                    animation: mfgSlideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes mfgSlideLeft {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .mfg-drawer__header {
                    padding: 18px 20px;
                    border-bottom: 1px solid #e5e7eb;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .mfg-drawer__content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                }
                .mfg-drawer__section-title {
                    font-family: 'Montserrat', sans-serif;
                    font-size: 0.62rem;
                    font-weight: 700;
                    letter-spacing: 1.2px;
                    text-transform: uppercase;
                    color: #C5A059;
                    margin: 14px 0 6px 8px;
                }
                .mfg-drawer__link {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 9px 12px;
                    border-radius: 8px;
                    color: #374151;
                    font-family: 'Montserrat', sans-serif;
                    font-size: 0.78rem;
                    text-decoration: none;
                    transition: all 0.15s;
                    margin-bottom: 2px;
                }
                .mfg-drawer__link--active {
                    background: #111114;
                    color: #ffffff;
                    font-weight: 600;
                }
                .mfg-drawer__link--active i {
                    color: #C5A059;
                }

                @media (max-width: 1024px) {
                    .mfg-header__nav {
                        display: none;
                    }
                    .mfg-header__hamburger {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .mfg-header__profile-name {
                        display: none;
                    }
                }
            `}</style>

            <div className="mfg-header__inner">
                {/* Brand & Manufacturer Badge */}
                <div className="mfg-header__left" onClick={() => navigate('/mfg')} title="ASAT Manufacturer Portal">
                    <img
                        src="/logo.png"
                        alt="ASAT Designer Paradise"
                        className="mfg-header__logo-img"
                    />
                    <div className="mfg-header__badge">
                        <span className="mfg-header__badge-tag">MANUFACTURER</span>
                        <span className="mfg-header__badge-title">PORTAL</span>
                    </div>
                </div>

                {/* Capsule Navigation with Dropdown Groups */}
                <nav className="mfg-header__nav">
                    <div className="mfg-header__nav-capsule">
                        {MFG_NAV_GROUPS.map(group => {
                            const active = isGroupActive(group);

                            if (group.exact) {
                                return (
                                    <NavLink
                                        key={group.id}
                                        to={group.to}
                                        end
                                        className={({ isActive }) => `mfg-nav__link ${isActive ? 'mfg-nav__link--active' : ''}`}
                                    >
                                        <i className={`${group.icon} mfg-nav__icon`}></i>
                                        <span>{group.label}</span>
                                    </NavLink>
                                );
                            }

                            return (
                                <div
                                    key={group.id}
                                    className="mfg-nav__item"
                                    onMouseEnter={() => handleMouseEnter(group.id)}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <button
                                        type="button"
                                        className={`mfg-nav__link ${active ? 'mfg-nav__link--active' : ''}`}
                                        onClick={() => setActiveDropdown(activeDropdown === group.id ? null : group.id)}
                                    >
                                        <i className={`${group.icon} mfg-nav__icon`}></i>
                                        <span>{group.label}</span>
                                        <i className={`fas fa-chevron-down mfg-nav__chevron ${activeDropdown === group.id ? 'mfg-nav__chevron--open' : ''}`}></i>
                                    </button>

                                    {activeDropdown === group.id && (
                                        <div className="mfg-dropdown-menu">
                                            {group.children.map(child => {
                                                const childActive = location.pathname === child.to || location.pathname.startsWith(child.to + '/');
                                                return (
                                                    <Link
                                                        key={child.to}
                                                        to={child.to}
                                                        className={`mfg-dropdown-item ${childActive ? 'mfg-dropdown-item--active' : ''}`}
                                                        onClick={() => setActiveDropdown(null)}
                                                    >
                                                        <i className={`${child.icon} mfg-dropdown-item__icon`}></i>
                                                        <div className="mfg-dropdown-item__content">
                                                            <span className="mfg-dropdown-item__label">{child.label}</span>
                                                            {child.desc && <span className="mfg-dropdown-item__desc">{child.desc}</span>}
                                                        </div>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </nav>

                {/* Right Profile & Actions */}
                <div className="mfg-header__right">
                    <div className="mfg-header__profile" ref={profileRef}>
                        <button
                            type="button"
                            className={`mfg-header__profile-pill ${profileOpen ? 'mfg-header__profile-pill--active' : ''}`}
                            onClick={() => setProfileOpen(p => !p)}
                            title="Facility Menu"
                        >
                            <div className="mfg-header__avatar-badge">
                                {initial}
                            </div>
                            <span className="mfg-header__profile-name">
                                {displayName}
                            </span>
                            <i className={`fas fa-chevron-down mfg-header__profile-caret ${profileOpen ? 'mfg-header__profile-caret--open' : ''}`}></i>
                        </button>

                        {profileOpen && (
                            <div className="mfg-profile-dropdown">
                                <div className="mfg-profile-header">
                                    <div className="mfg-profile-header__avatar">{initial}</div>
                                    <div className="mfg-profile-header__meta">
                                        <span className="mfg-profile-header__name">{displayName}</span>
                                        <span className="mfg-profile-header__email">{email}</span>
                                    </div>
                                </div>
                                <div className="mfg-profile-divider"></div>
                                <Link to="/mfg/profile" className="mfg-profile-link" onClick={() => setProfileOpen(false)}>
                                    <i className="fas fa-industry"></i>
                                    <span>Facility Profile</span>
                                </Link>
                                <Link to="/mfg/wallet" className="mfg-profile-link" onClick={() => setProfileOpen(false)}>
                                    <i className="fas fa-wallet"></i>
                                    <span>Earnings &amp; Wallet</span>
                                </Link>
                                <Link to="/mfg/support" className="mfg-profile-link" onClick={() => setProfileOpen(false)}>
                                    <i className="fas fa-headset"></i>
                                    <span>Help &amp; Support</span>
                                </Link>
                                <div className="mfg-profile-divider"></div>
                                <button
                                    type="button"
                                    className="mfg-profile-logout"
                                    onClick={async () => {
                                        setProfileOpen(false);
                                        try {
                                            await logout();
                                            navigate('/mfg/login');
                                        } catch (err) {
                                            console.error('Logout error:', err);
                                        }
                                    }}
                                >
                                    <i className="fas fa-power-off"></i>
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        className="mfg-header__hamburger"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Open Navigation Menu"
                    >
                        <i className="fas fa-bars"></i>
                    </button>
                </div>
            </div>

            {/* Mobile Drawer */}
            {mobileOpen && (
                <div className="mfg-mobile-overlay" onClick={() => setMobileOpen(false)}>
                    <div className="mfg-mobile-drawer" onClick={e => e.stopPropagation()}>
                        <div className="mfg-drawer__header">
                            <div>
                                <div style={{ fontFamily: 'Montserrat', fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>
                                    Manufacturer Portal
                                </div>
                                <div style={{ fontSize: '0.68rem', color: '#6b7280', fontFamily: 'Montserrat' }}>
                                    {email}
                                </div>
                            </div>
                            <button
                                style={{ background: 'none', border: 'none', color: '#374151', fontSize: '1.2rem', cursor: 'pointer' }}
                                onClick={() => setMobileOpen(false)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="mfg-drawer__content">
                            <NavLink
                                to="/mfg"
                                end
                                className={({ isActive }) => `mfg-drawer__link ${isActive ? 'mfg-drawer__link--active' : ''}`}
                                onClick={() => setMobileOpen(false)}
                            >
                                <i className="fas fa-chart-pie" style={{ width: 18 }}></i>
                                <span>Dashboard</span>
                            </NavLink>

                            {MFG_NAV_GROUPS.filter(g => !g.exact).map(group => (
                                <div key={group.id}>
                                    <div className="mfg-drawer__section-title">{group.label}</div>
                                    {group.children.map(child => (
                                        <NavLink
                                            key={child.to}
                                            to={child.to}
                                            className={({ isActive }) => `mfg-drawer__link ${isActive ? 'mfg-drawer__link--active' : ''}`}
                                            onClick={() => setMobileOpen(false)}
                                        >
                                            <i className={child.icon} style={{ width: 18 }}></i>
                                            <span>{child.label}</span>
                                        </NavLink>
                                    ))}
                                </div>
                            ))}

                            <div className="mfg-drawer__section-title">Account</div>
                            <NavLink
                                to="/mfg/wallet"
                                className={({ isActive }) => `mfg-drawer__link ${isActive ? 'mfg-drawer__link--active' : ''}`}
                                onClick={() => setMobileOpen(false)}
                            >
                                <i className="fas fa-wallet" style={{ width: 18 }}></i>
                                <span>Wallet &amp; Payouts</span>
                            </NavLink>
                            <NavLink
                                to="/mfg/profile"
                                className={({ isActive }) => `mfg-drawer__link ${isActive ? 'mfg-drawer__link--active' : ''}`}
                                onClick={() => setMobileOpen(false)}
                            >
                                <i className="fas fa-industry" style={{ width: 18 }}></i>
                                <span>Facility Profile</span>
                            </NavLink>
                            <NavLink
                                to="/mfg/support"
                                className={({ isActive }) => `mfg-drawer__link ${isActive ? 'mfg-drawer__link--active' : ''}`}
                                onClick={() => setMobileOpen(false)}
                            >
                                <i className="fas fa-headset" style={{ width: 18 }}></i>
                                <span>Support Desk</span>
                            </NavLink>
                        </div>

                        <div style={{ padding: 16, borderTop: '1px solid #e5e7eb' }}>
                            <button
                                type="button"
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    padding: '10px 14px',
                                    background: '#fef2f2',
                                    color: '#dc2626',
                                    border: '1px solid #fecaca',
                                    borderRadius: 8,
                                    fontFamily: 'Montserrat',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                                onClick={async () => {
                                    setMobileOpen(false);
                                    await logout();
                                    navigate('/mfg/login');
                                }}
                            >
                                <i className="fas fa-power-off"></i>
                                <span>Sign Out of Portal</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}

export default MfgHeader;
