import React, { useState, useEffect } from 'react';

function PopupModal() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const hasSeenPopup = sessionStorage.getItem('asat_popup_seen');
        if (!hasSeenPopup) {
            setVisible(true);
        }
    }, []);

    const closeModal = () => {
        sessionStorage.setItem('asat_popup_seen', 'true');
        setVisible(false);
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            closeModal();
        }
    };

    if (!visible) return null;

    return (
        <div className="popup-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-labelledby="popup-title">
            <style>{`
                .popup-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.75);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 99999;
                    padding: 20px;
                    animation: popupOverlayFadeIn 0.25s ease-out both;
                }
                @keyframes popupOverlayFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .popup-modal {
                    position: relative;
                    background: #FFFFFF;
                    color: #000000;
                    max-width: 480px;
                    width: 100%;
                    padding: 48px 40px 38px;
                    border-radius: 24px;
                    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.25);
                    text-align: center;
                    border: 1px solid #ECECEC;
                    animation: popupScaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
                    box-sizing: border-box;
                }
                @keyframes popupScaleUp {
                    from { transform: scale(0.92); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .popup-logo-wrap {
                    margin-bottom: 24px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .popup-logo-img {
                    max-height: 38px;
                    width: auto;
                    object-fit: contain;
                }
                .popup-close-btn {
                    position: absolute;
                    top: 18px;
                    right: 18px;
                    width: 32px;
                    height: 32px;
                    border-radius: 4px;
                    background: #FFFFFF;
                    border: 2px solid #000000;
                    font-size: 0.85rem;
                    font-weight: bold;
                    color: #000000;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }
                .popup-close-btn:hover {
                    background: #000000;
                    color: #FFFFFF;
                    transform: rotate(90deg);
                }
                .popup-title {
                    font-family: -apple-system, BlinkMacSystemFont, 'Montserrat', sans-serif;
                    font-size: 1.5rem;
                    font-weight: 900;
                    letter-spacing: -0.5px;
                    text-transform: uppercase;
                    margin: 0 0 16px;
                    color: #000000;
                    line-height: 1.2;
                }
                .popup-greeting {
                    font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
                    font-size: 0.95rem;
                    font-weight: 700;
                    color: #000000;
                    margin: 0 0 10px;
                }
                .popup-body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
                    font-size: 0.88rem;
                    font-weight: 400;
                    line-height: 1.65;
                    color: #666666;
                    margin: 0 0 16px;
                }
                .popup-highlight {
                    font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
                    font-size: 0.88rem;
                    font-weight: 700;
                    color: #000000;
                    margin: 0 0 28px;
                }
                .popup-cta-btn {
                    display: block;
                    width: 100%;
                    background: #000000;
                    color: #FFFFFF;
                    border: none;
                    border-radius: 30px;
                    padding: 16px 28px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
                    font-size: 0.78rem;
                    font-weight: 800;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: opacity 0.2s ease, transform 0.2s ease;
                }
                .popup-cta-btn:hover {
                    opacity: 0.85;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
                }
                .popup-cta-btn:active {
                    transform: scale(0.98);
                }
            `}</style>
            <div className="popup-modal">
                <button className="popup-close-btn" onClick={closeModal} aria-label="Close popup">&#x2715;</button>
                <div className="popup-logo-wrap">
                    <img src="/dp-logo.png" alt="ASAT Designer Paradise" className="popup-logo-img" />
                </div>
                <h2 className="popup-title" id="popup-title">
                    Welcome to<br />Designer Paradise
                </h2>
                <div className="popup-greeting">
                    Hey Drippy,
                </div>
                <p className="popup-body">
                    For the best experience, switch to a larger screen and explore the full collection.
                    This premium designer edition platform is built for a real-time big screen shopping experience.
                </p>
                <div className="popup-highlight">
                    We believe you deserve nothing but the best 😇
                </div>
                <button className="popup-cta-btn" onClick={closeModal}>
                    START EXPLORING
                </button>
            </div>
        </div>
    );
}

export default PopupModal;
