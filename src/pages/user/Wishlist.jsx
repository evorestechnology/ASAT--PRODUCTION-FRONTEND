import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../components/BackButton';
import { useToast, ToastContainer, TOAST_CSS } from '../../components/useToast';
import { useCurrency } from '../../context/CurrencyContext';


const styles = `
    /* ═══════ Wishlist Page ═══════ */
    .wishlist-page { min-height: 80vh; background: var(--light); padding-bottom: 60px; }

    .wishlist-hero {
        background: var(--dark);
        color: white;
        padding: 50px 5% 45px;
        text-align: center;
    }
    .wishlist-hero h1 {
        font-family: 'Cinzel', serif;
        font-size: 2.2rem;
        letter-spacing: 5px;
        font-weight: 700;
        margin: 0 0 8px;
    }
    .wishlist-hero p {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.82rem;
        letter-spacing: 1.5px;
        color: #aaa;
    }

    .wishlist-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 30px;
        padding: 40px 4%;
        max-width: 1400px;
        margin: 0 auto;
    }

    /* ── Wishlist Card ── */
    .wishlist-card {
        background: white;
        border: 1px solid #eee;
        border-radius: 8px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        position: relative;
    }
    .wishlist-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 25px rgba(0,0,0,0.06);
    }

    .wishlist-img-wrap {
        position: relative;
        aspect-ratio: 4/5;
        overflow: hidden;
        background: #fafafa;
        cursor: pointer;
    }
    .wishlist-img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        transition: transform 0.5s ease;
    }
    .wishlist-card:hover .wishlist-img {
        transform: scale(1.03);
    }

    .wishlist-remove-btn {
        position: absolute;
        top: 15px;
        right: 15px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(0, 0, 0, 0.05);
        color: #555;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        z-index: 10;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .wishlist-remove-btn:hover {
        background: var(--dark);
        color: white;
        border-color: var(--dark);
    }

    .wishlist-details {
        padding: 20px;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        gap: 6px;
    }
    .wishlist-collection {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.65rem;
        letter-spacing: 2px;
        color: var(--gold);
        text-transform: uppercase;
    }
    .wishlist-name {
        font-family: 'Cinzel', serif;
        font-size: 1rem;
        font-weight: 600;
        letter-spacing: 1px;
        color: var(--dark);
        margin: 0;
        cursor: pointer;
        transition: color 0.2s;
    }
    .wishlist-name:hover { color: var(--gold); }
    .wishlist-price {
        font-family: 'Cinzel', serif;
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--dark);
    }
    .wishlist-sizes-list {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.72rem;
        color: #666;
        margin-top: 4px;
        letter-spacing: 0.5px;
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .wishlist-sizes-label {
        font-weight: 600;
        color: var(--dark);
    }
    .wishlist-sizes-values {
        color: var(--gold);
        font-weight: 500;
    }

    .wishlist-actions {
        display: flex;
        gap: 10px;
        margin-top: auto;
        padding: 0 20px 20px;
    }
    .wishlist-add-bag {
        flex: 1;
        padding: 12px;
        background: var(--dark);
        color: white;
        border: none;
        font-family: 'Cinzel', serif;
        font-size: 0.75rem;
        letter-spacing: 1.5px;
        cursor: pointer;
        transition: 0.3s;
        text-align: center;
    }
    .wishlist-add-bag:hover { background: var(--gold); }

    /* ── Empty Wishlist ── */
    .wishlist-empty {
        grid-column: 1 / -1;
        text-align: center;
        padding: 80px 20px;
    }
    .wishlist-empty-icon {
        font-size: 4rem;
        color: #ddd;
        margin-bottom: 24px;
    }
    .wishlist-empty h3 {
        font-family: 'Cinzel', serif;
        font-size: 1.4rem;
        letter-spacing: 3px;
        margin-bottom: 10px;
        color: var(--dark);
    }
    .wishlist-empty p {
        font-family: 'Montserrat', sans-serif;
        color: #999;
        font-size: 0.88rem;
        margin-bottom: 30px;
    }

    /* Size selector popup */
    .wishlist-size-modal {
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(12,12,12,0.6);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center;
        z-index: 10000;
        animation: pdpFadeIn 0.3s forwards;
    }
    .wishlist-size-modal-content {
        background: white;
        width: 90%;
        max-width: 400px;
        padding: 30px;
        border-radius: 8px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        border: 1px solid rgba(197,160,89,0.2);
        animation: pdpZoomIn 0.3s forwards;
    }
    .wishlist-size-modal-content h4 {
        font-family: 'Cinzel', serif;
        font-size: 1.1rem;
        letter-spacing: 1.5px;
        margin: 0 0 16px;
        color: var(--dark);
        text-transform: uppercase;
        border-bottom: 1px solid #eee;
        padding-bottom: 12px;
    }
    .wishlist-size-modal-sizes {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-bottom: 24px;
    }
    .wishlist-size-modal-btn {
        min-width: 46px; padding: 8px 12px;
        border: 1px solid #ddd; background: white;
        font-family: 'Montserrat', sans-serif; font-size: 0.78rem;
        letter-spacing: 1px; cursor: pointer; transition: 0.2s;
    }
    .wishlist-size-modal-btn:hover { border-color: var(--dark); }
    .wishlist-size-modal-btn.active { background: var(--dark); color: white; border-color: var(--dark); }
    
    .wishlist-size-modal-actions {
        display: flex;
        gap: 10px;
    }
    .wishlist-size-modal-confirm {
        flex: 1; padding: 12px;
        background: var(--gold); color: white;
        border: none; font-family: 'Cinzel', serif;
        font-size: 0.78rem; letter-spacing: 1.5px; cursor: pointer; transition: 0.3s;
    }
    .wishlist-size-modal-confirm:hover { background: var(--dark); }
    .wishlist-size-modal-cancel {
        padding: 12px 20px;
        background: #f5f5f5; color: #555;
        border: 1px solid #ddd; font-family: 'Montserrat', sans-serif;
        font-size: 0.78rem; letter-spacing: 1px; cursor: pointer; transition: 0.2s;
    }
    .wishlist-size-modal-cancel:hover { background: #eee; }

    @keyframes pdpFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes pdpZoomIn {
        from { transform: scale(0.95); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
    }
`;

function Wishlist() {
    const navigate = useNavigate();
    const { toasts, showToast } = useToast();
    const { formatPrice, applyMarkup } = useCurrency();
    const [wishlist, setWishlist] = useState([]);
    
    // Size selection modal states
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [chosenSize, setChosenSize] = useState('');

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('asat_wishlist') || '[]');
        setWishlist(stored);
    }, []);

    const updateWishlist = (newWishlist) => {
        setWishlist(newWishlist);
        localStorage.setItem('asat_wishlist', JSON.stringify(newWishlist));
        window.dispatchEvent(new Event('wishlist_updated'));
    };

    const removeWishlistItem = (id) => {
        const filtered = wishlist.filter(item => item.id !== id);
        updateWishlist(filtered);
    };

    const handleQuickAdd = (product) => {
        // Standard sizing fallback if none is fetched
        setSelectedProduct(product);
        setChosenSize('');
    };

    const confirmQuickAdd = () => {
        if (!chosenSize) {
            showToast('Please select a size first', 'warning');
            return;
        }
        
        // Guard check for Login
        const isLoggedIn = localStorage.getItem('asat_loggedIn') === 'true';
        if (!isLoggedIn) {
            navigate('/login', { 
                state: { 
                    from: window.location.pathname, 
                    message: 'Please sign in to build your bag!' 
                } 
            });
            return;
        }

        const cart = JSON.parse(localStorage.getItem('asat_cart') || '[]');
        
        const selectedColorIdx = 0;
        const colors = selectedProduct.colors || [];
        const itemColor = selectedProduct.isMfgProduct 
            ? (colors[selectedColorIdx]?.color || '') 
            : (colors[selectedColorIdx] || '#121212');

        const itemColorName = selectedProduct.isMfgProduct 
            ? (colors[selectedColorIdx]?.colorName || '') 
            : '';

        const cartItem = {
            id: selectedProduct.id,
            name: selectedProduct.name,
            price: selectedProduct.price,
            image: selectedProduct.image,
            size: chosenSize,
            colorIdx: selectedColorIdx,
            color: itemColor,
            colorName: itemColorName,
            qty: 1,
            ...(selectedProduct.isMfgProduct ? {
                isMfgProduct: true,
                mfgId: selectedProduct.mfgId || 'unknown_mfg',
                mfgName: selectedProduct.mfgName || 'Unknown Manufacturer',
                baseCost: selectedProduct.price,
                printStyle: 'Plain',
                printCost: 0
            } : {
                designerId: selectedProduct.designerId || 'unknown_designer',
                designerUsername: selectedProduct.designerUsername || 'anonymous'
            })
        };

        const existingIdx = cart.findIndex(i => {
            const matchBasic = i.id === cartItem.id && i.size === cartItem.size && i.colorIdx === cartItem.colorIdx;
            if (!matchBasic) return false;
            if (cartItem.isMfgProduct) {
                return i.printStyle === cartItem.printStyle;
            } else {
                return !i.isMfgProduct;
            }
        });
        
        if (existingIdx > -1) {
            cart[existingIdx].qty += 1;
        } else {
            cart.push(cartItem);
        }
        
        localStorage.setItem('asat_cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cart_updated'));
        
        // Close modal
        setSelectedProduct(null);
        setChosenSize('');
        
        showToast('Item successfully added to your bag!', 'success');
    };

    return (
        <>
            <style>{styles}</style>
            <style>{TOAST_CSS}</style>
            <ToastContainer toasts={toasts} />
            <div className="wishlist-page">
                <BackButton />
                <div className="wishlist-hero">
                    <h1>YOUR WISHLIST</h1>
                    <p>{wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved for later</p>
                </div>

                <div className="wishlist-grid">
                    {wishlist.length === 0 ? (
                        <div className="wishlist-empty">
                            <div className="wishlist-empty-icon"><i className="far fa-heart"></i></div>
                            <h3>YOUR WISHLIST IS EMPTY</h3>
                            <p>Save items you love here so you can easily discover, share, and purchase them later.</p>
                            <button className="cta-gold" onClick={() => navigate('/products')}>EXPLORE PRODUCTS</button>
                        </div>
                    ) : (
                        wishlist.map((item) => (
                            <div className="wishlist-card" key={item.id}>
                                <button className="wishlist-remove-btn" onClick={() => removeWishlistItem(item.id)} title="Remove">
                                    <i className="fas fa-times"></i>
                                </button>
                                <div className="wishlist-img-wrap" onClick={() => navigate(`/products/${item.id}`)}>
                                    <img className="wishlist-img" src={item.image} alt={item.name} />
                                </div>
                                <div className="wishlist-details">
                                    <span className="wishlist-collection">{item.collection}</span>
                                    <h4 className="wishlist-name" onClick={() => navigate(`/products/${item.id}`)}>{item.name}</h4>
                                    <div className="wishlist-price">{formatPrice(applyMarkup(item.price))}</div>
                                    <div className="wishlist-sizes-list">
                                        <span className="wishlist-sizes-label">SIZES:</span>
                                        <span className="wishlist-sizes-values">
                                            {(Array.isArray(item.sizes) ? item.sizes : (typeof item.sizes === 'string' ? item.sizes.split(',').map(s => s.trim()) : ['XS', 'S', 'M', 'L', 'XL', 'XXL'])).join(', ')}
                                        </span>
                                    </div>
                                </div>
                                <div className="wishlist-actions">
                                    <button className="wishlist-add-bag" onClick={() => handleQuickAdd(item)}>
                                        ADD TO BAG
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Sizing Modal */}
                {selectedProduct && (
                    <div className="wishlist-size-modal" onClick={() => setSelectedProduct(null)}>
                        <div className="wishlist-size-modal-content" onClick={(e) => e.stopPropagation()}>
                            <h4>SELECT SIZE</h4>
                            <div className="wishlist-size-modal-sizes">
                                {(Array.isArray(selectedProduct.sizes) 
                                    ? selectedProduct.sizes 
                                    : (typeof selectedProduct.sizes === 'string' 
                                        ? selectedProduct.sizes.split(',').map(s => s.trim()) 
                                        : ['XS', 'S', 'M', 'L', 'XL', 'XXL'])
                                ).map(sz => (
                                    <button 
                                        key={sz} 
                                        className={`wishlist-size-modal-btn ${chosenSize === sz ? 'active' : ''}`}
                                        onClick={() => setChosenSize(sz)}
                                    >
                                        {sz}
                                    </button>
                                ))}
                            </div>
                            <div className="wishlist-size-modal-actions">
                                <button className="wishlist-size-modal-confirm" onClick={confirmQuickAdd}>
                                    ADD TO BAG
                                </button>
                                <button className="wishlist-size-modal-cancel" onClick={() => setSelectedProduct(null)}>
                                    CANCEL
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default Wishlist;
