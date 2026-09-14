import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/admin.css';

export default function MasterReports() {
  const reports = [
    { path: '/master/reports/revenue', name: 'Revenue Summary', icon: 'fa-chart-bar', desc: 'Gross revenue, discounts, tax & shipping breakdown', color: '#10b981' },
    { path: '/master/reports/orders', name: 'Orders Analysis', icon: 'fa-receipt', desc: 'Order volume, status breakdown & avg order value', color: '#3b82f6' },
    { path: '/master/reports/designers', name: 'Top Designers', icon: 'fa-paint-brush', desc: 'Best performing designers by revenue & orders', color: '#8b5cf6' },
    { path: '/master/reports/manufacturers', name: 'Manufacturer Performance', icon: 'fa-industry', desc: 'Production volume, earnings & fulfilment speed', color: '#f59e0b' },
    { path: '/master/reports/products', name: 'Top Products', icon: 'fa-tshirt', desc: 'Best-selling designs and product demand', color: '#ef4444' },
    { path: '/master/reports/customers', name: 'Customer Analytics', icon: 'fa-users', desc: 'Customer acquisition, retention & spending patterns', color: '#ec4899' },
    { path: '/master/reports/promos', name: 'Promo Code Performance', icon: 'fa-ticket-alt', desc: 'Coupon usage, discount totals & code effectiveness', color: '#14b8a6' },
    { path: '/master/reports/support', name: 'Support Ticket Report', icon: 'fa-headset', desc: 'Ticket volume, resolution times & open/closed ratios', color: '#6366f1' },
    { path: '/master/reports/inventory', name: 'Design & Inventory Health', icon: 'fa-boxes', desc: 'Slow-movers, pending approvals & design status', color: '#f97316' },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#1a1a1a', margin: '0 0 8px 0' }}>Business Reports</h1>
        <p style={{ color: '#666', margin: 0 }}>Analytics and insights across all areas of the business.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {reports.map((r, i) => (
          <Link to={r.path} key={i} style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{ 
              background: '#fff', 
              border: '1px solid #E5E5E5', 
              borderRadius: '12px', 
              overflow: 'hidden',
              transition: 'box-shadow 0.2s',
              cursor: 'pointer',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ height: '4px', background: r.color, width: '100%' }}></div>
              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <i className={`fas ${r.icon}`} style={{ fontSize: '32px', color: r.color, marginBottom: '16px', display: 'block' }}></i>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#1a1a1a' }}>{r.name}</h3>
                <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#666', lineHeight: '1.5' }}>{r.desc}</p>
                <div style={{ fontSize: '14px', color: '#1d4ed8', fontWeight: 500, marginTop: 'auto' }}>
                  View Report &rarr;
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
