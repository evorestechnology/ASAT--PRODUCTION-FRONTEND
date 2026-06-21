import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BackButton from '../../components/BackButton';


function MasterRevenue() {
    const navigate = useNavigate();
    return (
        <>
            
            <main style={{ padding: '40px 5%' }}>
                <BackButton />
                <h2 style={{ fontFamily: "'Cinzel'", textAlign: 'center', marginBottom: '30px' }}>REVENUE ANALYSIS</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
                    <div style={{ background: 'var(--dark)', color: 'white', padding: '30px', textAlign: 'center', borderBottom: '3px solid var(--gold)' }}>
                        <small>TOTAL REVENUE</small><h1>₹158,000</h1>
                    </div>
                    <div style={{ background: 'var(--gray)', color: 'white', padding: '30px', textAlign: 'center' }}>
                        <small>MANUFACTURE SHARE</small><h1>₹84,200</h1>
                    </div>
                    <div style={{ background: 'var(--gray)', color: 'white', padding: '30px', textAlign: 'center' }}>
                        <small>DESIGNER SHARE</small><h1>₹31,300</h1>
                    </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                    <tr style={{ background: 'var(--dark)', color: 'white', fontFamily: "'Cinzel'" }}><th style={{ padding: '15px' }}>Category</th><th>Daily Avg</th><th>Growth</th></tr>
                    <tr style={{ textAlign: 'center', borderBottom: '1px solid #eee' }}><td style={{ padding: '15px' }}>Apparel</td><td>₹2,400</td><td>+5.4%</td></tr>
                </table>
            </main>
            
        </>
    );
}

export default MasterRevenue;
