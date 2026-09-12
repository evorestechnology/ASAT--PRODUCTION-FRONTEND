import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_GROUPS = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'fas fa-chart-pie',
        to: '/master',
        exact: true
    },
    {
        id: 'orders',
        label: 'Orders',
        icon: 'fas fa-receipt',
        children: [
            { to: '/master/orders', label: 'Order History', icon: 'fas fa-receipt', desc: 'Manage all order records' },
            { to: '/master/activity', label: 'Live Activity', icon: 'fas fa-bolt', desc: 'Real-time production stream' },
            { to: '/master/delivery', label: 'Delivery & Logistics', icon: 'fas fa-truck', desc: 'Couriers & tracking' },
        ]
    },
    {
        id: 'network',
        label: 'Network',
        icon: 'fas fa-users-cog',
        children: [
            { to: '/master/designers', label: 'Designers', icon: 'fas fa-paint-brush', desc: 'Profiles, rankings & cuts' },
            { to: '/master/manufacturers', label: 'Manufacturers', icon: 'fas fa-industry', desc: 'Production facilities & rates' },
        ]
    },
    {
        id: 'catalog',
        label: 'Catalog',
        icon: 'fas fa-boxes',
        children: [
            { to: '/master/designs', label: 'Designs', icon: 'fas fa-palette', desc: 'Community submissions' },
            { to: '/master/products', label: 'Base Products', icon: 'fas fa-tshirt', desc: 'Garments & specs' },
            { to: '/master/categories', label: 'Categories', icon: 'fas fa-tags', desc: 'Taxonomy & tags' },
            { to: '/master/catalogue', label: 'Catalogue Items', icon: 'fas fa-book-open', desc: 'Item repository' },
        ]
    },
    {
        id: 'financials',
        label: 'Financials',
        icon: 'fas fa-coins',
        children: [
            { to: '/master/wallet', label: 'Master Wallet', icon: 'fas fa-wallet', desc: 'Balances & deposits' },
            { to: '/master/withdrawals', label: 'Withdrawals', icon: 'fas fa-hand-holding-usd', desc: 'Pending payout requests' },
            { to: '/master/finance', label: 'Finance & Analytics', icon: 'fas fa-chart-line', desc: 'Margins & cost breakdown' },
            { to: '/master/gst-report', label: 'GST Statutory Report', icon: 'fas fa-file-invoice-dollar', desc: 'Tax filings & invoices' },
        ]
    },
    {
        id: 'operations',
        label: 'Operations',
        icon: 'fas fa-headset',
        children: [
            { to: '/master/tickets', label: 'Support Tickets', icon: 'fas fa-headset', desc: 'Customer & partner issues' },
            { to: '/master/tutorials', label: 'Tutorials & Guides', icon: 'fas fa-graduation-cap', desc: 'Documentation & videos' },
        ]
    }
];

function MasterHeader() {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, profile, user } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const dropdownTimeoutRef = useRef(null);
    const profileRef = useRef(null);

    const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Master Admin';
    const email = profile?.email || user?.email || 'admin@asat.com';
    const initial = displayName ? displayName.charAt(0).toUpperCase() : 'M';

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, []);

    // Close on route change
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
        <header className="mst-header">
            <style>{`
                .mst-header {
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
                .mst-header__inner {
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
                .mst-header__left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    cursor: pointer;
                    user-select: none;
                    transition: opacity 0.2s ease;
                }
                .mst-header__left:hover {
                    opacity: 0.9;
                }
                .mst-header__logo-img {
                    height: 26px;
                    width: auto;
                    object-fit: contain;
                    display: block;
                }
                .mst-header__badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 3px 10px 3px 6px;
                    background: rgba(197, 160, 89, 0.08);
                    border: 1px solid rgba(197, 160, 89, 0.25);
                    border-radius: 20px;
                    line-height: 1;
                }
                .mst-header__badge-tag {
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
                .mst-header__badge-title {
                    font-family: 'Montserrat', sans-serif;
                    font-size: 0.68rem;
                    font-weight: 600;
                    color: #1f2937;
                    letter-spacing: 0.4px;
                    text-transform: uppercase;
                }
                .mst-header__nav {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex: 1;
                    margin: 0 16px;
                }
                .mst-header__nav-capsule {
                    display: inline-flex;
                    align-items: center;
                    gap: 3px;
                    background: #f4f4f6;
                    padding: 4px;
                    border-radius: 100px;
                    border: 1px solid rgba(0, 0, 0, 0.05);
                }
                .mst-nav__item {
                    position: relative;
                }
                .mst-nav__link {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 13px;
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
                .mst-nav__link:hover {
                    color: #111827;
                    background: rgba(255, 255, 255, 0.7);
                }
                .mst-nav__link--active {
                    color: #ffffff !important;
                    background: #111114 !important;
                    font-weight: 600 !important;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.16);
                }
                .mst-nav__link--active i {
                    color: #C5A059 !important;
                }
                .mst-nav__icon {
                    font-size: 0.7rem;
                    color: #9ca3af;
                    transition: color 0.2s ease;
                }
                .mst-nav__chevron {
                    font-size: 0.55rem;
                    color: #9ca3af;
                    margin-left: 2px;
                    transition: transform 0.2s ease;
                }
                .mst-nav__chevron--open {
                    transform: rotate(180deg);
                }

                /* ── Floating Dropdown Menu ── */
                .mst-dropdown-menu {
                    position: absolute;
                    top: calc(100% + 8px);
                    left: 50%;
                    transform: translateX(-50%);
                    background: #ffffff;
                    border: 1px solid rgba(0, 0, 0, 0.08);
                    border-radius: 14px;
                    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.1);
                    min-width: 220px;
                    padding: 6px;
                    z-index: 1050;
                    animation: mstDropIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes mstDropIn {
                    from { opacity: 0; transform: translate(-50%, -6px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
                .mst-dropdown-item {
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
                .mst-dropdown-item:hover {
                    background: #f9fafb;
                    color: #111827;
                }
                .mst-dropdown-item--active {
                    background: rgba(197, 160, 89, 0.1) !important;
                    color: #927333 !important;
                    font-weight: 600;
                }
                .mst-dropdown-item--active i {
                    color: #C5A059 !important;
                }
                .mst-dropdown-item__icon {
                    width: 16px;
                    text-align: center;
                    font-size: 0.75rem;
                    color: #9ca3af;
                }
                .mst-dropdown-item__content {
                    display: flex;
                    flex-direction: column;
                }
                .mst-dropdown-item__label {
                    font-weight: 600;
                }
                .mst-dropdown-item__desc {
                    font-size: 0.62rem;
                    color: #9ca3af;
                    margin-top: 1px;
                }

                /* ── Profile Area ── */
                .mst-header__right {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .mst-header__profile {
                    position: relative;
                }
                .mst-header__profile-pill {
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
                .mst-header__profile-pill:hover,
                .mst-header__profile-pill--active {
                    border-color: #C5A059;
                    box-shadow: 0 2px 10px rgba(197, 160, 89, 0.18);
                }
                .mst-header__avatar-badge {
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
                .mst-header__profile-name {
                    font-family: 'Montserrat', sans-serif;
                    font-size: 0.72rem;
                    font-weight: 600;
                    color: #1f2937;
                    max-width: 110px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .mst-header__profile-caret {
                    font-size: 0.6rem;
                    color: #9ca3af;
                    transition: transform 0.2s ease;
                }
                .mst-header__profile-caret--open {
                    transform: rotate(180deg);
                    color: #C5A059;
                }
                .mst-profile-dropdown {
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
                    animation: mstProfileDropIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes mstProfileDropIn {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .mst-profile-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 16px 8px;
                }
                .mst-profile-header__avatar {
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
                .mst-profile-header__meta {
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .mst-profile-header__name {
                    font-family: 'Montserrat', sans-serif;
                    font-size: 0.76rem;
                    font-weight: 600;
                    color: #111827;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .mst-profile-header__email {
                    font-family: 'Montserrat', sans-serif;
                    font-size: 0.65rem;
                    color: #9ca3af;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .mst-profile-link {
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
                .mst-profile-link:hover {
                    background: #f9fafb;
                    color: #111827;
                }
                .mst-profile-link:hover i {
                    color: #C5A059;
                }
                .mst-profile-link i {
                    width: 16px;
                    text-align: center;
                    color: #9ca3af;
                    font-size: 0.78rem;
                }
                .mst-profile-divider {
                    height: 1px;
                    background: #f3f4f6;
                    margin: 4px 0;
                }
                .mst-profile-logout {
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
                .mst-profile-logout:hover {
                    background: #fef2f2;
                    color: #b91c1c;
                }
                .mst-header__hamburger {
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

                /* ── Mobile Drawer ── */
                .mst-mobile-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.65);
                    backdrop-filter: blur(8px);
                    z-index: 9999;
                    display: flex;
                    justify-content: flex-end;
                    animation: mstFadeIn 0.2s ease;
                }
                .mst-mobile-drawer {
                    width: 82%;
                    max-width: 320px;
                    height: 100%;
                    background: #ffffff;
                    display: flex;
                    flex-direction: column;
                    box-shadow: -10px 0 30px rgba(0,0,0,0.15);
                    animation: mstSlideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes mstSlideLeft {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .mst-drawer__header {
                    padding: 18px 20px;
                    border-bottom: 1px solid #e5e7eb;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .mst-drawer__content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                }
                .mst-drawer__section-title {
                    font-family: 'Montserrat', sans-serif;
                    font-size: 0.62rem;
                    font-weight: 700;
                    letter-spacing: 1.2px;
                    text-transform: uppercase;
                    color: #C5A059;
                    margin: 14px 0 6px 8px;
                }
                .mst-drawer__link {
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
                .mst-drawer__link--active {
                    background: #111114;
                    color: #ffffff;
                    font-weight: 600;
                }
                .mst-drawer__link--active i {
                    color: #C5A059;
                }

                @media (max-width: 1080px) {
                    .mst-header__nav {
                        display: none;
                    }
                    .mst-header__hamburger {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .mst-header__profile-name {
                        display: none;
                    }
                }
            `}</style>

            <div className="mst-header__inner">
                {/* Brand & Master Role Identity */}
                <div className="mst-header__left" onClick={() => navigate('/master')} title="ASAT Master Control Portal">
                    <img
                        src="/logo.png"
                        alt="ASAT Designer Paradise"
                        className="mst-header__logo-img"
                    />
                    <div className="mst-header__badge">
                        <span className="mst-header__badge-tag">MASTER</span>
                        <span className="mst-header__badge-title">CONTROL</span>
                    </div>
                </div>

                {/* Capsule Navigation with Dropdown Groups */}
                <nav className="mst-header__nav">
                    <div className="mst-header__nav-capsule">
                        {NAV_GROUPS.map(group => {
                            const active = isGroupActive(group);

                            if (group.exact) {
                                return (
                                    <NavLink
                                        key={group.id}
                                        to={group.to}
                                        end
                                        className={({ isActive }) => `mst-nav__link ${isActive ? 'mst-nav__link--active' : ''}`}
                                    >
                                        <i className={`${group.icon} mst-nav__icon`}></i>
                                        <span>{group.label}</span>
                                    </NavLink>
                                );
                            }

                            return (
                                <div
                                    key={group.id}
                                    className="mst-nav__item"
                                    onMouseEnter={() => handleMouseEnter(group.id)}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <button
                                        type="button"
                                        className={`mst-nav__link ${active ? 'mst-nav__link--active' : ''}`}
                                        onClick={() => setActiveDropdown(activeDropdown === group.id ? null : group.id)}
                                    >
                                        <i className={`${group.icon} mst-nav__icon`}></i>
                                        <span>{group.label}</span>
                                        <i className={`fas fa-chevron-down mst-nav__chevron ${activeDropdown === group.id ? 'mst-nav__chevron--open' : ''}`}></i>
                                    </button>

                                    {activeDropdown === group.id && (
                                        <div className="mst-dropdown-menu">
                                            {group.children.map(child => {
                                                const childActive = location.pathname === child.to || location.pathname.startsWith(child.to + '/');
                                                return (
                                                    <Link
                                                        key={child.to}
                                                        to={child.to}
                                                        className={`mst-dropdown-item ${childActive ? 'mst-dropdown-item--active' : ''}`}
                                                        onClick={() => setActiveDropdown(null)}
                                                    >
                                                        <i className={`${child.icon} mst-dropdown-item__icon`}></i>
                                                        <div className="mst-dropdown-item__content">
                                                            <span className="mst-dropdown-item__label">{child.label}</span>
                                                            {child.desc && <span className="mst-dropdown-item__desc">{child.desc}</span>}
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
                <div className="mst-header__right">
                    <div className="mst-header__profile" ref={profileRef}>
                        <button
                            type="button"
                            className={`mst-header__profile-pill ${profileOpen ? 'mst-header__profile-pill--active' : ''}`}
                            onClick={() => setProfileOpen(p => !p)}
                            title="Administrator Menu"
                        >
                            <div className="mst-header__avatar-badge">
                                {initial}
                            </div>
                            <span className="mst-header__profile-name">
                                {displayName}
                            </span>
                            <i className={`fas fa-chevron-down mst-header__profile-caret ${profileOpen ? 'mst-header__profile-caret--open' : ''}`}></i>
                        </button>

                        {profileOpen && (
                            <div className="mst-profile-dropdown">
                                <div className="mst-profile-header">
                                    <div className="mst-profile-header__avatar">{initial}</div>
                                    <div className="mst-profile-header__meta">
                                        <span className="mst-profile-header__name">{displayName}</span>
                                        <span className="mst-profile-header__email">{email}</span>
                                    </div>
                                </div>
                                <div className="mst-profile-divider"></div>
                                <Link to="/master/settings" className="mst-profile-link" onClick={() => setProfileOpen(false)}>
                                    <i className="fas fa-cog"></i>
                                    <span>Platform Settings</span>
                                </Link>
                                <Link to="/master/profile" className="mst-profile-link" onClick={() => setProfileOpen(false)}>
                                    <i className="fas fa-user-shield"></i>
                                    <span>Admin Security &amp; Profile</span>
                                </Link>
                                <div className="mst-profile-divider"></div>
                                <button
                                    type="button"
                                    className="mst-profile-logout"
                                    onClick={async () => {
                                        setProfileOpen(false);
                                        try {
                                            await logout();
                                            navigate('/master/login');
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
                        className="mst-header__hamburger"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Open Navigation Menu"
                    >
                        <i className="fas fa-bars"></i>
                    </button>
                </div>
            </div>

            {/* Mobile Drawer */}
            {mobileOpen && (
                <div className="mst-mobile-overlay" onClick={() => setMobileOpen(false)}>
                    <div className="mst-mobile-drawer" onClick={e => e.stopPropagation()}>
                        <div className="mst-drawer__header">
                            <div>
                                <div style={{ fontFamily: 'Montserrat', fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>
                                    Master Administration
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

                        <div className="mst-drawer__content">
                            <NavLink
                                to="/master"
                                end
                                className={({ isActive }) => `mst-drawer__link ${isActive ? 'mst-drawer__link--active' : ''}`}
                                onClick={() => setMobileOpen(false)}
                            >
                                <i className="fas fa-chart-pie" style={{ width: 18 }}></i>
                                <span>Dashboard</span>
                            </NavLink>

                            {NAV_GROUPS.filter(g => !g.exact).map(group => (
                                <div key={group.id}>
                                    <div className="mst-drawer__section-title">{group.label}</div>
                                    {group.children.map(child => (
                                        <NavLink
                                            key={child.to}
                                            to={child.to}
                                            className={({ isActive }) => `mst-drawer__link ${isActive ? 'mst-drawer__link--active' : ''}`}
                                            onClick={() => setMobileOpen(false)}
                                        >
                                            <i className={child.icon} style={{ width: 18 }}></i>
                                            <span>{child.label}</span>
                                        </NavLink>
                                    ))}
                                </div>
                            ))}

                            <div className="mst-drawer__section-title">Administration</div>
                            <NavLink
                                to="/master/settings"
                                className={({ isActive }) => `mst-drawer__link ${isActive ? 'mst-drawer__link--active' : ''}`}
                                onClick={() => setMobileOpen(false)}
                            >
                                <i className="fas fa-cog" style={{ width: 18 }}></i>
                                <span>Settings</span>
                            </NavLink>
                            <NavLink
                                to="/master/profile"
                                className={({ isActive }) => `mst-drawer__link ${isActive ? 'mst-drawer__link--active' : ''}`}
                                onClick={() => setMobileOpen(false)}
                            >
                                <i className="fas fa-user-shield" style={{ width: 18 }}></i>
                                <span>Admin Profile</span>
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
                                    navigate('/master/login');
                                }}
                            >
                                <i className="fas fa-power-off"></i>
                                <span>Sign Out of Master</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}

export default MasterHeader;
