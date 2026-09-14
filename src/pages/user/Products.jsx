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
    z-index: 500;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    overflow: visible !important;
  }

  .pcol-filter-bar__inner {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 5%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    overflow: visible !important;
  }

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

  .pcol-sort-dropdown-wrap {
    position: relative;
    display: inline-block;
  }
  .pcol-sort-btn {
    border: 1px solid var(--border, #E5E5E5);
    color: var(--fg, #000000);
    padding: 8px 16px;
    border-radius: 24px;
    font-size: 12px;
    font-weight: 600;
    font-family: 'Montserrat', sans-serif;
    cursor: pointer;
    background: #FFFFFF;
    outline: none;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    user-select: none;
    box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  }
  .pcol-sort-btn:hover {
    border-color: #000000;
  }
  .pcol-sort-btn i {
    font-size: 0.65rem;
    transition: transform 0.2s ease;
  }
  .pcol-sort-btn i.open {
    transform: rotate(180deg);
  }
  .pcol-sort-popover {
    position: absolute;
    top: calc(100% + 6px);
    z-index: 999999;
    background: #FFFFFF;
    border: 1px solid rgba(0, 0, 0, 0.12);
    box-shadow: 0 12px 36px rgba(0,0,0,0.18);
    border-radius: 12px;
    min-width: 175px;
    max-width: min(300px, 90vw);
    overflow: hidden;
    padding: 6px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .pcol-sort-popover--left {
    left: 0;
    right: auto;
  }
  .pcol-sort-popover--center {
    left: 50%;
    transform: translateX(-50%);
    right: auto;
  }
  .pcol-sort-popover--right {
    right: 0;
    left: auto;
  }
  .pcol-sort-popover-item {
    background: none;
    border: none;
    width: 100%;
    padding: 10px 14px;
    text-align: left;
    font-size: 0.75rem;
    font-weight: 500;
    font-family: 'Montserrat', sans-serif;
    color: #444444;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.15s ease;
  }
  .pcol-sort-popover-item:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #000000;
    padding-left: 18px;
  }
  .pcol-sort-popover-item.active {
    background: #000000;
    color: #FFFFFF;
    font-weight: 600;
  }

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
  @media (max-width: 360px) {
    .blu-products-grid {
      gap: 8px;
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { currency, rates, formatPrice, globalCurrencies, applyMarkup } = useCurrency();
  const curSymbol = ((globalCurrencies && globalCurrencies[currency]) || SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES['INR'] || { symbol: '₹' }).symbol?.trim() || '₹';

  /* ── Supabase Data ── */
  const [allProducts, setAllProducts] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ── Collections (derived from data) ── */
  const [collections, setCollections] = useState(['All']);

  /* ── Filter State ── */
  const initialCategory = searchParams.get('category') || '';
  const initialDesigner = searchParams.get('designer') || '';
  const initialSearch = searchParams.get('search') || '';

  const initialSort = searchParams.get('sort') || '';
  const [activeCategory, setActiveCategory] = useState(() => {
    const cat = searchParams.get('category');
    return cat ? decodeURIComponent(cat).trim() : 'All Drops';
  });
  const [activeCollection, setActiveCollection] = useState('All');
  const [activeGender, setActiveGender] = useState('All');
  const [sortBy, setSortBy] = useState(
    initialSort === 'bestsellers' || initialSort === 'best-sellers' ? 'best-sellers' : 'latest'
  );
  const [priceSort, setPriceSort] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [launched, setLaunched] = useState(false);
  const gridRef = useRef(null);

  // Dropdown open states and refs
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const categoryDropdownRef = useRef(null);
  const genderDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);
  const priceDropdownRef = useRef(null);

  const toggleCategory = (e) => {
    e?.stopPropagation?.();
    setCategoryOpen(prev => !prev);
    setGenderOpen(false);
    setSortOpen(false);
    setPriceOpen(false);
  };
  const toggleGender = (e) => {
    e?.stopPropagation?.();
    setGenderOpen(prev => !prev);
    setCategoryOpen(false);
    setSortOpen(false);
    setPriceOpen(false);
  };
  const toggleSort = (e) => {
    e?.stopPropagation?.();
    setSortOpen(prev => !prev);
    setCategoryOpen(false);
    setGenderOpen(false);
    setPriceOpen(false);
  };
  const togglePrice = (e) => {
    e?.stopPropagation?.();
    setPriceOpen(prev => !prev);
    setCategoryOpen(false);
    setGenderOpen(false);
    setSortOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target)) {
        setCategoryOpen(false);
      }
      if (genderDropdownRef.current && !genderDropdownRef.current.contains(e.target)) {
        setGenderOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
        setSortOpen(false);
      }
      if (priceDropdownRef.current && !priceDropdownRef.current.contains(e.target)) {
        setPriceOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Sync URL search, sort, and gender params to state
  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
    const s = searchParams.get('sort');
    if (s === 'bestsellers' || s === 'best-sellers') {
      setSortBy('best-sellers');
    } else if (s === 'newest' || s === 'latest') {
      setSortBy('latest');
    } else if (!s) {
      setSortBy('latest');
    }

    const g = searchParams.get('gender');
    if (g) {
      const match = ['Male', 'Female', 'Unisex'].find(
        (val) => val.toLowerCase() === g.toLowerCase()
      );
      if (match) setActiveGender(match);
    }
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

        setDbCategories(categoriesData || []);

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
              const match = (categoriesData || []).find(
                (c) =>
                  c.slug === catVal ||
                  c.name?.toLowerCase() === catVal?.toLowerCase() ||
                  c.id === catVal
              );
              return match ? match.name : (catVal || 'Other');
            })(),
            name: d.title || 'Designer Creation',
            price: d.price || 0,
            brand: d.designer_username || 'Designer',
            createdAt: d.created_at,
            ordersCount: d.orders_count || 0,
            designerId: d.designer_id,
            designerUsername: d.designer_username,
            gender: d.gender || d.products?.gender || d.catalogue?.gender || 'Unisex',
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

  /* ── Derive unique categories from active database categories + actual products ── */
  const categories = useMemo(() => {
    const list = ['All Drops'];
    const seen = new Set(['all drops', 'all']);

    // 1. From database categories (active categories configured in the store)
    (dbCategories || [])
      .filter((c) => c.active !== false && c.name)
      .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
      .forEach((c) => {
        const name = c.name.trim();
        const lower = name.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          list.push(name);
        }
      });

    // 2. From actual products (so existing products always have their category available)
    (allProducts || []).forEach((p) => {
      const cat = (p.category || p.type || p.productType || '').trim();
      const lower = cat.toLowerCase();
      if (cat && !seen.has(lower) && lower !== 'other') {
        seen.add(lower);
        list.push(cat);
      }
    });

    return list;
  }, [dbCategories, allProducts]);

  /* ── Apply URL param filters once data loads or searchParams change ── */
  useEffect(() => {
    const catParam = searchParams.get('category');
    if (catParam) {
      const decodedParam = decodeURIComponent(catParam).trim();
      const match = categories.find(
        (c) =>
          c.toLowerCase() === decodedParam.toLowerCase() ||
          c.toLowerCase().replace(/[^a-z0-9]/g, '') ===
            decodedParam.toLowerCase().replace(/[^a-z0-9]/g, '')
      );
      if (match) {
        setActiveCategory(match);
      } else {
        setActiveCategory(decodedParam);
      }
    } else {
      setActiveCategory('All Drops');
    }
  }, [searchParams, categories]);

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
    if (activeCategory && activeCategory !== 'All' && activeCategory !== 'All Drops') {
      const targetLower = activeCategory.toLowerCase().trim();
      const normTarget = targetLower.replace(/[^a-z0-9]/g, '');
      items = items.filter((p) => {
        const catName = (p.category || '').toLowerCase().trim();
        const catType = (p.type || '').toLowerCase().trim();
        const catProdType = (p.productType || '').toLowerCase().trim();

        if (catName === targetLower || catType === targetLower || catProdType === targetLower) {
          return true;
        }

        const normCat = catName.replace(/[^a-z0-9]/g, '');
        if (normCat && normTarget && (normCat === normTarget || normCat.includes(normTarget) || normTarget.includes(normCat))) {
          return true;
        }

        const rawCat = (p.products?.category || p.catalogue?.category || '').toLowerCase().trim();
        if (rawCat && (rawCat === targetLower || rawCat.replace(/[^a-z0-9]/g, '') === normTarget)) {
          return true;
        }

        return false;
      });
    }

    // Collection
    if (activeCollection !== 'All') {
      items = items.filter((p) => p.collection === activeCollection);
    }

    // Gender — include unisex dress in male and female filters as well
    if (activeGender !== 'All') {
      const targetGender = activeGender.toLowerCase().trim();
      items = items.filter((p) => {
        const prodGender = (p.gender || 'Unisex').toLowerCase().trim();
        if (targetGender === 'male') {
          return prodGender === 'male' || prodGender === 'men' || prodGender === 'unisex';
        }
        if (targetGender === 'female') {
          return prodGender === 'female' || prodGender === 'women' || prodGender === 'unisex';
        }
        if (targetGender === 'unisex') {
          return prodGender === 'unisex';
        }
        return prodGender === targetGender || prodGender === 'unisex';
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

    // Sorting: Filter 4 (Price) takes precedence if selected; otherwise Filter 3 (Latest / Best Sellers)
    if (priceSort === 'price-asc') {
      items.sort((a, b) => applyMarkup(a.price ?? 0) - applyMarkup(b.price ?? 0));
    } else if (priceSort === 'price-desc') {
      items.sort((a, b) => applyMarkup(b.price ?? 0) - applyMarkup(a.price ?? 0));
    } else if (sortBy === 'best-sellers' || sortBy === 'top-sales') {
      items.sort((a, b) => (b.ordersCount ?? b.orders_count ?? 0) - (a.ordersCount ?? a.orders_count ?? 0));
    } else {
      // default: latest (newest first)
      items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    return items;
  }, [allProducts, activeCategory, activeCollection, activeGender, sortBy, priceSort, priceMin, priceMax, initialDesigner, searchTerm, currency, rates]);

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
    setActiveCategory('All Drops');
    setActiveCollection('All');
    setActiveGender('All');
    setSortBy('latest');
    setPriceSort('');
    setPriceMin('');
    setPriceMax('');
    setSearchTerm('');
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const hasFilters =
    (activeCategory !== 'All' && activeCategory !== 'All Drops') ||
    activeCollection !== 'All' ||
    activeGender !== 'All' ||
    priceSort !== '' ||
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
          <span
            className="pcard--standard__brand"
            onClick={(e) => {
              if (product.designerId || product.designerUsername) {
                e.stopPropagation();
                navigate(`/designers/${product.designerId || product.designerUsername}`);
              }
            }}
            style={product.designerId || product.designerUsername ? { cursor: 'pointer' } : {}}
            title={product.designerId || product.designerUsername ? 'View Designer Profile' : ''}
          >
            {subtitle}
          </span>
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
          {product.designer ? (
            <>
              {' by '}
              <span
                onClick={(e) => {
                  if (product.designerId || product.designerUsername) {
                    e.stopPropagation();
                    navigate(`/designers/${product.designerId || product.designerUsername}`);
                  }
                }}
                style={{ cursor: 'pointer', color: 'var(--gold)', fontWeight: 600 }}
                title="View Designer Profile"
              >
                {product.designer}
              </span>
            </>
          ) : ''}.
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
          <div className="pcol-filter-bar__inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>

            {/* Filter 1: Category / All Drops Dropdown */}
            <div className="pcol-sort-dropdown-wrap" ref={categoryDropdownRef}>
              <button
                type="button"
                className="pcol-sort-btn"
                onClick={toggleCategory}
                aria-label="Filter by drops"
                style={{
                  background: '#000000',
                  color: '#FFFFFF',
                  borderColor: '#000000',
                  borderRadius: '24px',
                  padding: '8px 18px',
                  fontSize: '12px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>
                  {activeCategory === 'All' || activeCategory === 'All Drops'
                    ? 'All Drops'
                    : `All Drops: ${activeCategory}`}
                </span>
                <i className={`fas fa-chevron-down${categoryOpen ? ' open' : ''}`} style={{ marginLeft: '4px' }}></i>
              </button>
              {categoryOpen && (
                <div className="pcol-sort-popover pcol-sort-popover--left" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {categories.map((cat) => {
                    const isSelected = activeCategory === cat || (cat === 'All Drops' && (activeCategory === 'All' || activeCategory === 'All Drops'));
                    return (
                      <button
                        key={cat}
                        type="button"
                        className={`pcol-sort-popover-item${isSelected ? ' active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveCategory(cat);
                          setCategoryOpen(false);
                          setSearchParams((prev) => {
                            const next = new URLSearchParams(prev);
                            if (cat === 'All Drops' || cat === 'All') {
                              next.delete('category');
                            } else {
                              next.set('category', cat);
                            }
                            return next;
                          }, { replace: true });
                        }}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Controls: Filter 2 (Gender), Filter 3 (Latest / Best Sellers), Filter 4 (Price) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, flexWrap: 'wrap', position: 'relative', zIndex: 600 }}>

              {/* 2nd Filter: Gender */}
              <div className="pcol-sort-dropdown-wrap" ref={genderDropdownRef}>
                <button
                  type="button"
                  className="pcol-sort-btn"
                  onClick={toggleGender}
                  aria-label="Filter by gender"
                  style={{
                    background: activeGender !== 'All' ? '#000000' : '#FFFFFF',
                    color: activeGender !== 'All' ? '#FFFFFF' : '#000000',
                    borderColor: activeGender !== 'All' ? '#000000' : '#E5E5E5',
                  }}
                >
                  <span>{activeGender === 'All' ? 'Gender' : `Gender: ${activeGender}`}</span>
                  <i className={`fas fa-chevron-down${genderOpen ? ' open' : ''}`} style={{ marginLeft: '4px' }}></i>
                </button>
                {genderOpen && (
                  <div className="pcol-sort-popover pcol-sort-popover--left">
                    {[
                      { label: 'All Genders', value: 'All' },
                      { label: 'Male', value: 'Male' },
                      { label: 'Female', value: 'Female' },
                      { label: 'Unisex', value: 'Unisex' },
                    ].map((g) => (
                      <button
                        key={g.value}
                        type="button"
                        className={`pcol-sort-popover-item${activeGender === g.value ? ' active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveGender(g.value);
                          setGenderOpen(false);
                        }}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 3rd Filter: Latest / Best Sellers */}
              <div className="pcol-sort-dropdown-wrap" ref={sortDropdownRef}>
                <button
                  type="button"
                  className="pcol-sort-btn"
                  onClick={toggleSort}
                  aria-label="Sort products"
                  style={{
                    background: (sortBy === 'best-sellers' || sortBy === 'top-sales') ? '#000000' : '#FFFFFF',
                    color: (sortBy === 'best-sellers' || sortBy === 'top-sales') ? '#FFFFFF' : '#000000',
                    borderColor: (sortBy === 'best-sellers' || sortBy === 'top-sales') ? '#000000' : '#E5E5E5',
                  }}
                >
                  <span>{sortBy === 'best-sellers' || sortBy === 'top-sales' ? 'Best Sellers' : 'Latest'}</span>
                  <i className={`fas fa-chevron-down${sortOpen ? ' open' : ''}`} style={{ marginLeft: '4px' }}></i>
                </button>
                {sortOpen && (
                  <div className="pcol-sort-popover pcol-sort-popover--center">
                    {[
                      { label: 'Latest', value: 'latest' },
                      { label: 'Best Sellers', value: 'best-sellers' },
                    ].map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        className={`pcol-sort-popover-item${(sortBy === s.value || (s.value === 'best-sellers' && sortBy === 'top-sales')) ? ' active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSortBy(s.value);
                          setPriceSort('');
                          setSortOpen(false);
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 4th Filter: Price (Low to High / High to Low) */}
              <div className="pcol-sort-dropdown-wrap" ref={priceDropdownRef}>
                <button
                  type="button"
                  className="pcol-sort-btn"
                  onClick={togglePrice}
                  aria-label="Sort by price"
                  style={{
                    background: priceSort ? '#000000' : '#FFFFFF',
                    color: priceSort ? '#FFFFFF' : '#000000',
                    borderColor: priceSort ? '#000000' : '#E5E5E5',
                  }}
                >
                  <span>
                    {priceSort === 'price-asc'
                      ? 'Price: Low to High'
                      : priceSort === 'price-desc'
                        ? 'Price: High to Low'
                        : 'Price'}
                  </span>
                  <i className={`fas fa-chevron-down${priceOpen ? ' open' : ''}`} style={{ marginLeft: '4px' }}></i>
                </button>
                {priceOpen && (
                  <div className="pcol-sort-popover pcol-sort-popover--right">
                    {[
                      { label: 'All Prices', value: '' },
                      { label: 'Price: Low to High', value: 'price-asc' },
                      { label: 'Price: High to Low', value: 'price-desc' },
                    ].map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        className={`pcol-sort-popover-item${priceSort === p.value ? ' active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPriceSort(p.value);
                          setPriceOpen(false);
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>

        {/* Products Grid */}
        <div className="pcol-grid-wrap" style={{ padding: '32px clamp(16px, 3.5vw, 48px)' }}>

          {/* Results Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '900', letterSpacing: '-0.5px', textTransform: 'uppercase', margin: 0, color: '#000' }}>
              {activeCategory === 'All' || activeCategory === 'All Drops' ? 'ALL DROPS' : activeCategory.toUpperCase()}
              {activeGender !== 'All' && (
                <span style={{ color: '#666', fontWeight: '700', marginLeft: '8px', fontSize: '1rem' }}>
                  · {activeGender.toUpperCase()}
                </span>
              )}
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
