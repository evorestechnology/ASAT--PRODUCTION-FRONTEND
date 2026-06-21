import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const heroImages = [
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=1600&q=80',
];

function HeroSection() {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);

    const goToSlide = useCallback((index) => {
        setCurrentSlide(index);
    }, []);

    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, []);

    const prevSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);
    }, []);

    // Auto-play
    useEffect(() => {
        const timer = setInterval(nextSlide, 5000);
        return () => clearInterval(timer);
    }, [nextSlide]);

    const handleCardClick = (category) => {
        navigate(`/products?category=${encodeURIComponent(category)}`);
    };

    return (
        <>
            {/* Hero Slideshow Banner */}
            <section className="hero-banner">
                {heroImages.map((image, index) => (
                    <div
                        key={index}
                        className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
                        style={{
                            backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${image}')`,
                        }}
                    />
                ))}

                <div className="hero-content">
                    <h1>As Simple as That</h1>
                    <p className="hero-subtitle">"**A Designer Paradise**"</p>
                    <button className="cta-gold" onClick={() => navigate('/products')}>
                        EXPLORE COLLECTION
                    </button>
                </div>

                {/* Arrows */}
                <button className="hero-arrow hero-arrow-left" onClick={prevSlide} aria-label="Previous slide">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                <button className="hero-arrow hero-arrow-right" onClick={nextSlide} aria-label="Next slide">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>

                {/* Dots */}
                <div className="hero-dots">
                    {heroImages.map((_, index) => (
                        <button
                            key={index}
                            className={`hero-dot ${index === currentSlide ? 'active' : ''}`}
                            onClick={() => goToSlide(index)}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </section>

            {/* Selection Scroll Section */}
            <section className="selection-scroll-section">
                <h3>DISCOVER MORE</h3>
                <div className="scroll-container equal-grid">
                    <div className="grid-item" onClick={() => handleCardClick('trending')} style={{ backgroundImage: "url('/images/cards/trending_now.jpeg')", backgroundSize: 'cover', backgroundPosition: 'center top' }}>
                        <span>TRENDING NOW</span>
                    </div>
                    <div className="grid-item" onClick={() => handleCardClick('designers')} style={{ backgroundImage: "url('/images/cards/select_designers.jpeg')", backgroundSize: 'cover', backgroundPosition: 'center top' }}>
                        <span>SELECT BY DESIGNERS</span>
                    </div>
                    <div className="grid-item" onClick={() => handleCardClick('categories')} style={{ backgroundImage: "url('/images/cards/selected_categories.jpeg')", backgroundSize: 'cover', backgroundPosition: 'center top' }}>
                        <span>SELECT BY CATEGORIES</span>
                    </div>
                    <div className="grid-item" onClick={() => handleCardClick('new-arrivals')} style={{ backgroundImage: "url('/images/cards/new_arrivals.jpeg')", backgroundSize: 'cover', backgroundPosition: 'center top' }}>
                        <span>NEW ARRIVALS</span>
                    </div>
                </div>
            </section>

            {/* Horizontal Scroll Section */}
            <section className="horizontal-scroll-section">
                <h3>CURATED ESSENTIALS</h3>
                <div className="scroll-container equal-grid">
                    <div className="product-card" onClick={() => handleCardClick('t-shirts')} style={{ backgroundImage: "url('/images/cards/tshirts.jpeg')", backgroundSize: 'cover', backgroundPosition: 'center top' }}>
                        T-SHIRTS
                    </div>
                    <div className="product-card" onClick={() => handleCardClick('hoodies')} style={{ backgroundImage: "url('/images/cards/hoodies.jpeg')", backgroundSize: 'cover', backgroundPosition: 'center top' }}>
                        HOODIES
                    </div>
                    <div className="product-card" onClick={() => handleCardClick('pants')} style={{ backgroundImage: "url('/images/cards/pants.jpeg')", backgroundSize: 'cover', backgroundPosition: 'center top' }}>
                        PANTS
                    </div>
                    <div className="product-card" onClick={() => handleCardClick('kids')} style={{ backgroundImage: "url('/images/cards/kids.jpeg')", backgroundSize: 'cover', backgroundPosition: 'center top' }}>
                        KIDS
                    </div>
                </div>
            </section>
        </>
    );
}

export default HeroSection;
