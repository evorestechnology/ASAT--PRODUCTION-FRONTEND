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
  /* ── Enhanced Filter Bar ── */
  .pcol-filter-bar {
    background: #1a1a1a;
    border-bottom: 1px solid rgba(197,160,89,0.12);
    position: sticky;
    top: 0;
    z-index: 200;
    box-shadow: 0 4px 24px rgba(0,0,0,0.35);
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
    border-right: 1px solid rgba(197,160,89,0.12);
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
    color: rgba(197,160,89,0.6);
    white-space: nowrap;
    font-family: 'Montserrat', sans-serif;
  }

  /* Category Pills */
  .pcol-pills {
    display: flex;
    gap: 6px;
    flex-wrap: nowrap;
  }

  .pcol-pill {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.15);
    color: rgba(255,255,255,0.5);
    padding: 6px 14px;
    border-radius: 100px;
    font-size: 0.7rem;
    letter-spacing: 1px;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    font-family: 'Montserrat', sans-serif;
    text-transform: uppercase;
  }
  .pcol-pill:hover { border-color: rgba(197,160,89,0.6); color: var(--gold); }
  .pcol-pill.active {
    background: var(--gold);
    border-color: var(--gold);
    color: #111;
    font-weight: 600;
  }

  .pcol-sort-select {
    border: 1px solid rgba(255,255,255,0.15);
    color: rgba(255,255,255,0.75);
    padding: 7px 12px;
    border-radius: 6px;
    font-size: 0.72rem;
    font-family: 'Montserrat', sans-serif;
    cursor: pointer;
    background: rgba(255,255,255,0.05);
    outline: none;
    letter-spacing: 0.5px;
    transition: border-color 0.2s;
  }
  .pcol-sort-select:focus { border-color: var(--gold); }
  .pcol-sort-select option { background: #1a1a1a; color: #fff; }

  /* Price Range Inputs */
  .pcol-price-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .pcol-price-input {
    width: 80px;
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 6px;
    padding: 7px 10px;
    font-size: 0.72rem;
    font-family: 'Montserrat', sans-serif;
    color: rgba(255,255,255,0.75);
    outline: none;
    transition: border-color 0.2s;
    background: rgba(255,255,255,0.05);
  }
  .pcol-price-input::placeholder { color: rgba(255,255,255,0.25); }
  .pcol-price-input:focus { border-color: var(--gold); }
  .pcol-price-sep { color: rgba(255,255,255,0.2); font-size: 0.75rem; }

  /* Collection Tabs */
  .pcol-tabs {
    background: var(--dark);
    display: flex;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .pcol-tabs::-webkit-scrollbar { display: none; }
  .pcol-tab {
    background: transparent;
    border: none;
    color: rgba(255,255,255,0.55);
    padding: 14px 28px;
    font-family: 'Cinzel', serif;
    font-size: 0.7rem;
    letter-spacing: 3px;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.25s ease;
    white-space: nowrap;
    border-bottom: 2px solid transparent;
    flex-shrink: 0;
  }
  .pcol-tab:hover { color: rgba(255,255,255,0.85); }
  .pcol-tab.active {
    color: var(--gold);
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
    border-radius: 12px;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 2px 12px rgba(0,0,0,0.05);
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
    border-radius: 14px;
    overflow: hidden;
    cursor: pointer;
    background: #111;
    opacity: 0;
    transform: translateY(22px);
    transition: transform 0.4s cubic-bezier(0.25,1,0.5,1), box-shadow 0.4s ease;
    box-shadow: 0 4px 20px rgba(0,0,0,0.10);
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
    transform: translateY(-7px) scale(1.015);
    box-shadow: 0 22px 52px rgba(0,0,0,0.22);
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

  /* Frosted glass bottom panel */
  .pcard--standard__panel {
    position: absolute;
    bottom: 12px; left: 12px; right: 12px;
    background: rgba(18,18,18,0.72);
    backdrop-filter: blur(20px) saturate(1.5);
    -webkit-backdrop-filter: blur(20px) saturate(1.5);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 10px;
    padding: 14px 16px 16px;
    z-index: 2;
    transition: background 0.3s ease;
  }
  .pcard--standard:hover .pcard--standard__panel {
    background: rgba(18,18,18,0.82);
  }
  .pcard--standard__brand {
    display: block;
    font-family: 'Montserrat', sans-serif;
    font-size: 0.52rem;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 5px;
    font-weight: 600;
  }
  .pcard--standard__name {
    font-family: 'Cinzel', serif;
    font-size: 0.92rem;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.5px;
    margin: 0 0 8px;
    line-height: 1.35;
    text-shadow: 0 1px 6px rgba(0,0,0,0.5);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .pcard--standard__price {
    font-family: 'Cinzel', serif;
    font-size: 0.98rem;
    font-weight: 700;
    color: var(--gold);
    text-shadow: 0 1px 4px rgba(0,0,0,0.4);
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

    // Gender
    if (activeGender !== 'All') {
      items = items.filter(
        (p) => (p.gender || 'Unisex').toLowerCase() === activeGender.toLowerCase()
      );
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
    const rank  = rankMap.get(product.id);  // 1-50 for top-sold, undefined otherwise
    const badge = product.tag === 'trending' ? '★ TRENDING' : isNew ? '✦ NEW' : null;
    return (
      <div
        className="pcard--standard"
        key={product.id}
        data-pcard="standard"
        style={{ '--pcard-delay': `${Math.min(idx, 12) * 60}ms` }}
        onClick={() => goToProduct(product.id)}
      >
        <div
          className="pcard--standard__img"
          style={{ backgroundImage: `url('${getImage(product)}')` }}
        />
        {/* Left badge (NEW / TRENDING) */}
        {badge && <span className="pcard--standard__badge">{badge}</span>}
        {/* Right rank number for top-50 sold */}
        {rank && (
          <span className="pcard--standard__rank">
            #{String(rank).padStart(2, '0')}
          </span>
        )}
        <div className="pcard--standard__panel">
          <span className="pcard--standard__brand">{product.brand || 'ASAT'}</span>
          <h4 className="pcard--standard__name">{product.name || product.title}</h4>
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
        <BackButton />

        {/* ── Sticky Filter Bar ── */}
        <div className="pcol-filter-bar">
          <div className="pcol-filter-bar__inner">

            {/* Category Dropdown */}
            <div className="pcol-filter-section">
              <span className="pcol-filter-label">Category</span>
              <select
                className="pcol-sort-select"
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'All' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Gender Pills */}
            <div className="pcol-filter-section">
              <span className="pcol-filter-label">Gender</span>
              <div className="pcol-pills">
                {['All', 'Male', 'Female', 'Unisex'].map((gnd) => (
                  <button
                    key={gnd}
                    className={`pcol-pill ${activeGender === gnd ? 'active' : ''}`}
                    onClick={() => setActiveGender(gnd)}
                  >
                    {gnd}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="pcol-filter-section">
              <span className="pcol-filter-label">Price</span>
              <div className="pcol-price-wrap">
                <input
                  type="number"
                  className="pcol-price-input"
                  placeholder={`Min ${curSymbol}`}
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  min="0"
                />
                <span className="pcol-price-sep">–</span>
                <input
                  type="number"
                  className="pcol-price-input"
                  placeholder={`Max ${curSymbol}`}
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  min="0"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="pcol-filter-section">
              <span className="pcol-filter-label">Sort</span>
              <select
                className="pcol-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Search Input Filter */}
            <div className="pcol-filter-section" style={{ borderRight: 'none', marginLeft: 'auto', paddingRight: 0 }}>
              <span className="pcol-filter-label" style={{ marginRight: 6 }}>Search</span>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Type to filter..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '100px',
                    color: 'white',
                    padding: '6px 30px 6px 14px',
                    fontSize: '0.72rem',
                    fontFamily: "'Montserrat', sans-serif",
                    outline: 'none',
                    width: '180px',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--gold)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                {searchTerm && (
                  <i 
                    className="fas fa-times" 
                    onClick={() => setSearchTerm('')} 
                    style={{ position: 'absolute', right: 28, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.75rem' }}
                  ></i>
                )}
                <i className="fas fa-search" style={{ position: 'absolute', right: 12, color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}></i>
              </div>
            </div>

          </div>
        </div>

        {/* Products Grid */}
        <div className="pcol-grid-wrap">

          {/* Results bar */}
          <div className="pcol-results-bar">
            <div className="pcol-count">
              {loading
                ? 'Loading collection…'
                : `Showing ${filtered.length} ${filtered.length === 1 ? 'piece' : 'pieces'}`}
              {initialDesigner && (
                <span style={{ marginLeft: '10px', color: 'var(--gold)' }}>
                  · by {initialDesigner}
                </span>
              )}
            </div>

            {/* Active filter chips */}
            {hasFilters && (
              <div className="pcol-active-chips">
                {activeCategory !== 'All' && (
                  <span className="pcol-chip" onClick={() => setActiveCategory('All')}>
                    {activeCategory} ✕
                  </span>
                )}
                {activeCollection !== 'All' && (
                  <span className="pcol-chip" onClick={() => setActiveCollection('All')}>
                    {activeCollection} ✕
                  </span>
                )}
                {activeGender !== 'All' && (
                  <span className="pcol-chip" onClick={() => setActiveGender('All')}>
                    {activeGender} ✕
                  </span>
                )}
                {(priceMin || priceMax) && (
                  <span className="pcol-chip" onClick={() => { setPriceMin(''); setPriceMax(''); }}>
                    {curSymbol}{priceMin || '0'} – {curSymbol}{priceMax || '∞'} ✕
                  </span>
                )}
                {sortBy !== 'latest' && (
                  <span className="pcol-chip" onClick={() => setSortBy('latest')}>
                    {SORT_OPTIONS.find((o) => o.value === sortBy)?.label} ✕
                  </span>
                )}
                <span
                  className="pcol-chip"
                  onClick={resetFilters}
                  style={{ borderColor: 'rgba(180,60,60,0.35)', color: '#c0392b', background: 'rgba(180,60,60,0.06)' }}
                >
                  Clear All
                </span>
              </div>
            )}
          </div>

          {/* Grid content */}
          {loading ? (
            <div className="pcol-grid" ref={gridRef}>
              {Array(9).fill(0).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="pcol-empty">
              <div className="pcol-empty__icon">✦</div>
              <h3>NO PRODUCTS FOUND</h3>
              <p>
                {hasFilters
                  ? 'Try adjusting your filters to discover our collection.'
                  : 'No approved products available yet.'}
              </p>
              {hasFilters && (
                <button
                  style={{
                    marginTop: '16px',
                    background: 'var(--dark)',
                    color: '#fff',
                    border: 'none',
                    padding: '12px 28px',
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: '0.72rem',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    transition: 'background 0.3s',
                  }}
                  onClick={resetFilters}
                  onMouseOver={(e) => (e.currentTarget.style.background = 'var(--gold)')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'var(--dark)')}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* First product — full-width editorial wide card */}
              {filtered.length > 0 && renderWideCard(filtered[0], 0)}

              {/* Rest — 4-column standard card grid */}
              {filtered.length > 1 && (
                <div className="pcol-grid" ref={gridRef}>
                  {filtered.slice(1).map((product, index) => renderStandardCard(product, index + 1))}
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </>
  );
}

export default Products;
