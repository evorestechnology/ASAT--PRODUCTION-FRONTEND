import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navSections = [
    {
        title: 'Overview',
        links: [
            { to: '/master', label: 'Dashboard', icon: 'fas fa-chart-pie', end: true },
            { to: '/master/orders', label: 'Orders', icon: 'fas fa-receipt' },
            { to: '/master/activity', label: 'Live Activity', icon: 'fas fa-bolt' },
        ]
    },
    {
        title: 'Partners & Network',
        links: [
            { to: '/master/designers', label: 'Designers', icon: 'fas fa-paint-brush' },
            { to: '/master/manufacturers', label: 'Manufacturers', icon: 'fas fa-industry' },
        ]
    },
    {
        title: 'Catalog Management',
        links: [
            { to: '/master/designs', label: 'Designs', icon: 'fas fa-palette' },
            { to: '/master/products', label: 'Base Products', icon: 'fas fa-boxes' },
            { to: '/master/categories', label: 'Categories', icon: 'fas fa-tags' },
        ]
    },
    {
        title: 'Financials',
        links: [
            { to: '/master/wallet', label: 'Master Wallet', icon: 'fas fa-wallet' },
            { to: '/master/withdrawals', label: 'Withdrawals', icon: 'fas fa-hand-holding-usd' },
            { to: '/master/finance', label: 'Finance & Analytics', icon: 'fas fa-calculator' },
        ]
    },
    {
        title: 'Operations',
        links: [
            { to: '/master/delivery', label: 'Delivery & Logistics', icon: 'fas fa-truck' },
            { to: '/master/tickets', label: 'Support Tickets', icon: 'fas fa-headset' },
            { to: '/master/tutorials', label: 'Tutorials', icon: 'fas fa-graduation-cap' },
        ]
    },
    {
        title: 'Administration',
        links: [
            { to: '/master/settings', label: 'Platform Settings', icon: 'fas fa-cog' },
            { to: '/master/profile', label: 'Admin Profile', icon: 'fas fa-user-shield' },
        ]
    }
];

// Flat list for the main scrollable bar
const allNavLinks = navSections.flatMap(section => section.links);

function MasterHeader() {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, profile, user } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const navRef = useRef(null);

    const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Master Admin';
    const email = profile?.email || user?.email || 'admin@asat.com';

    // Track scroll for subtle shadow elevation
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Auto-scroll active link into view
    useEffect(() => {
        if (!navRef.current) return;
        const activeEl = navRef.current.querySelector('.mst-nav__link--active');
        if (activeEl) {
            activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    }, [location.pathname]);

    const scrollNav = (direction) => {
        if (navRef.current) {
            navRef.current.scrollBy({ left: direction * 240, behavior: 'smooth' });
        }
    };

    return (
        <header className={`mst-header ${scrolled ? 'mst-header--scrolled' : ''}`}>
            <style>{`
                .mst-header {
                    background: #0d0d0f;
                    border-bottom: 1px solid rgba(197, 160, 89, 0.2);
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
                }
                .mst-header--scrolled {
                    box-shadow: 0 10px 30px rgba(0,0,0,0.7);
                    border-bottom-color: rgba(197, 160, 89, 0.35);
                }
                .mst-topbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 3%;
                    background: linear-gradient(180deg, #131316 0%, #0d0d0f 100%);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }
                .mst-topbar__left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .mst-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 12px;
                    background: rgba(197, 160, 89, 0.12);
                    border: 1px solid rgba(197, 160, 89, 0.3);
                    border-radius: 20px;
                    color: var(--gold, #C5A059);
                    font-family: 'Montserrat', sans-serif;
                    font-size: 0.65rem;
                    font-weight: 700;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                }
                .mst-live-dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: #10b981;
                    box-shadow: 0 0 8px #10b981;
                    animation: mst-pulse 2s infinite;
                }
                @keyframes mst-pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.3); opacity: 0.6; }
                }
                .mst-topbar__brand {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    cursor: pointer;
                    user-select: none;
                    transition: transform 0.2s ease;
                }
                .mst-topbar__brand:hover {
                    transform: scale(1.02);
                }
                .mst-brand__title {
                    font-family: 'Cinzel', serif;
                    font-size: 1.35rem;
                    font-weight: 800;
                    letter-spacing: 4px;
                    color: #ffffff;
                    text-shadow: 0 2px 10px rgba(197, 160, 89, 0.3);
                }
                .mst-brand__title span {
                    color: var(--gold, #C5A059);
                }
                .mst-brand__tagline {
                    font-family: 'Montserrat', sans-serif;
                    font-size: 0.55rem;
                    letter-spacing: 3.5px;
                    text-transform: uppercase;
                    color: rgba(197, 160, 89, 0.85);
                    margin-top: 1px;
                }
                .mst-topbar__right {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }
                .mst-user-pill {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 5px 12px 5px 6px;
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 30px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-decoration: none;
                }
                .mst-user-pill:hover {
                    background: rgba(197, 160, 89, 0.1);
                    border-color: rgba(197, 160, 89, 0.35);
                }
                .mst-user-avatar {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #C5A059, #8c6a28);
                    color: #000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.75rem;
                    font-weight: 700;
                    font-family: 'Montserrat', sans-serif;
                }
                .mst-user-info {
                    display: flex;
                    flex-direction: column;
                }
                .mst-user-name {
                    font-family: 'Montserrat', sans-serif;
                    font-size: 0.72rem;
                    font-weight: 600;
                    color: #f3f4f6;
                    letter-spacing: 0.3px;
                }
                .mst-user-role {
                    font-family: 'Montserrat', sans-serif;
                    font-size: 0.58rem;
                    color: rgba(197, 160, 89, 0.75);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .mst-btn-logout {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 7px 14px;
                    background: rgba(239, 68, 68, 0.08);
                    border: 1px solid rgba(239, 68, 68, 0.25);
                    border-radius: 6px;
                    color: #f87171;
                    font-family: 'Montserrat', sans-serif;
                    font-size: 0.68rem;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .mst-btn-logout:hover {
                    background: rgba(239, 68, 68, 0.2);
                    border-color: rgba(239, 68, 68, 0.5);
                    color: #ffffff;
                }
                .mst-hamburger-btn {
                    display: none;
                    background: none;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    color: #ffffff;
                    font-size: 1.1rem;
                    padding: 6px 10px;
                    cursor: pointer;
                }

                /* ── Navigation Strip ── */
                .mst-nav-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                    background: #09090b;
                    padding: 0 1%;
                }
                .mst-nav-arrow {
                    background: #09090b;
                    border: none;
                    color: rgba(197, 160, 89, 0.6);
                    font-size: 0.85rem;
                    padding: 10px 8px;
                    cursor: pointer;
                    transition: color 0.2s;
                    z-index: 2;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .mst-nav-arrow:hover {
                    color: var(--gold, #C5A059);
                }
                .mst-nav {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    overflow-x: auto;
                    scroll-behavior: smooth;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                    padding: 6px 4px;
                    flex: 1;
                }
                .mst-nav::-webkit-scrollbar {
                    display: none;
                }
                .mst-nav__link {
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    padding: 8px 14px;
                    border-radius: 6px;
                    font-family: 'Montserrat', sans-serif;
                    font-size: 0.7rem;
                    font-weight: 500;
                    letter-spacing: 0.4px;
                    color: #9ca3af;
                    text-decoration: none;
                    white-space: nowrap;
                    transition: all 0.2s ease;
                    border: 1px solid transparent;
                }
                .mst-nav__link i {
                    font-size: 0.78rem;
                    color: rgba(255, 255, 255, 0.35);
                    transition: color 0.2s ease;
                }
                .mst-nav__link:hover {
                    color: #ffffff;
                    background: rgba(255, 255, 255, 0.05);
                }
                .mst-nav__link:hover i {
                    color: var(--gold, #C5A059);
                }
                .mst-nav__link--active {
                    color: #000000 !important;
                    background: linear-gradient(135deg, #e6ca85 0%, #C5A059 100%) !important;
                    font-weight: 700 !important;
                    box-shadow: 0 2px 10px rgba(197, 160, 89, 0.3);
                }
                .mst-nav__link--active i {
                    color: #000000 !important;
                }

                /* ── Mobile Drawer ── */
                .mst-mobile-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(8px);
                    z-index: 9999;
                    display: flex;
                    justify-content: flex-end;
                    animation: mst-fade 0.2s ease;
                }
                @keyframes mst-fade {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .mst-mobile-drawer {
                    width: 82%;
                    max-width: 340px;
                    height: 100%;
                    background: #111114;
                    border-left: 1px solid rgba(197, 160, 89, 0.25);
                    display: flex;
                    flex-direction: column;
                    box-shadow: -10px 0 40px rgba(0,0,0,0.9);
                    animation: mst-slide 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes mst-slide {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .mst-drawer__header {
                    padding: 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
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
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                    color: var(--gold, #C5A059);
                    margin: 18px 0 8px 10px;
                }
                .mst-drawer__link {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 14px;
                    border-radius: 8px;
                    color: #d1d5db;
                    font-family: 'Montserrat', sans-serif;
                    font-size: 0.82rem;
                    text-decoration: none;
                    transition: all 0.2s;
                    margin-bottom: 4px;
                }
                .mst-drawer__link i {
                    width: 18px;
                    color: rgba(255, 255, 255, 0.4);
                }
                .mst-drawer__link--active {
                    background: rgba(197, 160, 89, 0.15);
                    border: 1px solid rgba(197, 160, 89, 0.3);
                    color: var(--gold, #C5A059);
                    font-weight: 600;
                }
                .mst-drawer__link--active i {
                    color: var(--gold, #C5A059);
                }
                .mst-drawer__footer {
                    padding: 16px;
                    border-top: 1px solid rgba(255, 255, 255, 0.08);
                    background: #09090b;
                }

                @media (max-width: 1024px) {
                    .mst-hamburger-btn { display: block; }
                    .mst-topbar__role, .mst-user-info { display: none; }
                    .mst-nav-wrapper { display: none; }
                }
                @media (min-width: 1025px) {
                    .mst-mobile-overlay { display: none !important; }
                }
            `}</style>

            {/* ── Top Bar ── */}
            <div className="mst-topbar">
                <div className="mst-topbar__left">
                    <div className="mst-badge mst-topbar__role">
                        <span className="mst-live-dot"></span>
                        Master Control
                    </div>
                </div>

                <div className="mst-topbar__brand" onClick={() => navigate('/master')}>
                    <div className="mst-brand__title">
                        AS SIMPLE AS <span>THAT</span>
                    </div>
                    <div className="mst-brand__tagline">
                        ★ Master Administration Portal ★
                    </div>
                </div>

                <div className="mst-topbar__right">
                    <NavLink to="/master/profile" className="mst-user-pill" title="View Master Profile & Security">
                        <div className="mst-user-avatar">
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="mst-user-info">
                            <span className="mst-user-name">{displayName}</span>
                            <span className="mst-user-role">Administrator</span>
                        </div>
                    </NavLink>

                    <button className="mst-btn-logout" onClick={async () => {
                        try {
                            await logout();
                            navigate('/master/login');
                        } catch (err) {
                            console.error('Logout error:', err);
                        }
                    }}>
                        <i className="fas fa-power-off"></i>
                        <span>Logout</span>
                    </button>

                    <button className="mst-hamburger-btn" onClick={() => setMobileOpen(true)} title="Open Navigation Menu">
                        <i className="fas fa-bars"></i>
                    </button>
                </div>
            </div>

            {/* ── Horizontal Scrollable Navigation Strip (Desktop) ── */}
            <div className="mst-nav-wrapper">
                <button className="mst-nav-arrow" onClick={() => scrollNav(-1)} title="Scroll Left">
                    <i className="fas fa-chevron-left"></i>
                </button>

                <nav className="mst-nav" ref={navRef}>
                    {allNavLinks.map(l => (
                        <NavLink
                            key={l.to}
                            to={l.to}
                            end={l.end}
                            className={({ isActive }) => `mst-nav__link ${isActive ? 'mst-nav__link--active' : ''}`}
                        >
                            <i className={l.icon}></i>
                            <span>{l.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <button className="mst-nav-arrow" onClick={() => scrollNav(1)} title="Scroll Right">
                    <i className="fas fa-chevron-right"></i>
                </button>
            </div>

            {/* ── Mobile Sidebar Drawer ── */}
            {mobileOpen && (
                <div className="mst-mobile-overlay" onClick={() => setMobileOpen(false)}>
                    <div className="mst-mobile-drawer" onClick={e => e.stopPropagation()}>
                        <div className="mst-drawer__header">
                            <div>
                                <div style={{ fontFamily: 'Cinzel', fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                                    ASAT <span>ADMIN</span>
                                </div>
                                <div style={{ fontSize: '0.68rem', color: '#888', fontFamily: 'Montserrat' }}>
                                    {email}
                                </div>
                            </div>
                            <button
                                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
                                onClick={() => setMobileOpen(false)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="mst-drawer__content">
                            {navSections.map(section => (
                                <div key={section.title}>
                                    <div className="mst-drawer__section-title">{section.title}</div>
                                    {section.links.map(l => (
                                        <NavLink
                                            key={l.to}
                                            to={l.to}
                                            end={l.end}
                                            className={({ isActive }) => `mst-drawer__link ${isActive ? 'mst-drawer__link--active' : ''}`}
                                            onClick={() => setMobileOpen(false)}
                                        >
                                            <i className={l.icon}></i>
                                            <span>{l.label}</span>
                                        </NavLink>
                                    ))}
                                </div>
                            ))}
                        </div>

                        <div className="mst-drawer__footer">
                            <button
                                className="mst-btn-logout"
                                style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
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
