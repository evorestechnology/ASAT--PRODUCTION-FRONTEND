import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiFetch } from '../../api';
import BackButton from '../../components/BackButton';
import { useCurrency } from '../../context/CurrencyContext';
import { useToast, ToastContainer, TOAST_CSS } from '../../components/useToast';
import { useAuth } from '../../context/AuthContext';

const styles = `
    /* â•â•â•â•â•â•â• Product Detail â€” Full Width Split Layout â•â•â•â•â•â•â• */
    .pdp-page { background: var(--light); }

    .pdp-breadcrumb {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.78rem;
        letter-spacing: 1px;
        color: #999;
        padding: 20px 4%;
    }
    .pdp-breadcrumb a {
        color: #999;
        text-decoration: none;
        transition: color 0.3s;
    }
    .pdp-breadcrumb a:hover { color: var(--gold); }
    .pdp-breadcrumb span { color: var(--dark); font-weight: 600; }

    /* Split layout â€” gallery left, info right */
    .pdp-split {
        display: grid;
        grid-template-columns: 55% 45%;
        min-height: 80vh;
    }

    /* â”€â”€ Gallery â”€â”€ */
    .pdp-gallery {
        padding: 0 0 60px 4%;
    }
    .pdp-main-image-container {
        position: relative;
        cursor: zoom-in;
        overflow: hidden;
        border-radius: 6px;
        margin-bottom: 14px;
        width: 100%;
        aspect-ratio: 4/5;
        max-height: 520px;
        background: #fafafa;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(0, 0, 0, 0.05);
    }
    
    .pdp-main-image-container:hover .pdp-main-image {
        transform: scale(1.04);
    }
    
    .pdp-main-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
        border-radius: 6px;
        display: block;
        transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.35s ease;
        animation: pdpFadeIn 0.4s ease-out;
    }
    
    .pdp-image-zoom-badge {
        position: absolute;
        bottom: 16px;
        right: 16px;
        background: rgba(18, 18, 18, 0.7);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.15);
        padding: 8px 14px;
        border-radius: 30px;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.68rem;
        letter-spacing: 1px;
        text-transform: uppercase;
        opacity: 0;
        transform: translateY(8px);
        transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
        pointer-events: none;
        display: flex;
        align-items: center;
        gap: 6px;
        z-index: 10;
    }
    
    .pdp-main-image-container:hover .pdp-image-zoom-badge {
        opacity: 1;
        transform: translateY(0);
    }

    /* â”€â”€ Enlarged Image Overlay (Lightbox) â”€â”€ */
    .pdp-enlarged-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(12, 12, 12, 0.96);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        animation: pdpFadeIn 0.35s forwards cubic-bezier(0.25, 1, 0.5, 1);
    }

    .pdp-enlarged-container {
        position: relative;
        width: 90%;
        max-width: 1200px;
        height: 85vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        padding: 20px 0;
        outline: none;
    }

    .pdp-enlarged-header {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: white;
        font-family: 'Cinzel', serif;
        letter-spacing: 2px;
        padding: 0 20px;
        z-index: 10002;
    }

    .pdp-enlarged-title {
        font-size: 1.1rem;
        color: var(--gold);
        text-transform: uppercase;
        margin: 0;
    }

    .pdp-enlarged-controls {
        display: flex;
        align-items: center;
        gap: 15px;
    }

    .pdp-enlarged-control-btn {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(197, 160, 89, 0.35);
        color: white;
        padding: 8px 16px;
        border-radius: 30px;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.72rem;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
    }

    .pdp-enlarged-control-btn:hover,
    .pdp-enlarged-control-btn.active-magnify {
        background: var(--gold);
        color: var(--dark);
        border-color: var(--gold);
        box-shadow: 0 0 15px rgba(197, 160, 89, 0.4);
    }

    .pdp-enlarged-control-btn i {
        font-size: 0.8rem;
    }

    .pdp-enlarged-close {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: white;
        font-size: 1.2rem;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        cursor: pointer;
        transition: transform 0.3s ease, color 0.3s ease, background 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .pdp-enlarged-close:hover {
        color: var(--gold);
        border-color: var(--gold);
        background: rgba(197, 160, 89, 0.1);
        transform: rotate(90deg);
    }

    .pdp-enlarged-body {
        position: relative;
        flex: 1;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 20px 0;
    }

    .pdp-enlarged-image-wrap {
        position: relative;
        max-width: 80%;
        max-height: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border-radius: 8px;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.04);
    }

    .pdp-enlarged-img {
        max-width: 100%;
        max-height: 60vh;
        object-fit: contain;
        border-radius: 6px;
        transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s ease;
        animation: pdpZoomIn 0.4s forwards cubic-bezier(0.25, 1, 0.5, 1);
    }

    /* Ken Burns slowly breathes/zooms when autoscroll runs */
    .pdp-enlarged-img.kb-active {
        animation: pdpKenBurns 6s infinite alternate ease-in-out;
    }

    .pdp-enlarged-arrow {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 54px;
        height: 54px;
        border-radius: 50%;
        background: rgba(18, 18, 18, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: white;
        font-size: 1.1rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        z-index: 10005;
        backdrop-filter: blur(4px);
    }

    .pdp-enlarged-arrow:hover {
        background: var(--gold);
        color: var(--dark);
        border-color: var(--gold);
        box-shadow: 0 0 20px rgba(197, 160, 89, 0.5);
    }

    .pdp-enlarged-arrow.prev { left: 30px; }
    .pdp-enlarged-arrow.next { right: 30px; }

    .pdp-enlarged-footer {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 15px;
        z-index: 10002;
    }

    .pdp-enlarged-dots {
        display: flex;
        gap: 8px;
    }

    .pdp-enlarged-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.25);
        border: none;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .pdp-enlarged-dot.active {
        background: var(--gold);
        transform: scale(1.25);
        box-shadow: 0 0 8px var(--gold);
    }

    .pdp-enlarged-thumbs {
        display: flex;
        gap: 12px;
        max-width: 100%;
        overflow-x: auto;
        padding: 5px;
        scrollbar-width: none; /* Firefox */
    }

    .pdp-enlarged-thumbs::-webkit-scrollbar {
        display: none; /* Safari and Chrome */
    }

    .pdp-enlarged-thumb {
        width: 50px;
        height: 65px;
        object-fit: cover;
        border-radius: 4px;
        cursor: pointer;
        opacity: 0.4;
        border: 2px solid transparent;
        transition: all 0.3s ease;
    }

    .pdp-enlarged-thumb:hover { opacity: 0.75; }

    .pdp-enlarged-thumb.active {
        opacity: 1;
        border-color: var(--gold);
        box-shadow: 0 0 10px rgba(197, 160, 89, 0.4);
        transform: translateY(-2px);
    }
    .pdp-thumbs {
        display: flex;
        gap: 10px;
    }
    .pdp-thumb {
        width: 80px;
        height: 100px;
        object-fit: cover;
        border: 2px solid transparent;
        border-radius: 4px;
        cursor: pointer;
        transition: border-color 0.3s, opacity 0.3s;
        opacity: 0.5;
    }
    .pdp-thumb:hover { opacity: 0.85; }
    .pdp-thumb.active {
        border-color: var(--gold);
        opacity: 1;
    }

    /* â”€â”€ Info panel â€” sticky â”€â”€ */
    .pdp-info {
        padding: 0 5% 60px 40px;
        position: sticky;
        top: 80px;
        align-self: start;
        max-height: calc(100vh - 80px);
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: rgba(197,160,89,0.3) transparent;
    }
    .pdp-info::-webkit-scrollbar { width: 4px; }
    .pdp-info::-webkit-scrollbar-thumb { background: rgba(197,160,89,0.3); border-radius: 4px; }

    .pdp-collection-tag {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.65rem;
        letter-spacing: 3.5px;
        text-transform: uppercase;
        color: var(--gold);
        margin-bottom: 10px;
        display: block;
    }
    .pdp-product-name {
        font-family: 'Cinzel', serif;
        font-size: 2.4rem;
        font-weight: 700;
        letter-spacing: 3px;
        margin: 0 0 8px;
        color: var(--dark);
        line-height: 1.15;
    }
    .pdp-designer {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.82rem;
        color: #888;
        letter-spacing: 1px;
        margin-bottom: 24px;
    }
    .pdp-price {
        font-family: 'Cinzel', serif;
        font-size: 1.8rem;
        font-weight: 700;
        color: var(--dark);
        margin-bottom: 28px;
    }
    .pdp-divider {
        height: 1px;
        background: #e5e5e5;
        margin: 24px 0;
    }

    /* Color / Size / Qty selectors */
    .pdp-section-label {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.72rem;
        letter-spacing: 2px;
        text-transform: uppercase;
        color: #666;
        margin-bottom: 12px;
        display: block;
    }
    .pdp-colors { display: flex; gap: 12px; margin-bottom: 24px; }
    .pdp-color-swatch {
        width: 32px; height: 32px; border-radius: 50%;
        border: 2px solid transparent; cursor: pointer;
        transition: 0.3s; position: relative;
    }
    .pdp-color-swatch:hover { transform: scale(1.15); }
    .pdp-color-swatch.active {
        border-color: var(--gold);
        box-shadow: 0 0 0 3px rgba(197,160,89,0.25);
    }
    .pdp-sizes { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 28px; }
    .pdp-size-btn {
        min-width: 52px; padding: 10px 16px;
        border: 1px solid #ddd; background: white;
        font-family: 'Montserrat', sans-serif; font-size: 0.82rem;
        letter-spacing: 1px; cursor: pointer; transition: 0.3s; text-align: center;
    }
    .pdp-size-btn:hover { border-color: var(--dark); }
    .pdp-size-btn.active { background: var(--dark); color: white; border-color: var(--dark); }

    .pdp-qty-row { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; }
    .pdp-qty-control { display: flex; align-items: center; border: 1px solid #ddd; }
    .pdp-qty-btn {
        width: 40px; height: 40px; border: none; background: white;
        font-size: 1.2rem; cursor: pointer; transition: 0.3s;
        display: flex; align-items: center; justify-content: center;
    }
    .pdp-qty-btn:hover { background: #f5f5f5; }
    .pdp-qty-value {
        width: 50px; text-align: center;
        font-family: 'Montserrat', sans-serif; font-size: 0.9rem;
        border-left: 1px solid #ddd; border-right: 1px solid #ddd; padding: 10px 0;
    }

    /* Actions */
    .pdp-actions { display: flex; gap: 12px; margin-bottom: 28px; }
    .pdp-add-bag {
        flex: 1; padding: 16px 32px; background: var(--dark); color: white;
        border: none; font-family: 'Cinzel', serif; font-size: 0.85rem;
        letter-spacing: 2.5px; cursor: pointer; transition: 0.3s;
    }
    .pdp-add-bag:hover { background: var(--gold); }
    .pdp-buy-now {
        flex: 1; padding: 16px 32px; background: var(--gold); color: white;
        border: none; font-family: 'Cinzel', serif; font-size: 0.85rem;
        letter-spacing: 2.5px; cursor: pointer; transition: 0.3s;
    }
    .pdp-buy-now:hover { background: var(--dark); }
    .pdp-wishlist-btn {
        width: 54px; height: 54px; border: 1px solid #ddd; background: white;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: 0.3s; font-size: 1.3rem; flex-shrink: 0;
    }
    .pdp-wishlist-btn:hover { border-color: var(--gold); color: var(--gold); }

    /* Tabs */
    .pdp-tabs { display: flex; border-bottom: 1px solid #e5e5e5; margin-bottom: 20px; flex-wrap: wrap; }
    .pdp-tab {
        padding: 12px 20px; border: none; background: none;
        font-family: 'Montserrat', sans-serif; font-size: 0.75rem;
        letter-spacing: 1.5px; text-transform: uppercase; cursor: pointer;
        color: #999; position: relative; transition: color 0.3s;
    }
    .pdp-tab:hover { color: var(--dark); }
    .pdp-tab.active { color: var(--dark); font-weight: 600; }
    .pdp-tab.active::after {
        content: ''; position: absolute; bottom: -1px; left: 0; right: 0;
        height: 2px; background: var(--gold);
    }
    .pdp-tab-content {
        font-family: 'Montserrat', sans-serif; font-size: 0.88rem;
        line-height: 1.85; color: #555; letter-spacing: 0.3px;
    }
    .pdp-tab-content ul { padding-left: 20px; margin: 0; }
    .pdp-tab-content li { margin-bottom: 8px; }

    /* â”€â”€ Not Found â”€â”€ */
    .pdp-not-found {
        text-align: center; padding: 120px 5%;
    }
    .pdp-not-found h2 {
        font-family: 'Cinzel', serif; letter-spacing: 3px; margin-bottom: 16px;
    }
    .pdp-not-found p { color: #888; margin-bottom: 30px; }

    /* â”€â”€ Responsive â”€â”€ */
    @media (max-width: 900px) {
        .pdp-split { grid-template-columns: 1fr; }
        .pdp-gallery { padding: 0 4% 30px; }
        .pdp-info {
            position: static; padding: 0 4% 40px;
            max-height: none; overflow-y: visible;
        }
        .pdp-product-name { font-size: 1.8rem; }
        .pdp-price { font-size: 1.4rem; }
    }
    @media (max-width: 600px) {
        .pdp-product-name { font-size: 1.4rem; letter-spacing: 2px; }
        .pdp-price { font-size: 1.2rem; }
        .pdp-actions { flex-direction: column; }
        .pdp-actions .pdp-wishlist-btn { width: 100%; height: auto; padding: 14px; }
        .pdp-thumb { width: 60px; height: 75px; }
        .pdp-tab { padding: 10px 14px; font-size: 0.68rem; }
    }

    @keyframes pdpFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes pdpZoomIn {
        from { transform: scale(0.95); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
    }
    @keyframes pdpKenBurns {
        from { transform: scale(1); }
        to { transform: scale(1.06); }
    }

    /* Size Chart Modal Overlay */
    .pdp-sizechart-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(12, 12, 12, 0.75);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        animation: pdpFadeIn 0.3s forwards cubic-bezier(0.25, 1, 0.5, 1);
    }
    .pdp-sizechart-container {
        background: #ffffff;
        width: 90%;
        max-width: 650px;
        max-height: 80vh;
        border-radius: 8px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,0.1);
        transform: scale(0.95);
        animation: pdpZoomIn 0.3s forwards cubic-bezier(0.25, 1, 0.5, 1);
    }
    .pdp-sizechart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px;
        border-bottom: 1px solid #eee;
        background: #fafafa;
    }
    .pdp-sizechart-title {
        font-family: 'Cinzel', serif;
        font-size: 1.1rem;
        letter-spacing: 1.5px;
        color: var(--dark);
        margin: 0;
    }
    .pdp-sizechart-close {
        background: none;
        border: none;
        font-size: 1.2rem;
        color: #999;
        cursor: pointer;
        transition: color 0.3s;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .pdp-sizechart-close:hover {
        color: var(--dark);
    }
    .pdp-sizechart-body {
        padding: 24px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: white;
    }
    .pdp-sizechart-img {
        max-width: 100%;
        max-height: 60vh;
        object-fit: contain;
        border-radius: 4px;
    }
`;

function ProductDetail() {
    const { productId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { toasts, showToast } = useToast();
    const { formatPrice } = useCurrency();
    const { applyMarkup } = useCurrency();
    
    const { user, profile } = useAuth();
    const [financeRules, setFinanceRules] = useState(null);

    // Fetch settings/finance on mount
    useEffect(() => {
        apiFetch('/api/settings')
            .then(data => setFinanceRules(data))
            .catch(() => {});
    }, []);

    const isRestricted = React.useMemo(() => {
        if (!user || !profile || !profile.country) return false;
        const dr = financeRules?.delivery_restrictions;
        if (!dr || !dr.restricted_countries) return false;
        return dr.restricted_countries.includes(profile.country);
    }, [user, profile, financeRules]);

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [globalShippingNote, setGlobalShippingNote] = useState('');
    const [welcomeToast, setWelcomeToast] = useState(location.state?.welcomeMessage || '');

    useEffect(() => {
        if (location.state?.welcomeMessage) {
            setWelcomeToast(location.state.welcomeMessage);
            window.history.replaceState({}, document.title);
            const timer = setTimeout(() => setWelcomeToast(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [location]);

    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedColor, setSelectedColor] = useState(0);
    const [selectedSize, setSelectedSize] = useState(null);
    const [showSizeChart, setShowSizeChart] = useState(false);

    // Keyboard support for closing Size Guide Modal
    useEffect(() => {
        if (!showSizeChart) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setShowSizeChart(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showSizeChart]);
    const [selectedPrintStyle, setSelectedPrintStyle] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('description');
    const [added, setAdded] = useState(false);
    const [wishlisted, setWishlisted] = useState(false);

    useEffect(() => {
        const checkWishlist = () => {
            const wishlist = JSON.parse(localStorage.getItem('asat_wishlist') || '[]');
            setWishlisted(wishlist.some(item => item.id === productId));
        };
        checkWishlist();
        window.addEventListener('wishlist_updated', checkWishlist);
        return () => window.removeEventListener('wishlist_updated', checkWishlist);
    }, [productId]);

    const activeImages = React.useMemo(() => {
        if (!product) return [];

        // â”€â”€ Designer products â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        if (!product.isMfgProduct) {
            const colorName = product.colors && product.colors[selectedColor]; // e.g. "BLACK"

            // 1. Try explicit customerImages map (from new uploads)
            if (product.customerImages && colorName) {
                const key = Object.keys(product.customerImages).find(
                    k => k.toLowerCase() === String(colorName).toLowerCase()
                );
                if (key) {
                    const imgs = product.customerImages[key];
                    if (Array.isArray(imgs) && imgs.length > 0) {
                        const finalImgs = [...imgs];
                        if (product.sizeChartImage && !finalImgs.includes(product.sizeChartImage))
                            finalImgs.push(product.sizeChartImage);
                        return finalImgs;
                    }
                }
            }

            // 2. Parse color from filename â€” pattern: *_customer_COLORNAME_*.ext
            //    Works for existing designs uploaded via DesignerUpload
            if (colorName && product.images && product.images.length > 0) {
                const colorUpper = String(colorName).toUpperCase();
                // Try to match e.g. "_customer_BLACK_" or "_BLACK_" in URL
                const colorSpecific = product.images.filter(url => {
                    const filename = url.split('/').pop().toUpperCase();
                    return filename.includes(`_${colorUpper}_`) ||
                           filename.includes(`_CUSTOMER_${colorUpper}_`) ||
                           filename.startsWith(`${colorUpper}_`);
                });
                if (colorSpecific.length > 0) {
                    const finalImgs = [...colorSpecific];
                    if (product.sizeChartImage && !finalImgs.includes(product.sizeChartImage))
                        finalImgs.push(product.sizeChartImage);
                    return finalImgs;
                }
            }

            // 3. Fallback: show all images when no color-specific ones found
            const baseImgs = product.images || [];
            if (product.sizeChartImage && !baseImgs.includes(product.sizeChartImage))
                return [...baseImgs, product.sizeChartImage];
            return baseImgs;
        }

        // â”€â”€ Manufacturer (base) products â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        const colorObj = product.colors && product.colors[selectedColor];
        if (colorObj) {
            const imgs = [];
            if (colorObj.frontImage) imgs.push(colorObj.frontImage);
            if (colorObj.backImage) imgs.push(colorObj.backImage);
            const finalImgs = imgs.length > 0 ? imgs : [product.coverImage || product.colors?.[0]?.frontImage || ''];
            if (product.sizeChartImage && !finalImgs.includes(product.sizeChartImage))
                return [...finalImgs, product.sizeChartImage];
            return finalImgs;
        }
        const fallback = [product.coverImage || product.colors?.[0]?.frontImage || ''];
        if (product.sizeChartImage && !fallback.includes(product.sizeChartImage))
            return [...fallback, product.sizeChartImage];
        return fallback;
    }, [product, selectedColor]);


    useEffect(() => {
        setSelectedImage(0);
    }, [selectedColor, productId]);

    const handleWishlistToggle = () => {
        if (!product) return;
        
        // Guard check for Login
        const isLoggedIn = localStorage.getItem('asat_loggedIn') === 'true';
        if (!isLoggedIn) {
            navigate('/login', { 
                state: { 
                    from: window.location.pathname, 
                    message: 'Please sign in to add products to your wishlist!' 
                } 
            });
            return;
        }

        const wishlist = JSON.parse(localStorage.getItem('asat_wishlist') || '[]');
        const isAlreadyWishlisted = wishlist.some(item => item.id === product.id);
        let newWishlist;
        if (isAlreadyWishlisted) {
            newWishlist = wishlist.filter(item => item.id !== product.id);
        } else {
            newWishlist = [...wishlist, {
                id: product.id,
                name: product.name,
                price: product.price,
                image: activeImages[0] || product.coverImage || product.colors?.[0]?.frontImage || '',
                collection: product.collection || 'ASAT Exclusive',
                sizes: product.sizes || ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
                colors: product.colors || [],
                isMfgProduct: !!product.isMfgProduct,
                ...(product.isMfgProduct ? {
                    mfgId: product.mfgId || 'unknown_mfg',
                    mfgName: product.mfgName || 'Unknown Manufacturer',
                    printingStyles: product.printingStyles || [],
                    coverImage: product.coverImage || ''
                } : {
                    designerId: product.designerId || 'unknown_designer',
                    designerUsername: product.designerUsername || 'anonymous'
                })
            }];
        }
        localStorage.setItem('asat_wishlist', JSON.stringify(newWishlist));
        setWishlisted(!isAlreadyWishlisted);
        window.dispatchEvent(new Event('wishlist_updated'));
    };

    const isAlreadyInCart = () => {
        if (!product || !selectedSize) return false;
        const cart = JSON.parse(localStorage.getItem('asat_cart') || '[]');
        return cart.some(i => {
            const matchBasic = i.id === product.id && i.size === selectedSize && i.colorIdx === selectedColor;
            if (!matchBasic) return false;
            if (product.isMfgProduct) {
                const targetStyle = selectedPrintStyle ? selectedPrintStyle.style : 'Plain';
                return i.printStyle === targetStyle;
            } else {
                return !i.isMfgProduct;
            }
        });
    };

    const [isEnlarged, setIsEnlarged] = useState(false);
    const [autoScrollActive, setAutoScrollActive] = useState(true);
    const [isMagnified, setIsMagnified] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

    const handleMouseMove = (e) => {
        if (!isMagnified) return;
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setMousePos({ x, y });
    };

    // Reset magnification when changing images or closing modal
    useEffect(() => {
        setIsMagnified(false);
    }, [selectedImage, isEnlarged]);

    // â”€â”€ Auto-scroll Effect (Normal & Enlarged Modes) â”€â”€
    useEffect(() => {
        let timer;
        // Auto-scroll runs normally; in Enlarged modal it respects play/pause state
        const shouldScroll = product && activeImages.length > 1 && (!isEnlarged || autoScrollActive);

        if (shouldScroll) {
            timer = setTimeout(() => {
                setSelectedImage((prev) => (prev + 1) % activeImages.length);
            }, 3000); // Cycles images every 3 seconds
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [isEnlarged, autoScrollActive, product, selectedImage, activeImages]);

    // â”€â”€ Keyboard Support for Enlarged Mode â”€â”€
    useEffect(() => {
        if (!isEnlarged || !product) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsEnlarged(false);
            } else if (e.key === 'ArrowRight' && activeImages.length > 1) {
                setSelectedImage((prev) => (prev + 1) % activeImages.length);
            } else if (e.key === 'ArrowLeft' && activeImages.length > 1) {
                setSelectedImage((prev) => (prev - 1 + activeImages.length) % activeImages.length);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isEnlarged, product, activeImages]);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);

        const loadProduct = async () => {
            try {
                const settings = await apiFetch('/api/settings/global_shipping_note').catch(() => null);
                if (settings && settings.value && settings.value.text) {
                    setGlobalShippingNote(settings.value.text);
                }
            } catch (e) {
                console.error("Failed to fetch shipping note");
            }

            try {
                // Try fetching design from backend first
                let designData = null;
                try {
                    designData = await apiFetch(`/api/designs/${productId}`);
                } catch (e) {
                    if (e.status === 404) {
                        // Safely fallback to base products if design is not found
                    } else {
                        // It's a 500 or network error, do not fallback
                        throw e;
                    }
                }

                if (designData && isMounted) {
                    const parsedDesc = (() => {
                        const desc = designData.description;
                        if (desc && typeof desc === 'string' && desc.startsWith('{')) {
                            try {
                                return JSON.parse(desc);
                            } catch (e) {
                                return null;
                            }
                        }
                        return null;
                    })();

                    // If design is hidden, do not display it
                    if (parsedDesc && parsedDesc.isHidden) {
                        setProduct(null);
                        setLoading(false);
                        return;
                    }

                    const dbProduct = {
                        id: designData.id,
                        name: designData.title || 'Unnamed Product',
                        price: Number(designData.price) || 0,
                        category: designData.category?.toLowerCase() || 'general',
                        collection: 'ASAT Exclusive',
                        designer: designData.designer_username ? `@${designData.designer_username}` : 'ASAT Designer',
                        designerId: designData.designer_id || 'unknown_designer',
                        designerUsername: designData.designer_username || 'anonymous',
                        description: parsedDesc ? (parsedDesc.text || '') : (designData.description || 'No description available for this premium designer item.'),
                        customerImages: parsedDesc ? parsedDesc.customerImages : null,
                        baseProductId: parsedDesc ? parsedDesc.baseProductId : null,
                        details: designData.details || [
                            'Premium heavyweight fabric construction',
                            'Precision tailoring designed for modern drape',
                            'Pre-shrunk and color-locked longevity',
                            'Designed exclusively for the ASAT Collection'
                        ],
                        designerNote: designData.designer_note || 'Reflecting a fine balance of modern street aesthetics and rich cultural silhouettes.',
                        washCare: designData.wash_care || ['Machine wash cold inside out', 'Do not bleach', 'Hang dry in shade', 'Iron on low heat'],
                        sizes: designData.sizes || ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
                        sizeChartImage: designData.size_chart_image || '',
                        colors: designData.colors || ['#121212', '#F5F5DC', '#8B4513'],
                        images: designData.images && designData.images.length > 0 ? designData.images : [
                            'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80'
                        ],
                        pricing: parsedDesc ? parsedDesc.pricing : null
                    };

                    // Fetch designer details
                    if (designData.designer_id) {
                        try {
                            const desData = await apiFetch(`/api/designers/${designData.designer_id}`);
                            if (desData) {
                                if (desData.status === 'blocked') {
                                    if (isMounted) {
                                        setProduct(null);
                                        setLoading(false);
                                    }
                                    return;
                                }
                                dbProduct.designer = desData.full_name || `@${designData.designer_username}`;
                            }
                        } catch (err) {
                            console.error('Error fetching designer details:', err);
                        }
                    }

                    // Fetch base product details (sizes, size chart, details)
                    const bpId = designData.base_product_id || parsedDesc?.baseProductId;
                    if (bpId) {
                        try {
                            const catData = await apiFetch(`/api/products/${bpId}`);
                            if (catData) {
                                const catDetails = catData.details || [];
                                if (catData.available === false || catDetails.includes('__DELETED__')) {
                                    if (isMounted) {
                                        setProduct(null);
                                        setLoading(false);
                                    }
                                    return;
                                }

                                if (catData.colors && Array.isArray(catData.colors)) {
                                    dbProduct.colors = dbProduct.colors.filter(colorName => {
                                        const baseColor = catData.colors.find(bc => bc.colorName === colorName);
                                        return !baseColor || baseColor.available !== false;
                                    });
                                    dbProduct.colorDetails = catData.colors;
                                }

                                if (dbProduct.colors.length === 0) {
                                    if (isMounted) {
                                        setProduct(null);
                                        setLoading(false);
                                    }
                                    return;
                                }

                                if (!designData.sizes && catData.sizes) {
                                    dbProduct.sizes = catData.sizes;
                                }
                                if (!dbProduct.sizeChartImage && catData.size_chart_image) {
                                    dbProduct.sizeChartImage = catData.size_chart_image;
                                }
                                if (catData.title) {
                                    dbProduct.collection = catData.title;
                                }
                                if (catData.details && catData.details.length > 0) {
                                    dbProduct.details = catData.details.filter(d => d !== '__DELETED__');
                                }
                                if (catData.wash_care && catData.wash_care.length > 0) {
                                    dbProduct.washCare = catData.wash_care;
                                }
                                dbProduct.mfgId = catData.mfg_id;
                                dbProduct.mfgName = catData.mfg_name || catData.mfgName || '';
                            } else {
                                if (isMounted) {
                                    setProduct(null);
                                    setLoading(false);
                                }
                                return;
                            }
                        } catch (err) {
                            console.error('Error fetching base product details:', err);
                            if (isMounted) {
                                setProduct(null);
                                setLoading(false);
                            }
                            return;
                        }
                    }

                    if (isMounted) {
                        setProduct(dbProduct);
                        setSelectedImage(0);
                        setSelectedColor(0);
                        setSelectedSize(null);
                        setSelectedPrintStyle(null);
                        setQuantity(1);
                    }
                } else {
                    // Design not found â€” base products are not publicly visible
                    if (isMounted) setProduct(null);
                }
            } catch (err) {
                console.error('Error loading product:', err);
                if (isMounted) {
                    setProduct(null);
                    setFetchError('Failed to load product details due to a server error. Please try again later.');
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadProduct();
        return () => { isMounted = false; };
    }, [productId]);

    const handleAddToBag = () => {
        if (!product) return;

        if (product.available === false) {
            showToast('This product is currently not available.', 'error');
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

        if (!selectedSize) { showToast('Please select a size', 'warning'); return; }
        
        if (isAlreadyInCart()) {
            navigate('/cart');
            return;
        }

        const cart = JSON.parse(localStorage.getItem('asat_cart') || '[]');
        
        const itemColor = product.isMfgProduct 
            ? (product.colors[selectedColor]?.color || '') 
            : product.colors[selectedColor];

        const itemColorName = product.isMfgProduct 
            ? (product.colors[selectedColor]?.colorName || '') 
            : (product.colors[selectedColor] || '');

        let garmentMode = "dark";
        if (product.isMfgProduct) {
            garmentMode = product.colors[selectedColor]?.mode || "dark";
        } else if (product.colorDetails) {
            const matchedColor = product.colorDetails.find(c => c.colorName === itemColorName);
            if (matchedColor) {
                garmentMode = matchedColor.mode || "dark";
            }
        }
        const finalPrice = applyMarkup(product.price + (product.isMfgProduct && selectedPrintStyle ? selectedPrintStyle.cost : 0));

        const cartItem = {
            id: product.id,
            name: product.name,
            price: finalPrice,
            image: activeImages[0] || product.coverImage || product.colors?.[0]?.frontImage || '',
            size: selectedSize,
            colorIdx: selectedColor,
            color: itemColor,
            colorName: itemColorName,
            qty: quantity, garmentMode: garmentMode,
            ...(product.isMfgProduct ? {
                isMfgProduct: true,
                mfgId: product.mfgId,
                mfgName: product.mfgName,
                baseCost: product.price,
                printStyle: selectedPrintStyle ? selectedPrintStyle.style : 'Plain',
                printCost: selectedPrintStyle ? selectedPrintStyle.cost : 0
            } : {
                designerId: product.designerId || 'unknown_designer',
                designerUsername: product.designerUsername || 'anonymous',
                pricing: product.pricing || null,
                mfgId: product.mfgId || null,
                mfgName: product.mfgName || ''
            })
        };

        const existingIdx = cart.findIndex(i => {
            const matchBasic = i.id === cartItem.id && i.size === cartItem.size && i.colorIdx === cartItem.colorIdx;
            if (!matchBasic) return false;
            if (product.isMfgProduct) {
                return i.printStyle === cartItem.printStyle;
            } else {
                return !i.isMfgProduct;
            }
        });

        if (existingIdx > -1) {
            cart[existingIdx].qty += quantity;
        } else {
            cart.push(cartItem);
        }

        localStorage.setItem('asat_cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cart_updated'));
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    if (loading) {
        return (
            <>
                <style>{styles}</style>
                <div style={{
                    minHeight: '80vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--light)',
                    color: 'var(--dark)',
                    fontFamily: 'Montserrat, sans-serif'
                }}>
                    <div className="pdp-skeleton-spinner" style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        border: '2px solid rgba(197,160,89,0.15)',
                        borderTopColor: 'var(--gold)',
                        animation: 'spin 1s linear infinite',
                        marginBottom: '20px'
                    }} />
                    <p style={{ letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.8rem', color: '#999' }}>
                        Loading Product Details...
                    </p>
                    <style>{`
                        @keyframes spin {
                            to { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            </>
        );
    }

    if (!product) {
        return (
            <>
                <style>{styles}</style>
                <div className="pdp-not-found">
                    <h2>{fetchError ? 'SERVER ERROR' : 'PRODUCT NOT FOUND'}</h2>
                    <p>{fetchError || "The item you're looking for doesn't exist."}</p>
                    <button className="cta-gold" onClick={() => navigate('/products')}>BROWSE COLLECTION</button>
                </div>
            </>
        );
    }

    return (
        <>
            <style>{styles}</style>
            <style>{TOAST_CSS}</style>
            <ToastContainer toasts={toasts} />
            <div className="pdp-page">
                <BackButton />
                <div className="pdp-breadcrumb">
                    <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>HOME</a>
                    {' / '}
                    <a href="/products" onClick={(e) => { e.preventDefault(); navigate('/products'); }}>COLLECTION</a>
                    {' / '}
                    <span>{product.name}</span>
                </div>

                <div className="pdp-split">
                    {/* â”€â”€ Gallery (left 55%) â”€â”€ */}
                    <div className="pdp-gallery">
                        <div className="pdp-main-image-container" onClick={() => setIsEnlarged(true)}>
                            <img key={selectedImage} className="pdp-main-image" src={activeImages[selectedImage] || product.coverImage || product.colors?.[0]?.frontImage || ''} alt={product.name} />
                            <div className="pdp-image-zoom-badge">
                                <i className="fa-solid fa-expand"></i> Click to Zoom
                            </div>
                        </div>
                        <div className="pdp-thumbs">
                            {activeImages.map((img, i) => (
                                <img key={i} className={`pdp-thumb ${i === selectedImage ? 'active' : ''}`} src={img} alt={`${product.name} view ${i + 1}`} onClick={() => setSelectedImage(i)} />
                            ))}
                        </div>
                    </div>

                    {/* â”€â”€ Info panel (right 45%) â”€â”€ */}
                    <div className="pdp-info">
                        <span className="pdp-collection-tag">{product.collection}</span>
                        <h1 className="pdp-product-name">{product.name}</h1>
                        <p className="pdp-designer">By {product.designer}</p>
                        <div className="pdp-price">
                            {formatPrice(applyMarkup((product.price) + (product.isMfgProduct && selectedPrintStyle ? selectedPrintStyle.cost : 0)))}
                            <span style={{ display: 'block', fontSize: '0.72rem', fontFamily: "'Montserrat', sans-serif", letterSpacing: '1.5px', color: '#888', fontWeight: 400, marginTop: '4px' }}>excl. GST &amp; shipping</span>
                        </div>

                        <div className="pdp-divider" />

                        <span className="pdp-section-label">
                            COLOR{(() => {
                                if (product.isMfgProduct) {
                                    return product.colors[selectedColor]?.colorName
                                        ? ` â€” ${product.colors[selectedColor].colorName.toUpperCase()}`
                                        : '';
                                }
                                // Designer product â€” colors are plain strings
                                const c = product.colors?.[selectedColor];
                                return c ? ` â€” ${String(c).toUpperCase()}` : '';
                            })()}
                        </span>
                        <div className="pdp-colors">
                            {product.colors.map((c, i) => {
                                const swatchBg = product.isMfgProduct ? c.color : c;
                                const swatchTitle = product.isMfgProduct ? c.colorName : c;
                                return (
                                    <div 
                                        key={i} 
                                        className={`pdp-color-swatch ${i === selectedColor ? 'active' : ''}`} 
                                        style={{ backgroundColor: swatchBg }} 
                                        title={swatchTitle}
                                        onClick={() => setSelectedColor(i)} 
                                    />
                                );
                            })}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span className="pdp-section-label" style={{ marginBottom: 0 }}>SIZE</span>
                            {product.sizeChartImage && (
                                <button 
                                    onClick={() => setShowSizeChart(true)} 
                                    style={{ 
                                        background: 'none', 
                                        border: 'none', 
                                        color: 'var(--gold)', 
                                        fontFamily: "'Montserrat', sans-serif", 
                                        fontSize: '0.72rem', 
                                        letterSpacing: '1.5px', 
                                        textTransform: 'uppercase', 
                                        textDecoration: 'underline', 
                                        cursor: 'pointer',
                                        padding: 0
                                    }}
                                >
                                    Size Guide
                                </button>
                            )}
                        </div>
                        <div className="pdp-sizes">
                            {product.sizes.map(size => (
                                <button key={size} className={`pdp-size-btn ${selectedSize === size ? 'active' : ''}`} onClick={() => setSelectedSize(size)}>{size}</button>
                            ))}
                        </div>


                        <span className="pdp-section-label">QUANTITY</span>
                        <div className="pdp-qty-row">
                            <div className="pdp-qty-control">
                                <button className="pdp-qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>âˆ’</button>
                                <div className="pdp-qty-value">{quantity}</div>
                                <button className="pdp-qty-btn" onClick={() => setQuantity(quantity + 1)}>+</button>
                            </div>
                        </div>

                        <div className="pdp-actions">
                            {product.available === false ? (
                                <button className="pdp-add-bag" disabled style={{ background: '#555', cursor: 'not-allowed', color: '#999', width: '100%' }}>
                                    PRODUCT NOT AVAILABLE
                                </button>
                            ) : (
                                <>
                                    <button className="pdp-add-bag" onClick={handleAddToBag}>
                                        {isAlreadyInCart() ? 'VIEW CART' : (added ? 'âœ“ ADDED TO BAG' : 'ADD TO BAG')}
                                    </button>
                                    <button className="pdp-buy-now" onClick={() => { 
                                        // Guard check for Login
                                        const isLoggedIn = localStorage.getItem('asat_loggedIn') === 'true';
                                        if (!isLoggedIn) {
                                            navigate('/login', { 
                                                state: { 
                                                    from: window.location.pathname, 
                                                    message: 'Please sign in to buy now!' 
                                                } 
                                            });
                                            return;
                                        }

                                        if (!selectedSize) { 
                                            showToast('Please select a size', 'warning'); 
                                            return; 
                                        }

                                        if (isAlreadyInCart()) {
                                            navigate('/cart');
                                        } else {
                                            handleAddToBag(); 
                                            navigate('/cart'); 
                                        }
                                    }}>
                                        BUY NOW
                                    </button>
                                </>
                            )}
                            <button 
                                className="pdp-wishlist-btn" 
                                onClick={handleWishlistToggle}
                                title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                                style={{ color: wishlisted ? 'var(--gold)' : 'var(--dark)', borderColor: wishlisted ? 'var(--gold)' : '#ddd' }}
                            >
                                {wishlisted ? 'â™¥' : 'â™¡'}
                            </button>
                        </div>

                        <div className="pdp-divider" />

                        <div className="pdp-tabs">
                            {['description', 'details', 'shipping', 'designer', 'washcare', ...(product.sizeChartImage ? ['sizeguide'] : [])].map(tab => (
                                <button key={tab} className={`pdp-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                                    {tab === 'washcare' ? 'Wash Care' : tab === 'designer' ? 'Designer Note' : tab === 'sizeguide' ? 'Size Guide' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>
                        <div className="pdp-tab-content">
                            {activeTab === 'description' && <p>{product.description}</p>}
                            {activeTab === 'details' && <ul>{product.details.map((d, i) => <li key={i}>{d}</li>)}</ul>}
                            {activeTab === 'shipping' && (
                                <div dangerouslySetInnerHTML={{ __html: globalShippingNote || '<p>Standard shipping terms apply.</p>' }} />
                            )}
                            {activeTab === 'designer' && <p>{product.designerNote || 'Designer note coming soon.'}</p>}
                            {activeTab === 'washcare' && (
                                <ul>{product.washCare && product.washCare.map((item, i) => <li key={i}>{item}</li>)}</ul>
                            )}
                            {activeTab === 'sizeguide' && product.sizeChartImage && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                                    <p style={{ alignSelf: 'flex-start', margin: 0, fontSize: '0.82rem', color: '#666', fontFamily: "'Montserrat', sans-serif" }}>Please refer to the size chart below to select your fit:</p>
                                    <img 
                                        src={product.sizeChartImage} 
                                        alt="Size Guide" 
                                        style={{ 
                                            maxWidth: '100%', 
                                            maxHeight: '400px', 
                                            objectFit: 'contain',
                                            border: '1px solid rgba(0,0,0,0.08)',
                                            borderRadius: '4px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                        }} 
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* â”€â”€ Size Guide Modal Overlay â”€â”€ */}
            {showSizeChart && product && product.sizeChartImage && (
                <div className="pdp-sizechart-overlay" onClick={() => setShowSizeChart(false)}>
                    <div className="pdp-sizechart-container" onClick={(e) => e.stopPropagation()}>
                        <div className="pdp-sizechart-header">
                            <h2 className="pdp-sizechart-title">SIZE GUIDE</h2>
                            <button className="pdp-sizechart-close" onClick={() => setShowSizeChart(false)} title="Close (Esc)">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <div className="pdp-sizechart-body">
                            <img className="pdp-sizechart-img" src={product.sizeChartImage} alt={`${product.name} Size Chart`} />
                        </div>
                    </div>
                </div>
            )}

            {/* â”€â”€ Enlarged Image Modal Overlay (Lightbox with Auto-scroll) â”€â”€ */}
            {isEnlarged && product && (
                <div className="pdp-enlarged-overlay" onClick={() => setIsEnlarged(false)}>
                    <div className="pdp-enlarged-container" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Header controls */}
                        <div className="pdp-enlarged-header">
                            <h2 className="pdp-enlarged-title">{product.name}</h2>
                            <div className="pdp-enlarged-controls">
                                <button 
                                    className={`pdp-enlarged-control-btn ${isMagnified ? 'active-magnify' : ''}`}
                                    onClick={() => {
                                        setIsMagnified(!isMagnified);
                                        if (!isMagnified) {
                                            setAutoScrollActive(false); // Pause slideshow when magnifying
                                        }
                                    }}
                                    title={isMagnified ? "Disable Magnifier" : "Enable Magnifier"}
                                >
                                    <i className={`fa-solid ${isMagnified ? 'fa-magnifying-glass-minus' : 'fa-magnifying-glass-plus'}`}></i>
                                    {isMagnified ? 'Normal View' : 'Magnify Fabric'}
                                </button>
                                {activeImages.length > 1 && (
                                    <button 
                                        className="pdp-enlarged-control-btn" 
                                        onClick={() => setAutoScrollActive(!autoScrollActive)}
                                        title={autoScrollActive ? "Pause Autoplay" : "Start Autoplay"}
                                    >
                                        <i className={`fa-solid ${autoScrollActive ? 'fa-pause' : 'fa-play'}`}></i>
                                        {autoScrollActive ? 'Pause Slideshow' : 'Play Slideshow'}
                                    </button>
                                )}
                                <button className="pdp-enlarged-close" onClick={() => setIsEnlarged(false)} title="Close (Esc)">
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>
                        </div>

                        {/* Main lightbox body */}
                        <div className="pdp-enlarged-body">
                            {activeImages.length > 1 && (
                                <button 
                                    className="pdp-enlarged-arrow prev" 
                                    onClick={() => setSelectedImage((prev) => (prev - 1 + activeImages.length) % activeImages.length)}
                                    title="Previous Image (Left Arrow)"
                                >
                                    <i className="fa-solid fa-chevron-left"></i>
                                </button>
                            )}

                            <div 
                                className="pdp-enlarged-image-wrap"
                                onMouseMove={handleMouseMove}
                                onClick={() => {
                                    setIsMagnified(!isMagnified);
                                    if (!isMagnified) {
                                        setAutoScrollActive(false); // Pause slideshow when magnifying
                                    }
                                }}
                                style={{ cursor: isMagnified ? 'zoom-out' : 'zoom-in' }}
                            >
                                <img 
                                    key={selectedImage}
                                    className={`pdp-enlarged-img ${autoScrollActive && !isMagnified ? 'kb-active' : ''}`}
                                    src={activeImages[selectedImage] || product.coverImage || product.colors?.[0]?.frontImage || ''} 
                                    alt={product.name} 
                                    style={isMagnified ? {
                                        transform: 'scale(2.2)',
                                        transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                                        transition: 'none',
                                    } : {}}
                                />
                            </div>

                            {activeImages.length > 1 && (
                                <button 
                                    className="pdp-enlarged-arrow next" 
                                    onClick={() => setSelectedImage((prev) => (prev + 1) % activeImages.length)}
                                    title="Next Image (Right Arrow)"
                                >
                                    <i className="fa-solid fa-chevron-right"></i>
                                </button>
                            )}
                        </div>

                        {/* Footer indicator thumbnails */}
                        <div className="pdp-enlarged-footer">
                            {activeImages.length > 1 && (
                                <div className="pdp-enlarged-dots">
                                    {activeImages.map((_, idx) => (
                                        <button 
                                            key={idx} 
                                            className={`pdp-enlarged-dot ${idx === selectedImage ? 'active' : ''}`}
                                            onClick={() => setSelectedImage(idx)}
                                            title={`Go to image ${idx + 1}`}
                                        />
                                    ))}
                                </div>
                            )}

                            <div className="pdp-enlarged-thumbs">
                                {activeImages.map((img, idx) => (
                                    <img 
                                        key={idx} 
                                        className={`pdp-enlarged-thumb ${idx === selectedImage ? 'active' : ''}`}
                                        src={img} 
                                        alt={`${product.name} enlarged view ${idx + 1}`} 
                                        onClick={() => setSelectedImage(idx)}
                                    />
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {welcomeToast && (
                <div style={{
                    position: 'fixed',
                    bottom: '30px',
                    right: '30px',
                    background: 'var(--dark)',
                    color: 'white',
                    borderLeft: '4px solid var(--gold)',
                    padding: '16px 24px',
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: '0.85rem',
                    letterSpacing: '1px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                    zIndex: 99999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    borderRadius: '4px',
                    animation: 'slideIn 0.35s ease forwards'
                }}>
                    <i className="fa-solid fa-circle-check" style={{ color: 'var(--gold)' }}></i>
                    <span>{welcomeToast}</span>
                    <button 
                        onClick={() => setWelcomeToast('')} 
                        style={{ 
                            background: 'transparent', 
                            border: 'none', 
                            color: 'rgba(255,255,255,0.5)', 
                            cursor: 'pointer',
                            marginLeft: '12px',
                            fontSize: '0.9rem'
                        }}
                    >Ã—</button>
                    <style>{`
                        @keyframes slideIn {
                            from { transform: translateX(120%); opacity: 0; }
                            to { transform: translateX(0); opacity: 1; }
                        }
                    `}</style>
                </div>
            )}
        </>
    );
}

export default ProductDetail;

