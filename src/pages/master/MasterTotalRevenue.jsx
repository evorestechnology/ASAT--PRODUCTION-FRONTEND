import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BackButton from '../../components/BackButton';


const styles = `
    body { display: flex; flex-direction: column; min-height: 100vh; margin: 0; }
    header { padding: 20px 5%; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; background: white; }
    .logo { font-family: 'Cinzel', serif; font-weight: bold; font-size: 1.5rem; letter-spacing: 2px; cursor: pointer; }
    main { flex: 1; padding: 40px 5%; }
    .rev-card { background: var(--dark); color: white; padding: 40px; text-align: center; border-bottom: 5px solid var(--gold); margin-bottom: 40px; }
    .rev-card h1 { font-family: 'Cinzel', serif; font-size: 3.5rem; color: var(--gold); margin: 15px 0; }
    .rev-table { width: 100%; border-collapse: collapse; background: white; }
    .rev-table th { background: #f8f8f8; padding: 15px; text-align: left; font-family: 'Cinzel', serif; border-bottom: 2px solid var(--dark); }
    .rev-table td { padding: 15px; border-bottom: 1px solid #eee; font-family: 'Montserrat', sans-serif; }
`;

function MasterTotalRevenue() {
    const navigate = useNavigate();
    return (
        <>
            <style>{styles}</style>
            
            <main>
                <BackButton />
                <div className="rev-card">
                    <span>GROSS PLATFORM REVENUE</span>
                    <h1>$158,000.00</h1>
                    <p style={{ fontSize: '0.8rem', letterSpacing: '2px' }}>AGGREGATED TILL DATE</p>
                </div>
                <h3 style={{ fontFamily: "'Cinzel', serif", marginBottom: '20px' }}>REVENUE BY CATEGORY</h3>
                <table className="rev-table">
                    <thead><tr><th>Category</th><th>Volume</th><th>Gross Contribution</th><th>Status</th></tr></thead>
                    <tbody>
                        <tr><td>Premium Apparel</td><td>840 Units</td><td>$105,000.00</td><td style={{ color: 'green' }}>High Growth</td></tr>
                        <tr><td>Accessories</td><td>444 Units</td><td>$53,000.00</td><td style={{ color: 'var(--gold)' }}>Stable</td></tr>
                    </tbody>
                </table>
            </main>
            
        </>
    );
}

export default MasterTotalRevenue;
