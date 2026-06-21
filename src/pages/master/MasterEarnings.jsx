import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BackButton from '../../components/BackButton';


const styles = `
    body { display: flex; flex-direction: column; min-height: 100vh; margin: 0; }
    header { padding: 20px 5%; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; background: white; position: sticky; top: 0; z-index: 1000; }
    .logo { font-family: 'Cinzel', serif; font-weight: bold; font-size: 1.5rem; letter-spacing: 2px; cursor: pointer; }
    main { flex: 1; padding: 40px 5%; }
    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
    .summary-card { background: var(--dark); color: white; padding: 30px; text-align: center; border-bottom: 4px solid var(--gold); }
    .summary-card small { font-size: 0.7rem; color: #aaa; letter-spacing: 2px; text-transform: uppercase; }
    .summary-card h2 { font-family: 'Cinzel', serif; color: var(--gold); margin: 10px 0 0; font-size: 2rem; }
    .earnings-table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #eee; font-family: 'Montserrat', sans-serif; }
    .earnings-table th { background: var(--dark); color: white; font-family: 'Cinzel', serif; padding: 15px; text-align: left; }
    .earnings-table td { padding: 15px; border-bottom: 1px solid #eee; }
    .trend-up { color: #2e7d32; font-weight: bold; }
    footer { background: var(--dark); color: white; padding: 20px 5%; width: 100%; box-sizing: border-box; }
    .copyright { text-align: center; font-size: 0.75rem; }
`;

function MasterEarnings() {
    const navigate = useNavigate();
    return (
        <>
            <style>{styles}</style>
            
            <main>
                <BackButton />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h2 style={{ fontFamily: "'Cinzel', serif", margin: 0 }}>NET EARNINGS REPORT</h2>
                    <select style={{ padding: '8px', border: '1px solid var(--gold)', outline: 'none', fontFamily: "'Montserrat'" }}>
                        <option>Last 24 Hours</option><option>Last Week</option><option>Last Month</option><option defaultValue>Till Date</option>
                    </select>
                </div>
                <div className="summary-grid">
                    <div className="summary-card"><small>Gross Earnings</small><h2>₹158,000</h2></div>
                    <div className="summary-card"><small>Operational Costs</small><h2>₹115,500</h2></div>
                    <div className="summary-card"><small>Platform Profit</small><h2>₹42,500</h2></div>
                </div>
                <table className="earnings-table">
                    <thead><tr><th>FINANCIAL METRIC</th><th>VALUE</th><th>COMMISSION RATE</th><th>MONTHLY TREND</th></tr></thead>
                    <tbody>
                        <tr><td>Manufacturer Settlements</td><td>₹84,200.00</td><td>Variable</td><td className="trend-up">+8.4%</td></tr>
                        <tr><td>Designer Royalties</td><td>₹31,300.00</td><td>15.0%</td><td className="trend-up">+12.1%</td></tr>
                        <tr><td>Master Platform Profit</td><td>₹42,500.00</td><td>Net Residual</td><td className="trend-up">+5.2%</td></tr>
                    </tbody>
                </table>
            </main>
            
        </>
    );
}

export default MasterEarnings;
