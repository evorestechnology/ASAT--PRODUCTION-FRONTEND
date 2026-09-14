import React from 'react';
import { Link } from 'react-router-dom';

export default function DesignerReports() {
    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <h1 style={{ color: '#C5A059', marginBottom: '5px' }}>My Reports</h1>
            <p style={{ color: '#666', marginBottom: '30px' }}>Understand your creative performance</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <Link to="/designer/reports/earnings" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ padding: '20px', border: '1px solid #E5E5E5', borderRadius: '8px', backgroundColor: '#FAFAF8', cursor: 'pointer' }}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#1a1a1a' }}><i className="fas fa-coins" style={{ color: '#C5A059', marginRight: '10px' }}></i>Earnings History</h3>
                        <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Monthly earnings, payout history & pending balance</p>
                    </div>
                </Link>
                
                <Link to="/designer/reports/designs" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ padding: '20px', border: '1px solid #E5E5E5', borderRadius: '8px', backgroundColor: '#FAFAF8', cursor: 'pointer' }}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#1a1a1a' }}><i className="fas fa-palette" style={{ color: '#C5A059', marginRight: '10px' }}></i>Design Performance</h3>
                        <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Orders per design, rankings & popularity trends</p>
                    </div>
                </Link>

                <Link to="/designer/reports/customers" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ padding: '20px', border: '1px solid #E5E5E5', borderRadius: '8px', backgroundColor: '#FAFAF8', cursor: 'pointer' }}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#1a1a1a' }}><i className="fas fa-users" style={{ color: '#C5A059', marginRight: '10px' }}></i>Customer Insights</h3>
                        <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Countries buying your designs, buyer behaviour</p>
                    </div>
                </Link>
            </div>
        </div>
    );
}
