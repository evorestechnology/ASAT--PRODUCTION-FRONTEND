import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiFetch } from '../../api';
import BackButton from '../../components/BackButton';
import { useCurrency } from '../../context/CurrencyContext';
import { useToast, ToastContainer, TOAST_CSS } from '../../components/useToast';
import { useAuth } from '../../context/AuthContext';

const styles = `
    /* ─── Product Detail Clean Streetwear Layout (BLUORNG PDP) ─── */
    .pdp-page { 
        background: #FFFFFF;
        min-height: 80vh;
        width: 100%;
        box-sizing: border-box;
        padding-bottom: 80px;
    }

    .pdp-breadcrumb {
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        font-size: 0.75rem;
        letter-spacing: 0.5px;
        color: #888888;
        padding: 16px clamp(16px, 3.5vw, 48px);
    }
    .pdp-breadcrumb a {
        color: #888888;
        text-decoration: none;
        transition: color 0.2s;
    }
    .pdp-breadcrumb a:hover { color: #000000; }
    .pdp-breadcrumb span { color: #000000; font-weight: 600; }

    /* ─── 3-COLUMN PDP LAYOUT (BLUORNG EXACT) ─── */
    .pdp-split-3col {
        display: grid;
        grid-template-columns: 1.1fr 1fr 380px;
        gap: 20px;
        padding: 0 clamp(16px, 2.5vw, 36px);
        align-items: start;
        min-height: calc(100vh - 100px);
    }

    /* Column 1: Non-scrollable Fixed Primary Cover Shot */
    .pdp-col-cover {
        position: sticky;
        top: 85px;
        height: calc(100vh - 110px);
        max-height: 820px;
        border-radius: 20px;
        overflow: hidden;
        background: #F8F8F8;
        cursor: zoom-in;
        box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    }

    .pdp-col-cover-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .pdp-col-cover:hover .pdp-col-cover-img {
        transform: scale(1.03);
    }

    /* Column 2: In-place Scrollable Stream of Remaining Angles */
    .pdp-col-stream {
        height: calc(100vh - 110px);
        max-height: 820px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding-right: 4px;
        scrollbar-width: thin;
        scrollbar-color: rgba(0,0,0,0.15) transparent;
    }
    .pdp-col-stream .pdp-stream-card:first-child {
        display: none;
    }

    .pdp-col-stream::-webkit-scrollbar {
        width: 4px;
    }

    .pdp-col-stream::-webkit-scrollbar-thumb {
        background: rgba(0,0,0,0.15);
        border-radius: 4px;
    }

    .pdp-stream-card {
        width: 100%;
        aspect-ratio: 4 / 5;
        border-radius: 20px;
        overflow: hidden;
        background: #F8F8F8;
        cursor: zoom-in;
        position: relative;
        flex-shrink: 0;
        box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    }

    .pdp-stream-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .pdp-stream-card:hover .pdp-stream-img {
        transform: scale(1.03);
    }

    /* Column 3: Sticky Details Card & Accordion */
    .pdp-col-details {
        position: sticky;
        top: 85px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        max-height: calc(100vh - 110px);
        overflow-y: auto;
        scrollbar-width: none;
    }
    .pdp-col-details::-webkit-scrollbar {
        display: none;
    }

    .pdp-info-card {
        background: #FFFFFF;
        border: 1px solid #EBEBEB;
        border-radius: 18px;
        padding: 24px 24px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.02);
    }

    .pdp-header-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 6px;
    }

    .pdp-product-name {
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Montserrat', sans-serif;
        font-size: 1.35rem;
        font-weight: 800;
        letter-spacing: -0.3px;
        color: #000000;
        margin: 0;
        line-height: 1.25;
    }

    .pdp-bookmark-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        color: #000000;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;
        flex-shrink: 0;
    }

    .pdp-bookmark-btn:hover {
        transform: scale(1.15);
    }

    .pdp-price-row {
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        font-size: 1.15rem;
        font-weight: 700;
        color: #000000;
        margin-bottom: 16px;
    }

    /* Recommended Section */
    .pdp-recommended-section {
        margin-top: 80px;
        padding: 0 clamp(16px, 2.5vw, 36px);
    }

    @media (max-width: 1150px) {
        .pdp-split-3col {
            grid-template-columns: 1fr 1fr;
        }
        .pdp-col-details {
            grid-column: 1 / -1;
            position: static;
            max-height: none;
        }
    }

    @media (max-width: 768px) {
        .pdp-split-3col {
            grid-template-columns: 1fr;
            gap: 10px;
        }
        .pdp-col-cover {
            display: none !important;
        }
        .pdp-col-stream {
            display: flex !important;
            flex-direction: row !important;
            overflow-x: auto !important;
            scroll-snap-type: x mandatory !important;
            gap: 12px !important;
            padding: 8px 4vw 20px !important;
            margin: 0 -4% 20px !important;
            width: 100vw !important;
            box-sizing: border-box !important;
            height: auto !important;
            max-height: none !important;
            overflow-y: visible !important;
            scrollbar-width: none !important;
        }
        .pdp-col-stream::-webkit-scrollbar {
            display: none !important;
        }
        .pdp-col-stream .pdp-stream-card:first-child {
            display: block !important;
        }
        .pdp-stream-card {
            flex-shrink: 0 !important;
            width: 80vw !important;
            scroll-snap-align: center !important;
            border-radius: 12px !important;
            overflow: hidden !important;
            height: 55vh !important;
            aspect-ratio: auto !important;
            box-shadow: 0 8px 24px rgba(0,0,0,0.04) !important;
        }
        .pdp-stream-img {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
        }
    }

    .pdp-bookmark-btn:hover {
        transform: scale(1.15);
    }

    .pdp-price-row {
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        font-size: 1.15rem;
        font-weight: 700;
        color: #000000;
        margin-bottom: 20px;
    }

    .pdp-size-header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
    }

    .pdp-size-guide-btn {
        background: #F4F4F4;
        border: none;
        border-radius: 14px;
        padding: 4px 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        font-size: 11px;
        font-weight: 600;
        color: #444444;
        cursor: pointer;
        transition: all 0.2s;
    }

    .pdp-size-guide-btn:hover {
        background: #E8E8E8;
        color: #000000;
    }

    /* Size selector pill chips */
    .pdp-pill-sizes {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-bottom: 24px;
    }

    .pdp-pill-size-btn {
        padding: 10px 22px;
        border-radius: 24px;
        border: 1px solid #E5E5E5;
        background: #FFFFFF;
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        font-size: 13px;
        font-weight: 700;
        color: #000000;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .pdp-pill-size-btn:hover {
        border-color: #000000;
    }

    .pdp-pill-size-btn.active {
        background: #000000;
        color: #FFFFFF;
        border-color: #000000;
    }

    .pdp-pill-size-btn.disabled {
        opacity: 0.4;
        cursor: not-allowed;
        text-decoration: line-through;
    }

    /* Action Buttons Row */
    .pdp-action-pills-row {
        display: flex;
        gap: 12px;
        margin-bottom: 6px;
    }

    .pdp-add-bag-pill {
        flex: 1;
        background: #FFFFFF;
        color: #000000;
        border: 1px solid #000000;
        border-radius: 28px;
        padding: 14px 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 1px;
        text-transform: uppercase;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .pdp-add-bag-pill:hover {
        background: #000000;
        color: #FFFFFF;
    }

    .pdp-buy-now-pill {
        flex: 1;
        background: #000000;
        color: #FFFFFF;
        border: 1px solid #000000;
        border-radius: 28px;
        padding: 14px 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 1px;
        text-transform: uppercase;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .pdp-buy-now-pill:hover {
        background: #222222;
        transform: translateY(-1px);
    }

    /* Accordion / Tab container */
    .pdp-accordion-card {
        background: #FFFFFF;
        border: 1px solid #EBEBEB;
        border-radius: 18px;
        padding: 20px 24px;
    }

    .pdp-tabs-nav {
        display: flex;
        gap: 20px;
        border-bottom: 1px solid #F0F0F0;
        padding-bottom: 12px;
        margin-bottom: 16px;
    }

    .pdp-tab-btn {
        background: none;
        border: none;
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        font-size: 12.5px;
        font-weight: 600;
        color: #888888;
        cursor: pointer;
        padding: 0;
        transition: color 0.2s;
    }

    .pdp-tab-btn.active {
        color: #000000;
        font-weight: 700;
        text-decoration: underline;
        text-underline-offset: 6px;
    }

    .pdp-tab-body {
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        font-size: 12.5px;
        line-height: 1.65;
        color: #555555;
    }

    @media (max-width: 960px) {
        .pdp-split {
            grid-template-columns: 1fr;
        }
        .pdp-sticky-wrap {
            position: static;
        }
    }content: center;
        border: 1px solid rgba(0, 0, 0, 0.05);
    }
    
    .pdp-main-image-container:hover .pdp-main-image {
        transform: scale(1.04);
    }
    
    .pdp-main-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
        border-radius: 2px;
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
        font-family: 'Cormorant Garamond', 'Cinzel', serif;
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
        gap: 12px;
        margin-top: 14px;
        overflow-x: auto;
    }
    .pdp-thumb {
        width: 72px;
        height: 90px;
        object-fit: cover;
        border: 1.5px solid transparent;
        border-radius: 8px;
        cursor: pointer;
        transition: border-color 0.2s, opacity 0.2s;
        opacity: 0.5;
    }
    .pdp-thumb:hover { opacity: 0.85; }
    .pdp-thumb.active {
        border-color: #000000;
        opacity: 1;
    }

    /* ── Info panel — sticky ── */
    .pdp-info {
        padding: 0 0 60px 20px;
        position: sticky;
        top: 80px;
        align-self: start;
        max-height: calc(100vh - 80px);
        overflow-y: auto;
        scrollbar-width: thin;
    }
    .pdp-info::-webkit-scrollbar { width: 4px; }
    .pdp-info::-webkit-scrollbar-thumb { background: #E5E5E5; border-radius: 4px; }

    .pdp-collection-tag {
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        font-size: 0.7rem;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        color: #888888;
        font-weight: 700;
        margin-bottom: 8px;
        display: block;
    }
    .pdp-product-name {
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Montserrat', sans-serif;
        font-size: clamp(1.6rem, 2.4vw, 2.2rem);
        font-weight: 900;
        letter-spacing: -0.5px;
        text-transform: uppercase;
        margin: 0 0 8px;
        color: #000000;
        line-height: 1.15;
    }
    .pdp-designer {
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        font-size: 0.8rem;
        color: var(--gold, #C5A059);
        font-weight: 700;
        letter-spacing: 1px;
        text-transform: uppercase;
        margin-bottom: 16px;
    }
    .pdp-price {
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        font-size: 1.5rem;
        font-weight: 800;
        color: #000000;
        margin-bottom: 24px;
        letter-spacing: -0.5px;
    }
    .pdp-divider {
        height: 1px;
        background: #EEEEEE;
        margin: 24px 0;
    }

    /* Color / Size / Qty selectors */
    .pdp-section-label {
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        font-size: 0.72rem;
        letter-spacing: 1.2px;
        text-transform: uppercase;
        font-weight: 700;
        color: #000000;
        margin-bottom: 12px;
        display: block;
    }
    .pdp-colors { display: flex; gap: 12px; margin-bottom: 24px; }
    .pdp-color-swatch {
        width: 32px; height: 32px; border-radius: 50%;
        border: 2px solid rgba(0, 0, 0, 0.12); cursor: pointer;
        transition: 0.3s; position: relative;
    }
    .pdp-color-swatch:hover { transform: scale(1.15); }
    .pdp-color-swatch.active {
        border-color: #000000;
        box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.15);
    }
    .pdp-sizes { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 28px; }
    .pdp-size-btn {
        min-width: 52px; padding: 10px 16px;
        border: 1px solid #E5E5E5; background: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        font-size: 0.8rem; font-weight: 700;
        letter-spacing: 1px; cursor: pointer; transition: 0.2s; text-align: center;
        border-radius: 4px;
    }
    .pdp-size-btn:hover { border-color: #000000; }
    .pdp-size-btn.active { background: #000000; color: white; border-color: #000000; }
    .pdp-size-btn.disabled {
        opacity: 0.4 !important;
        cursor: not-allowed !important;
        text-decoration: line-through !important;
        background: #fafafa !important;
        color: #888888 !important;
        border-color: #e5e5e5 !important;
    }

    .pdp-qty-row { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; }
    .pdp-qty-control { display: flex; align-items: center; border: 1px solid #E5E5E5; border-radius: 2px; }
    .pdp-qty-btn {
        width: 42px; height: 42px; border: none; background: white;
        font-size: 1.1rem; cursor: pointer; transition: 0.2s;
        display: flex; align-items: center; justify-content: center;
    }
    .pdp-qty-btn:hover { background: #f5f5f5; }
    .pdp-qty-value {
        width: 50px; text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Montserrat', sans-serif;
        font-size: 0.9rem; font-weight: 700;
        border-left: 1px solid #E5E5E5; border-right: 1px solid #E5E5E5; padding: 11px 0;
    }

    /* Actions */
    .pdp-actions { display: flex; gap: 12px; margin-bottom: 28px; }
    .pdp-add-bag {
        flex: 1; padding: 18px 32px; background: #000000; color: white;
        border: none; font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Montserrat', sans-serif;
        font-size: 0.8rem; font-weight: 800;
        letter-spacing: 2px; text-transform: uppercase; cursor: pointer; transition: 0.25s;
        border-radius: 2px;
    }
    .pdp-add-bag:hover { background: var(--gold, #C5A059); color: #000000; }
    .pdp-buy-now {
        flex: 1; padding: 18px 32px; background: var(--gold, #C5A059); color: #000000;
        border: none; font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Montserrat', sans-serif;
        font-size: 0.8rem; font-weight: 800;
        letter-spacing: 2px; text-transform: uppercase; cursor: pointer; transition: 0.25s;
        border-radius: 2px;
    }
    .pdp-buy-now:hover { background: #000000; color: #FFFFFF; }
    .pdp-wishlist-btn {
        width: 54px; height: 54px; border: 1px solid #E5E5E5; background: white;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: 0.2s; font-size: 1.2rem; flex-shrink: 0; border-radius: 2px;
    }
    .pdp-wishlist-btn:hover { border-color: #000000; color: #000000; }
    .pdp-share-btn {
        width: 54px; height: 54px; border: 1px solid #ddd; background: white;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: 0.3s; font-size: 1.15rem; flex-shrink: 0;
    }
    .pdp-share-btn:hover { border-color: var(--gold); color: var(--gold); }
    .pdp-share-dropdown {
        position: absolute;
        bottom: 60px;
        right: 0;
        background: white;
        border: 1px solid #ddd;
        border-radius: 6px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        display: flex;
        flex-direction: column;
        z-index: 100;
        width: 160px;
    }
    .pdp-share-item {
        padding: 10px 14px;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.76rem;
        color: var(--dark);
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: 0.2s;
        width: 100%;
    }
    .pdp-share-item:hover {
        background: #f8f9fa;
        color: var(--gold);
    }

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
        font-family: 'Cormorant Garamond', 'Cinzel', serif; letter-spacing: 3px; margin-bottom: 16px;
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
        .pdp-actions > div { width: 100%; }
        .pdp-actions .pdp-share-btn { width: 100%; height: auto; padding: 14px; }
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
        font-family: 'Cormorant Garamond', 'Cinzel', serif;
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

    /* Responsive Related Products Grid */
    .blu-products-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 30px;
        width: 100%;
        box-sizing: border-box;
    }
    .blu-products-grid .blu-card {
        min-width: 0 !important;
        max-width: none !important;
        width: 100% !important;
        background: #fff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .blu-products-grid .blu-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 30px rgba(0,0,0,0.12);
    }
    .blu-card__media-wrap {
        width: 100%;
        aspect-ratio: 3/4;
        overflow: hidden;
    }
    .blu-card__img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.5s ease;
    }
    .blu-card:hover .blu-card__img {
        transform: scale(1.04);
    }
    .blu-card__body {
        padding: 16px;
    }
    .blu-card__title {
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Montserrat', sans-serif;
        font-size: 0.88rem;
        font-weight: 700;
        color: #111;
        margin: 0 0 6px;
        text-transform: uppercase;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .blu-card__price {
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        font-size: 0.82rem;
        font-weight: 600;
        color: var(--gold, #C5A059);
    }
    @media (max-width: 768px) {
        .blu-products-grid {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 20px;
        }
    }
    @media (max-width: 480px) {
        .blu-products-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }
        .blu-card__body {
            padding: 10px;
        }
        .blu-card__title {
            font-size: 0.72rem;
        }
        .blu-card__price {
            font-size: 0.78rem;
        }
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
    const streamRef = useRef(null);

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

    const [recommendedProducts, setRecommendedProducts] = useState([]);
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
    const [showShareMenu, setShowShareMenu] = useState(false);

    useEffect(() => {
        const checkWishlist = () => {
            const wishlist = JSON.parse(localStorage.getItem('asat_wishlist') || '[]');
            setWishlisted(wishlist.some(item => item.id === productId));
        };
        checkWishlist();
        window.addEventListener('wishlist_updated', checkWishlist);
        return () => window.removeEventListener('wishlist_updated', checkWishlist);
    }, [productId]);

    useEffect(() => {
        if (!showShareMenu) return;
        const handleOutsideClick = () => setShowShareMenu(false);
        window.addEventListener('click', handleOutsideClick);
        return () => window.removeEventListener('click', handleOutsideClick);
    }, [showShareMenu]);

    const handleShareAction = async (type) => {
        const shareUrl = window.location.href;
        const shareText = `Check out this design on ASAT: ${product?.name}`;
        
        if (type === 'copy') {
            try {
                await navigator.clipboard.writeText(shareUrl);
                showToast('Link copied to clipboard!', 'success');
            } catch (err) {
                showToast('Failed to copy link.', 'error');
            }
        } else if (type === 'whatsapp') {
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
        } else if (type === 'twitter') {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
        }
        setShowShareMenu(false);
    };

    const activeImages = React.useMemo(() => {
        if (!product) return [];

        const rawColor = product.colors && product.colors[selectedColor];
        const colorName = typeof rawColor === 'object' && rawColor !== null 
            ? (rawColor.colorName || rawColor.name || '') 
            : String(rawColor || '');

        // 1. Explicit customerImages map from designer uploads
        if (product.customerImages && colorName) {
            const key = Object.keys(product.customerImages).find(
                k => k.toLowerCase() === colorName.toLowerCase()
            );
            if (key && Array.isArray(product.customerImages[key]) && product.customerImages[key].length > 0) {
                return product.customerImages[key];
            }
        }

        // 2. Manufacturer / Color object containing front/back images
        if (typeof rawColor === 'object' && rawColor !== null) {
            const imgs = [];
            if (Array.isArray(rawColor.images) && rawColor.images.length > 0) {
                imgs.push(...rawColor.images);
            } else {
                if (rawColor.frontImage) imgs.push(rawColor.frontImage);
                if (rawColor.backImage)  imgs.push(rawColor.backImage);
                if (rawColor.sideImage)  imgs.push(rawColor.sideImage);
            }
            if (imgs.length > 0) return imgs;
        }

        // 3. Filter product.images by color name in URL
        if (colorName && Array.isArray(product.images) && product.images.length > 0) {
            const cleanColor = colorName.trim().toUpperCase();
            const colorSpecific = product.images.filter(url => {
                const upperUrl = String(url).toUpperCase();
                return upperUrl.includes(`_${cleanColor}_`) ||
                       upperUrl.includes(`_CUSTOMER_${cleanColor}_`) ||
                       upperUrl.includes(`/${cleanColor}/`) ||
                       upperUrl.includes(`-${cleanColor.toLowerCase()}-`) ||
                       upperUrl.includes(`_${cleanColor.toLowerCase()}_`);
            });
            if (colorSpecific.length > 0) {
                return colorSpecific;
            }

            // 4. Partition product.images evenly per color variant
            if (Array.isArray(product.colors) && product.colors.length > 1) {
                const perColor = Math.floor(product.images.length / product.colors.length);
                if (perColor >= 1) {
                    const start = selectedColor * perColor;
                    const subset = product.images.slice(start, start + perColor);
                    if (subset.length > 0) return subset;
                }
            }
        }

        // 5. If only 1 image exists or single color, return only primary image
        return product.images && product.images.length > 0 ? [product.images[0]] : [product.coverImage || product.colors?.[0]?.frontImage || ''];
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

    useEffect(() => {
        if (window.innerWidth <= 768 && streamRef.current) {
            const card = streamRef.current.children[selectedImage];
            if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [selectedImage]);

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

    // Dynamic context-aware recommendation scoring algorithm
    const computeRecommendations = (allDesigns, currentProd) => {
        if (!Array.isArray(allDesigns) || !currentProd) return [];

        const currId = String(currentProd.id);
        const currCat = String(currentProd.category || '').toLowerCase();
        const currTitle = String(currentProd.name || currentProd.title || '').toLowerCase();
        const currDesigner = String(currentProd.designerId || currentProd.designer_id || '');
        const currPrice = Number(currentProd.price) || 0;

        // Keywords from product title (e.g. "wave", "cap", "oversized", "tee", "hoodie")
        const keywords = currTitle.split(/\s+/).filter(w => w.length > 2);

        const candidates = allDesigns.filter(d => String(d.id) !== currId && d.is_available !== false);

        const scored = candidates.map(d => {
            let score = 0;
            const dCat = String(d.category || '').toLowerCase();
            const dTitle = String(d.title || d.name || '').toLowerCase();
            const dDesigner = String(d.designer_id || d.designerId || '');
            const dPrice = Number(d.price) || 0;

            // 1. Same garment category (+40 points)
            if (currCat && dCat === currCat) score += 40;

            // 2. Keyword relevance (+20 points per match)
            keywords.forEach(kw => {
                if (dTitle.includes(kw)) score += 20;
            });

            // 3. Same designer drop (+30 points)
            if (currDesigner && dDesigner === currDesigner) score += 30;

            // 4. Price bracket proximity (+15 points if within 35% range)
            if (currPrice > 0 && Math.abs(dPrice - currPrice) / currPrice < 0.35) {
                score += 15;
            }

            // 5. Deterministic hash variance so products have distinct recommendation sets
            const hash = (String(d.id).charCodeAt(0) * 7 + currId.charCodeAt(0) * 13) % 19;
            score += hash;

            return { item: d, score };
        });

        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, 4).map(s => s.item);
    };

    useEffect(() => {
        let isMounted = true;
        setLoading(true);

        const loadProduct = async () => {
            try {
                const settings = await apiFetch('/api/settings/global_shipping_note').catch(() => null);

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
                        available: designData.is_available !== false && designData.available !== false,
                        unavailableReason: designData.unavailable_reason || '',
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
                                    dbProduct.available = false;
                                    dbProduct.unavailableReason = 'Base product is currently unavailable';
                                }

                                if (catData.colors && Array.isArray(catData.colors)) {
                                    dbProduct.colors = dbProduct.colors.filter(colorName => {
                                        const baseColor = catData.colors.find(bc => bc.colorName === colorName);
                                        return !baseColor || baseColor.available !== false;
                                    });
                                    dbProduct.colorDetails = catData.colors;
                                }

                                if (dbProduct.colors.length === 0) {
                                    dbProduct.available = false;
                                    dbProduct.unavailableReason = 'No available colors for this product';
                                }

                                const rawSizes = dbProduct.sizes && dbProduct.sizes.length > 0 
                                    ? dbProduct.sizes 
                                    : (catData.sizes || ['XS', 'S', 'M', 'L', 'XL', 'XXL']);

                                const baseSizes = Array.isArray(catData.sizes) ? catData.sizes : [];
                                const baseSizeMap = {};
                                baseSizes.forEach(s => {
                                    const sizeName = typeof s === 'object' && s !== null ? s.size : s;
                                    const isAvail = typeof s === 'object' && s !== null ? (s.available !== false) : true;
                                    baseSizeMap[sizeName] = isAvail;
                                });

                                dbProduct.sizes = rawSizes.map(sz => {
                                    const sizeName = typeof sz === 'object' && sz !== null ? sz.size : sz;
                                    const isDesignAvail = typeof sz === 'object' && sz !== null ? (sz.available !== false) : true;
                                    const isBaseAvail = baseSizeMap.hasOwnProperty(sizeName) ? baseSizeMap[sizeName] : true;
                                    return {
                                        size: sizeName,
                                        available: isDesignAvail && isBaseAvail
                                    };
                                });

                                dbProduct.allSizesOut = dbProduct.sizes.length > 0 && dbProduct.sizes.every(s => !s.available);

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
                    } else {
                        // Standardize sizes format if no base product
                        dbProduct.sizes = (dbProduct.sizes || ['XS', 'S', 'M', 'L', 'XL', 'XXL']).map(sz => {
                            const sizeName = typeof sz === 'object' && sz !== null ? sz.size : sz;
                            const isAvail = typeof sz === 'object' && sz !== null ? (sz.available !== false) : true;
                            return { size: sizeName, available: isAvail };
                        });
                        dbProduct.allSizesOut = dbProduct.sizes.length > 0 && dbProduct.sizes.every(s => !s.available);
                    }

                    if (isMounted) {
                        setProduct(dbProduct);
                        setSelectedImage(0);
                        setSelectedColor(0);
                        const firstAvailSize = dbProduct.sizes?.find(s => s.available !== false)?.size || null;
                        setSelectedSize(firstAvailSize);
                        setSelectedPrintStyle(null);
                        setQuantity(1);

                        // Compute tailored recommendations specifically for this product
                        try {
                            const allDesigns = await apiFetch('/api/designs');
                            if (Array.isArray(allDesigns) && isMounted) {
                                const recommended = computeRecommendations(allDesigns, dbProduct);
                                setRecommendedProducts(recommended);
                            }
                        } catch (e) {
                            console.error("Failed to load recommendations");
                        }
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

        if (product.available === false || product.allSizesOut) {
            showToast('This product is currently out of stock.', 'error');
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

        if (!selectedSize) { showToast('Please select an available size', 'warning'); return; }

        const sizeObj = product.sizes?.find(s => (typeof s === 'object' ? s.size : s) === selectedSize);
        const isSizeAvail = sizeObj ? (typeof sizeObj === 'object' ? sizeObj.available !== false : true) : true;
        if (!isSizeAvail) {
            showToast(`Size ${selectedSize} is currently out of stock and cannot be added.`, 'error');
            return;
        }
        
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
                <div className="pdp-breadcrumb">
                    <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>HOME</a>
                    {' / '}
                    <a href="/products" onClick={(e) => { e.preventDefault(); navigate('/products'); }}>COLLECTION</a>
                    {' / '}
                    <span>{product.name}</span>
                </div>

                {/* ── 3-COLUMN PDP LAYOUT (BLUORNG EXACT) ── */}
                <div className="pdp-split-3col">
                    {/* Column 1: Non-scrollable Fixed Primary Cover Shot */}
                    <div 
                        className="pdp-col-cover"
                        onClick={() => { setSelectedImage(0); setIsEnlarged(true); }}
                        title="Click to expand"
                    >
                        <img
                            className="pdp-col-cover-img"
                            src={activeImages[0] || product.coverImage || product.colors?.[0]?.frontImage || ''}
                            alt={product.name}
                        />
                    </div>

                    {/* Column 2: In-place Scrollable Stream of Remaining Angles */}
                    <div className="pdp-col-stream" ref={streamRef}>
                        {activeImages.map((imgUrl, idx) => (
                            <div
                                key={idx}
                                className="pdp-stream-card"
                                onClick={() => { setSelectedImage(idx); setIsEnlarged(true); }}
                            >
                                <img
                                    className="pdp-stream-img"
                                    src={imgUrl}
                                    alt={`${product.name} view ${idx + 1}`}
                                    loading="lazy"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Column 3: Sticky Details Card & Accordion */}
                    <div className="pdp-col-details">
                        <div className="pdp-info-card">
                            <div className="pdp-header-row">
                                <h1 className="pdp-product-name">{product.name}</h1>
                                <button
                                    className="pdp-bookmark-btn"
                                    onClick={handleWishlistToggle}
                                    title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                                    aria-label="Wishlist"
                                >
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill={wishlisted ? "#000000" : "none"} stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                                    </svg>
                                </button>
                            </div>

                            <div className="pdp-price-row">
                                {formatPrice(applyMarkup((product.price) + (product.isMfgProduct && selectedPrintStyle ? selectedPrintStyle.cost : 0)))}
                            </div>

                            {/* Color Selector */}
                            {product.colors && product.colors.length > 1 && (
                                <div style={{ marginBottom: '18px' }}>
                                    <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px', color: '#000' }}>
                                        COLOR: {typeof product.colors[selectedColor] === 'object' ? (product.colors[selectedColor]?.colorName || '') : product.colors[selectedColor]}
                                    </span>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {product.colors.map((c, i) => {
                                            const swatchBg = typeof c === 'object' ? c.color : getColorHexByName(c);
                                            return (
                                                <div
                                                    key={i}
                                                    className={`pdp-color-swatch ${i === selectedColor ? 'active' : ''}`}
                                                    style={{ backgroundColor: swatchBg, width: '28px', height: '28px' }}
                                                    onClick={() => setSelectedColor(i)}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Size Header with Size Guide */}
                            <div className="pdp-size-header-row">
                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#000000' }}>SIZE</span>
                                {product.sizeChartImage && (
                                    <button className="pdp-size-guide-btn" onClick={() => setShowSizeChart(true)}>
                                        Size Guide
                                    </button>
                                )}
                            </div>

                            {/* Pill Size Buttons */}
                            <div className="pdp-pill-sizes">
                                {product.sizes && product.sizes.map(sz => {
                                    const sizeName = typeof sz === 'object' && sz !== null ? sz.size : sz;
                                    const isAvailable = typeof sz === 'object' && sz !== null ? (sz.available !== false) : true;
                                    const isActive = selectedSize === sizeName;

                                    return (
                                        <button
                                            key={sizeName}
                                            disabled={!isAvailable}
                                            className={`pdp-pill-size-btn ${isActive ? 'active' : ''} ${!isAvailable ? 'disabled' : ''}`}
                                            onClick={() => {
                                                if (!isAvailable) {
                                                    showToast(`Size ${sizeName} is out of stock`, 'warning');
                                                    return;
                                                }
                                                setSelectedSize(sizeName);
                                            }}
                                        >
                                            {sizeName}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Action Buttons Row */}
                            {product.available === false || product.allSizesOut ? (
                                <button className="pdp-buy-now-pill" disabled style={{ background: '#475569', cursor: 'not-allowed', width: '100%' }}>
                                    OUT OF STOCK
                                </button>
                            ) : (
                                <div className="pdp-action-pills-row">
                                    <button className="pdp-add-bag-pill" onClick={handleAddToBag}>
                                        {isAlreadyInCart() ? 'VIEW CART' : (added ? '✓ IN BAG' : 'ADD TO BAG')}
                                    </button>
                                    <button className="pdp-buy-now-pill" onClick={() => {
                                        if (!selectedSize) {
                                            showToast('Please select a size first', 'warning');
                                            return;
                                        }
                                        if (!isAlreadyInCart()) handleAddToBag();
                                        navigate('/cart');
                                    }}>
                                        BUY NOW
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Accordion / Tabs Description Card */}
                        <div className="pdp-accordion-card">
                            <div className="pdp-tabs-nav">
                                <button className={`pdp-tab-btn ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>
                                    Details & Description
                                </button>
                                <button className={`pdp-tab-btn ${activeTab === 'washcare' ? 'active' : ''}`} onClick={() => setActiveTab('washcare')}>
                                    Washcare
                                </button>
                                <button className={`pdp-tab-btn ${activeTab === 'shipping' ? 'active' : ''}`} onClick={() => setActiveTab('shipping')}>
                                    Shipping
                                </button>
                            </div>

                            <div className="pdp-tab-body">
                                {activeTab === 'details' && (
                                    <div>
                                        <p style={{ margin: '0 0 10px', fontWeight: '600', color: '#000' }}>{product.collection || '100% Premium Cotton'}</p>
                                        <p style={{ margin: 0, color: '#555' }}>{product.description || 'Crafted from heavyweight French Terry cotton offering structured fit and breathable luxury comfort.'}</p>
                                    </div>
                                )}
                                {activeTab === 'washcare' && (
                                    <div>
                                        <p style={{ margin: 0, color: '#555' }}>• Hand wash cold or gentle machine wash inside-out<br />• Do not bleach<br />• Iron on low heat avoiding direct graphic embroidery<br />• Flat dry in shade</p>
                                    </div>
                                )}
                                {activeTab === 'shipping' && (
                                    <div>
                                        <p style={{ margin: 0, color: '#555' }}>• Free express domestic shipping across India<br />• Dispatched in 24-48 business hours<br />• 7-day hassle-free return and exchange policy</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Recommended Products: "YOU MAY ALSO LIKE" ── */}
                {recommendedProducts && recommendedProducts.length > 0 && (
                    <div className="pdp-recommended-section">
                        <div className="blu-section__head" style={{ marginBottom: '24px' }}>
                            <h2 className="blu-section__title" style={{ fontSize: '1.25rem' }}>YOU MAY ALSO LIKE</h2>
                            <Link to="/products" className="blu-section__link">Discover more</Link>
                        </div>
                        <div className="blu-products-grid">
                            {recommendedProducts.map((p) => {
                                const pImgs = (p.images && p.images.length > 0) ? p.images : [p.cover_image || p.image || 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80'];
                                return (
                                    <div 
                                        key={p.id} 
                                        className="blu-card" 
                                        onClick={() => {
                                            navigate(`/product/${p.id}`);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="blu-card__media-wrap">
                                            <img className="blu-card__img" src={pImgs[0]} alt={p.title || p.name} />
                                        </div>
                                        <div className="blu-card__body">
                                            <div className="blu-card__text">
                                                <h3 className="blu-card__title">{p.title || p.name}</h3>
                                                <div className="blu-card__price">{formatPrice(applyMarkup(Number(p.price) || 0))}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
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

const getColorHexByName = (name, fallback = '#ccc') => {
    if (!name || typeof name !== 'string') return fallback;
    const lower = name.toLowerCase().trim();
    if (lower.startsWith('#') || lower.startsWith('rgb') || lower.startsWith('hsl')) return name;
    
    if (lower.includes('jet black') || lower === 'black' || lower === 'blk') return '#000000';
    if (lower.includes('off white') || lower.includes('cream') || lower.includes('ivory')) return '#faf6ee';
    if (lower === 'white' || lower === 'wht') return '#ffffff';
    if (lower.includes('navy') || lower.includes('dark blue')) return '#000080';
    if (lower.includes('royal blue')) return '#4169e1';
    if (lower.includes('blue')) return '#1a73e8';
    if (lower.includes('grey') || lower.includes('gray') || lower.includes('melange')) return '#808080';
    if (lower.includes('olive')) return '#556b2f';
    if (lower.includes('green') || lower.includes('khaki')) return '#008000';
    if (lower.includes('red') || lower.includes('maroon') || lower.includes('burgundy')) return '#800000';
    if (lower.includes('yellow') || lower.includes('gold')) return '#ffd700';
    if (lower.includes('orange')) return '#ffa500';
    if (lower.includes('pink') || lower.includes('rose')) return '#ffc0cb';
    if (lower.includes('purple') || lower.includes('lavender') || lower.includes('violet')) return '#800080';
    if (lower.includes('brown') || lower.includes('tan') || lower.includes('beige')) return '#d2b48c';
    
    return name;
};

