import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BackButton from '../../components/BackButton';


const styles = `
    body { display: flex; flex-direction: column; min-height: 100vh; margin: 0; }
    header { padding: 20px 5%; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; background: white; }
    main { flex: 1; padding: 40px 5%; }
    .mfg-summary { background: var(--gray); color: white; padding: 40px; text-align: center; border-bottom: 5px solid #fff; margin-bottom: 40px; }
    .mfg-summary h1 { font-family: 'Cinzel', serif; font-size: 3rem; color: var(--gold); margin: 10px 0; }
    table { width: 100%; border-collapse: collapse; background: white; }
    th { background: var(--dark); color: white; padding: 15px; text-align: left; font-family: 'Cinzel'; }
    td { padding: 15px; border-bottom: 1px solid #eee; }
`;

function MasterMfgRevenue() {
    const navigate = useNavigate();
    return (
        <>
            <style>{styles}</style>
            
            <main>
                <BackButton />
                <div className="mfg-summary">
                    <span>TOTAL MANUFACTURE PAYOUTS</span>
                    <h1>$84,200.00</h1>
                </div>
                <h3 style={{ fontFamily: "'Cinzel', serif", marginBottom: '20px' }}>FACTORY SETTLEMENT LOGS</h3>
                <table>
                    <thead><tr><th>Unit ID</th><th>Location</th><th>Batch Total</th><th>Settlement Date</th></tr></thead>
                    <tbody>
                        <tr><td>#MFG-UNIT-07</td><td>Royal Industrial Hub</td><td>$12,400.00</td><td>2026-04-20</td></tr>
                        <tr><td>#MFG-UNIT-03</td><td>Elite Textiles Park</td><td>$8,200.00</td><td>2026-04-18</td></tr>
                    </tbody>
                </table>
            </main>
            
        </>
    );
}

export default MasterMfgRevenue;
