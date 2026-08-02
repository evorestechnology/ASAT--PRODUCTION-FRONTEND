import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import ProfileDropdown from './ProfileDropdown';
import { useCurrency, SUPPORTED_CURRENCIES } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';

/* ─── Bubble menu items ─────────────────────────────────────── */
const bubbleItems = [
    { icon: 'fas fa-home', label: 'Home', path: '/' },
    { icon: 'fas fa-th-large', label: 'Products', path: '/products' },
    { icon: 'fas fa-trophy', label: 'Rankings', path: '/rankings' },
    { icon: 'fas fa-user-circle', label: 'Account', path: '/profile' },
    { icon: 'fas fa-shopping-bag', label: 'Cart', path: '/cart' },
];

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const isHomePage = location.pathname === '/';
    const [profileOpen, setProfileOpen] = useState(false);
    const [greeting, setGreeting] = useState('Hello there!');
    const [bubbleOpen, setBubbleOpen] = useState(false);
    const profilePopupRef = useRef(null);
    const profileBtnRef = useRef(null);
    const [cartCount, setCartCount] = useState(0);
    const [wishlistCount, setWishlistCount] = useState(0);
    const { user, profile, role } = useAuth();

    const { currency, setCurrency, activeCurrencies, globalCurrencies } = useCurrency();
    const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
    const currencyDropdownRef = useRef(null);
    const [showMobileSearch, setShowMobileSearch] = useState(false);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(e.target)) {
                setCurrencyDropdownOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        const updateCounts = () => {
            const loggedIn = localStorage.getItem('asat_loggedIn') === 'true';
            if (!loggedIn) {
                setCartCount(0);
                setWishlistCount(0);
                return;
            }
            const cart = JSON.parse(localStorage.getItem('asat_cart') || '[]');
            const wishlist = JSON.parse(localStorage.getItem('asat_wishlist') || '[]');
            setCartCount(cart.reduce((sum, item) => sum + (item.qty || 1), 0));
            setWishlistCount(wishlist.length);
        };
        updateCounts();
        window.addEventListener('cart_updated', updateCounts);
        window.addEventListener('wishlist_updated', updateCounts);
        window.addEventListener('storage', updateCounts);
        
        return () => {
            window.removeEventListener('cart_updated', updateCounts);
            window.removeEventListener('wishlist_updated', updateCounts);
            window.removeEventListener('storage', updateCounts);
        };
    }, []);

    const loggedIn = typeof window !== 'undefined' && localStorage.getItem('asat_loggedIn') === 'true';

    // Dynamically update greeting with user's name
    useEffect(() => {
        const updateGreeting = () => {
            const isUserLoggedIn = loggedIn || !!user;
            if (!isUserLoggedIn) {
                setGreeting('Hello there!');
                return;
            }

            let nameCandidate = '';

            if (profile?.full_name) {
                nameCandidate = profile.full_name;
            } else if (profile?.business_name) {
                nameCandidate = profile.business_name;
            } else if (user?.user_metadata?.full_name) {
                nameCandidate = user.user_metadata.full_name;
            } else if (user?.user_metadata?.name) {
                nameCandidate = user.user_metadata.name;
            } else {
                const userData = localStorage.getItem('asat_user');
                if (userData) {
                    try {
                        const parsed = JSON.parse(userData);
                        if (parsed.fullName && parsed.fullName.trim() !== '' && parsed.fullName.toLowerCase() !== 'user') {
                            nameCandidate = parsed.fullName;
                        }
                    } catch (e) {}
                }
            }

            if (nameCandidate && nameCandidate.trim() !== '' && nameCandidate.toLowerCase() !== 'user') {
                const firstName = nameCandidate.trim().split(' ')[0];
                setGreeting(`Hello, ${firstName}!`);
            } else if (user?.email) {
                const rawName = user.email.split('@')[0];
                const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
                setGreeting(`Hello, ${formattedName}!`);
            } else {
                setGreeting('Hello there!');
            }
        };

        updateGreeting();
        window.addEventListener('storage', updateGreeting);
        window.addEventListener('user_profile_updated', updateGreeting);
        return () => {
            window.removeEventListener('storage', updateGreeting);
            window.removeEventListener('user_profile_updated', updateGreeting);
        };
    }, [user, profile, role, loggedIn]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                profilePopupRef.current &&
                !profilePopupRef.current.contains(e.target) &&
                e.target !== profileBtnRef.current
            ) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Prevent body scroll when bubble menu is open
    useEffect(() => {
        document.body.style.overflow = bubbleOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [bubbleOpen]);

    const [navSearchTerm, setNavSearchTerm] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (navSearchTerm.trim()) {
            navigate(`/products?search=${encodeURIComponent(navSearchTerm.trim())}`);
            setNavSearchTerm('');
        }
    };

    return (
        <>
            <header style={{ padding: '16px 5% 12px' }}>
                <div className="nav-container" style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    alignItems: 'center',
                    marginBottom: '10px'
                }}>
                    {/* Greeting — hidden on mobile via CSS */}
                    <div className={`nav-greeting ${!isHomePage ? 'nav-greeting--shifted' : ''}`} style={{ justifySelf: 'start' }}>
                        {greeting}
                    </div>
                    <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer', textAlign: 'center', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span className="logo-top-tag" style={{ fontSize: '0.68rem', letterSpacing: '3px', textTransform: 'uppercase', fontFamily: "'Montserrat', sans-serif", fontWeight: '700', color: 'var(--gold)', marginBottom: '1px' }}>
                            ASAT
                        </span>
                        <span className="logo-main-title" style={{ fontSize: '1.7rem', letterSpacing: '4px', textTransform: 'uppercase', fontFamily: "'Cinzel', serif", fontWeight: '700', color: 'var(--dark)', lineHeight: '1.1' }}>
                            DESIGNER PARADISE
                        </span>
                    </div>

                    <div className="nav-icons" style={{ justifySelf: 'end', display: 'flex', alignItems: 'center' }}>
                        {/* Currency Selector Dropdown */}
                        <div className="currency-selector-container" ref={currencyDropdownRef} style={{ marginRight: '10px' }}>
                            <button 
                                className="currency-select-btn"
                                onClick={() => setCurrencyDropdownOpen(prev => !prev)}
                            >
                                <span className="currency-symbol-badge">
                                    {((globalCurrencies && globalCurrencies[currency]) || SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES['INR']).symbol.trim()}
                                </span>
                                {currency}
                                <i className="fas fa-chevron-down" style={{ fontSize: '0.62rem', marginLeft: '2px', transition: 'transform 0.2s', transform: currencyDropdownOpen ? 'rotate(180deg)' : 'none' }}></i>
                            </button>
                            <div className={`currency-dropdown-list${currencyDropdownOpen ? ' active' : ''}`}>
                                {(activeCurrencies || Object.keys(SUPPORTED_CURRENCIES)).map((code) => {
                                    const c = (globalCurrencies && globalCurrencies[code]) || SUPPORTED_CURRENCIES[code] || SUPPORTED_CURRENCIES['INR'];
                                    return (
                                        <button
                                            key={code}
                                            className={`currency-dropdown-item${currency === code ? ' active' : ''}`}
                                            onClick={() => {
                                                setCurrency(code);
                                                setCurrencyDropdownOpen(false);
                                            }}
                                        >
                                            <span>{code} — {c.name}</span>
                                            <span className="currency-symbol-badge">{c.symbol.trim()}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="profile-container">
                            <i
                                className="far fa-user-circle"
                                id="profileBtn"
                                ref={profileBtnRef}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!loggedIn) {
                                        navigate('/login');
                                    } else {
                                        setProfileOpen(prev => !prev);
                                    }
                                }}
                            ></i>
                            <div ref={profilePopupRef} className={`profile-popup${profileOpen ? ' active' : ''}`}>
                                <ProfileDropdown />
                            </div>
                        </div>

                        {/* Search Icon (in place of Wishlist) */}
                        <div className="nav-icon-wrapper" onClick={() => setShowMobileSearch(prev => !prev)} style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }} title="Search Products">
                            <i className="fas fa-search" style={{ marginLeft: '20px', fontSize: '1.05rem', color: showMobileSearch ? 'var(--gold)' : 'inherit', transition: 'color 0.2s' }}></i>
                        </div>

                        {/* Cart Shopping Bag Icon with dynamic badge */}
                        <div className="nav-icon-wrapper" onClick={() => navigate('/cart')} style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}>
                            <i className="fas fa-shopping-bag" style={{ marginLeft: '20px' }}></i>
                            {cartCount > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    top: '-6px',
                                    right: '-6px',
                                    background: 'var(--gold)',
                                    color: 'white',
                                    fontSize: '0.62rem',
                                    fontWeight: '700',
                                    borderRadius: '50%',
                                    width: '16px',
                                    height: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontFamily: "'Montserrat', sans-serif",
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                                    zIndex: 5
                                }}>
                                    {cartCount}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Search Dropdown Bar */}
                {showMobileSearch && (
                    <div className="nav-mobile-search-bar" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 4%',
                        background: '#f8f8fa',
                        borderBottom: '1px solid rgba(0,0,0,0.06)',
                        marginTop: '5px',
                        borderRadius: '4px'
                    }}>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleSearchSubmit(e);
                            setShowMobileSearch(false);
                        }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="text"
                                placeholder="Search products, designs..."
                                className="nav-search-input-field"
                                value={navSearchTerm}
                                onChange={e => setNavSearchTerm(e.target.value)}
                                autoFocus
                                style={{
                                    flex: 1,
                                    border: 'none',
                                    background: 'white',
                                    outline: 'none',
                                    fontSize: '0.85rem',
                                    color: 'var(--dark)',
                                    fontFamily: "'Montserrat', sans-serif",
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
                                }}
                            />
                            <button type="submit" style={{ background: 'var(--gold)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700' }}>
                                SEARCH
                            </button>
                            <button type="button" onClick={() => setShowMobileSearch(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#888', padding: '0 4px' }}>
                                <i className="fas fa-times"></i>
                            </button>
                        </form>
                    </div>
                )}

                {/* Desktop Secondary Menu Bar — Centered, Symmetrical Luxury Layout */}
                <div className="nav-desktop-links" style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '40px',
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: '0.72rem',
                    letterSpacing: '3px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    padding: '8px 0 2px',
                    marginTop: '8px',
                    borderTop: '1px solid rgba(0, 0, 0, 0.03)'
                }}>
                    <Link to="/products" style={{ color: 'var(--dark)', textDecoration: 'none' }} className="nav-link-item">Collection</Link>
                    <Link to="/rankings" style={{ color: 'var(--dark)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }} className="nav-link-item">
                        <i className="fas fa-trophy" style={{ color: 'var(--gold)', fontSize: '0.8rem', margin: 0 }}></i> Rankings
                    </Link>
                    <Link to="/terms" style={{ color: 'var(--dark)', textDecoration: 'none' }} className="nav-link-item">T&amp;C</Link>
                </div>
            </header>

            {/* ━━━ BUBBLE MENU — Floating radial navigation ━━━━━ */}
            <div className={`bubble-menu ${bubbleOpen ? 'bubble-menu--open' : ''}`}>
                {/* Backdrop overlay */}
                <div className="bubble-menu__backdrop" onClick={() => setBubbleOpen(false)} />

                {/* Menu items — radial arc */}
                <div className="bubble-menu__items">
                    {bubbleItems.map((item, i) => (
                        <button
                            key={i}
                            className="bubble-menu__item"
                            style={{ '--bubble-i': i, '--bubble-total': bubbleItems.length }}
                            onClick={() => { navigate(item.path); setBubbleOpen(false); }}
                            aria-label={item.label}
                        >
                            <span className="bubble-menu__item-icon">
                                <i className={item.icon}></i>
                            </span>
                            <span className="bubble-menu__item-label">{item.label}</span>
                        </button>
                    ))}
                </div>

                {/* FAB trigger button */}
                <button
                    className="bubble-menu__fab"
                    onClick={() => setBubbleOpen(prev => !prev)}
                    aria-label="Toggle navigation menu"
                >
                    <span className="bubble-menu__fab-icon">
                        <i className={bubbleOpen ? 'fas fa-times' : 'fas fa-plus'}></i>
                    </span>
                </button>
            </div>
        </>
    );
}

export default Navbar;
