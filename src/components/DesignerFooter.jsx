import React from 'react';
import { Link } from 'react-router-dom';

function DesignerFooter() {
    const [openCol, setOpenCol] = React.useState(null);
    const toggleCol = (colIndex) => {
        setOpenCol(openCol === colIndex ? null : colIndex);
    };
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
                    grid-template-columns: auto auto auto 1fr;
                    gap: clamp(24px, 4vw, 56px);
                    align-items: flex-start;
                }

                .blu-footer-card__col-title {
                    font-size: 13px;
                    font-weight: 700;
                    color: #000000;
                    margin-bottom: 18px;
                    display: block;
                    white-space: nowrap;
                }
                .blu-footer-card__col-chevron {
                    display: none;
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
                    .blu-footer-card {
                        padding: 24px 16px 16px;
                        border-radius: 16px;
                        margin: 16px 12px;
                    }
                    .blu-footer-card__grid {
                        grid-template-columns: 1fr;
                        gap: 12px;
                    }
                    .blu-footer-card__col-title {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        cursor: pointer;
                        padding: 10px 4px;
                        margin-bottom: 0;
                        border-bottom: 1px solid #F0F0F0;
                        font-size: 12.5px;
                        user-select: none;
                    }
                    .blu-footer-card__col-chevron {
                        display: block;
                        font-size: 0.7rem;
                        color: #888888;
                        transition: transform 0.2s ease;
                    }
                    .blu-footer-card__col.open .blu-footer-card__col-chevron {
                        transform: rotate(180deg);
                    }
                    .blu-footer-card__list {
                        max-height: 0;
                        overflow: hidden;
                        transition: max-height 0.25s ease-out;
                        gap: 8px;
                    }
                    .blu-footer-card__col.open .blu-footer-card__list {
                        max-height: 250px;
                        padding: 12px 6px 4px;
                    }
                    .blu-footer-card__brand-showcase {
                        flex-direction: row;
                        align-items: center;
                        justify-content: space-between;
                        gap: 12px;
                        margin-top: 12px;
                        padding-top: 16px;
                        border-top: 1px solid #F0F0F0;
                    }
                    .blu-footer-card__script-logo {
                        font-size: 2rem;
                    }
                    .blu-footer-card__bag-wrap {
                        display: none !important;
                    }
                    .blu-footer-card__bottom {
                        margin-top: 16px;
                        padding-top: 12px;
                        justify-content: center;
                    }
                }
                @media (max-width: 380px) {
                    .blu-footer-card {
                        padding: 18px 10px 14px;
                        margin: 12px 6px;
                    }
                    .blu-footer-card__copy {
                        text-align: center;
                        justify-content: center;
                        font-size: 8.5px;
                    }
                }
            `}</style>

            <div className="blu-footer-card">
                <div className="blu-footer-card__grid">
                    {/* Column 1: Connect with us */}
                    <div className={`blu-footer-card__col${openCol === 0 ? ' open' : ''}`}>
                        <span className="blu-footer-card__col-title" onClick={() => toggleCol(0)}>
                            Connect with us
                            <i className="fas fa-chevron-down blu-footer-card__col-chevron"></i>
                        </span>
                        <ul className="blu-footer-card__list">
                            <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="blu-footer-card__link">Instagram</a></li>
                            <li><a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="blu-footer-card__link">YouTube</a></li>
                            <li><a href="/designer/login" className="blu-footer-card__link">Design Sign In</a></li>
                            <li><a href="/designer/register" className="blu-footer-card__link">Join as a Designer</a></li>
                        </ul>
                    </div>

                    {/* Column 2: Support */}
                    <div className={`blu-footer-card__col${openCol === 1 ? ' open' : ''}`}>
                        <span className="blu-footer-card__col-title" onClick={() => toggleCol(1)}>
                            Support
                            <i className="fas fa-chevron-down blu-footer-card__col-chevron"></i>
                        </span>
                        <ul className="blu-footer-card__list">
                            <li><Link to="/support" className="blu-footer-card__link">FAQ's</Link></li>
                            <li><Link to="/terms" className="blu-footer-card__link">Terms and Conditions Policies</Link></li>
                        </ul>
                    </div>

                    {/* Column 3: We at Designer Paradise
                    <div className={`blu-footer-card__col${openCol === 2 ? ' open' : ''}`}>
                        <span className="blu-footer-card__col-title" onClick={() => toggleCol(2)}>
                            We at Designer Paradise
                            <i className="fas fa-chevron-down blu-footer-card__col-chevron"></i>
                        </span>
                        <ul className="blu-footer-card__list">
                            <li><Link to="/rankings" className="blu-footer-card__link">Our story</Link></li>
                            <li><a href="/designer/register" className="blu-footer-card__link">Collaborations</a></li>
                        </ul>
                    </div> */}

                    {/* Column 4: Side-by-Side Logos */}
                    <div className="blu-footer-card__brand-showcase">
                        {/* <Link to="/" style={{ display: 'inline-flex', alignItems: 'center' }} title="Designer Paradise">
                            <img 
                                src="/logo.png" 
                                alt="ASAT DESIGNER PARADISE" 
                                className="blu-footer-card__dp-logo"
                                style={{ height: '36px', width: 'auto', objectFit: 'contain' }} 
                            />
                        </Link> */}
                        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center' }} title="ASAT">
                            <img 
                                src="/dp-logo.png" 
                                alt="ASAT Logo" 
                                className="blu-footer-card__ast-logo"
                                style={{ height: '48px', width: 'auto', objectFit: 'contain', mixBlendMode: 'multiply' }} 
                            />
                        </Link>
                    </div>
                </div>

                {/* Bottom Copyright */}
                <div className="blu-footer-card__bottom">
                    <p className="blu-footer-card__copy" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        © 2026 Designer paradise by ASAT. ALL RIGHTS Reserved with EvoRES Technology 
                        <a 
                            href="https://evorestechnology.com" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ color: '#0052FF', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                            title="EvoRES Technology"
                        >
                            <i className="fa-solid fa-globe" style={{ fontSize: '12px' }}></i>
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
}

export default DesignerFooter;
