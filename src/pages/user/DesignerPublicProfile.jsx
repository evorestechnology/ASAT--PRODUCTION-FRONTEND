import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../api';
import BackButton from '../../components/BackButton';
import { useCurrency, SUPPORTED_CURRENCIES } from '../../context/CurrencyContext';


/* ─────────────────────────────────────────────────────────────
   CSS — scoped inside this page component
───────────────────────────────────────────────────────────── */
const styles = `
  /* ── Page Shell ── */
  .dpp-page {
    min-height: 100vh;
    background: var(--light);
    font-family: 'Montserrat', sans-serif;
  }

  /* ── Hero Banner ── */
  .dpp-hero {
    position: relative;
    background: var(--dark);
    padding: 60px 6% 50px;
    overflow: hidden;
  }

  .dpp-hero__backdrop {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 70% 50%, rgba(197,160,89,0.12) 0%, transparent 65%);
    pointer-events: none;
  }

  .dpp-hero__inner {
    position: relative;
    display: flex;
    align-items: center;
    gap: 40px;
    flex-wrap: wrap;
    max-width: 1200px;
    margin: 0 auto;
  }

  .dpp-hero__avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background-size: cover;
    background-position: center;
    border: 3px solid var(--gold);
    flex-shrink: 0;
    box-shadow: 0 0 30px rgba(197,160,89,0.25);
  }

  .dpp-hero__info {
    flex: 1;
    min-width: 220px;
  }

  .dpp-hero__label {
    font-size: 0.65rem;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 8px;
  }

  .dpp-hero__name {
    font-family: 'Cinzel', serif;
    font-size: clamp(1.6rem, 3vw, 2.5rem);
    color: #fff;
    margin: 0 0 8px;
    letter-spacing: 2px;
  }

  .dpp-hero__bio {
    color: rgba(255,255,255,0.65);
    font-size: 0.85rem;
    line-height: 1.7;
    max-width: 560px;
    margin: 0 0 16px;
  }

  .dpp-hero__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .dpp-hero__tag {
    background: rgba(197,160,89,0.12);
    border: 1px solid rgba(197,160,89,0.3);
    color: var(--gold);
    padding: 5px 14px;
    border-radius: 100px;
    font-size: 0.7rem;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }

  .dpp-hero__stats {
    display: flex;
    gap: 32px;
    flex-wrap: wrap;
  }

  .dpp-hero__stat {
    text-align: center;
  }

  .dpp-hero__stat-num {
    font-family: 'Cinzel', serif;
    font-size: 1.8rem;
    color: var(--gold);
    line-height: 1;
  }

  .dpp-hero__stat-label {
    font-size: 0.65rem;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.5);
    margin-top: 4px;
  }

  .dpp-hero__back {
    position: absolute;
    top: 24px;
    left: 6%;
    background: transparent;
    border: 1px solid rgba(255,255,255,0.15);
    color: rgba(255,255,255,0.7);
    padding: 7px 16px;
    border-radius: 100px;
    font-size: 0.72rem;
    letter-spacing: 1.5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
    font-family: 'Montserrat', sans-serif;
    text-transform: uppercase;
  }

  .dpp-hero__back:hover {
    border-color: var(--gold);
    color: var(--gold);
  }

  /* ── Filter Bar ── */
  .dpp-filters {
    background: #1a1a1a;
    border-bottom: 1px solid rgba(197,160,89,0.12);
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 4px 24px rgba(0,0,0,0.4);
  }

  .dpp-filters__inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 6%;
    display: flex;
    align-items: center;
    gap: 0;
    flex-wrap: wrap;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .dpp-filters__inner::-webkit-scrollbar { display: none; }

  .dpp-filters__section {
    display: flex;
    align-items: center;
    gap: 0;
    padding: 14px 0;
    border-right: 1px solid rgba(197,160,89,0.12);
    padding-right: 24px;
    margin-right: 24px;
    flex-shrink: 0;
  }

  .dpp-filters__section:last-child {
    border-right: none;
    margin-right: 0;
    padding-right: 0;
  }

  .dpp-filters__label {
    font-size: 0.65rem;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: rgba(197,160,89,0.6);
    margin-right: 12px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .dpp-pills {
    display: flex;
    gap: 6px;
    flex-wrap: nowrap;
  }

  .dpp-pill {
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

  .dpp-pill:hover {
    border-color: rgba(197,160,89,0.6);
    color: var(--gold);
  }

  .dpp-pill.active {
    background: var(--gold);
    border-color: var(--gold);
    color: #111;
    font-weight: 600;
  }

  .dpp-sort-select {
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
  .dpp-sort-select:focus { border-color: var(--gold); }
  .dpp-sort-select option { background: #1a1a1a; color: #fff; }

  .dpp-price-inputs {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .dpp-price-input {
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
  .dpp-price-input::placeholder { color: rgba(255,255,255,0.25); }
  .dpp-price-input:focus { border-color: var(--gold); }
  .dpp-price-sep {
    color: rgba(255,255,255,0.2);
    font-size: 0.75rem;
  }

  /* ── Products Grid ── */
  .dpp-main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 6%;
  }

  .dpp-results-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32px;
    flex-wrap: wrap;
    gap: 12px;
  }

  .dpp-results-count {
    font-size: 0.75rem;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #999;
  }

  .dpp-active-filters {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .dpp-filter-chip {
    background: rgba(197,160,89,0.1);
    border: 1px solid rgba(197,160,89,0.3);
    color: var(--gold);
    padding: 4px 12px;
    border-radius: 100px;
    font-size: 0.65rem;
    letter-spacing: 1px;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }

  .dpp-filter-chip:hover { background: rgba(197,160,89,0.2); }

  /* ── Product Grid ── */
  .dpp-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 28px;
  }

  .dpp-card {
    background: #fff;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.3s cubic-bezier(0.25,1,0.5,1), box-shadow 0.3s ease;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    opacity: 0;
    transform: translateY(20px);
    animation: dppCardIn 0.45s ease forwards;
  }

  .dpp-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 40px rgba(0,0,0,0.14);
  }

  @keyframes dppCardIn {
    to { opacity: 1; transform: translateY(0); }
  }

  .dpp-card__img {
    width: 100%;
    aspect-ratio: 3/4;
    background-size: cover;
    background-position: center;
    position: relative;
    overflow: hidden;
    transition: transform 0.5s ease;
  }

  .dpp-card:hover .dpp-card__img { transform: scale(1.04); }

  .dpp-card__badge {
    position: absolute;
    top: 14px;
    left: 14px;
    background: var(--dark);
    color: var(--gold);
    font-size: 0.6rem;
    letter-spacing: 2px;
    padding: 5px 10px;
    border-radius: 4px;
    text-transform: uppercase;
    font-family: 'Cinzel', serif;
  }

  .dpp-card__rank {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--gold);
    color: var(--dark);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
    font-family: 'Cinzel', serif;
  }

  .dpp-card__body {
    padding: 16px 18px 20px;
  }

  .dpp-card__category {
    font-size: 0.62rem;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 6px;
  }

  .dpp-card__name {
    font-family: 'Cinzel', serif;
    font-size: 0.95rem;
    color: var(--dark);
    margin: 0 0 4px;
    letter-spacing: 0.5px;
    line-height: 1.35;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dpp-card__subtitle {
    font-size: 0.72rem;
    color: #888;
    margin: 0 0 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dpp-card__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .dpp-card__price {
    font-family: 'Cinzel', serif;
    font-size: 1.1rem;
    color: var(--dark);
    font-weight: 700;
  }

  .dpp-card__sales {
    font-size: 0.65rem;
    color: #999;
    letter-spacing: 1px;
  }

  /* ── Loading Skeleton ── */
  .dpp-skel {
    background: #fff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  }

  .dpp-skel__img {
    aspect-ratio: 3/4;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: dppShimmer 1.5s infinite;
  }

  .dpp-skel__body { padding: 16px 18px 20px; }
  .dpp-skel__line {
    height: 10px;
    border-radius: 100px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: dppShimmer 1.5s infinite;
    margin-bottom: 10px;
  }
  .dpp-skel__line--short { width: 55%; }
  .dpp-skel__line--med { width: 80%; }

  @keyframes dppShimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* ── Empty State ── */
  .dpp-empty {
    grid-column: 1/-1;
    text-align: center;
    padding: 80px 20px;
  }

  .dpp-empty__icon {
    font-size: 3rem;
    margin-bottom: 20px;
    opacity: 0.3;
  }

  .dpp-empty h3 {
    font-family: 'Cinzel', serif;
    font-size: 1.2rem;
    letter-spacing: 3px;
    color: var(--dark);
    margin: 0 0 12px;
  }

  .dpp-empty p {
    color: #999;
    font-size: 0.85rem;
    margin: 0 0 24px;
  }

  .dpp-empty__reset {
    background: var(--dark);
    color: #fff;
    border: none;
    padding: 12px 28px;
    font-family: 'Montserrat', sans-serif;
    font-size: 0.75rem;
    letter-spacing: 2px;
    text-transform: uppercase;
    cursor: pointer;
    border-radius: 4px;
    transition: background 0.3s;
  }

  .dpp-empty__reset:hover { background: var(--gold); }

  /* ── Not Found ── */
  .dpp-not-found {
    min-height: 60vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 60px;
    font-family: 'Montserrat', sans-serif;
  }

  .dpp-not-found h2 {
    font-family: 'Cinzel', serif;
    letter-spacing: 4px;
    font-size: 1.5rem;
    color: var(--dark);
    margin-bottom: 12px;
  }

  .dpp-not-found p { color: #999; font-size: 0.85rem; margin-bottom: 28px; }

  .dpp-btn-back {
    background: var(--dark);
    color: #fff;
    border: none;
    padding: 13px 28px;
    font-family: 'Montserrat', sans-serif;
    font-size: 0.75rem;
    letter-spacing: 2px;
    text-transform: uppercase;
    cursor: pointer;
    border-radius: 4px;
    transition: background 0.3s;
  }
  .dpp-btn-back:hover { background: var(--gold); }

  @media (max-width: 768px) {
    .dpp-hero__inner { gap: 24px; }
    .dpp-hero__avatar { width: 80px; height: 80px; }
    .dpp-hero__stats { gap: 20px; }
    .dpp-grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 18px; }
    .dpp-filters__inner { gap: 0; flex-direction: column; align-items: flex-start; }
    .dpp-filters__section { border-right: none; border-bottom: 1px solid #f0f0f0; padding: 10px 0; margin-right: 0; width: 100%; }
    .dpp-filters__section:last-child { border-bottom: none; }
  }
`;

const SORT_OPTIONS = [
  { label: 'Latest',        value: 'latest' },
  { label: 'Top Sales',     value: 'top-sales' },
  { label: 'Ranking',       value: 'ranking' },
  { label: 'Price: Low → High', value: 'price-asc' },
  { label: 'Price: High → Low', value: 'price-desc' },
  { label: 'Name: A–Z',    value: 'name-asc' },
];

/* ─────────────────────────────────────────────────────────────
   Skeleton Card
───────────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="dpp-skel">
      <div className="dpp-skel__img" />
      <div className="dpp-skel__body">
                <BackButton />
        <div className="dpp-skel__line dpp-skel__line--short" />
        <div className="dpp-skel__line dpp-skel__line--med" />
        <div className="dpp-skel__line dpp-skel__line--short" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Page Component
───────────────────────────────────────────────────────────── */
function DesignerPublicProfile() {
  const { designerId } = useParams();
  const navigate = useNavigate();
  const { currency, rates, formatPrice, globalCurrencies, applyMarkup } = useCurrency();
  const curSymbol = ((globalCurrencies && globalCurrencies[currency]) || SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES['INR'] || { symbol: '₹' }).symbol?.trim() || '₹';

  /* ── State ── */
  const [designer, setDesigner] = useState(null);
  const [products, setProducts]  = useState([]);
  const [loadingDesigner, setLoadingDesigner] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [notFound, setNotFound] = useState(false);

  /* ── Filters ── */
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('latest');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');

  /* ── Fetch designer profile ── */
  useEffect(() => {
    setLoadingDesigner(true);
    const fetchDesigner = async () => {
      try {
        const data = await apiFetch(`/api/designers/${designerId}`);

        if (data) {
          if (data.status === 'blocked') {
            setNotFound(true);
          } else {
            setDesigner({
              id: data.id,
              fullName: data.full_name,
              email: data.email,
              username: data.username,
              avatar: data.avatar_url,
              bio: data.bio || '',
              speciality: data.speciality || '',
              location: data.address || '',
              status: data.status,
              designsCount: data.designs_count,
              totalEarnings: Number(data.total_earnings) || 0,
              points: data.points,
              rank: data.rank
            });
          }
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error('Error fetching designer:', err);
        setNotFound(true);
      } finally {
        setLoadingDesigner(false);
      }
    };
    fetchDesigner();
  }, [designerId]);

  /* ── Fetch designer's approved products ── */
  useEffect(() => {
    setLoadingProducts(true);
    const fetchApprovedDesigns = async () => {
      try {
        const [designsData, categoriesData] = await Promise.all([
          apiFetch(`/api/designs?designerId=${designerId}`),
          apiFetch('/api/categories')
        ]);

        if (designsData) {
          const mapped = designsData.map((d) => ({
            id: d.id,
            title: d.title || '',
            name: d.title || '',
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
            price: Number(d.price) || 0,
            catalogueItemId: d.catalogue_item_id,
            designerId: d.designer_id,
            designerUsername: d.designer_username,
            images: d.images,
            colors: d.colors,
            sizes: d.sizes,
            gender: d.gender,
            status: d.status,
            collection: d.collection,
            ordersCount: d.orders_count,
            totalEarnings: Number(d.total_earnings) || 0,
            createdAt: d.created_at ? { seconds: new Date(d.created_at).getTime() / 1000 } : null
          }));
          setProducts(mapped);
        }
      } catch (err) {
        console.error('Error fetching designer products:', err);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchApprovedDesigns();
  }, [designerId]);

  /* ── Derive unique categories from products ── */
  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category || p.type || 'Other').filter(Boolean));
    return ['All', ...Array.from(cats).sort()];
  }, [products]);

  /* ── Reset category if it disappears ── */
  useEffect(() => {
    if (!categories.includes(activeCategory)) setActiveCategory('All');
  }, [categories, activeCategory]);

  /* ── Filtering + Sorting ── */
  const filtered = useMemo(() => {
    let items = [...products];

    if (activeCategory !== 'All') {
      items = items.filter((p) => (p.category || p.type || 'Other') === activeCategory);
    }

    const minVal = priceMin !== '' ? parseFloat(priceMin) : null;
    const maxVal = priceMax !== '' ? parseFloat(priceMax) : null;
    const rate = rates[currency] || 1;
    const min = minVal !== null ? (minVal / rate) : null;
    const max = maxVal !== null ? (maxVal / rate) : null;
    if (min !== null) items = items.filter((p) => (p.price || 0) >= min);
    if (max !== null) items = items.filter((p) => (p.price || 0) <= max);

    switch (sortBy) {
      case 'latest':    items.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)); break;
      case 'top-sales': items.sort((a, b) => (b.ordersCount ?? 0) - (a.ordersCount ?? 0)); break;
      case 'ranking':   items.sort((a, b) => (a.ranking ?? 999) - (b.ranking ?? 999)); break;
      case 'price-asc': items.sort((a, b) => (a.price ?? 0) - (b.price ?? 0)); break;
      case 'price-desc':items.sort((a, b) => (b.price ?? 0) - (a.price ?? 0)); break;
      case 'name-asc':  items.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')); break;
      default: break;
    }

    return items;
  }, [products, activeCategory, sortBy, priceMin, priceMax, currency, rates]);

  /* ── Helpers ── */
  const resetFilters = useCallback(() => {
    setActiveCategory('All');
    setSortBy('latest');
    setPriceMin('');
    setPriceMax('');
  }, []);

  const hasFilters = activeCategory !== 'All' || priceMin !== '' || priceMax !== '' || sortBy !== 'latest';

  const getProductImage = (p) => {
    if (p.images && p.images.length > 0) return p.images[0];
    if (p.image) return p.image;
    if (p.coverImage) return p.coverImage;
    if (p.colors?.[0]?.frontImage) return p.colors[0].frontImage;
    return 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=600&q=80';
  };

  /* ── Not found state ── */
  if (!loadingDesigner && notFound) {
    return (
      <>
        <style>{styles}</style>
        <div className="dpp-not-found">
          <h2>DESIGNER NOT FOUND</h2>
          <p>This designer profile doesn't exist or has been removed.</p>
          <button className="dpp-btn-back" onClick={() => navigate('/')}>
            ← Back to Home
          </button>
        </div>
      </>
    );
  }

  /* ── Render ── */
  return (
    <>
      <style>{styles}</style>
      <div className="dpp-page">

        {/* ── Hero Banner ── */}
        <div className="dpp-hero">
          <div className="dpp-hero__backdrop" />

          <button className="dpp-hero__back" onClick={() => navigate(-1)}>
            <i className="fa-solid fa-arrow-left" /> Back
          </button>

          {loadingDesigner ? (
            <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                border: '2px solid rgba(197,160,89,0.2)',
                borderTopColor: 'var(--gold)',
                animation: 'spin 0.8s linear infinite'
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : designer && (
            <div className="dpp-hero__inner">
              {/* Avatar */}
              <div
                className="dpp-hero__avatar"
                style={{
                  backgroundImage: `url('${designer.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(designer.fullName || 'D')}&background=C5A059&color=121212&bold=true&size=200`
                  }')`,
                }}
              />

              {/* Info */}
              <div className="dpp-hero__info">
                <div className="dpp-hero__label">Designer Profile</div>
                <h1 className="dpp-hero__name">{designer.fullName || designer.username}</h1>
                {designer.bio && (
                  <p className="dpp-hero__bio">{designer.bio}</p>
                )}
                <div className="dpp-hero__tags">
                  {designer.speciality && (
                    <span className="dpp-hero__tag">{designer.speciality}</span>
                  )}
                  {/* {designer.location && (
                    <span className="dpp-hero__tag">
                      <i className="fa-solid fa-location-dot" style={{ marginRight: '4px' }} />
                      {designer.location}
                    </span>
                  )} */}
                  {/* {designer.status === 'active' && (
                    <span className="dpp-hero__tag" style={{ borderColor: 'rgba(40,200,100,0.4)', color: '#28c864' }}>
                      ● Active
                    </span>
                  )} */}
                </div>
              </div>

              {/* Stats */}
              <div className="dpp-hero__stats">
                <div className="dpp-hero__stat">
                  <div className="dpp-hero__stat-num">{designer.designsCount ?? products.length}</div>
                  <div className="dpp-hero__stat-label">Designs</div>
                </div>
                <div className="dpp-hero__stat">
                  <div className="dpp-hero__stat-num">{designer.totalOrders ?? '—'}</div>
                  <div className="dpp-hero__stat-label">Total Sales</div>
                </div>
                <div className="dpp-hero__stat">
                  <div className="dpp-hero__stat-num">#{designer.ranking ?? '—'}</div>
                  <div className="dpp-hero__stat-label">Ranking</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Sticky Filter Bar ── */}
        <div className="dpp-filters">
          <div className="dpp-filters__inner">

            {/* Category Dropdown */}
            <div className="dpp-filters__section">
              <span className="dpp-filters__label">Category</span>
              <select
                className="dpp-sort-select"
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

            {/* Price range */}
            <div className="dpp-filters__section">
              <span className="dpp-filters__label">Price</span>
              <div className="dpp-price-inputs">
                <input
                  type="number"
                  className="dpp-price-input"
                  placeholder={`Min ${curSymbol}`}
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  min="0"
                />
                <span className="dpp-price-sep">–</span>
                <input
                  type="number"
                  className="dpp-price-input"
                  placeholder={`Max ${curSymbol}`}
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  min="0"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="dpp-filters__section">
              <span className="dpp-filters__label">Sort</span>
              <select
                className="dpp-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* ── Main Content ── */}
        <div className="dpp-main">
          <div className="dpp-results-bar">
            <span className="dpp-results-count">
              {loadingProducts
                ? 'Loading designs…'
                : `${filtered.length} ${filtered.length === 1 ? 'design' : 'designs'} found`}
            </span>
            {hasFilters && (
              <div className="dpp-active-filters">
                {activeCategory !== 'All' && (
                  <span className="dpp-filter-chip" onClick={() => setActiveCategory('All')}>
                    {activeCategory} ✕
                  </span>
                )}
                {(priceMin || priceMax) && (
                  <span className="dpp-filter-chip" onClick={() => { setPriceMin(''); setPriceMax(''); }}>
                    {curSymbol}{priceMin || '0'} – {curSymbol}{priceMax || '∞'} ✕
                  </span>
                )}
                {sortBy !== 'latest' && (
                  <span className="dpp-filter-chip" onClick={() => setSortBy('latest')}>
                    {SORT_OPTIONS.find((o) => o.value === sortBy)?.label} ✕
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="dpp-grid">
            {loadingProducts
              ? Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)
              : filtered.length === 0
                ? (
                  <div className="dpp-empty">
                    <div className="dpp-empty__icon">✦</div>
                    <h3>NO DESIGNS FOUND</h3>
                    <p>
                      {hasFilters
                        ? 'No designs match your current filters. Try adjusting them.'
                        : 'This designer hasn\'t published any designs yet.'}
                    </p>
                    {hasFilters && (
                      <button className="dpp-empty__reset" onClick={resetFilters}>
                        Clear All Filters
                      </button>
                    )}
                  </div>
                )
                : filtered.map((product, idx) => (
                  <div
                    key={product.id}
                    className="dpp-card"
                    style={{ animationDelay: `${idx * 60}ms` }}
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    {/* Image */}
                    <div
                      className="dpp-card__img"
                      style={{ backgroundImage: `url('${getProductImage(product)}')` }}
                    >
                      {product.tag === 'trending' && (
                        <span className="dpp-card__badge">★ Trending</span>
                      )}
                      {product.ranking && sortBy === 'ranking' && (
                        <span className="dpp-card__rank">#{product.ranking}</span>
                      )}
                    </div>

                    {/* Body */}
                    <div className="dpp-card__body">
                      <div className="dpp-card__category">
                        {product.category || product.type || product.productType || 'Design'}
                      </div>
                      <h4 className="dpp-card__name">
                        {product.name || product.title || 'Untitled'}
                      </h4>
                      <p className="dpp-card__subtitle">
                        {product.collection || product.subtitle || product.description?.slice(0, 50) || ''}
                      </p>
                      <div className="dpp-card__footer">
                        <span className="dpp-card__price">
                          {formatPrice(applyMarkup(product.price || 0))}
                        </span>
                        <span className="dpp-card__sales">
                          {product.ordersCount ? `${product.ordersCount} sold` : 'New'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
            }
          </div>
        </div>

      </div>
    </>
  );
}

export default DesignerPublicProfile;
