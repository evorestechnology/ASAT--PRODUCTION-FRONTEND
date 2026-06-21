import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BackButton from '../../components/BackButton';


const styles = `
    .tracking-table { width: 90%; margin: 40px auto; border-collapse: collapse; background: white; }
    .tracking-table th, .tracking-table td { padding: 15px; border: 1px solid #eee; text-align: left; }
    .tracking-table th { background: var(--dark); color: white; font-family: 'Cinzel'; }
    .status-badge { padding: 5px 10px; font-size: 0.7rem; font-weight: bold; }
`;

function MasterTracking() {
    const navigate = useNavigate();
    return (
        <>
            <style>{styles}</style>
            
            <main>
                <BackButton />
                <h2 style={{ textAlign: 'center', fontFamily: "'Cinzel'", marginTop: '30px' }}>GLOBAL ORDER TRACKING</h2>
                <table className="tracking-table">
                    <thead>
                        <tr><th>Tracking ID</th><th>Order ID</th><th>Customer</th><th>Route</th><th>Status</th><th>Last Update</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>TRK9921</td><td>#AS-101</td><td>John Doe</td><td>Mfg -&gt; User</td><td><span className="status-badge" style={{ background: '#C5A059', color: 'white' }}>IN TRANSIT</span></td><td>2026-04-24</td></tr>
                        <tr><td>TRK9922</td><td>#AS-102</td><td>Sara Lee</td><td>Designer -&gt; Mfg</td><td><span className="status-badge" style={{ background: '#121212', color: 'white' }}>PROCESSING</span></td><td>2026-04-23</td></tr>
                    </tbody>
                </table>
            </main>
            
        </>
    );
}

export default MasterTracking;
