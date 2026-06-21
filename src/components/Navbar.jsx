import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import ProfileDropdown from './ProfileDropdown';
import { useCurrency, SUPPORTED_CURRENCIES } from '../context/CurrencyContext';

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

    const { currency, setCurrency, activeCurrencies, globalCurrencies } = useCurrency();
    const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
    const currencyDropdownRef = useRef(null);

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

    // Read login state & username from localStorage
    useEffect(() => {
        const updateGreeting = () => {
            const loggedIn = localStorage.getItem('asat_loggedIn') === 'true';
            if (loggedIn) {
                const userData = localStorage.getItem('asat_user');
                if (userData) {
                    const { fullName } = JSON.parse(userData);
                    const firstName = fullName ? fullName.split(' ')[0] : '';
                    setGreeting(`Hello, ${firstName}!`);
                } else {
                    setGreeting('Hello there!');
                }
            } else {
                setGreeting('Hello there!');
            }
        };

        updateGreeting();
        window.addEventListener('storage', updateGreeting);
        return () => window.removeEventListener('storage', updateGreeting);
    }, []);

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
                    <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer', textAlign: 'center', margin: '0 auto' }}>
                        As Simple as That
                        <span className="logo-caption">**A Designer Paradise**</span>
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

                        {/* Wishlist Heart Icon with dynamic badge */}
                        <div className="nav-icon-wrapper" onClick={() => navigate('/wishlist')} style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}>
                            <i className="far fa-heart" style={{ marginLeft: '20px' }}></i>
                            {wishlistCount > 0 && (
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
                                    {wishlistCount}
                                </span>
                            )}
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

                {/* Desktop Secondary Menu Bar — Centered, Symmetrical Luxury Layout */}
                <div className="nav-desktop-links" style={{
                    display: 'flex',
                    justifyContent: 'center',
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
