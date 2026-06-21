import React from 'react';
import BackButton from '../../components/BackButton';


function MfgDesigners() {
    return (
        <div style={{ padding: '40px 5%' }}>
            <BackButton />
                <h2 style={{ fontFamily: "'Cinzel', serif", marginBottom: '30px' }}>ASSIGNED DESIGNERS</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                <div style={{ background: 'var(--gray)', color: 'white', padding: '30px', textAlign: 'center' }}>
                    <h4 style={{ fontFamily: "'Cinzel'" }}>@ClassicVogue</h4>
                    <p style={{ fontSize: '0.8rem' }}>Current Projects: 3</p>
                </div>
                {/* Add more designer cards here */}
            </div>
        </div>
    );
}

export default MfgDesigners;
