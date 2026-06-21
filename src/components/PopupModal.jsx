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
            <div className="popup-modal">
                <button className="popup-close-btn" onClick={closeModal} aria-label="Close popup">&#x2715;</button>
                <div className="popup-accent-line" />
                <h2 className="popup-title" id="popup-title">Welcome to Designers Paradise 🌟</h2>
                <p className="popup-body">
                    Hey Drippy 👀,
                </p>
                <p className="popup-body">
                    For the best experience, switch to a larger screen and explore the full collection.
                    This fashion-tech platform is built for a real-time big screen experience.
                </p>
                <p className="popup-body popup-body--highlight">
                    We believe you deserve nothing but the best ✨
                </p>
                <button className="popup-cta-btn" onClick={closeModal}>
                    START EXPLORING
                </button>
            </div>
        </div>
    );
}

export default PopupModal;
