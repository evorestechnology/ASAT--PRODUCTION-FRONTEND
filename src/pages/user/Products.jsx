import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCurrency, SUPPORTED_CURRENCIES } from '../../context/CurrencyContext';
import { apiFetch } from '../../api';

import BackButton from '../../components/BackButton';


/* ═══════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════ */
const SORT_OPTIONS = [
  { label: 'Latest',            value: 'latest'     },
  { label: 'Top Sales',         value: 'top-sales'  },
  { label: 'Ranking',           value: 'ranking'    },
  { label: 'Price: Low → High', value: 'price-asc'  },
  { label: 'Price: High → Low', value: 'price-desc' },
  { label: 'Name: A–Z',         value: 'name-asc'   },
];



/* ═══════════════════════════════════════════════════════════
   INLINE STYLES  (extended with filter-bar, price, skeleton)
═══════════════════════════════════════════════════════════ */
const extraStyles = `
  .products-page {
    background: var(--bg, #FAFAF8);
    min-height: 80vh;
  }

  /* ── Enhanced Filter Bar ── */
  .pcol-filter-bar {
    background: white;
    border-bottom: 1px solid var(--border, #E8E5E0);
    position: sticky;
    top: var(--nav-h, 68px);
    z-index: 200;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  }

  .pcol-filter-bar__inner {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 5%;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .pcol-filter-bar__inner::-webkit-scrollbar { display: none; }

  .pcol-filter-section {
    display: flex;
    align-items: center;
    padding: 14px 24px 14px 0;
    margin-right: 24px;
    border-right: 1px solid var(--border, #E8E5E0);
    flex-shrink: 0;
    gap: 10px;
  }
  .pcol-filter-section:last-child {
    border-right: none;
    margin-right: 0;
    padding-right: 0;
  }

  .pcol-filter-label {
    font-size: 0.62rem;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--muted, #6B6B6B);
    white-space: nowrap;
    font-family: 'Montserrat', sans-serif;
    font-weight: 600;
  }

  /* Category Pills */
  .pcol-pills {
    display: flex;
    gap: 6px;
    flex-wrap: nowrap;
  }

  .pcol-pill {
    background: transparent;
    border: 1px solid var(--border, #E8E5E0);
    color: var(--muted, #6B6B6B);
    padding: 6px 14px;
    border-radius: 2px;
    font-size: 0.68rem;
    letter-spacing: 1.5px;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    font-family: 'Montserrat', sans-serif;
    text-transform: uppercase;
    font-weight: 500;
  }
  .pcol-pill:hover { border-color: var(--gold); color: var(--gold); }
  .pcol-pill.active {
    background: var(--fg, #0E0E0E);
    border-color: var(--fg, #0E0E0E);
    color: white;
    font-weight: 600;
  }

  .pcol-sort-select {
    border: 1px solid var(--border, #E8E5E0);
    color: var(--fg, #0E0E0E);
    padding: 7px 12px;
    border-radius: 2px;
    font-size: 0.72rem;
    font-family: 'Montserrat', sans-serif;
    cursor: pointer;
    background: white;
    outline: none;
    letter-spacing: 0.5px;
    transition: border-color 0.2s;
  }
  .pcol-sort-select:focus { border-color: var(--gold); }
  .pcol-sort-select option { background: white; color: var(--fg); }

  /* Price Range Inputs */
  .pcol-price-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .pcol-price-input {
    width: 80px;
    border: 1px solid var(--border, #E8E5E0);
    border-radius: 2px;
    padding: 7px 10px;
    font-size: 0.72rem;
    font-family: 'Montserrat', sans-serif;
    color: var(--fg, #0E0E0E);
    outline: none;
    transition: border-color 0.2s;
    background: white;
  }
  .pcol-price-input::placeholder { color: var(--muted-light, #9A9A9A); }
  .pcol-price-input:focus { border-color: var(--gold); }
  .pcol-price-sep { color: var(--muted, #6B6B6B); font-size: 0.75rem; }

  /* Collection Tabs */
  .pcol-tabs {
    background: white;
    border-bottom: 1px solid var(--border, #E8E5E0);
    display: flex;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .pcol-tabs::-webkit-scrollbar { display: none; }
  .pcol-tab {
    background: transparent;
    border: none;
    color: var(--muted, #6B6B6B);
    padding: 14px 28px;
    font-family: 'Montserrat', sans-serif;
    font-size: 0.68rem;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s ease;
    white-space: nowrap;
    border-bottom: 2px solid transparent;
    flex-shrink: 0;
  }
  .pcol-tab:hover { color: var(--fg, #0E0E0E); }
  .pcol-tab.active {
    color: var(--fg, #0E0E0E);
    border-bottom-color: var(--gold);
  }

  /* Results bar */
  .pcol-results-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 32px;
  }

  .pcol-count {
    font-size: 0.72rem;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #aaa;
    font-family: 'Montserrat', sans-serif;
  }

  .pcol-active-chips {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .pcol-chip {
    background: rgba(197,160,89,0.1);
    border: 1px solid rgba(197,160,89,0.3);
    color: var(--gold);
    padding: 4px 12px;
    border-radius: 100px;
    font-size: 0.62rem;
    letter-spacing: 1px;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-family: 'Montserrat', sans-serif;
    transition: background 0.2s;
  }
  .pcol-chip:hover { background: rgba(197,160,89,0.2); }

  /* Loading Skeleton */
  .pcard-skeleton {
    border-radius: 2px;
    overflow: hidden;
    background: #fff;
    border: 1px solid var(--border, #E8E5E0);
  }
  .pcard-skeleton__img {
    width: 100%;
    aspect-ratio: 3/4;
    background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: skelShimmer 1.4s infinite;
  }
  .pcard-skeleton__body { padding: 16px; }
  .pcard-skeleton__line {
    height: 10px;
    border-radius: 100px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: skelShimmer 1.4s infinite;
    margin-bottom: 10px;
  }
  .pcard-skeleton__line--short { width: 55%; }
  .pcard-skeleton__line--med   { width: 80%; }

  @keyframes skelShimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }



  /* ══════════════════════════════════════════════════════════
     STANDARD CARD  — primary template (matches image ref)
  ══════════════════════════════════════════════════════════ */
  .pcard--standard {
    position: relative;
    border-radius: 2px;
    overflow: hidden;
    cursor: pointer;
    background: var(--surface, #F4F2EE);
    opacity: 0;
    transform: translateY(22px);
    transition: transform 0.4s cubic-bezier(0.25,1,0.5,1), box-shadow 0.4s ease;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border, #E8E5E0);
  }
  .pcard--standard.pcard-visible {
    animation: pcStdReveal 0.55s cubic-bezier(0.25,0.46,0.45,0.94) forwards;
    animation-delay: var(--pcard-delay, 0ms);
  }
  @keyframes pcStdReveal {
    from { opacity:0; transform:translateY(22px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .pcard--standard:hover {
    transform: translateY(-5px);
    box-shadow: 0 16px 40px rgba(0,0,0,0.1);
    border-color: rgba(197,160,89,0.3);
  }
  .pcard--standard__cover {
    position: relative;
    width: 100%;
    overflow: hidden;
  }
  .pcard--standard__img {
    width: 100%;
    aspect-ratio: 3/4;
    background-size: cover;
    background-position: center top;
    display: block;
    transition: transform 0.65s cubic-bezier(0.25,1,0.5,1);
  }
  .pcard--standard:hover .pcard--standard__img { transform: scale(1.06); }

  /* Badge — top left */
  .pcard--standard__badge {
    position: absolute;
    top: 14px; left: 14px;
    background: var(--dark);
    color: var(--gold);
    font-family: 'Montserrat', sans-serif;
    font-size: 0.55rem;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    padding: 5px 12px;
    border-radius: 4px;
    font-weight: 600;
    z-index: 3;
  }

  /* Details panel placed BELOW cover image */
  .pcard--standard__panel {
    position: relative;
    background: white;
    padding: 12px 14px 14px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    z-index: 2;
  }
  .pcard--standard__name {
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Montserrat', sans-serif;
    font-size: 0.82rem;
    font-weight: 700;
    color: #000000;
    letter-spacing: -0.2px;
    text-transform: uppercase;
    margin: 0;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .pcard--standard__brand {
    display: block;
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
    font-size: 0.68rem;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: #888888;
    font-weight: 600;
  }
  .pcard--standard__price {
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
    font-size: 0.88rem;
    font-weight: 800;
    color: #000000;
    letter-spacing: -0.2px;
    margin-top: 2px;
  }

  /* Hover Quick Sizes & View Drawer */
  .pcard--standard__hover-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.88);
    backdrop-filter: blur(8px);
    padding: 10px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 4;
    transform: translateY(100%);
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .pcard--standard:hover .pcard--standard__hover-bar {
    transform: translateY(0);
  }
  .pcard--standard__sizes {
    display: flex;
    gap: 6px;
  }
  .pcard--standard__size-chip {
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
    font-size: 0.65rem;
    font-weight: 700;
    color: #FFFFFF;
    padding: 2px 6px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 2px;
  }
  .pcard--standard__quick-btn {
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
    font-size: 0.62rem;
    font-weight: 800;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #FFFFFF;
  }

  /* Rank badge — top right corner */
  .pcard--standard__rank {
    position: absolute;
    top: 14px;
    right: 14px;
    background: linear-gradient(135deg, #c5a059 0%, #e8c97a 50%, #c5a059 100%);
    color: #111;
    font-family: 'Cinzel', serif;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 1px;
    padding: 5px 9px;
    border-radius: 4px;
    z-index: 3;
    box-shadow: 0 2px 8px rgba(197,160,89,0.4);
    line-height: 1;
  }

  /* Responsive Products Grid */
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
    .blu-card__title {
      font-size: 0.72rem !important;
    }
    .blu-card__price {
      font-size: 0.78rem !important;
    }
  }
`;

/* ═══════════════════════════════════════════════════════════
   SKELETON CARD
═══════════════════════════════════════════════════════════ */
function SkeletonCard() {
  return (
    <div className="pcard-skeleton">
      <div className="pcard-skeleton__img" />
      <div className="pcard-skeleton__body">
                <BackButton />
        <div className="pcard-skeleton__line pcard-skeleton__line--short" />
        <div className="pcard-skeleton__line pcard-skeleton__line--med" />
        <div className="pcard-skeleton__line pcard-skeleton__line--short" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
function Products() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currency, rates, formatPrice, globalCurrencies, applyMarkup } = useCurrency();
  const curSymbol = ((globalCurrencies && globalCurrencies[currency]) || SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES['INR'] || { symbol: '₹' }).symbol?.trim() || '₹';

  /* ── Supabase Data ── */
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ── Collections (derived from data) ── */
  const [collections, setCollections] = useState(['All']);

  /* ── Filter State ── */
  const initialCategory = searchParams.get('category') || '';
  const initialDesigner = searchParams.get('designer') || '';
  const initialSearch = searchParams.get('search') || '';

  const [activeCategory, setActiveCategory] = useState('All');
  const [activeCollection, setActiveCollection] = useState('All');
  const [activeGender, setActiveGender] = useState('All');
  const [sortBy, setSortBy] = useState('latest');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [launched, setLaunched] = useState(false);
  const gridRef = useRef(null);

  // Sync URL search params to local search term state
  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
  }, [searchParams]);

  /* ── Fetch products from Supabase ── */
  useEffect(() => {
    setLoading(true);

    const fetchAll = async () => {
      try {
        // Fetch designers, designs, categories in parallel
        const [
          designersData,
          designsData,
          categoriesData,
        ] = await Promise.all([
          apiFetch('/api/designers/rankings'),
          apiFetch('/api/designs?limit=120'),
          apiFetch('/api/categories'),
        ]);

        // Build a set of blocked designer IDs
        const blockedDesignerIds = new Set(
          (designersData || [])
            .filter((d) => d.status === 'blocked')
            .map((d) => d.id)
        );

        // Build a set of valid category names
        const validCategories = new Set(
          (categoriesData || []).map((d) => (d.name || '').trim()).filter(Boolean)
        );

        const approved = (designsData || [])
          .filter((d) => !blockedDesignerIds.has(d.designer_id))
          .filter((d) => {
            if (d.description && typeof d.description === 'string' && d.description.startsWith('{')) {
              try {
                const descObj = JSON.parse(d.description);
                if (descObj.isHidden) return false;
              } catch (e) {}
            }
            return true;
          })
          .map((d) => ({
            ...d,
            description: (() => {
              const desc = d.description;
              if (desc && typeof desc === 'string' && desc.startsWith('{')) {
                try {
                  return JSON.parse(desc).text || '';
                } catch (e) {
                  return desc;
                }
              }
              return desc || '';
            })(),
            category: (() => {
              const catVal = d.products?.category || d.catalogue?.category || d.category || '';
              const match = (categoriesData || []).find(c => c.slug === catVal || c.name === catVal);
              return match ? match.name : (catVal || 'Other');
            })(),
            name: d.title || 'Designer Creation',
            price: d.price || 0,
            brand: d.designer_username || 'Designer',
            createdAt: d.created_at,
            ordersCount: d.orders_count || 0,
            designerId: d.designer_id,
            designerUsername: d.designer_username,
          }));

        const combined = [...approved];

        // Sort combined list by created_at desc
        combined.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });

        setAllProducts(combined);

        // Derive unique collections
        const cols = new Set(combined.map((p) => p.collection).filter(Boolean));
        setCollections(['All', ...Array.from(cols).sort()]);
      } catch (err) {
        console.error('Products fetch error:', err);
        setAllProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  /* ── Derive unique categories from data ── */
  const categories = useMemo(() => {
    const cats = new Set(
      allProducts.map((p) => p.category || p.type || p.productType || '').filter(Boolean)
    );
    return ['All', ...Array.from(cats).sort()];
  }, [allProducts]);

  /* ── Apply URL param filters once data loads ── */
  useEffect(() => {
    if (!loading) {
      if (initialCategory) {
        const match = categories.find(
          (c) => c.toLowerCase() === initialCategory.toLowerCase()
        );
        if (match) setActiveCategory(match);
      }
    }
  }, [loading, initialCategory, categories]);

  /* ── Page launch animation ── */
  useEffect(() => {
    const t = setTimeout(() => setLaunched(true), 80);
    return () => clearTimeout(t);
  }, []);

  /* ── Scroll-reveal observer ── */
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('pcard-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    const timer = setTimeout(() => {
      const els = document.querySelectorAll('[data-pcard]');
      els.forEach((el) => observer.observe(el));
    }, 150);

    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [activeCategory, activeCollection, activeGender, sortBy, priceMin, priceMax, allProducts, currency, rates]);

  /* ── Helper: resolve image from product ── */
  const getImage = (p) => {
    if (p.images?.length) return p.images[0];
    if (p.image) return p.image;
    if (p.cover_image) return p.cover_image;
    if (p.coverImage) return p.coverImage;
    if (p.colors?.[0]?.frontImage) return p.colors[0].frontImage;
    return 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=800&q=80';
  };

  /* ── Filtering & Sorting ── */
  const filtered = useMemo(() => {
    let items = [...allProducts];

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      items = items.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.brand || '').toLowerCase().includes(q) ||
          (p.collection || '').toLowerCase().includes(q)
      );
    }

    // Designer filter from URL param
    if (initialDesigner) {
      items = items.filter(
        (p) => (p.designer || p.designerName || '').toLowerCase() === initialDesigner.toLowerCase()
      );
    }

    // Category
    if (activeCategory !== 'All') {
      items = items.filter(
        (p) => (p.category || p.type || p.productType || '').toLowerCase() === activeCategory.toLowerCase()
      );
    }

    // Collection
    if (activeCollection !== 'All') {
      items = items.filter((p) => p.collection === activeCollection);
    }

    // Gender — if Male/Men or Female/Women is selected, Unisex products are also included
    if (activeGender !== 'All') {
      const targetGender = activeGender.toLowerCase();
      items = items.filter((p) => {
        const prodGender = (p.gender || 'Unisex').toLowerCase();
        if (targetGender === 'male' || targetGender === 'men') {
          return prodGender === 'male' || prodGender === 'men' || prodGender === 'unisex';
        }
        if (targetGender === 'female' || targetGender === 'women') {
          return prodGender === 'female' || prodGender === 'women' || prodGender === 'unisex';
        }
        return prodGender === targetGender;
      });
    }

    // Price range — compare against selling price (markup-applied)
    const minVal = priceMin !== '' ? parseFloat(priceMin) : null;
    const maxVal = priceMax !== '' ? parseFloat(priceMax) : null;
    const rate = rates[currency] || 1;
    const min = minVal !== null ? (minVal / rate) : null;
    const max = maxVal !== null ? (maxVal / rate) : null;
    if (min !== null) items = items.filter((p) => applyMarkup(p.price ?? 0) >= min);
    if (max !== null) items = items.filter((p) => applyMarkup(p.price ?? 0) <= max);

    // Sort
    switch (sortBy) {
      case 'latest':
        items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      case 'top-sales':
        items.sort((a, b) => (b.ordersCount ?? b.orders_count ?? 0) - (a.ordersCount ?? a.orders_count ?? 0));
        break;
      case 'ranking':
        items.sort((a, b) => (a.ranking ?? 9999) - (b.ranking ?? 9999));
        break;
      case 'price-asc':
        items.sort((a, b) => applyMarkup(a.price ?? 0) - applyMarkup(b.price ?? 0));
        break;
      case 'price-desc':
        items.sort((a, b) => applyMarkup(b.price ?? 0) - applyMarkup(a.price ?? 0));
        break;
      case 'name-asc':
        items.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
        break;
      default:
        break;
    }

    return items;
  }, [allProducts, activeCategory, activeCollection, activeGender, sortBy, priceMin, priceMax, initialDesigner, searchTerm, currency, rates]);

  /* ── Set of IDs for the 15 most recently added products (for NEW badge) ── */
  const latestIds = useMemo(() => {
    const sorted = [...allProducts]
      .filter(p => p.createdAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 15);
    return new Set(sorted.map(p => p.id));
  }, [allProducts]);

  /* ── Map of productId → rank (1-50) for the top-sold 50 products ── */
  const rankMap = useMemo(() => {
    const map = new Map();
    [...allProducts]
      .filter(p => (p.ordersCount ?? p.orders_count ?? 0) > 0)
      .sort((a, b) => (b.ordersCount ?? b.orders_count ?? 0) - (a.ordersCount ?? a.orders_count ?? 0))
      .slice(0, 50)
      .forEach((p, i) => map.set(p.id, i + 1));
    return map;
  }, [allProducts]);

  /* ── Reset all filters ── */
  const resetFilters = useCallback(() => {
    setActiveCategory('All');
    setActiveCollection('All');
    setActiveGender('All');
    setSortBy('latest');
    setPriceMin('');
    setPriceMax('');
    setSearchTerm('');
  }, []);

  const hasFilters =
    activeCategory !== 'All' ||
    activeCollection !== 'All' ||
    activeGender !== 'All' ||
    priceMin !== '' ||
    priceMax !== '' ||
    searchTerm !== '' ||
    sortBy !== 'latest';

  /* ── Navigate to product ── */
  const goToProduct = useCallback((id) => navigate(`/products/${id}`), [navigate]);

  /* ── helper: pick image by index (0-based) ── */
  const getImageAt = (product, n) => {
    if (product.images?.length > n) return product.images[n];
    return getImage(product);
  };

  /* ── Standard card (used for every product except index 0) ── */
  const renderStandardCard = (product, idx) => {
    const isNew = latestIds.has(product.id);
    const rank  = rankMap.get(product.id);
    const badge = product.tag === 'trending' ? '★ TRENDING' : isNew ? '✦ NEW' : null;
    const subtitle = product.designerUsername ? `@${product.designerUsername}` : (product.brand || product.collection || 'ASAT EXCLUSIVE');
    return (
      <div
        className="pcard--standard"
        key={product.id}
        data-pcard="standard"
        style={{ '--pcard-delay': `${Math.min(idx, 12) * 60}ms` }}
        onClick={() => goToProduct(product.id)}
      >
        <div className="pcard--standard__cover">
          <div
            className="pcard--standard__img"
            style={{ backgroundImage: `url('${getImage(product)}')` }}
          />
          {badge && <span className="pcard--standard__badge">{badge}</span>}
          {rank && (
            <span className="pcard--standard__rank">
              #{String(rank).padStart(2, '0')}
            </span>
          )}
          {/* Quick sizes bar on hover */}
          <div className="pcard--standard__hover-bar">
            <div className="pcard--standard__sizes">
              {['S', 'M', 'L', 'XL'].map((s) => (
                <span key={s} className="pcard--standard__size-chip">{s}</span>
              ))}
            </div>
            <span className="pcard--standard__quick-btn">VIEW</span>
          </div>
        </div>
        <div className="pcard--standard__panel">
          <h4 className="pcard--standard__name">{product.name || product.title}</h4>
          <span className="pcard--standard__brand">{subtitle}</span>
          <span className="pcard--standard__price">{formatPrice(applyMarkup(product.price || 0))}</span>
        </div>
      </div>
    );
  };

  /* ── Wide editorial card (used only for the first result, uses 2nd image) ── */
  const renderWideCard = (product, idx) => (
    <div
      className="pcard pcard--wide"
      key={product.id}
      data-pcard="wide"
      style={{ '--pcard-delay': `${idx * 80}ms` }}
      onClick={() => goToProduct(product.id)}
    >
      <div className="pcard--wide__img-side">
        <div className="pcard--wide__img" style={{ backgroundImage: `url('${getImageAt(product, 1)}')` }} />
      </div>
      <div className="pcard--wide__text-side">
        <span className="pcard--wide__label">EDITORIAL PICK</span>
        <h3 className="pcard--wide__name">{product.name || product.title}</h3>
        <p className="pcard--wide__desc">
          {product.subtitle || product.description?.slice(0, 80) || '—'} — curated from the{' '}
          {product.collection || 'ASAT'} collection
          {product.designer ? ` by ${product.designer}` : ''}.
        </p>
        <div className="pcard--wide__bottom">
          <span className="pcard--wide__price">{formatPrice(applyMarkup(product.price || 0))}</span>
          <span className="pcard--wide__cta">VIEW DETAILS <i className="fas fa-long-arrow-alt-right" /></span>
        </div>
      </div>
    </div>
  );

  /* ── Dispatcher: wide for first result, standard for rest ── */
  const renderCard = (product, index) =>
    index === 0 ? renderWideCard(product, index) : renderStandardCard(product, index);


  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{extraStyles}</style>
      <div className={`products-page ${launched ? 'products-page--launched' : ''}`}>
        {/* ── Sticky Filter Bar ── */}
        <div className="pcol-filter-bar" style={{ background: '#FFFFFF', borderBottom: '1px solid #EBEBEB', padding: '12px 0' }}>
          <div className="pcol-filter-bar__inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>

            {/* Category Pills */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    background: activeCategory === cat ? '#000000' : '#FFFFFF',
                    color: activeCategory === cat ? '#FFFFFF' : '#000000',
                    border: '1px solid ' + (activeCategory === cat ? '#000000' : '#E5E5E5'),
                    borderRadius: '24px',
                    padding: '8px 18px',
                    fontSize: '12px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {cat === 'All' ? 'All Drops' : cat}
                </button>
              ))}
            </div>

            {/* Right Controls: Sort & Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              <select
                className="pcol-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  border: '1px solid #E5E5E5',
                  borderRadius: '24px',
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: '600',
                  outline: 'none',
                  cursor: 'pointer',
                  background: '#FFFFFF',
                  color: '#000000'
                }}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Search collection..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    background: '#FAFAF8',
                    border: '1px solid #E5E5E5',
                    borderRadius: '24px',
                    color: '#000000',
                    padding: '8px 32px 8px 16px',
                    fontSize: '12px',
                    outline: 'none',
                    width: '160px',
                  }}
                />
                {searchTerm && (
                  <i 
                    className="fas fa-times" 
                    onClick={() => setSearchTerm('')} 
                    style={{ position: 'absolute', right: 28, color: '#999', cursor: 'pointer', fontSize: '0.75rem' }}
                  />
                )}
                <i className="fas fa-search" style={{ position: 'absolute', right: 12, color: '#999', fontSize: '0.75rem' }} />
              </div>
            </div>

          </div>
        </div>

        {/* Products Grid */}
        <div className="pcol-grid-wrap" style={{ padding: '32px clamp(16px, 3.5vw, 48px)' }}>

          {/* Results Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '900', letterSpacing: '-0.5px', textTransform: 'uppercase', margin: 0, color: '#000' }}>
              {activeCategory === 'All' ? 'ALL DROPS' : activeCategory.toUpperCase()}
              <span style={{ fontSize: '12px', color: '#888', fontWeight: '600', marginLeft: '12px' }}>
                ({filtered.length} {filtered.length === 1 ? 'DROP' : 'DROPS'})
              </span>
            </h1>

            {hasFilters && (
              <button
                onClick={resetFilters}
                style={{
                  background: 'none',
                  border: '1px solid #E5E5E5',
                  borderRadius: '16px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#666',
                  cursor: 'pointer'
                }}
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Grid Content */}
          {loading ? (
            <div className="blu-products-grid">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} style={{ width: '100%', height: 'auto', aspectRatio: '3/4.2', background: '#F0F0F0', borderRadius: '14px', animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="pcol-empty" style={{ textAlign: 'center', padding: '80px 20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', textTransform: 'uppercase', color: '#000' }}>NO PRODUCTS FOUND</h3>
              <p style={{ color: '#888', fontSize: '13px' }}>Try adjusting your filters to discover our atelier pieces.</p>
              {hasFilters && (
                <button
                  style={{
                    marginTop: '16px',
                    background: '#000000',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '12px 28px',
                    fontSize: '12px',
                    fontWeight: '700',
                    borderRadius: '24px',
                    cursor: 'pointer'
                  }}
                  onClick={resetFilters}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="blu-products-grid">
              {filtered.map((product) => {
                const rawImgs = product.images && product.images.length > 0 ? product.images : [getImage(product)];
                const imgs = rawImgs.length === 1 && product.coverImage ? [rawImgs[0], product.coverImage] : rawImgs;
                return (
                  <article
                    key={product.id}
                    className="blu-card"
                    onClick={() => goToProduct(product.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="blu-card__image-box">
                      <div
                        className="blu-card__image"
                        style={{ backgroundImage: `url('${imgs[0]}')` }}
                      />
                    </div>
                    <div className="blu-card__footer">
                      <div className="blu-card__meta">
                        <h4 className="blu-card__title" title={product.title || product.name}>{product.title || product.name}</h4>
                        <span className="blu-card__price">{formatPrice(applyMarkup(product.price))}</span>
                      </div>
                      <button
                        className="blu-card__plus-btn"
                        onClick={(e) => { e.stopPropagation(); goToProduct(product.id); }}
                        aria-label="View product"
                      >
                        +
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </>
  );
}

export default Products;
