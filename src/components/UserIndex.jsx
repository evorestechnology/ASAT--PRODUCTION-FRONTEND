import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCurrency } from '../context/CurrencyContext';
import { apiFetch } from '../api';
import PopupModal from './PopupModal';

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   STATIC DATA â€” Hero carousel (always live, brand-controlled)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const heroSlides = [
  {
    image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1600&q=80',
    title: 'Drop 001', subtitle: 'Elevated basics for the everyday',
    cta: 'Shop Essentials', tag: 'NEW SEASON',
  },
  {
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1600&q=80',
    title: 'The Hoodie Edit', subtitle: 'Heavyweight fleece, tailored fits',
    cta: 'Explore Hoodies', tag: 'TRENDING',
  },
  {
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=80',
    title: 'Street Royalty', subtitle: 'Bold prints, bolder statements',
    cta: 'View Collection', tag: 'EXCLUSIVE',
  },
  {
    image: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?auto=format&fit=crop&w=1600&q=80',
    title: 'Kids Collection', subtitle: 'Mini style, maximum attitude',
    cta: 'Shop Kids', tag: 'JUST DROPPED',
  },
];

const STATIC_FEATURES = [
  { icon: 'fa-gem',           title: 'Designer’s best',    desc: 'Every piece crafted from premium fabrics with meticulous attention to detail.' },
  { icon: 'fa-truck-fast',    title: 'Pan-World Delivery', desc: 'Free shipping above â‚¹2,000 with real-time tracking and hassle-free returns.' },
  { icon: 'fa-shield-halved', title: 'Certified Quality',  desc: 'Every garment quality-tested and inspected before shipping to you.' },
];

const STATIC_MARQUEE = [
  "world’s first platform made for designers",
  "your born to wear designer edition",
  "streetwear season is live now"
];

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

];
   SKELETON LOADERS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function SkeletonCard() {
  return (
    <div style={{
      minWidth: '240px', height: '320px', borderRadius: '4px',
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      flexShrink: 0,
    }} />
  );
}

function SkeletonDesignerCard() {
  return (
    <div style={{
      minWidth: '140px', display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: '10px', flexShrink: 0,
    }}>
      <div style={{
        width: '100px', height: '100px', borderRadius: '50%',
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
      }} />
      <div style={{
        width: '80px', height: '12px', borderRadius: '6px',
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
      }} />
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SCROLL HOOK
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function useHorizontalScroll() {
  const ref = useRef(null);
  const scroll = (dir) => {
    if (ref.current) {
      const amount = ref.current.offsetWidth * 0.75;
      ref.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };
  return [ref, scroll];
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PRODUCT CARD
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function ProductCard({ product, badge, badgeClass = '', rank, onNavigate }) {
  const { formatPrice } = useCurrency();
  const [wishlisted, setWishlisted] = useState(false);
  const img = product.images?.[0] || 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=500&q=80';

  useEffect(() => {
    const checkWishlist = () => {
      const wishlist = JSON.parse(localStorage.getItem('asat_wishlist') || '[]');
      setWishlisted(wishlist.some(item => item.id === product.id));
    };
    checkWishlist();
    window.addEventListener('wishlist_updated', checkWishlist);
    return () => window.removeEventListener('wishlist_updated', checkWishlist);
  }, [product.id]);

  const toggleWishlist = (e) => {
    e.stopPropagation();
    
    // Guard check for Login
    const isLoggedIn = localStorage.getItem('asat_loggedIn') === 'true';
    if (!isLoggedIn) {
      onNavigate('/login', { 
        state: { 
          from: '/', 
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
        name: product.title || product.name,
        price: product.price,
        image: img,
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

  return (
    <article
      className="ui-product-card"
      style={{ backgroundImage: `url('${img}')`, minWidth: '240px', cursor: 'pointer' }}
      onClick={() => onNavigate(`/products/${product.id}`)}
    >
      <span className={`ui-product-card__badge ${badgeClass}`}>{badge}</span>
      {rank ? (
        <div className="ui-product-card__rank">#{rank}</div>
      ) : (
        <button
          className="ui-product-card__heart"
          onClick={toggleWishlist}
          aria-label="Wishlist"
        >
          <i className={wishlisted ? 'fas fa-heart' : 'far fa-heart'} />
        </button>
      )}
      <div className="ui-product-card__overlay">
        <h4 className="ui-product-card__name">{product.title}</h4>
        <span className="ui-product-card__price">{formatPrice(product.price)}</span>
      </div>
      <button
        className="ui-product-card__quick-add"
        onClick={(e) => { e.stopPropagation(); onNavigate(`/products/${product.id}`); }}
      >
        QUICK ADD
      </button>
    </article>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SECTION WRAPPER with heading
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function Section({ id, label, title, dark, children }) {
  return (
    <section className={`ui-section${dark ? ' ui-section--dark' : ''}`} id={id}>
      <div className="ui-section__head" data-animate="heading">
        <div className="ui-section__label">{label}</div>
        <h2 className="ui-section__title">{title}</h2>
        <div className="ui-section__rule" />
      </div>
      {children}
    </section>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SCROLLABLE ROW
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function ScrollRow({ items, loading, skeletonCount = 6, renderItem, rowClass = '' }) {
  const [ref, scroll] = useHorizontalScroll();
  return (
    <div className="ui-scroll-wrap">
      <button className="ui-scroll-arrow ui-scroll-arrow--left" onClick={() => scroll('left')} aria-label="Scroll left">
        <i className="fas fa-angle-left" />
      </button>
      <div className={`ui-scroll-row ${rowClass}`} ref={ref}>
        {loading
          ? Array.from({ length: skeletonCount }).map((_, i) =>
              rowClass.includes('designers') ? <SkeletonDesignerCard key={i} /> : <SkeletonCard key={i} />
            )
          : items.length > 0
            ? items.map((item, idx) => renderItem(item, idx))
            : (
              <div style={{
                padding: '60px 20px', color: '#aaa', fontFamily: 'Montserrat,sans-serif',
                fontSize: '0.85rem', letterSpacing: '2px', textTransform: 'uppercase',
              }}>
                Coming Soon
              </div>
            )
        }
      </div>
      <button className="ui-scroll-arrow ui-scroll-arrow--right" onClick={() => scroll('right')} aria-label="Scroll right">
        <i className="fas fa-angle-right" />
      </button>
    </div>
  );
}

const getDynamicBentoClass = (index, total) => {
  if (total === 1) return 'bento-card--span-12';
  if (total === 2) return index === 0 ? 'bento-card--span-8' : 'bento-card--span-4';
  if (total === 3) return index === 0 ? 'bento-card--span-12' : 'bento-card--span-6';
  if (total === 4) {
    if (index === 0) return 'bento-card--span-8';
    if (index === 1) return 'bento-card--span-4';
    return 'bento-card--span-6';
  }
  if (total === 5) {
    if (index === 0) return 'bento-card--span-8';
    return 'bento-card--span-4';
  }
  if (total === 6) {
    if (index === 0) return 'bento-card--span-8';
    if (index === 5) return 'bento-card--span-12';
    return 'bento-card--span-4';
  }
  const idx = index % 5;
  if (idx === 0) return 'bento-card--span-8';
  return 'bento-card--span-4';
};

/* â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• 
   MAIN COMPONENT
   â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â•  */
export default function UserIndex() {
  const navigate = useNavigate();
  const location = useLocation();
  const [welcomeToast, setWelcomeToast] = useState(location.state?.welcomeMessage || '');

  useEffect(() => {
    if (location.state?.welcomeMessage) {
      setWelcomeToast(location.state.welcomeMessage);
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => setWelcomeToast(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [location]);

  /* â”€â”€ Hero State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const [slide, setSlide]         = useState(0);
  const [prevSlide, setPrevSlide] = useState(null);
  const [heroReady, setHeroReady] = useState(false);

  const goSlide = useCallback((i) => {
    if (i === slide) return;
    setPrevSlide(slide);
    setSlide(i);
  }, [slide]);

  const nextSlide    = useCallback(() => goSlide((slide + 1) % heroSlides.length), [slide, goSlide]);
  const prevSlideNav = useCallback(() => goSlide((slide - 1 + heroSlides.length) % heroSlides.length), [slide, goSlide]);

  useEffect(() => {
    const t = setTimeout(() => setHeroReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setPrevSlide(slide);
      setSlide((p) => (p + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(t);
  }, [slide]);


  /* â”€â”€ Firestore Data State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const [newArrivals,   setNewArrivals]   = useState([]);
  const [bestsellers,   setBestsellers]   = useState([]);
  const [categories,    setCategories]    = useState([]);
  const [designers,     setDesigners]     = useState([]);

  const [marqueeItems,  setMarqueeItems]  = useState(STATIC_MARQUEE);

  const [loadingArrivals,   setLoadingArrivals]   = useState(true);
  const [loadingBestsellers,setLoadingBestsellers] = useState(true);
  const [loadingCategories, setLoadingCategories]  = useState(true);
  const [loadingDesigners,  setLoadingDesigners]   = useState(true);


  /* â”€â”€ Intersection Observer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      }),
      { threshold: 0.08 }
    );
    // Observe ALL data-animate elements, including those added after data loads
    const timer = setTimeout(() => {
      document.querySelectorAll('[data-animate]').forEach((el) => obs.observe(el));
    }, 100);
    return () => { obs.disconnect(); clearTimeout(timer); };
  }, [categories, designers]); // re-run when async data arrives
  /* â”€â”€ Fetch All Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all designers first to determine active status
        const designersData = await apiFetch('/api/designers/rankings');

        const activeDesignerIds = new Set(
          (designersData || [])
            .filter((d) => d.status === 'active')
            .map((d) => d.id)
        );

        // New Arrivals — limit 50, filter client-side by active designer
        const designsArrivalsData = await apiFetch('/api/designs?limit=50');

        if (designsArrivalsData) {
          const approved = designsArrivalsData
            .map((d) => ({
              id: d.id,
              title: d.title,
              description: d.description,
              price: Number(d.price || 0),
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
              totalEarnings: Number(d.total_earnings || 0),
              createdAt: d.created_at
            }))
            .filter((d) => d.status === 'approved' && activeDesignerIds.has(d.designerId))
            .slice(0, 8);
          setNewArrivals(approved);
        }
        setLoadingArrivals(false);

        // Bestsellers — orderBy orders_count desc, limit 50, filter client-side by active designer
        const designsBestsellersData = await apiFetch('/api/designs?sort=orders_count&limit=50');

        if (designsBestsellersData) {
          const approved = designsBestsellersData
            .map((d) => ({
              id: d.id,
              title: d.title,
              description: d.description,
              price: Number(d.price || 0),
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
              totalEarnings: Number(d.total_earnings || 0),
              createdAt: d.created_at
            }))
            .filter((d) => (d.status === 'approved' || d.status === 'active') && activeDesignerIds.has(d.designerId))
            .slice(0, 8);
          setBestsellers(approved);
        }
        setLoadingBestsellers(false);

        // Designers Spotlight — filter client-side and display active designers
        const activeDesignersList = (designersData || [])
          .map((d) => ({
            id: d.id,
            fullName: d.full_name,
            email: d.email,
            username: d.username,
            avatar: d.avatar_url,
            status: d.status,
            designsCount: d.designs_count,
            totalEarnings: Number(d.total_earnings || 0),
            points: d.points,
            createdAt: d.created_at
          }))
          .filter((d) => d.status === 'active')
          .sort((a, b) => (b.totalEarnings || 0) - (a.totalEarnings || 0))
          .slice(0, 8);
        setDesigners(activeDesignersList);
        setLoadingDesigners(false);

      } catch (err) {
        console.error('Error fetching designers/designs list:', err);
        setLoadingArrivals(false);
        setLoadingBestsellers(false);
        setLoadingDesigners(false);
      }

      // Categories
      try {
        const categoriesData = await apiFetch('/api/categories');
        if (categoriesData) {
          setCategories(categoriesData);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoadingCategories(false);
      }

      // Homepage settings (marquee)
      try {
        const homepageSettings = await apiFetch('/api/settings/homepage');
        if (homepageSettings?.value?.marqueeItems?.length) {
          setMarqueeItems(homepageSettings.value.marqueeItems);
        }
      } catch (err) {
        if (err.status !== 404) {
          console.error('Error fetching homepage settings:', err);
        }
      }
    };

    fetchData();
  }, []);



  /* â”€â”€ Newsletter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const [email, setEmail]         = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     RENDER
     â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .bento-skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 4px;
        }
      `}</style>

      <PopupModal />

      {/* â”â”â” 1 Â· HERO BANNER â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â” */}
      <section className={`hero-banner ${heroReady ? 'hero-banner--ready' : ''}`} id="hero-banner">
        {heroSlides.map((s, i) => (
          <div
            key={i}
            className={`hero-slide ${i === slide ? 'active' : ''} ${i === prevSlide ? 'prev' : ''}`}
            style={{ backgroundImage: `url('${s.image}')` }}
          />
        ))}
        <div className="hero-overlay" />
        <div className="hero-content" key={slide}>
          <span className="hero-tag">{heroSlides[slide].tag}</span>
          <h1 className="hero-title">{heroSlides[slide].title}</h1>
          <p className="hero-subtitle">{heroSlides[slide].subtitle}</p>
          <button className="cta-gold" onClick={() => navigate('/products')}>
            {heroSlides[slide].cta.toUpperCase()}
          </button>
        </div>
        <div className="hero-counter">
          <span className="hero-counter__current" key={`c-${slide}`}>{String(slide + 1).padStart(2, '0')}</span>
          <span className="hero-counter__sep">/</span>
          <span className="hero-counter__total">{String(heroSlides.length).padStart(2, '0')}</span>
        </div>
        <button className="hero-arrow hero-arrow-left" onClick={prevSlideNav} aria-label="Previous slide">
          <i className="fas fa-chevron-left" />
        </button>
        <button className="hero-arrow hero-arrow-right" onClick={nextSlide} aria-label="Next slide">
          <i className="fas fa-chevron-right" />
        </button>
        <div className="hero-dots">
          {heroSlides.map((_, i) => (
            <button key={i} className={`hero-dot ${i === slide ? 'active' : ''}`}
              onClick={() => goSlide(i)} aria-label={`Go to slide ${i + 1}`} />
          ))}
        </div>
        <div className="hero-progress"><div className="hero-progress-bar" key={slide} /></div>
      </section>

      {/* â”â”â” 2 Â· MARQUEE TICKER â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â” */}
      <div className="ui-marquee" id="marquee-strip">
        <div className="ui-marquee__track">
          {[0, 1].map((i) => (
            <span key={i} className="ui-marquee__content">
              {marqueeItems.map((item, j) => <span key={j}>{item}</span>)}
            </span>
          ))}
        </div>
      </div>

      {/* â”â”â” 3 Â· NEW ARRIVALS â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â” */}
      <Section id="new-arrivals" label="Just In" title="New Arrivals">
        <ScrollRow
          items={newArrivals}
          loading={loadingArrivals}
          skeletonCount={6}
          renderItem={(p, idx) => (
            <ProductCard
              key={p.id} product={p} badge="NEW"
              onNavigate={navigate}
            />
          )}
        />
      </Section>



      {/* â”â”â” 4 Â· SHOP BY CATEGORY â€” BENTO GRID â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â” */}
      <Section id="shop-by-category" label="Browse" title="Shop by Category">
        <div className="bento-grid">
          {loadingCategories
            ? ['all','tshirts','hoodies','pants','kids'].map((area, i) => (
                <div key={i} className={`bento-card bento-card--${area} bento-skeleton`} />
              ))
            : categories.length > 0
              ? categories
                  .slice()
                  .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
                  .map((cat, idx) => {
                    const indexStr = String(idx + 1).padStart(2, '0');
                    return (
                      <div
                        key={cat.id}
                        className={`bento-card ${getDynamicBentoClass(idx, categories.length)}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/products?category=${encodeURIComponent(cat.name)}`)}
                      >
                        <div className="bento-card__img" style={{ backgroundImage: `url('${cat.image}')` }} />
                        <div className="bento-card__glow-effect" />
                        <div className="bento-card__overlay">
                          <div className="bento-card__header-tag">
                            <span className="bento-card__index">{indexStr}</span>
                            <span className="bento-card__divider" />
                            <span className="bento-card__collection-label">COLLECTION</span>
                          </div>
                          
                          <div className="bento-card__info-wrap">
                            <h3 className="bento-card__title">{cat.name}</h3>
                            <span className="bento-card__cta">
                              Explore Collection 
                              <span className="bento-card__arrow-wrap">
                                <i className="fas fa-arrow-right" />
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
              : (
                <div style={{ gridColumn: '1/-1', padding: '60px', textAlign: 'center', color: '#aaa', fontFamily: 'Montserrat,sans-serif', fontSize: '0.85rem', letterSpacing: '2px' }}>
                  Categories coming soon
                </div>
              )
          }
        </div>
      </Section>

      {/* â”â”â” 6 Â· BESTSELLERS â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â” */}
      <Section id="bestsellers" label="Most Loved" title="Bestsellers" dark>
        <ScrollRow
          items={bestsellers}
          loading={loadingBestsellers}
          skeletonCount={6}
          renderItem={(p, idx) => (
            <ProductCard
              key={p.id} product={p}
              badge={`★ BESTSELLER`} badgeClass="ui-product-card__badge--hot"
              rank={idx + 1}
              onNavigate={navigate}
            />
          )}
        />
      </Section>

      {/* â”â”â” 7 Â· WHY CHOOSE US â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â” */}
      <section className="ui-features" id="why-choose-us">
        <div className="ui-section__head" data-animate="heading">
          <div className="ui-section__label">The ASAT Promise</div>
          <h2 className="ui-section__title">Why Choose Us</h2>
          <div className="ui-section__rule" />
        </div>
        <div className="ui-features__grid">
          {STATIC_FEATURES.map((f, i) => (
            <div className="ui-feature-card" key={i} data-animate="feature" style={{ '--anim-delay': `${i * 150}ms` }}>
              <div className="ui-feature-card__icon"><i className={`fas ${f.icon}`} /></div>
              <h4>{f.title}</h4>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* â”â”â” 8 Â· DESIGNERS SPOTLIGHT â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â” */}
      <Section id="designers-spotlight" label="Curated Talent" title="Designers Spotlight">
        <ScrollRow
          items={designers}
          loading={loadingDesigners}
          skeletonCount={6}
          rowClass="ui-scroll-row--designers"
          renderItem={(d, i) => (
            <div
              key={d.id}
              className="ui-designer-card"
              data-animate="card"
              style={{ '--anim-delay': `${i * 80}ms`, cursor: 'pointer' }}
              onClick={() => navigate(`/designers/${d.id}`)}
            >
              <div
                className="ui-designer-card__avatar"
                style={{
                  backgroundImage: `url('${d.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.fullName)}&background=C5A059&color=fff`}')`,
                }}
              />
              <span className="ui-designer-card__name">{d.fullName}</span>
              <span style={{
                fontSize: '0.65rem', letterSpacing: '1px', color: '#C5A059',
                fontFamily: 'Montserrat,sans-serif', textTransform: 'uppercase',
              }}>
                {d.designsCount} Designs
              </span>
              <br />
              <span className="ui-designer-card__cta">View Collection</span>
            </div>
          )}
        />
      </Section>

      {/* â”â”â” 9 Â· NEWSLETTER â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â” */}
      <section className="ui-newsletter" id="newsletter-signup">
        <div className="ui-newsletter__inner" data-animate="editorial">
          <div className="ui-newsletter__text">
            <h2>Stay In The Loop</h2>
            <p>Be the first to know about new drops, exclusive releases, and designer spotlights.</p>
          </div>
          <form className="ui-newsletter__form" onSubmit={handleSubscribe}>
            <div className="ui-newsletter__input-wrap">
              <i className="far fa-envelope" />
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="cta-gold">
              {subscribed ? 'âœ“ SUBSCRIBED' : 'SUBSCRIBE'}
            </button>
          </form>
          {subscribed && <p className="ui-newsletter__success">Welcome to the ASAT family!</p>}
        </div>
        
      </section>

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
          >×</button>
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
