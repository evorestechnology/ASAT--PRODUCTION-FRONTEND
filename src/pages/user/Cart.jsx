import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../components/BackButton';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast, ToastContainer, TOAST_CSS } from '../../components/useToast';
import { useCurrency } from '../../context/CurrencyContext';
import { COUNTRIES, getShippingZone } from '../../constants/countries';

const isValidUUID = (uuid) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
};

const parseEarnings = (item) => {
    const qty = Number(item.qty) || 1;
    const price = Number(item.price) || 0;
    
    if (item.isMfgProduct) {
        return {
            designer: 0,
            mfg: price * qty
        };
    }
    
    let p = item.pricing;
    if (!p && item.description && typeof item.description === 'string' && item.description.startsWith('{')) {
        try {
            const parsed = JSON.parse(item.description);
            p = parsed.pricing;
        } catch (e) {}
    }
    
    if (p) {
        const designerUnit = (Number(p.designerCost) || 0) + (Number(p.markup) || 0);
        const mfgUnit = (Number(p.baseCost) || 0) + (Number(p.printingCost) || 0);
        return {
            designer: designerUnit * qty,
            mfg: mfgUnit * qty
        };
    }
    
    // Fallback: 10% designer, 40% mfg
    return {
        designer: Math.round(price * qty * 0.1),
        mfg: Math.round(price * qty * 0.4)
    };
};

const styles = `
    /* ═══════ Cart Page ═══════ */
    .cart-page { min-height: 80vh; background: var(--light); }

    .cart-hero {
        background: var(--dark);
        color: white;
        padding: 50px 5% 45px;
        text-align: center;
    }
    .cart-hero h1 {
        font-family: 'Cinzel', serif;
        font-size: 2.2rem;
        letter-spacing: 5px;
        font-weight: 700;
        margin: 0 0 8px;
    }
    .cart-hero p {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.82rem;
        letter-spacing: 1.5px;
        color: #aaa;
    }

    .cart-layout {
        display: grid;
        grid-template-columns: 1fr 380px;
        gap: 40px;
        padding: 40px 4%;
        max-width: 1400px;
        margin: 0 auto;
    }

    /* ── Cart Items ── */
    .cart-items { display: flex; flex-direction: column; gap: 0; }

    .cart-items-header {
        display: grid;
        grid-template-columns: 3fr 1fr 1fr 1fr 40px;
        gap: 16px;
        padding: 14px 0;
        border-bottom: 2px solid var(--dark);
        font-family: 'Montserrat', sans-serif;
        font-size: 0.7rem;
        letter-spacing: 2px;
        text-transform: uppercase;
        color: #888;
    }

    .cart-item {
        display: grid;
        grid-template-columns: 3fr 1fr 1fr 1fr 40px;
        gap: 16px;
        align-items: center;
        padding: 24px 0;
        border-bottom: 1px solid #eee;
        transition: background 0.2s;
    }
    .cart-item:hover { background: rgba(197,160,89,0.03); }

    .cart-item-product {
        display: flex;
        gap: 18px;
        align-items: center;
    }
    .cart-item-img {
        width: 90px;
        height: 110px;
        object-fit: cover;
        border-radius: 4px;
        flex-shrink: 0;
        cursor: pointer;
    }
    .cart-item-details { display: flex; flex-direction: column; gap: 4px; }
    .cart-item-name {
        font-family: 'Cinzel', serif;
        font-size: 0.92rem;
        font-weight: 600;
        letter-spacing: 1.5px;
        color: var(--dark);
        cursor: pointer;
    }
    .cart-item-name:hover { color: var(--gold); }
    .cart-item-meta {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.72rem;
        color: #999;
        letter-spacing: 0.5px;
    }
    .cart-item-color-dot {
        display: inline-block;
        width: 10px; height: 10px;
        border-radius: 50%;
        border: 1px solid #ddd;
        vertical-align: middle;
        margin-right: 4px;
    }

    .cart-item-price {
        font-family: 'Cinzel', serif;
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--dark);
    }

    .cart-item-qty {
        display: flex;
        align-items: center;
        border: 1px solid #ddd;
        width: fit-content;
    }
    .cart-qty-btn {
        width: 32px; height: 32px;
        border: none; background: white;
        font-size: 1rem; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: 0.2s;
    }
    .cart-qty-btn:hover { background: #f5f5f5; }
    .cart-qty-val {
        width: 36px; text-align: center;
        font-family: 'Montserrat', sans-serif; font-size: 0.82rem;
        border-left: 1px solid #ddd; border-right: 1px solid #ddd;
        padding: 6px 0;
    }

    .cart-item-total {
        font-family: 'Cinzel', serif;
        font-size: 1rem;
        font-weight: 700;
        color: var(--dark);
    }

    .cart-remove-btn {
        width: 32px; height: 32px;
        border: none; background: transparent;
        color: #bbb; cursor: pointer; font-size: 1.1rem;
        transition: color 0.2s;
        display: flex; align-items: center; justify-content: center;
    }
    .cart-remove-btn:hover { color: #d44; }

    /* ── Order Summary ── */
    .cart-summary {
        background: white;
        border: 1px solid #eee;
        border-radius: 8px;
        padding: 32px 28px;
        position: sticky;
        top: 90px;
        align-self: start;
        box-shadow: 0 4px 20px rgba(0,0,0,0.04);
    }
    .cart-summary h3 {
        font-family: 'Cinzel', serif;
        font-size: 1.2rem;
        letter-spacing: 2px;
        margin: 0 0 24px;
        color: var(--dark);
    }
    .cart-summary-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 0;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.85rem;
        color: #666;
    }
    .cart-summary-row span:last-child {
        font-weight: 600;
        color: var(--dark);
    }
    .cart-summary-divider { height: 1px; background: #eee; margin: 16px 0; }
    .cart-summary-total {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 0;
        font-family: 'Cinzel', serif;
        font-size: 1.15rem;
        font-weight: 700;
        color: var(--dark);
    }

    /* Promo code */
    .cart-promo {
        display: flex;
        gap: 8px;
        margin: 20px 0;
    }
    .cart-promo input {
        flex: 1;
        padding: 12px 14px;
        border: 1px solid #ddd;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.82rem;
        letter-spacing: 1px;
        outline: none;
        transition: border-color 0.3s;
    }
    .cart-promo input:focus { border-color: var(--gold); }
    .cart-promo input::placeholder { color: #bbb; text-transform: uppercase; font-size: 0.72rem; letter-spacing: 1.5px; }
    .cart-promo button {
        padding: 12px 20px;
        background: var(--dark);
        color: white;
        border: none;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.72rem;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        cursor: pointer;
        transition: 0.3s;
        white-space: nowrap;
    }
    .cart-promo button:hover { background: var(--gold); }

    .cart-checkout-btn {
        width: 100%;
        padding: 16px;
        background: var(--gold);
        color: white;
        border: none;
        font-family: 'Cinzel', serif;
        font-size: 0.9rem;
        letter-spacing: 2.5px;
        cursor: pointer;
        transition: 0.3s;
        margin-top: 16px;
    }
    .cart-checkout-btn:hover { background: var(--dark); }

    .cart-continue {
        display: block;
        text-align: center;
        margin-top: 14px;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.75rem;
        letter-spacing: 1.5px;
        color: #999;
        text-decoration: none;
        cursor: pointer;
        transition: color 0.3s;
    }
    .cart-continue:hover { color: var(--gold); }

    .cart-secure {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        margin-top: 18px;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.68rem;
        letter-spacing: 1px;
        color: #aaa;
    }
    .cart-secure i { color: var(--gold); }

    /* ── Empty Cart ── */
    .cart-empty {
        grid-column: 1 / -1;
        text-align: center;
        padding: 80px 20px;
    }
    .cart-empty-icon {
        font-size: 4rem;
        color: #ddd;
        margin-bottom: 24px;
    }
    .cart-empty h3 {
        font-family: 'Cinzel', serif;
        font-size: 1.4rem;
        letter-spacing: 3px;
        margin-bottom: 10px;
        color: var(--dark);
    }
    .cart-empty p {
        font-family: 'Montserrat', sans-serif;
        color: #999;
        font-size: 0.88rem;
        margin-bottom: 30px;
    }

    /* ═══════ Address Modal ═══════ */
    .addr-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1100;
        backdrop-filter: blur(5px);
    }

    .addr-modal {
        background: white;
        width: 90%;
        max-width: 550px;
        border-radius: 12px;
        padding: 35px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        animation: slideUp 0.3s ease-out;
        color: var(--dark);
    }

    .addr-modal h3 {
        font-family: 'Cinzel', serif;
        font-size: 1.4rem;
        letter-spacing: 2px;
        margin-top: 0;
        margin-bottom: 24px;
        color: var(--dark);
        border-bottom: 2px solid var(--gold);
        padding-bottom: 12px;
        text-align: center;
    }

    .addr-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .addr-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .addr-field label {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.72rem;
        font-weight: 600;
        letter-spacing: 1px;
        text-transform: uppercase;
        color: #666;
    }

    .addr-input {
        padding: 12px 14px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.85rem;
        outline: none;
        transition: border-color 0.3s;
    }

    .addr-input:focus {
        border-color: var(--gold);
    }

    .addr-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
    }

    .addr-actions {
        display: flex;
        gap: 16px;
        margin-top: 10px;
    }

    .addr-btn-primary {
        flex: 1;
        padding: 14px;
        background: var(--gold);
        color: white;
        border: none;
        border-radius: 4px;
        font-family: 'Cinzel', serif;
        font-size: 0.9rem;
        letter-spacing: 1.5px;
        cursor: pointer;
        transition: background 0.3s;
        text-transform: uppercase;
    }

    .addr-btn-primary:hover {
        background: var(--dark);
    }

    .addr-btn-primary:disabled {
        background: #ccc;
        cursor: not-allowed;
    }

    .addr-btn-secondary {
        padding: 14px 24px;
        background: #eee;
        color: var(--dark);
        border: none;
        border-radius: 4px;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.78rem;
        letter-spacing: 1px;
        cursor: pointer;
        transition: background 0.3s;
        text-transform: uppercase;
    }

    /* ── Price Breakdown in Address Modal ── */
    .addr-breakdown {
        background: linear-gradient(135deg, #0f1117, #1a1a2e);
        border-radius: 10px;
        padding: 16px 18px;
        border: 1px solid rgba(197,160,89,0.3);
        margin-top: 4px;
    }
    .addr-breakdown__title {
        font-family: 'Cinzel', serif;
        font-size: 0.82rem;
        font-weight: 700;
        color: #C5A059;
        letter-spacing: 1px;
        margin-bottom: 12px;
    }
    .addr-breakdown__row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.8rem;
        color: #bbb;
        padding: 5px 0;
        border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .addr-breakdown__row span:last-child { font-weight: 600; color: #ddd; }
    .addr-breakdown__row--discount span { color: #4ade80 !important; }
    .addr-breakdown__total {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 10px;
        padding: 10px 0 0;
        font-family: 'Cinzel', serif;
        font-size: 1rem;
        font-weight: 700;
        color: #C5A059;
    }
    .addr-breakdown__note {
        margin-top: 10px;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.72rem;
        color: #f59e0b;
        background: rgba(245,158,11,0.08);
        border: 1px solid rgba(245,158,11,0.2);
        border-radius: 6px;
        padding: 8px 10px;
        line-height: 1.5;
    }

    /* ── Finance note in cart summary ── */
    .cart-summary-row--muted span:first-child { color: #888; font-size: 0.8rem; }
    .cart-summary-row--muted span:last-child  { color: #555; font-weight: 500; font-size: 0.8rem; }
    .cart-finance-note {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin: 10px 0 0;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.7rem;
        color: #888;
        background: #f8f8fa;
        border-radius: 6px;
        padding: 8px 10px;
        border-left: 3px solid #C5A059;
        line-height: 1.5;
    }
    .cart-finance-note i { color: #C5A059; margin-top: 2px; flex-shrink: 0; }

    @keyframes slideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }

    /* ── Responsive ── */
    @media (max-width: 900px) {
        .cart-layout {
            grid-template-columns: 1fr;
            gap: 30px;
        }
        .cart-summary { position: static; }
    }
    @media (max-width: 600px) {
        .cart-hero h1 { font-size: 1.5rem; letter-spacing: 3px; }
        .cart-hero { padding: 35px 5% 30px; }
        .cart-items-header { display: none; }
        .cart-item {
            grid-template-columns: 1fr;
            gap: 12px;
            padding: 20px 0;
        }
        .cart-item-product { gap: 14px; }
        .cart-item-img { width: 70px; height: 85px; }
        .cart-item-name { font-size: 0.82rem; }
        .cart-item-row-mobile {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        }
    }
`;


const INDIAN_STATES = [
    "Andaman and Nicobar Islands",
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chandigarh",
    "Chhattisgarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jammu and Kashmir",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Ladakh",
    "Lakshadweep",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Puducherry",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal"
];

function Cart() {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const { toasts, showToast } = useToast();
    const { formatPrice, currency } = useCurrency();
    const [cart, setCart] = useState([]);
    const [promo, setPromo] = useState('');
    const [promoApplied, setPromoApplied] = useState(false);

    // Finance rules from backend
    const [financeRules, setFinanceRules] = useState(null);

    // User saved addresses states
    const [userAddresses, setUserAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [showAddressEditModal, setShowAddressEditModal] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);

    // Address Modal states
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [placing, setPlacing] = useState(false);
    const [addrName, setAddrName] = useState('');
    const [addrPhone, setAddrPhone] = useState('');
    const [addrLine, setAddrLine] = useState('');
    const [addrLandmark, setAddrLandmark] = useState(''); // line2 (landmarks)
    const [addrCity, setAddrCity] = useState('');
    const [addrState, setAddrState] = useState('');
    const [addrPin, setAddrPin] = useState('');
    const [addrCountry, setAddrCountry] = useState('India');

    // Form inputs for address creation/edit
    const [formLabel, setFormLabel] = useState('Home');
    const [formFullName, setFormFullName] = useState('');
    const [formPhone, setFormPhone] = useState('');
    const [formCountry, setFormCountry] = useState('India');
    const [formState, setFormState] = useState('');
    const [formCity, setFormCity] = useState('');
    const [formPincode, setFormPincode] = useState('');
    const [formLine1, setFormLine1] = useState('');
    const [formLine2, setFormLine2] = useState('');

    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 600;

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('asat_cart') || '[]');
        setCart(stored);
    }, []);

    // Load finance settings
    useEffect(() => {
        apiFetch('/api/settings')
            .then(data => setFinanceRules(data))
            .catch(() => {}); // silently fallback to defaults
    }, []);

    const allowedCountries = useMemo(() => {
        const dr = financeRules?.delivery_restrictions;
        if (!dr || !dr.restricted_countries) return COUNTRIES;
        return COUNTRIES.filter(c => !dr.restricted_countries.includes(c.name));
    }, [financeRules]);

    const selectAddress = useCallback((addr) => {
        setSelectedAddressId(addr.id);
        setAddrName(addr.full_name || '');
        setAddrPhone(addr.phone || '');
        setAddrLine(addr.line1 || '');
        setAddrLandmark(addr.line2 || '');
        setAddrCity(addr.city || '');
        setAddrState(addr.state || '');
        setAddrPin(addr.pincode || '');
        setAddrCountry(addr.country || 'India');
    }, []);

    const fetchUserAddresses = useCallback(async () => {
        if (!user) return;
        try {
            const data = await apiFetch('/api/users/addresses');
            const normalized = (data || []).map(addr => {
                let normLabel = 'Home';
                if (addr.label) {
                    const l = addr.label.toUpperCase();
                    if (l === 'WORK') normLabel = 'Work';
                    else if (l === 'OTHER') normLabel = 'Other';
                }
                return {
                    ...addr,
                    label: normLabel
                };
            });
            setUserAddresses(normalized || []);
            // Set default address if available and nothing is selected yet
            if (normalized && normalized.length > 0) {
                const def = normalized.find(a => a.is_default) || normalized[0];
                if (def && !selectedAddressId) {
                    selectAddress(def);
                }
            }
        } catch (err) {
            console.error("Failed to load user addresses:", err);
        }
    }, [user, selectedAddressId, selectAddress]);

    useEffect(() => {
        if (user) {
            fetchUserAddresses();
        } else {
            setUserAddresses([]);
            setSelectedAddressId(null);
        }
    }, [user, fetchUserAddresses]);

    const handleAddOrEditAddressSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!formFullName || !formPhone || !formLine1 || !formCity || !formPincode || !formCountry) {
            showToast("Please fill in all required fields.", 'warning');
            return;
        }
        if (formCountry === 'India' && !formState) {
            showToast("Please select a state.", 'warning');
            return;
        }

        const payload = {
            label: formLabel,
            full_name: formFullName,
            phone: formPhone,
            line1: formLine1,
            line2: formLine2, // landmark
            city: formCity,
            state: formCountry === 'India' ? formState : '',
            pincode: formPincode,
            country: formCountry,
            is_default: editingAddress ? editingAddress.is_default : userAddresses.length === 0
        };

        try {
            let res;
            if (editingAddress) {
                res = await apiFetch(`/api/users/addresses/${editingAddress.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                showToast("Address updated successfully!", 'success');
            } else {
                res = await apiFetch('/api/users/addresses', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                showToast("Address added successfully!", 'success');
            }
            setShowAddressEditModal(false);
            
            // Reload addresses
            const freshAddresses = await apiFetch('/api/users/addresses');
            setUserAddresses(freshAddresses || []);
            
            // Auto-select the saved address
            const savedAddr = res?.address || freshAddresses?.find(a => a.line1 === formLine1 && a.pincode === formPincode) || freshAddresses?.[0];
            if (savedAddr) {
                selectAddress(savedAddr);
            }
        } catch (err) {
            console.error("Error saving address:", err);
            showToast("Failed to save address. Please try again.", 'error');
        }
    };

    const handleDeleteAddress = async (addrId, e) => {
        if (e) e.stopPropagation(); // prevent selecting it when clicking delete
        if (!window.confirm("Are you sure you want to delete this address?")) return;
        try {
            await apiFetch(`/api/users/addresses/${addrId}`, {
                method: 'DELETE'
            });
            showToast("Address deleted.", 'success');
            
            // Reload
            const freshAddresses = await apiFetch('/api/users/addresses');
            setUserAddresses(freshAddresses || []);
            
            if (selectedAddressId === addrId) {
                setSelectedAddressId(null);
                if (freshAddresses && freshAddresses.length > 0) {
                    selectAddress(freshAddresses[0]);
                } else {
                    setAddrName('');
                    setAddrPhone('');
                    setAddrLine('');
                    setAddrLandmark('');
                    setAddrCity('');
                    setAddrState('');
                    setAddrPin('');
                    setAddrCountry('India');
                }
            }
        } catch (err) {
            console.error("Failed to delete address:", err);
            showToast("Failed to delete address.", 'error');
        }
    };

    const openAddAddressModal = () => {
        setEditingAddress(null);
        setFormLabel('Home');
        setFormFullName(profile?.fullName || user?.displayName || '');
        setFormPhone(profile?.phone || user?.phone || '');
        setFormCountry('India');
        setFormState('');
        setFormCity('');
        setFormPincode('');
        setFormLine1('');
        setFormLine2('');
        setShowAddressEditModal(true);
    };

    const openEditAddressModal = (addr, e) => {
        if (e) e.stopPropagation(); // prevent selection trigger
        setEditingAddress(addr);
        let normLabel = 'Home';
        if (addr.label) {
            const l = addr.label.toUpperCase();
            if (l === 'WORK') normLabel = 'Work';
            else if (l === 'OTHER') normLabel = 'Other';
        }
        setFormLabel(normLabel);
        setFormFullName(addr.full_name || '');
        setFormPhone(addr.phone || '');
        setFormCountry(addr.country || 'India');
        setFormState(addr.state || '');
        setFormCity(addr.city || '');
        setFormPincode(addr.pincode || '');
        setFormLine1(addr.line1 || '');
        setFormLine2(addr.line2 || '');
        setShowAddressEditModal(true);
    };

    const updateCart = (newCart) => {
        setCart(newCart);
        localStorage.setItem('asat_cart', JSON.stringify(newCart));
        window.dispatchEvent(new Event('cart_updated'));
    };

    const updateQty = (idx, delta) => {
        const c = [...cart];
        c[idx].qty = Math.max(1, c[idx].qty + delta);
        updateCart(c);
    };

    const removeItem = (idx) => {
        const c = [...cart];
        c.splice(idx, 1);
        updateCart(c);
    };

    const isRestricted = useMemo(() => {
        const dr = financeRules?.delivery_restrictions;
        if (!dr || !dr.restricted_countries) return false;
        return dr.restricted_countries.includes(addrCountry);
    }, [financeRules, addrCountry]);

    const isProfileRestricted = useMemo(() => {
        if (!user || !profile || !profile.country) return false;
        const dr = financeRules?.delivery_restrictions;
        if (!dr || !dr.restricted_countries) return false;
        return dr.restricted_countries.includes(profile.country);
    }, [user, profile, financeRules]);

    // ── Price calculation using finance rules ──────────────────────────────
    const priceBreakdown = useMemo(() => {
        const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
        const totalQty = cart.reduce((s, i) => s + (Number(i.qty) || 1), 0);
        const discount = promoApplied ? Math.round(subtotal * 0.15) : 0;
        const afterDiscount = subtotal - discount;

        // Cost rules
        const costRules   = financeRules?.finance_cost_rules;
        const taxRules    = financeRules?.finance_tax_rules;
        const shipRules   = financeRules?.finance_shipping_rules;

        // Packing & operating are charged per piece
        const packingPerPiece   = Number(costRules?.packing_cost   ?? 50);
        const operatingPerPiece = Number(costRules?.operating_cost  ?? 100);
        const packingTotal   = packingPerPiece   * totalQty;
        const operatingTotal = operatingPerPiece * totalQty;

        // Base for tax = items after discount (packing and operating are already included in marked-up selling prices)
        const taxableAmount = afterDiscount;

        const pricePerPiece = totalQty > 0 ? taxableAmount / totalQty : 0;

        let taxRate = 0, taxLabel = 'Tax', taxAmount = 0;
        let shippingAmt = 0, shippingLabel = 'Shipping';
        let zone = '';

        if (selectedAddressId) {
            const zoneVal = getShippingZone(addrCountry, addrCity);
            zone = zoneVal;

            if (addrCountry === 'India') {
                const threshold = Number(taxRules?.india?.high_threshold ?? 2500);
                const highRate  = Number(taxRules?.india?.high_rate ?? 18);
                const lowRate   = Number(taxRules?.india?.low_rate ?? 5);
                taxRate  = pricePerPiece > threshold ? highRate : lowRate;
                taxLabel = `GST ${taxRate}%`;
            } else if (addrCountry === 'United States') {
                taxRate  = Number(taxRules?.usa_rate ?? 25);
                taxLabel = `Import Duty ${taxRate}%`;
            } else {
                const ovr = (taxRules?.country_overrides || []).find(o => o.country === addrCountry);
                taxRate  = ovr ? Number(ovr.rate) : Number(taxRules?.row_rate ?? 0);
                taxLabel = taxRate === 0 ? 'Tax (None)' : `Tax ${taxRate}%`;
            }
            taxAmount = Math.round((taxableAmount * taxRate) / 100);

            // Shipping
            if (zone === 'mumbai') {
                shippingAmt  = Number(shipRules?.mumbai ?? 100);
                shippingLabel = 'Mumbai Local Delivery';
            } else if (zone === 'india') {
                shippingAmt  = Number(shipRules?.india ?? 200);
                shippingLabel = 'India Delivery';
            } else if (addrCountry === 'United States') {
                const ovr = (shipRules?.country_overrides || []).find(o => o.country === 'United States');
                shippingAmt  = ovr ? Number(ovr.shipping) : Number(shipRules?.row ?? 5000);
                shippingLabel = 'USA Shipping';
            } else {
                const ovr = (shipRules?.country_overrides || []).find(o => o.country === addrCountry);
                shippingAmt  = ovr ? Number(ovr.shipping) : Number(shipRules?.row ?? 5000);
                shippingLabel = 'International Shipping';
            }
        } else {
            shippingLabel = 'Shipping';
            taxLabel = 'GST / Tax';
        }

        const total = taxableAmount + taxAmount + shippingAmt;

        return {
            subtotal, discount, afterDiscount,
            packingTotal, operatingTotal, taxableAmount,
            taxRate, taxLabel, taxAmount,
            shippingAmt, shippingLabel,
            total, zone, totalQty,
            packingPerPiece, operatingPerPiece
        };
    }, [cart, promoApplied, financeRules, addrCountry, addrCity, selectedAddressId]);

    const { subtotal, discount, afterDiscount, packingTotal, operatingTotal, taxableAmount, taxRate, taxLabel, taxAmount, shippingAmt, shippingLabel, total } = priceBreakdown;

    const applyPromo = () => {
        if (promo.trim().toUpperCase() === 'ASAT15') {
            setPromoApplied(true);
            showToast('ASAT15 promo code applied! 15% discount has been credited.', 'success');
        } else {
            showToast('Invalid promo code', 'error');
        }
    };

    const handleCheckoutClick = () => {
        if (!user) {
            showToast('Please log in to proceed to checkout.', 'error');
            setTimeout(() => navigate('/login?redirect=/cart'), 1500);
            return;
        }

        if (cart.length === 0) {
            showToast('Your bag is empty.', 'error');
            return;
        }

        if (!selectedAddressId) {
            showToast('Please select a shipping address to checkout.', 'warning');
            return;
        }

        handlePlaceOrder();
    };

    const handlePlaceOrder = async (e) => {
        if (e) e.preventDefault();

        if (!addrName.trim()) { showToast('Please select a shipping address.', 'error'); return; }
        if (!addrPhone.trim()) { showToast('Please select an address with phone number.', 'error'); return; }
        if (!addrLine.trim()) { showToast('Please select an address with street details.', 'error'); return; }
        if (!addrCity.trim()) { showToast('Please select an address with city details.', 'error'); return; }
        if (addrCountry === 'India' && !addrState.trim()) { showToast('Please select an address with state details.', 'error'); return; }
        if (!addrPin.trim()) { showToast('Please select an address with ZIP/PIN code.', 'error'); return; }

        setPlacing(true);

        try {
            const oId = `#ASAT-${Math.floor(1000 + Math.random() * 9000)}`;

            // Ensure all designer items have mfgId before placing the order
            const formattedItems = await Promise.all(cart.map(async (i) => {
                let mfgId = i.mfgId;
                let mfgName = i.mfgName;

                if (!i.isMfgProduct && !mfgId) {
                    try {
                        const design = await apiFetch(`/api/designs/${i.id}`);
                        const bpId = design.base_product_id;
                        if (bpId) {
                            const baseProd = await apiFetch(`/api/products/${bpId}`);
                            mfgId = baseProd.mfg_id;
                            mfgName = baseProd.mfg_name || baseProd.mfgName || '';
                        }
                    } catch (err) {
                        console.error("Failed to retrieve manufacturer info for:", i.name, err);
                    }
                }

                return {
                    name: i.name,
                    title: i.name,
                    size: i.size,
                    color: i.color || '',
                    price: Number(i.price) || 0,
                    qty: Number(i.qty) || 1,
                    image: i.image || '',
                    isMfgProduct: !!i.isMfgProduct,
                    mfgId: isValidUUID(mfgId) ? mfgId : null,
                    mfgName: mfgName || '',
                    baseCost: i.isMfgProduct ? (i.baseCost || Number(i.price) || 0) : (i.pricing?.baseCost || 0),
                    printStyle: i.isMfgProduct ? (i.printStyle || 'Plain') : 'Printed',
                    printCost: i.isMfgProduct ? (Number(i.printCost) || 0) : (i.pricing?.printingCost || 0),
                    colorName: i.colorName || 'Default',
                    designerId: !i.isMfgProduct && isValidUUID(i.designerId) ? i.designerId : null,
                    designerUsername: !i.isMfgProduct ? (i.designerUsername || 'anonymous') : 'anonymous'
                };
            }));

            // Calculate earnings splits
            const dEarnings = cart.reduce((sum, item) => sum + parseEarnings(item).designer, 0);
            const mEarnings = cart.reduce((sum, item) => sum + parseEarnings(item).mfg, 0);

            // Find designer and manufacturer details at order level (as fallback or for single columns)
            const designerItem = cart.find(i => !i.isMfgProduct && i.designerId);
            const desId = designerItem && isValidUUID(designerItem.designerId) ? designerItem.designerId : null;
            const desUser = designerItem ? (designerItem.designerUsername || 'anonymous') : 'anonymous';

            const mfgItem = formattedItems.find(i => i.mfgId);
            const mfgId = mfgItem && isValidUUID(mfgItem.mfgId) ? mfgItem.mfgId : null;

            const fullAddress = `${addrLine}${addrLandmark ? ` (Landmark: ${addrLandmark})` : ''}, ${addrCity}, ${addrState ? `${addrState}, ` : ''}${addrCountry} - ${addrPin}`;

            const orderData = {
                order_id: oId,
                user_id: user?.id && isValidUUID(user.id) ? user.id : null,
                customer_name: addrName,
                items: formattedItems,
                total_amount: Number(priceBreakdown.total) || 0,
            tax_amount: Number(priceBreakdown.taxAmount) || 0,
            shipping_amount: Number(priceBreakdown.shippingAmt) || 0,
                designer_earnings: dEarnings,
                mfg_earnings: mEarnings,
                designer_id: desId,
                designer_username: desUser,
                mfg_id: mfgId,
                status: 'pending',
                contact: addrPhone,
                phone: addrPhone,
                address: fullAddress,
                country: addrCountry,
                tracking_id: ''
            };

            await apiFetch('/api/orders', {
                method: 'POST',
                body: JSON.stringify(orderData)
            });

            // Construct WhatsApp message
            const msg = cart.map(i => {
                let itemText = `• ${i.name} (${i.size}) × ${i.qty}`;
                const detailParts = [];
                const col = i.colorName || i.color;
                if (col) detailParts.push(`Color: ${col}`);
                if (i.isMfgProduct && i.printStyle) {
                    detailParts.push(`Printing: ${i.printStyle}`);
                }
                if (detailParts.length > 0) {
                    itemText += ` [${detailParts.join(', ')}]`;
                }
                itemText += ` — ${formatPrice(i.price * i.qty)}`;
                return itemText;
            }).join('\n');

            const fullMsg = `Hi! I'd like to place an order (Order ID: ${oId}):\n\n${msg}\n\nDelivery Details:\nName: ${addrName}\nPhone: ${addrPhone}\nAddress: ${fullAddress}, ${addrCountry}\n\nSubtotal: ${formatPrice(priceBreakdown.subtotal)}\n${priceBreakdown.taxRate > 0 ? `${priceBreakdown.taxLabel}: ${formatPrice(priceBreakdown.taxAmount)}\n` : ''}Shipping: ${formatPrice(priceBreakdown.shippingAmt)}\nTotal: ${formatPrice(priceBreakdown.total)}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(fullMsg)}`, '_blank');

            // Clear cart
            updateCart([]);
            setShowAddressModal(false);
            navigate('/orders');
        } catch (err) {
            console.error("Error creating Supabase order:", err);
            showToast("There was an error creating your order. Please try again.", 'error');
        } finally {
            setPlacing(false);
        }
    };

    return (
        <>
            <style>{styles}</style>
            <style>{TOAST_CSS}</style>
            <ToastContainer toasts={toasts} />
            
            {showAddressEditModal && (
                <div className="addr-backdrop" onClick={() => setShowAddressEditModal(false)}>
                    <div className="addr-modal" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3>{editingAddress ? '✏️ Edit Shipping Address' : '➕ Add Shipping Address'}</h3>
                        <form onSubmit={handleAddOrEditAddressSubmit} className="addr-form">
                            <div className="addr-row">
                                <div className="addr-field">
                                    <label>Address Label (e.g. Home, Work)</label>
                                    <select
                                        className="addr-input"
                                        value={formLabel}
                                        onChange={e => setFormLabel(e.target.value)}
                                        required
                                    >
                                        <option value="Home">Home</option>
                                        <option value="Work">Work</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="addr-field">
                                    <label>Recipient Name</label>
                                    <input 
                                        type="text" 
                                        className="addr-input" 
                                        value={formFullName} 
                                        onChange={e => setFormFullName(e.target.value)} 
                                        placeholder="Full Name"
                                        required 
                                    />
                                </div>
                            </div>
                            
                            <div className="addr-row">
                                <div className="addr-field">
                                    <label>Mobile Number (For Delivery)</label>
                                    <input 
                                        type="tel" 
                                        className="addr-input" 
                                        value={formPhone} 
                                        onChange={e => setFormPhone(e.target.value)} 
                                        placeholder="Mobile Number"
                                        required 
                                    />
                                </div>
                                <div className="addr-field">
                                    <label>Country</label>
                                    <select
                                        className="addr-input"
                                        value={formCountry}
                                        onChange={e => {
                                            setFormCountry(e.target.value);
                                            if (e.target.value !== 'India') setFormState('');
                                        }}
                                        required
                                    >
                                        {allowedCountries.map(c => (
                                            <option key={c.code} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="addr-row">
                                {formCountry === 'India' ? (
                                    <div className="addr-field">
                                        <label>State</label>
                                        <select
                                            className="addr-input"
                                            value={formState}
                                            onChange={e => setFormState(e.target.value)}
                                            required
                                        >
                                            <option value="">Select State</option>
                                            {INDIAN_STATES.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="addr-field">
                                        <label>City</label>
                                        <input 
                                            type="text" 
                                            className="addr-input" 
                                            value={formCity} 
                                            onChange={e => setFormCity(e.target.value)} 
                                            placeholder="City"
                                            required 
                                        />
                                    </div>
                                )}
                                <div className="addr-field">
                                    <label>ZIP / PIN Code</label>
                                    <input 
                                        type="text" 
                                        className="addr-input" 
                                        value={formPincode} 
                                        onChange={e => setFormPincode(e.target.value)} 
                                        placeholder="ZIP/PIN Code"
                                        required 
                                    />
                                </div>
                            </div>

                            {formCountry === 'India' && (
                                <div className="addr-field">
                                    <label>City</label>
                                    <input 
                                        type="text" 
                                        className="addr-input" 
                                        value={formCity} 
                                        onChange={e => setFormCity(e.target.value)} 
                                        placeholder="City"
                                        required 
                                    />
                                </div>
                            )}

                            <div className="addr-field">
                                <label>Street Address</label>
                                <input 
                                    type="text" 
                                    className="addr-input" 
                                    value={formLine1} 
                                    onChange={e => setFormLine1(e.target.value)} 
                                    placeholder="Flat, House no., Building, Street"
                                    required 
                                />
                            </div>

                            <div className="addr-field">
                                <label>Nearby Landmarks (Optional)</label>
                                <input 
                                    type="text" 
                                    className="addr-input" 
                                    value={formLine2} 
                                    onChange={e => setFormLine2(e.target.value)} 
                                    placeholder="e.g. Near Metro Station"
                                />
                            </div>

                            <div className="addr-actions">
                                <button type="button" className="addr-btn-secondary" onClick={() => setShowAddressEditModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="addr-btn-primary">
                                    Save Address
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="cart-page">
                <BackButton />
                <div className="cart-hero">
                    <h1>YOUR BAG</h1>
                    <p>{cart.length} {cart.length === 1 ? 'item' : 'items'} in your bag</p>
                </div>

                <div className="cart-layout">
                    {cart.length === 0 ? (
                        <div className="cart-empty">
                            <div className="cart-empty-icon"><i className="fas fa-shopping-bag"></i></div>
                            <h3>YOUR BAG IS EMPTY</h3>
                            <p>Looks like you haven't added anything yet. Discover our collection and find your style.</p>
                            <button className="cta-gold" onClick={() => navigate('/products')}>CONTINUE SHOPPING</button>
                        </div>
                    ) : (
                        <>
                            {/* ── Cart Items ── */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                            {/* ── Cart Items ── */}
                            <div className="cart-items">
                                {!isMobile && (
                                    <div className="cart-items-header">
                                        <span>Product</span>
                                        <span>Price</span>
                                        <span>Quantity</span>
                                        <span>Total</span>
                                        <span></span>
                                    </div>
                                )}
                                {cart.map((item, idx) => (
                                    <div className="cart-item" key={`${item.id}-${item.size}-${item.colorIdx}-${idx}`}>
                                        <div className="cart-item-product">
                                            <img className="cart-item-img" src={item.image} alt={item.name} onClick={() => navigate(`/products/${item.id}`)} />
                                            <div className="cart-item-details">
                                                <span className="cart-item-name" onClick={() => navigate(`/products/${item.id}`)}>{item.name}</span>
                                                <span className="cart-item-meta">Size: {item.size}</span>
                                                <span className="cart-item-meta">
                                                    <span className="cart-item-color-dot" style={{ backgroundColor: item.color }}></span>
                                                    Color: {item.colorName || item.color || 'Selected'}
                                                </span>
                                                {!item.isMfgProduct && item.designerUsername && (
                                                    <span className="cart-item-meta" style={{ display: 'block', marginTop: '2px', color: 'var(--gold)', fontWeight: '500' }}>
                                                        by @{item.designerUsername}
                                                    </span>
                                                )}
                                                {item.isMfgProduct && item.printStyle && (
                                                    <span className="cart-item-meta" style={{ display: 'block', marginTop: '2px' }}>
                                                        Printing: {item.printStyle} (+{formatPrice(item.printCost || 0, true)})
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="cart-item-price">{formatPrice(item.price)}</div>
                                        <div className="cart-item-qty">
                                            <button className="cart-qty-btn" onClick={() => updateQty(idx, -1)}>−</button>
                                            <div className="cart-qty-val">{item.qty}</div>
                                            <button className="cart-qty-btn" onClick={() => updateQty(idx, 1)}>+</button>
                                        </div>
                                        <div className="cart-item-total">{formatPrice(item.price * item.qty)}</div>
                                        <button className="cart-remove-btn" onClick={() => removeItem(idx)} title="Remove">
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* ── Shipping Address Management Section ── */}
                            <div className="cart-address-section" style={{ background: 'white', border: '1px solid #eee', borderRadius: '8px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '12px' }}>
                                    <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: '1.1rem', letterSpacing: '2px', margin: 0, color: 'var(--dark)' }}>📍 Shipping Address</h3>
                                    {user && (
                                        <button 
                                            type="button"
                                            className="fin-btn fin-btn--save" 
                                            style={{ margin: 0, padding: '8px 16px', fontSize: '0.75rem', fontFamily: "'Montserrat', sans-serif", border: '1px solid var(--gold)', borderRadius: '4px', background: 'transparent', color: 'var(--gold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }} 
                                            onClick={openAddAddressModal}
                                        >
                                            ➕ Add New Address
                                        </button>
                                    )}
                                </div>
                                
                                {!user ? (
                                    <div style={{ padding: '20px 0', textAlign: 'center', color: '#888', fontFamily: "'Montserrat', sans-serif", fontSize: '0.85rem' }}>
                                        <i className="fas fa-lock" style={{ fontSize: '1.5rem', color: 'var(--gold)', marginBottom: '10px', display: 'block' }}></i>
                                        Please <span style={{ color: 'var(--gold)', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }} onClick={() => navigate('/login?redirect=/cart')}>log in</span> to add and select shipping address.
                                    </div>
                                ) : userAddresses.length === 0 ? (
                                    <div style={{ padding: '20px 0', textAlign: 'center', color: '#888', fontFamily: "'Montserrat', sans-serif", fontSize: '0.85rem' }}>
                                        <i className="fas fa-map-marker-alt" style={{ fontSize: '1.5rem', color: '#ccc', marginBottom: '10px', display: 'block' }}></i>
                                        You have no saved addresses. Please add a shipping address to calculate tax/shipping and checkout.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {userAddresses.map(addr => {
                                            const isSelected = selectedAddressId === addr.id;
                                            return (
                                                <div 
                                                    key={addr.id} 
                                                    onClick={() => selectAddress(addr)}
                                                    style={{ 
                                                        display: 'flex', 
                                                        gap: '14px', 
                                                        padding: '16px', 
                                                        border: isSelected ? '2px solid var(--gold)' : '1px solid #eee', 
                                                        borderRadius: '8px', 
                                                        cursor: 'pointer',
                                                        background: isSelected ? 'rgba(197, 160, 89, 0.02)' : 'white',
                                                        transition: 'all 0.2s',
                                                        position: 'relative'
                                                    }}
                                                >
                                                    <input 
                                                        type="radio" 
                                                        name="shipping_address" 
                                                        checked={isSelected}
                                                        onChange={() => selectAddress(addr)}
                                                        style={{ marginTop: '3px', accentColor: 'var(--gold)', cursor: 'pointer' }}
                                                    />
                                                    <div style={{ flex: 1, fontFamily: "'Montserrat', sans-serif", fontSize: '0.82rem', color: '#444', lineHeight: '1.5', paddingRight: '60px' }}>
                                                        <div style={{ fontWeight: 700, color: 'var(--dark)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                            <span>{addr.full_name}</span>
                                                            <span style={{ fontSize: '0.65rem', background: '#eee', padding: '2px 6px', borderRadius: '3px', color: '#666', textTransform: 'uppercase', fontWeight: 600 }}>{addr.label || 'Home'}</span>
                                                            {addr.is_default && <span style={{ fontSize: '0.65rem', background: 'var(--gold)', padding: '2px 6px', borderRadius: '3px', color: 'white', fontWeight: 600 }}>Default</span>}
                                                        </div>
                                                        <div>{addr.line1}</div>
                                                        {addr.line2 && <div style={{ color: '#666', fontStyle: 'italic' }}>Landmark: {addr.line2}</div>}
                                                        <div>{addr.city}, {addr.state ? `${addr.state}, ` : ''}{addr.country} - <span style={{ fontWeight: 600 }}>{addr.pincode}</span></div>
                                                        <div style={{ marginTop: '4px', fontWeight: 600, color: '#666' }}>📞 Alt Mobile: {addr.phone}</div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '12px', position: 'absolute', top: '16px', right: '16px' }}>
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => openEditAddressModal(addr, e)}
                                                            style={{ border: 'none', background: 'transparent', color: '#666', cursor: 'pointer', fontSize: '0.9rem', padding: '4px' }}
                                                            title="Edit Address"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => handleDeleteAddress(addr.id, e)}
                                                            style={{ border: 'none', background: 'transparent', color: '#d9534f', cursor: 'pointer', fontSize: '0.9rem', padding: '4px' }}
                                                            title="Delete Address"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                            {/* ── Order Summary ── */}
                            <div className="cart-summary">
                                <h3>ORDER SUMMARY</h3>
                                <div className="cart-summary-row">
                                    <span>Selling Price</span>
                                    <span>{formatPrice(subtotal)}</span>
                                </div>
                                {discount > 0 && (
                                    <div className="cart-summary-row" style={{ color: '#2e7d32' }}>
                                        <span>Discount (ASAT15)</span>
                                        <span style={{ color: '#2e7d32' }}>−{formatPrice(discount)}</span>
                                    </div>
                                )}

                                <div className="cart-summary-row" style={{ color: '#C5A059', fontWeight: 600 }}>
                                    <span>{taxLabel} <span style={{ fontSize: '0.7rem', fontWeight: 400, color: '#888' }}>(applied at billing)</span></span>
                                    <span>{selectedAddressId ? (taxRate === 0 ? 'None' : `+ ${formatPrice(taxAmount)}`) : '—'}</span>
                                </div>
                                <div className="cart-summary-row cart-summary-row--muted">
                                    <span>Shipping</span>
                                    <span>{selectedAddressId ? `+ ${formatPrice(priceBreakdown.shippingAmt)}` : '—'}</span>
                                </div>

                                <div className="cart-finance-note">
                                    <i className="fas fa-info-circle"></i>
                                    Prices shown include selling markup. GST is calculated based on your delivery address and applied at billing.
                                </div>

                                <div className="cart-promo">
                                    <input
                                        type="text"
                                        placeholder="Promo code"
                                        value={promo}
                                        onChange={e => setPromo(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') applyPromo(); }}
                                    />
                                    <button onClick={applyPromo}>Apply</button>
                                </div>
                                <div className="cart-summary-divider" />
                                <div className="cart-summary-total">
                                    <span>{selectedAddressId ? 'Grand Total' : 'Subtotal'}</span>
                                    <span>{formatPrice(total)}</span>
                                </div>
                                {currency !== 'INR' && (
                                    <div style={{
                                        fontSize: '0.72rem', color: 'var(--gold)', letterSpacing: '1px',
                                        fontFamily: "'Montserrat', sans-serif", textTransform: 'uppercase',
                                        marginTop: '10px', marginBottom: '20px', textAlign: 'center',
                                        background: 'rgba(197, 160, 89, 0.05)', padding: '8px 12px',
                                        border: '1px solid rgba(197, 160, 89, 0.2)', borderRadius: '2px'
                                    }}>
                                        <i className="fas fa-info-circle" style={{ marginRight: '6px' }}></i>
                                        Payment processed in INR (₹{total.toLocaleString('en-IN')})
                                    </div>
                                )}
                                  {isRestricted && (
                                      <div style={{
                                          margin: '14px 0',
                                          padding: '12px 14px',
                                          background: '#fef2f2',
                                          border: '1.5px solid #fee2e2',
                                          borderRadius: '8px',
                                          color: '#991b1b',
                                          fontFamily: "'Montserrat', sans-serif",
                                          fontSize: '0.78rem',
                                          fontWeight: '500',
                                          display: 'flex',
                                          alignItems: 'flex-start',
                                          gap: '8px',
                                          lineHeight: '1.4',
                                          textAlign: 'left'
                                      }}>
                                          <i className="fas fa-exclamation-circle" style={{ marginTop: '2px', flexShrink: 0 }}></i>
                                          <div>
                                              <strong style={{ display: 'block', marginBottom: '3px' }}>Delivery Restricted to {addrCountry}</strong>
                                              {financeRules?.delivery_restrictions?.message || "We currently do not deliver to this country. Please select a different country or contact support."}
                                          </div>
                                      </div>
                                  )}
                                  <button 
                                      className="cart-checkout-btn" 
                                      onClick={handleCheckoutClick}
                                      disabled={!selectedAddressId || isRestricted || placing}
                                      style={(!selectedAddressId || isRestricted || placing) ? { background: '#888', cursor: 'not-allowed', opacity: 0.6 } : {}}
                                  >
                                      {isRestricted ? 'DELIVERY RESTRICTED' : (placing ? 'PLACING ORDER...' : (selectedAddressId ? 'CHECKOUT VIA WHATSAPP' : 'SELECT ADDRESS TO CHECKOUT'))}
                                  </button>
                                <a className="cart-continue" onClick={() => navigate('/products')}>← Continue Shopping</a>
                                <div className="cart-secure">
                                    <i className="fas fa-lock"></i>
                                    Secure checkout • SSL encrypted
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

export default Cart;
