import React from 'react';
import { Link } from 'react-router-dom';

export default function MfgReports() {
    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <h1 style={{ color: '#C5A059', marginBottom: '5px' }}>Production Reports</h1>
            <p style={{ color: '#666', marginBottom: '30px' }}>Track your manufacturing performance</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <Link to="/mfg/reports/earnings" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ padding: '20px', border: '1px solid #E5E5E5', borderRadius: '8px', backgroundColor: '#FAFAF8', cursor: 'pointer' }}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#1a1a1a' }}><i className="fas fa-coins" style={{ color: '#C5A059', marginRight: '10px' }}></i>Earnings Report</h3>
                        <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Weekly earnings, payment status & order revenue breakdown</p>
                    </div>
                </Link>
                
                <Link to="/mfg/reports/orders" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ padding: '20px', border: '1px solid #E5E5E5', borderRadius: '8px', backgroundColor: '#FAFAF8', cursor: 'pointer' }}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#1a1a1a' }}><i className="fas fa-boxes" style={{ color: '#C5A059', marginRight: '10px' }}></i>Order Performance</h3>
                        <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Orders handled, fulfilment speed & status distribution</p>
                    </div>
                </Link>

                <Link to="/mfg/reports/products" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ padding: '20px', border: '1px solid #E5E5E5', borderRadius: '8px', backgroundColor: '#FAFAF8', cursor: 'pointer' }}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#1a1a1a' }}><i className="fas fa-tshirt" style={{ color: '#C5A059', marginRight: '10px' }}></i>Product Demand</h3>
                        <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Most ordered base products, colour & size demand</p>
                    </div>
                </Link>
            </div>
        </div>
    );
}
