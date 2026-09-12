import React from 'react';
import BackButton from '../../components/BackButton';

function DesignerAbout() {
    return (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: 'clamp(20px, 5vw, 40px)', width: 'min(800px, calc(100% - 32px))', textAlign: 'center', background: 'white', border: '1px solid #eee', borderRadius: '12px' }}>
            <BackButton />
            <h1 style={{ fontFamily: "'Cinzel', serif" }}>OUR VISION</h1>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '1.1rem', color: '#555', lineHeight: 1.6 }}>
                "As Simple As That" was founded on the principle of redefining elegance through simplicity.
                We provide a world-class platform where designers can showcase their creativity while we handle the
                complexities of manufacturing and distribution. This is **A Designer Paradise**.
            </p>
        </div>
    );
}

export default DesignerAbout;
