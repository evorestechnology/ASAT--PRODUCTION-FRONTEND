import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BackButton from '../../components/BackButton';


const styles = `
    body { display: flex; flex-direction: column; min-height: 100vh; margin: 0; }
    header { padding: 20px 5%; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; background: white; }
    main { flex: 1; padding: 40px 5%; }
    .dsn-card { background: #f4f4f4; border: 1px solid #eee; padding: 40px; text-align: center; margin-bottom: 40px; }
    .dsn-card h1 { font-family: 'Cinzel', serif; font-size: 3rem; color: var(--dark); margin: 10px 0; }
    .dsn-card span { color: var(--gold); font-weight: bold; letter-spacing: 2px; }
    table { width: 100%; border-collapse: collapse; background: white; }
    th { background: var(--gold); color: white; padding: 15px; text-align: left; font-family: 'Cinzel'; }
    td { padding: 15px; border-bottom: 1px solid #eee; }
`;

function MasterDesignerRevenue() {
    const navigate = useNavigate();
    return (
        <>
            <style>{styles}</style>
            
            <main>
                <BackButton />
                <div className="dsn-card">
                    <span>TOTAL DESIGNER ROYALTIES (15%)</span>
                    <h1>₹31,300.00</h1>
                </div>
                <h3 style={{ fontFamily: "'Cinzel', serif", marginBottom: '20px' }}>TOP EARNING DESIGNERS</h3>
                <table>
                    <thead><tr><th>Designer ID</th><th>Username</th><th>Total Designs</th><th>Royalties Paid</th></tr></thead>
                    <tbody>
                        <tr><td>#DSN-01</td><td>@Vaibhav</td><td>45</td><td>₹12,450.00</td></tr>
                        <tr><td>#DSN-04</td><td>@EliteCreator</td><td>22</td><td>₹5,200.00</td></tr>
                    </tbody>
                </table>
            </main>
            
        </>
    );
}

export default MasterDesignerRevenue;
