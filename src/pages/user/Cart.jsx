import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../components/BackButton';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast, ToastContainer, TOAST_CSS } from '../../components/useToast';
import { useCurrency } from '../../context/CurrencyContext';

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

    .addr-btn-secondary:hover {
        background: #ddd;
    }

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

function Cart() {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const { toasts, showToast } = useToast();
    const { formatPrice, currency } = useCurrency();
    const [cart, setCart] = useState([]);
    const [promo, setPromo] = useState('');
    const [promoApplied, setPromoApplied] = useState(false);
    
    // Address Modal states
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [placing, setPlacing] = useState(false);
    const [addrName, setAddrName] = useState('');
    const [addrPhone, setAddrPhone] = useState('');
    const [addrLine, setAddrLine] = useState('');
    const [addrCity, setAddrCity] = useState('');
    const [addrState, setAddrState] = useState('');
    const [addrPin, setAddrPin] = useState('');
    const [addrCountry, setAddrCountry] = useState('India');
    
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 600;

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('asat_cart') || '[]');
        setCart(stored);
    }, []);

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

    const subtotal = cart.reduce((s, item) => s + item.price * item.qty, 0);
    const shipping = subtotal >= 2000 ? 0 : 199;
    const discount = promoApplied ? Math.round(subtotal * 0.15) : 0;
    const total = subtotal - discount + shipping;

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

        // Pre-fill address details from profile/user
        setAddrName(profile?.fullName || user?.displayName || (localStorage.getItem('asat_user') ? JSON.parse(localStorage.getItem('asat_user')).fullName : ''));
        setAddrPhone(profile?.phone || user?.phone || '');
        setAddrLine(profile?.address || '');
        setAddrCountry(profile?.country || 'India');
        setAddrCity('');
        setAddrState('');
        setAddrPin('');

        setShowAddressModal(true);
    };

    const handlePlaceOrder = async (e) => {
        if (e) e.preventDefault();

        if (!addrName.trim()) { showToast('Please enter your name.', 'error'); return; }
        if (!addrPhone.trim()) { showToast('Please enter your phone number.', 'error'); return; }
        if (!addrLine.trim()) { showToast('Please enter your address.', 'error'); return; }
        if (!addrCity.trim()) { showToast('Please enter your city.', 'error'); return; }
        if (!addrState.trim()) { showToast('Please enter your state.', 'error'); return; }
        if (!addrPin.trim()) { showToast('Please enter your ZIP/PIN code.', 'error'); return; }

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

            const fullAddress = `${addrLine}, ${addrCity}, ${addrState} - ${addrPin}`;

            const orderData = {
                order_id: oId,
                user_id: user?.id && isValidUUID(user.id) ? user.id : null,
                customer_name: addrName,
                items: formattedItems,
                total_amount: Number(total) || 0,
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

            const fullMsg = `Hi! I'd like to place an order (Order ID: ${oId}):\n\n${msg}\n\nDelivery Details:\nName: ${addrName}\nPhone: ${addrPhone}\nAddress: ${fullAddress}, ${addrCountry}\n\nTotal: ${formatPrice(total)}`;
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
            
            {showAddressModal && (
                <div className="addr-backdrop" onClick={() => setShowAddressModal(false)}>
                    <div className="addr-modal" onClick={e => e.stopPropagation()}>
                        <h3>Delivery Address</h3>
                        <form onSubmit={handlePlaceOrder} className="addr-form">
                            <div className="addr-row">
                                <div className="addr-field">
                                    <label>Recipient Name</label>
                                    <input 
                                        type="text" 
                                        className="addr-input" 
                                        value={addrName} 
                                        onChange={e => setAddrName(e.target.value)} 
                                        placeholder="Full Name"
                                        required 
                                    />
                                </div>
                                <div className="addr-field">
                                    <label>Phone Number</label>
                                    <input 
                                        type="tel" 
                                        className="addr-input" 
                                        value={addrPhone} 
                                        onChange={e => setAddrPhone(e.target.value)} 
                                        placeholder="Contact Number"
                                        required 
                                    />
                                </div>
                            </div>
                            
                            <div className="addr-field">
                                <label>Street Address</label>
                                <input 
                                    type="text" 
                                    className="addr-input" 
                                    value={addrLine} 
                                    onChange={e => setAddrLine(e.target.value)} 
                                    placeholder="Flat, House no., Building, Company, Apartment, Street"
                                    required 
                                />
                            </div>

                            <div className="addr-row">
                                <div className="addr-field">
                                    <label>City</label>
                                    <input 
                                        type="text" 
                                        className="addr-input" 
                                        value={addrCity} 
                                        onChange={e => setAddrCity(e.target.value)} 
                                        placeholder="City"
                                        required 
                                    />
                                </div>
                                <div className="addr-field">
                                    <label>State</label>
                                    <input 
                                        type="text" 
                                        className="addr-input" 
                                        value={addrState} 
                                        onChange={e => setAddrState(e.target.value)} 
                                        placeholder="State"
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="addr-row">
                                <div className="addr-field">
                                    <label>ZIP / PIN Code</label>
                                    <input 
                                        type="text" 
                                        className="addr-input" 
                                        value={addrPin} 
                                        onChange={e => setAddrPin(e.target.value)} 
                                        placeholder="6 Digit PIN"
                                        required 
                                    />
                                </div>
                                <div className="addr-field">
                                    <label>Country</label>
                                    <input 
                                        type="text" 
                                        className="addr-input" 
                                        value={addrCountry} 
                                        onChange={e => setAddrCountry(e.target.value)} 
                                        placeholder="Country"
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="addr-actions">
                                <button type="button" className="addr-btn-secondary" onClick={() => setShowAddressModal(false)} disabled={placing}>
                                    Cancel
                                </button>
                                <button type="submit" className="addr-btn-primary" disabled={placing}>
                                    {placing ? 'Placing Order...' : 'Confirm & Place Order'}
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

                            {/* ── Order Summary ── */}
                            <div className="cart-summary">
                                <h3>ORDER SUMMARY</h3>
                                <div className="cart-summary-row">
                                    <span>Subtotal</span>
                                    <span>{formatPrice(subtotal)}</span>
                                </div>
                                <div className="cart-summary-row">
                                    <span>Shipping</span>
                                    <span>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                                </div>
                                {promoApplied && (
                                    <div className="cart-summary-row" style={{ color: '#2e7d32' }}>
                                        <span>Discount (ASAT15)</span>
                                        <span style={{ color: '#2e7d32' }}>-{formatPrice(discount)}</span>
                                    </div>
                                )}
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
                                    <span>Total</span>
                                    <span>{formatPrice(total)}</span>
                                </div>
                                {currency !== 'INR' && (
                                     <div style={{
                                         fontSize: '0.72rem',
                                         color: 'var(--gold)',
                                         letterSpacing: '1px',
                                         fontFamily: "'Montserrat', sans-serif",
                                         textTransform: 'uppercase',
                                         marginTop: '10px',
                                         marginBottom: '20px',
                                         textAlign: 'center',
                                         background: 'rgba(197, 160, 89, 0.05)',
                                         padding: '8px 12px',
                                         border: '1px solid rgba(197, 160, 89, 0.2)',
                                         borderRadius: '2px'
                                     }}>
                                         <i className="fas fa-info-circle" style={{ marginRight: '6px' }}></i>
                                         Payment will be safely processed in base INR (₹{total.toLocaleString('en-IN')})
                                     </div>
                                 )}
                                 <button className="cart-checkout-btn" onClick={handleCheckoutClick}>
                                     CHECKOUT VIA WHATSAPP
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
