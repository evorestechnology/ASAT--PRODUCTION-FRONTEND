import React from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../components/BackButton';


function MfgEarnings() {
    const navigate = useNavigate();
    return (
        <>
            
            <div style={{ padding: '40px 5%' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
                    <div style={{ background: 'var(--dark)', color: 'white', padding: '30px' }}>
                        <span>Total Revenue (Gross)</span>
                        <BackButton />
                <h1 style={{ color: 'var(--gold)', fontFamily: "'Cinzel'" }}>$420,500.00</h1>
                    </div>
                    <div style={{ background: 'var(--gray)', color: 'white', padding: '30px' }}>
                        <span>Net Margin (Estimated)</span>
                        <h1 style={{ color: 'var(--gold)', fontFamily: "'Cinzel'" }}>$63,075.00</h1>
                    </div>
                </div>
            </div>
        </>
    );
}

export default MfgEarnings;
