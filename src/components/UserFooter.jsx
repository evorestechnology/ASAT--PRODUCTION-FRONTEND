import React from 'react';
import { Link } from 'react-router-dom';

function UserFooter() {
    return (
        <footer style={{ width: '100%', background: 'transparent', padding: '0 0 20px' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,500;1,700&display=swap');

                .blu-footer-card {
                    background: #FFFFFF;
                    border-radius: 28px;
                    border: 1px solid #ECECEC;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
                    padding: 48px 56px 24px;
                    margin: 20px clamp(16px, 3.5vw, 36px) 16px;
                    box-sizing: border-box;
                    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Montserrat', sans-serif;
                }

                .blu-footer-card__grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr 1.8fr;
                    gap: 36px;
                    align-items: center;
                }

                .blu-footer-card__col-title {
                    font-size: 13px;
                    font-weight: 700;
                    color: #000000;
                    margin-bottom: 18px;
                    display: block;
                }

                .blu-footer-card__list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .blu-footer-card__link {
                    font-size: 12px;
                    color: #555555;
                    text-decoration: none;
                    transition: color 0.2s ease;
                    display: inline-block;
                }

                .blu-footer-card__link:hover {
                    color: #000000;
                }

                .blu-footer-card__brand-showcase {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 32px;
                }

                .blu-footer-card__script-logo {
                    font-family: 'Playfair Display', 'Cormorant Garamond', Georgia, serif;
                    font-style: italic;
                    font-weight: 600;
                    font-size: 2.6rem;
                    color: #222222;
                    letter-spacing: -0.5px;
                    white-space: nowrap;
                    text-decoration: none;
                }

                .blu-footer-card__bag-wrap {
                    width: 110px;
                    height: 140px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }

                .blu-footer-card__bag-svg {
                    width: 100%;
                    height: 100%;
                    filter: drop-shadow(0 12px 20px rgba(0, 0, 0, 0.08));
                }

                .blu-footer-card__bottom {
                    margin-top: 36px;
                    padding-top: 18px;
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                    border-top: 1px solid #F4F4F4;
                }

                .blu-footer-card__copy {
                    font-size: 9.5px;
                    font-weight: 600;
                    letter-spacing: 0.6px;
                    color: #777777;
                    text-transform: uppercase;
                    margin: 0;
                }

                @media (max-width: 960px) {
                    .blu-footer-card {
                        padding: 36px 28px 20px;
                        border-radius: 20px;
                    }
                    .blu-footer-card__grid {
                        grid-template-columns: 1fr 1fr;
                        gap: 32px;
                    }
                    .blu-footer-card__brand-showcase {
                        grid-column: 1 / -1;
                        justify-content: space-between;
                        margin-top: 12px;
                        padding-top: 20px;
                        border-top: 1px solid #F0F0F0;
                    }
                }

                @media (max-width: 560px) {
                    .blu-footer-card__grid {
                        grid-template-columns: 1fr;
                        gap: 24px;
                    }
                    .blu-footer-card__brand-showcase {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 16px;
                    }
                    .blu-footer-card__bottom {
                        justify-content: flex-start;
                    }
                }
            `}</style>

            <div className="blu-footer-card">
                <div className="blu-footer-card__grid">
                    {/* Column 1: Connect with us */}
                    <div>
                        <span className="blu-footer-card__col-title">Connect with us</span>
                        <ul className="blu-footer-card__list">
                            <li><a href="tel:+919177180258" className="blu-footer-card__link">Call</a></li>
                            <li><a href="https://wa.me/919177180258" target="_blank" rel="noopener noreferrer" className="blu-footer-card__link">Text (WhatsApp)</a></li>
                            <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="blu-footer-card__link">Instagram</a></li>
                            <li><a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="blu-footer-card__link">YouTube</a></li>
                            <li><a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="blu-footer-card__link">LinkedIn</a></li>
                        </ul>
                    </div>

                    {/* Column 2: Order Support */}
                    <div>
                        <span className="blu-footer-card__col-title">Order Support</span>
                        <ul className="blu-footer-card__list">
                            <li><Link to="/support" className="blu-footer-card__link">Make a return/Exchange</Link></li>
                            <li><Link to="/terms" className="blu-footer-card__link">Refund/Exchange policy</Link></li>
                            <li><Link to="/tracking" className="blu-footer-card__link">Track your order</Link></li>
                            <li><Link to="/terms" className="blu-footer-card__link">Shipping policy</Link></li>
                            <li><Link to="/support" className="blu-footer-card__link">FAQ's</Link></li>
                            <li><Link to="/terms" className="blu-footer-card__link">Terms</Link></li>
                        </ul>
                    </div>

                    {/* Column 3: We are ASAT */}
                    <div>
                        <span className="blu-footer-card__col-title">We are ASAT</span>
                        <ul className="blu-footer-card__list">
                            <li><Link to="/rankings" className="blu-footer-card__link">Our story</Link></li>
                            <li><Link to="/products" className="blu-footer-card__link">Walk-in Stores</Link></li>
                            <li><a href="/designer/register" className="blu-footer-card__link">Collaborations</a></li>
                            <li><Link to="/support" className="blu-footer-card__link">Careers</Link></li>
                            <li><Link to="/support" className="blu-footer-card__link">Media</Link></li>
                            <li><Link to="/products" className="blu-footer-card__link">Blogs</Link></li>
                        </ul>
                    </div>

                    {/* Column 4: Script Logo & 3D Shopping Bag */}
                    <div className="blu-footer-card__brand-showcase">
                        <Link to="/" className="blu-footer-card__script-logo" aria-label="ASAT Home">
                            Asat
                        </Link>

                        <div className="blu-footer-card__bag-wrap" title="ASAT Luxury Shopping Bag">
                            {/* Realistic 3D SVG Luxury Shopping Bag */}
                            <svg className="blu-footer-card__bag-svg" viewBox="0 0 160 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <linearGradient id="bagFrontGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#FFFFFF" />
                                        <stop offset="100%" stopColor="#EDEDED" />
                                    </linearGradient>
                                    <linearGradient id="bagSideGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#E4E4E4" />
                                        <stop offset="100%" stopColor="#D5D5D5" />
                                    </linearGradient>
                                    <linearGradient id="bagFoldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#DDDDDD" />
                                        <stop offset="100%" stopColor="#F9F9F9" />
                                    </linearGradient>
                                </defs>

                                {/* Side Perspective Panel */}
                                <polygon points="35,45 65,30 65,170 35,185" fill="url(#bagSideGrad)" />
                                <polygon points="50,38 50,178 65,170 65,30" fill="url(#bagFoldGrad)" opacity="0.4" />

                                {/* Front Panel */}
                                <polygon points="65,30 145,45 130,190 65,170" fill="url(#bagFrontGrad)" stroke="#E0E0E0" strokeWidth="0.5" />

                                {/* Top Inset Handle Hole */}
                                <ellipse cx="103" cy="58" rx="14" ry="5" fill="#E8E8E8" stroke="#D0D0D0" strokeWidth="0.5" />
                                <ellipse cx="103" cy="59" rx="12" ry="4" fill="#FFFFFF" />

                                {/* ASAT Brandmark printed on bag */}
                                <g transform="translate(100, 115) rotate(7)">
                                    <text
                                        x="0"
                                        y="0"
                                        textAnchor="middle"
                                        fill="#111111"
                                        fontFamily="-apple-system, Montserrat, sans-serif"
                                        fontWeight="900"
                                        fontSize="11"
                                        letterSpacing="2"
                                    >
                                        ASAT
                                    </text>
                                </g>
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Bottom Copyright */}
                <div className="blu-footer-card__bottom">
                    <p className="blu-footer-card__copy">
                        © 2026 ASAT RETAIL PRIVATE LIMITED, ALL RIGHTS RESERVED
                    </p>
                </div>
            </div>
        </footer>
    );
}

export default UserFooter;
