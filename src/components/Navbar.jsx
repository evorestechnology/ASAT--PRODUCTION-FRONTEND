import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import ProfileDropdown from './ProfileDropdown';
import { useCurrency, SUPPORTED_CURRENCIES } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, profile, role } = useAuth();
    const { currency, setCurrency, activeCurrencies, globalCurrencies } = useCurrency();

    const [profileOpen, setProfileOpen]     = useState(false);
    const [mobileOpen, setMobileOpen]       = useState(false);
    const [searchOpen, setSearchOpen]       = useState(false);
    const [currencyOpen, setCurrencyOpen]   = useState(false);
    const [cartCount, setCartCount]         = useState(0);
    const [wishlistCount, setWishlistCount] = useState(0);
    const [navSearchTerm, setNavSearchTerm] = useState('');
    const [scrolled, setScrolled]           = useState(false);
    const [popularTags, setPopularTags]     = useState(['Oversized Tees', 'French Terry Hoodies', 'Acid Wash', 'Caps']);

    /* ── Fetch popular searches dynamically ── */
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/categories');
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.length > 0) {
                        const active = data
                            .filter(c => c.status === 'active' || c.status === undefined)
                            .map(c => c.name);
                        if (active.length > 0) {
                            setPopularTags(active.slice(0, 4));
                        }
                    }
                }
            } catch (err) {
                console.warn('Failed to fetch dynamic popular searches:', err);
            }
        };
        fetchCategories();
    }, []);

    const profilePopupRef     = useRef(null);
    const profileBtnRef       = useRef(null);
    const currencyDropdownRef = useRef(null);
    const searchInputRef       = useRef(null);

    const loggedIn = typeof window !== 'undefined' && localStorage.getItem('asat_loggedIn') === 'true';

    /* ── Scroll effect ── */
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    /* ── Cart / Wishlist counts ── */
    useEffect(() => {
        const update = () => {
            const isLoggedIn = localStorage.getItem('asat_loggedIn') === 'true';
            if (!isLoggedIn) { setCartCount(0); setWishlistCount(0); return; }
            const cart     = JSON.parse(localStorage.getItem('asat_cart')     || '[]');
            const wishlist = JSON.parse(localStorage.getItem('asat_wishlist') || '[]');
            setCartCount(cart.reduce((s, i) => s + (i.qty || 1), 0));
            setWishlistCount(wishlist.length);
        };
        update();
        window.addEventListener('cart_updated',     update);
        window.addEventListener('wishlist_updated', update);
        window.addEventListener('storage',          update);
        return () => {
            window.removeEventListener('cart_updated',     update);
            window.removeEventListener('wishlist_updated', update);
            window.removeEventListener('storage',          update);
        };
    }, []);

    /* ── Close dropdowns on outside click ── */
    useEffect(() => {
        const handler = (e) => {
            if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(e.target)) setCurrencyOpen(false);
            if (profilePopupRef.current && !profilePopupRef.current.contains(e.target) && e.target !== profileBtnRef.current) setProfileOpen(false);
        };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, []);

    /* ── Lock body scroll when mobile drawer is open ── */
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    /* ── Auto-focus search input ── */
    useEffect(() => {
        if (searchOpen && searchInputRef.current) searchInputRef.current.focus();
    }, [searchOpen]);

    /* ── Close mobile drawer on route change ── */
    useEffect(() => { setMobileOpen(false); }, [location.pathname]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (navSearchTerm.trim()) {
            navigate(`/products?search=${encodeURIComponent(navSearchTerm.trim())}`);
            setNavSearchTerm('');
            setSearchOpen(false);
        }
    };

    const rawCurrencySymbol = ((globalCurrencies && globalCurrencies[currency]) || SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES['INR']).symbol.trim();
    const currencySymbol = (rawCurrencySymbol.toLowerCase() === 'rs' || currency === 'INR') ? '₹' : rawCurrencySymbol;

    return (
        <>
            <style>{`
                /* ── FIXED BLUORNG NAVIGATION BAR (Always visible at any position) ── */
                .blu-header {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 9999;
                    height: 70px;
                    background: rgba(255, 255, 255, 0.98);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    width: 100%;
                    max-width: 100vw;
                    box-sizing: border-box;
                    transition: border-color 0.25s ease, box-shadow 0.25s ease;
                    border-bottom: 1px solid #EBEBEB;
                }
                .blu-header--scrolled {
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
                }
                .blu-header-spacer {
                    height: 70px;
                    width: 100%;
                    display: block;
                }
                .blu-header__inner {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    height: 100%;
                    width: 100%;
                    max-width: 100%;
                    padding: 0 clamp(16px, 3vw, 40px);
                    box-sizing: border-box;
                }

                /* ── LEFT ITEMS: Logo and nav links ── */
                .blu-header__left {
                    display: flex;
                    align-items: center;
                    gap: 32px;
                }
                .blu-header__nav-links {
                    display: flex;
                    align-items: center;
                    gap: 24px;
                }
                .blu-header__nav-link {
                    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Montserrat', sans-serif;
                    font-size: 14px;
                    font-weight: 500;
                    color: #000000;
                    text-decoration: none;
                    letter-spacing: -0.1px;
                    transition: opacity 0.15s ease;
                    white-space: nowrap;
                }
                .blu-header__nav-link:hover {
                    opacity: 0.5;
                }

                .blu-header__brand-logo {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-decoration: none;
                    transition: opacity 0.2s ease;
                }
                .blu-header__brand-logo img {
                    height: 38px;
                    display: block;
                    object-fit: contain;
                    transition: height 0.2s ease;
                }
                .blu-header__brand-logo:hover {
                    opacity: 0.85;
                }

                /* ── RIGHT: Minimal Icon Group (Exact Match) ── */
                .blu-header__right {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }

                /* Currency Badge (Circular Blue Graphic Badge) */
                .blu-currency-badge-wrap {
                    position: relative;
                }
                .blu-currency-badge-btn {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: #0052FF;
                    color: #FFFFFF;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: none;
                    cursor: pointer;
                    font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
                    font-size: 12px;
                    font-weight: 800;
                    padding: 0;
                    transition: transform 0.2s;
                    box-shadow: 0 2px 8px rgba(0, 82, 255, 0.25);
                }
                .blu-currency-badge-btn:hover {
                    transform: scale(1.08);
                }
                .blu-currency-popover {
                    position: absolute;
                    top: calc(100% + 12px);
                    right: 0;
                    background: rgba(255, 255, 255, 0.98);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    border: 1px solid rgba(0, 0, 0, 0.08);
                    box-shadow: 0 16px 40px rgba(0,0,0,0.12);
                    z-index: 2500;
                    min-width: 240px;
                    max-height: 280px;
                    overflow-y: auto;
                    border-radius: 14px;
                    padding: 8px;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .blu-currency-popover::-webkit-scrollbar {
                    width: 4px;
                }
                .blu-currency-popover::-webkit-scrollbar-thumb {
                    background: rgba(0,0,0,0.1);
                    border-radius: 4px;
                }
                .blu-currency-popover-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    width: 100%;
                    padding: 10px 14px;
                    border: none;
                    background: none;
                    cursor: pointer;
                    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Montserrat', sans-serif;
                    font-size: 0.76rem;
                    font-weight: 500;
                    color: #444444;
                    text-align: left;
                    border-radius: 8px;
                    transition: all 0.15s ease;
                }
                .blu-currency-popover-item:hover {
                    background: rgba(0, 0, 0, 0.04);
                    color: #000000;
                    padding-left: 18px;
                }
                .blu-currency-popover-item.active {
                    background: #000000;
                    color: #FFFFFF;
                    font-weight: 600;
                }

                /* Minimal Stroke Icons */
                .blu-icon-btn {
                    background: none;
                    border: none;
                    padding: 4px;
                    color: #000000;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-decoration: none;
                    position: relative;
                    transition: opacity 0.15s ease;
                }
                .blu-icon-btn:hover {
                    opacity: 0.5;
                }
                .blu-icon-btn svg {
                    width: 19px;
                    height: 19px;
                    stroke-width: 1.6;
                }
                .blu-icon-count {
                    position: absolute;
                    top: -4px;
                    right: -6px;
                    background: #000000;
                    color: #FFFFFF;
                    font-size: 9px;
                    font-weight: 700;
                    border-radius: 50%;
                    min-width: 16px;
                    height: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
                }

                /* Hamburger Pill Button (2 Horizontal Bars in Pill) */
                .blu-menu-pill-btn {
                    background: #F2F2F2;
                    border: none;
                    border-radius: 22px;
                    width: 44px;
                    height: 36px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                    cursor: pointer;
                    padding: 0;
                    transition: background 0.2s ease, transform 0.15s;
                }
                .blu-menu-pill-btn:hover {
                    background: #E5E5E5;
                }
                .blu-menu-pill-bar {
                    width: 18px;
                    height: 1.5px;
                    background: #000000;
                    border-radius: 1px;
                    transition: transform 0.25s ease, opacity 0.2s ease;
                }
                .blu-menu-pill-btn--open .blu-menu-pill-bar:nth-child(1) {
                    transform: translateY(3.25px) rotate(45deg);
                }
                .blu-menu-pill-btn--open .blu-menu-pill-bar:nth-child(2) {
                    transform: translateY(-3.25px) rotate(-45deg);
                }

                /* ── SEARCH MODAL ── */
                .blu-search-modal-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(6px);
                    z-index: 3000;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding-top: 80px;
                    animation: bluFade 0.2s ease;
                }
                @keyframes bluFade { from { opacity: 0; } to { opacity: 1; } }
                .blu-search-container {
                    width: 100%;
                    max-width: 640px;
                    padding: 0 20px;
                    box-sizing: border-box;
                }
                .blu-search-inner {
                    display: flex;
                    align-items: center;
                    background: #FFFFFF;
                    border-radius: 4px;
                    overflow: hidden;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.25);
                }
                .blu-search-field {
                    flex: 1;
                    border: none;
                    outline: none;
                    padding: 18px 20px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
                    font-size: 15px;
                    color: #000000;
                }
                .blu-search-action-btn {
                    background: #000000;
                    color: #FFFFFF;
                    border: none;
                    padding: 18px 24px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 700;
                }
                .blu-search-dismiss {
                    position: absolute;
                    top: 20px;
                    left: 24px;
                    background: #FFFFFF;
                    border: none;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    font-size: 16px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #000000;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }

                /* ── MOBILE SLIDE-IN DRAWER ── */
                .blu-drawer-backdrop {
                    position: fixed;
                    top: 70px;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.4);
                    z-index: 4000;
                    backdrop-filter: blur(4px);
                    -webkit-backdrop-filter: blur(4px);
                }
                .blu-drawer {
                    position: fixed;
                    top: 70px;
                    left: 0;
                    bottom: 0;
                    width: min(300px, 80vw);
                    background: #FFFFFF;
                    z-index: 4001;
                    display: flex;
                    flex-direction: column;
                    overflow-y: auto;
                    animation: bluSlide 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                    border-right: 1px solid #ECECEC;
                }
                @keyframes bluSlide {
                    from { transform: translateX(-100%); }
                    to   { transform: translateX(0); }
                }
                .blu-drawer__top {
                    display: none;
                }
                .blu-drawer__logo-text {
                    font-family: 'Montserrat', sans-serif;
                    font-size: 1.4rem;
                    font-weight: 900;
                    color: #000000;
                }
                .blu-drawer__nav {
                    padding: 20px 0;
                    display: flex;
                    flex-direction: column;
                }
                .blu-drawer__item {
                    padding: 14px 24px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Montserrat', sans-serif;
                    font-size: 15px;
                    font-weight: 600;
                    color: #000000;
                    text-decoration: none;
                    transition: background 0.15s;
                }
                .blu-drawer__item:hover {
                    background: #F8F8F8;
                }
                .blu-drawer__sep {
                    height: 1px;
                    background: #EEEEEE;
                    margin: 12px 24px;
                }

                @media (max-width: 860px) {
                    .blu-header__nav-links {
                        display: none;
                    }
                    .blu-header__right {
                        gap: 14px;
                    }
                }
                @media (max-width: 500px) {
                    .blu-header__right {
                        gap: 8px;
                    }
                    .blu-header__account-wrap,
                    .blu-header__wishlist-btn {
                        display: none;
                    }
                    .blu-header__brand-logo img {
                        height: 30px;
                    }
                }
            `}</style>

            {/* ── EXACT BLUORNG HEADER ── */}
            <header className={`blu-header${scrolled ? ' blu-header--scrolled' : ''}`}>
                <div className="blu-header__inner">
                    {/* LEFT: Logo + Nav Links */}
                    <div className="blu-header__left">
                        <Link to="/" className="blu-header__brand-logo" aria-label="ASAT Home">
                            <img src="/logo.png" alt="AS SIMPLE AS THAT" />
                        </Link>
                        <div className="blu-header__nav-links">
                            <Link to="/products?sort=newest" className="blu-header__nav-link">
                                Latest
                            </Link>
                            <Link to="/products" className="blu-header__nav-link">
                                Best Sellers
                            </Link>
                            <Link to="/products" className="blu-header__nav-link">
                                Explore Collections
                            </Link>
                            <Link to="/rankings" className="blu-header__nav-link">
                                Designer Rankings
                            </Link>
                        </div>
                    </div>

                    {/* RIGHT: Complete BLUORNG Icon Sequence */}
                    <div className="blu-header__right">
                        {/* 1. Blue Circle Badge (Currency) */}
                        <div className="blu-currency-badge-wrap" ref={currencyDropdownRef}>
                            <button
                                className="blu-currency-badge-btn"
                                onClick={() => setCurrencyOpen(!currencyOpen)}
                                title={`Currency: ${currency}`}
                                aria-label="Currency Selector"
                            >
                                {currencySymbol}
                            </button>
                            {currencyOpen && (
                                <div className="blu-currency-popover">
                                    {(activeCurrencies || Object.keys(SUPPORTED_CURRENCIES)).map((code) => {
                                        const c = (globalCurrencies && globalCurrencies[code]) || SUPPORTED_CURRENCIES[code] || SUPPORTED_CURRENCIES['INR'];
                                        const symbolToShow = (c.symbol.trim().toLowerCase() === 'rs' || code === 'INR') ? '₹' : c.symbol.trim();
                                        return (
                                            <button
                                                key={code}
                                                className={`blu-currency-popover-item${currency === code ? ' active' : ''}`}
                                                onClick={() => { setCurrency(code); setCurrencyOpen(false); }}
                                            >
                                                <span>{code} ({c.name})</span>
                                                <span style={{ fontWeight: '700' }}>{symbolToShow}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* 2. Store / Location Pin Icon */}
                        {/* <Link to="/support" className="blu-icon-btn" aria-label="Stores & Support" title="Stores">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                        </Link> */}

                        {/* 3. Search Icon */}
                        <button className="blu-icon-btn" onClick={() => setSearchOpen(true)} aria-label="Search">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </button>

                        {/* 4. User Account Icon */}
                        <div className="blu-header__account-wrap" style={{ position: 'relative' }}>
                            <button
                                className="blu-icon-btn"
                                ref={profileBtnRef}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!loggedIn) navigate('/login');
                                    else setProfileOpen(!profileOpen);
                                }}
                                aria-label="Account"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                            </button>
                            {profileOpen && (
                                <div
                                    ref={profilePopupRef}
                                    style={{
                                        position: 'absolute',
                                        right: 0,
                                        top: 'calc(100% + 12px)',
                                        zIndex: 2500,
                                        background: '#FFFFFF',
                                        border: '1px solid #ECECEC',
                                        boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
                                        borderRadius: '16px',
                                        width: '240px',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <ProfileDropdown onClose={() => setProfileOpen(false)} />
                                </div>
                            )}
                        </div>

                        {/* 7. 2-Bar Hamburger Pill Button */}
                        <button 
                            className={`blu-menu-pill-btn${mobileOpen ? ' blu-menu-pill-btn--open' : ''}`} 
                            onClick={() => setMobileOpen(!mobileOpen)} 
                            aria-label="Toggle Menu"
                        >
                            <div className="blu-menu-pill-bar" />
                            <div className="blu-menu-pill-bar" />
                        </button>
                    </div>
                </div>
            </header>
            <div className="blu-header-spacer" aria-hidden="true" />

            {searchOpen && (
                <div className="blu-search-modal-backdrop" role="dialog" aria-modal="true" onClick={() => setSearchOpen(false)}>
                    <button
                        type="button"
                        className="blu-search-dismiss"
                        onClick={() => setSearchOpen(false)}
                        aria-label="Close search"
                    >
                        ✕
                    </button>
                    <div className="blu-search-container" onClick={(e) => e.stopPropagation()}>
                        <form className="blu-search-inner" onSubmit={handleSearchSubmit}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#777777" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '20px', flexShrink: 0 }}>
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input
                                ref={searchInputRef}
                                type="text"
                                className="blu-search-field"
                                placeholder="Search products, tees, hoodies, caps, drops..."
                                value={navSearchTerm}
                                onChange={(e) => setNavSearchTerm(e.target.value)}
                            />
                            {navSearchTerm && (
                                <button type="button" onClick={() => setNavSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: '0 12px' }}>
                                    ✕
                                </button>
                            )}
                            <button type="submit" className="blu-search-action-btn">
                                Search
                            </button>
                        </form>

                        <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Popular:</span>
                            {popularTags.map((tag) => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => {
                                        navigate(`/products?search=${encodeURIComponent(tag)}`);
                                        setSearchOpen(false);
                                    }}
                                    style={{
                                        background: 'rgba(255,255,255,0.15)',
                                        color: '#FFFFFF',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        borderRadius: '20px',
                                        padding: '5px 14px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                    }}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── MOBILE SLIDE-IN DRAWER ── */}
            {mobileOpen && (
                <>
                    <div className="blu-drawer-backdrop" onClick={() => setMobileOpen(false)} />
                    <nav className="blu-drawer" aria-label="Site navigation">
                        <div className="blu-drawer__top">
                            <span className="blu-drawer__logo-text">
                                <img src="/logo.png" alt="AS SIMPLE AS THAT" style={{ height: '30px', objectFit: 'contain' }} />
                            </span>
                            <button
                                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}
                                onClick={() => setMobileOpen(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="blu-drawer__nav">
                            <Link to="/" className="blu-drawer__item" onClick={() => setMobileOpen(false)}>Home</Link>
                            <Link to="/products?sort=newest" className="blu-drawer__item" onClick={() => setMobileOpen(false)}>Latest</Link>
                            <Link to="/products" className="blu-drawer__item" onClick={() => setMobileOpen(false)}>Best Sellers</Link>
                            <Link to="/products" className="blu-drawer__item" onClick={() => setMobileOpen(false)}>Explore Collections</Link>
                            <Link to="/rankings" className="blu-drawer__item" onClick={() => setMobileOpen(false)}>Designer Rankings</Link>
                            <div className="blu-drawer__sep" />
                            <Link to="/wishlist" className="blu-drawer__item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setMobileOpen(false)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
                                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                                </svg>
                                Saved {wishlistCount > 0 && `(${wishlistCount})`}
                            </Link>
                            <Link to="/cart" className="blu-drawer__item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setMobileOpen(false)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
                                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                                    <line x1="3" y1="6" x2="21" y2="6"></line>
                                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                                </svg>
                                Bag {cartCount > 0 && `(${cartCount})`}
                            </Link>
                            <div className="blu-drawer__sep" />
                            {loggedIn && (
                                <>
                                    <Link to="/profile" className="blu-drawer__item" onClick={() => setMobileOpen(false)}>My Profile</Link>
                                    <Link to="/orders" className="blu-drawer__item" onClick={() => setMobileOpen(false)}>Orders</Link>
                                    <Link to="/profile" className="blu-drawer__item" onClick={() => setMobileOpen(false)}>Reset Password</Link>
                                    <div className="blu-drawer__sep" />
                                </>
                            )}
                            <Link 
                                to="/terms" 
                                className="blu-drawer__item" 
                                style={{ 
                                    fontSize: '12px', 
                                    color: '#C5A059', 
                                    fontWeight: '700', 
                                    border: '1px solid #C5A059', 
                                    borderRadius: '8px', 
                                    padding: '10px 16px', 
                                    textAlign: 'center', 
                                    margin: '12px 0 8px 0', 
                                    display: 'block',
                                    background: '#111111',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    textDecoration: 'none'
                                }} 
                                onClick={() => setMobileOpen(false)}
                            >
                                Terms & Conditions
                            </Link>
                            <a href="/designer/register" className="blu-drawer__item" style={{ fontSize: '13px', color: '#000000', fontWeight: '700' }} onClick={() => setMobileOpen(false)}>Join as Designer</a>
                        </div>
                    </nav>
                </>
            )}
        </>
    );
}

export default Navbar;
