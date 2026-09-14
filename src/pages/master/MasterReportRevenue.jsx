import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../api';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const exportCSV = (data, filename, columns) => {
  const header = columns.map(c => c.label).join(',');
  const rows = data.map(row => columns.map(c => `"${(row[c.key] ?? '').toString().replace(/"/g, '""')}"`).join(','));
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const card  = { background:'#fff', border:'1px solid #E5E5E5', borderRadius:'12px', padding:'20px', flex:'1 1 180px' };
const label = { fontSize:'12px', color:'#666', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'8px' };
const value = { fontSize:'24px', fontWeight:'bold', color:'#1a1a1a', margin:0 };
const th    = { padding:'12px 16px', textAlign:'left', borderBottom:'1px solid #E5E5E5', background:'#FAFAF8', color:'#666', fontSize:'13px', fontWeight:600 };
const td    = { padding:'12px 16px', borderBottom:'1px solid #E5E5E5', color:'#1a1a1a', fontSize:'14px' };
const btn   = { background:'#1a1a1a', color:'#fff', border:'none', padding:'8px 16px', borderRadius:'6px', cursor:'pointer', fontSize:'14px' };
const preset= { padding:'6px 12px', background:'#f3f4f6', border:'1px solid #e5e7eb', borderRadius:'4px', cursor:'pointer', fontSize:'13px' };

const columns = [
  { label: 'Date', key: 'date' },
  { label: 'Orders', key: 'orders' },
  { label: 'Gross Revenue', key: 'revenue' },
];

export default function MasterReportRevenue() {
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate()-30); return d.toISOString().split('T')[0]; });
  const [dateTo,   setDateTo]   = useState(() => new Date().toISOString().split('T')[0]);
  const [totals,   setTotals]   = useState({});
  const [daily,    setDaily]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const setPreset = (days) => {
    const to = new Date(); const from = new Date();
    if (days === 'all') { setDateFrom('2020-01-01'); } else { from.setDate(from.getDate() - days); setDateFrom(from.toISOString().split('T')[0]); }
    setDateTo(to.toISOString().split('T')[0]);
  };

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await apiFetch(`/api/reports/revenue-summary?from=${dateFrom}&to=${dateTo}`);
      setTotals(res.totals || {});
      setDaily(res.dailyBreakdown || []);
    } catch (err) {
      setError(err?.data?.error || err.message || 'Failed to fetch report');
    } finally { setLoading(false); }
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const maxRevenue = Math.max(...daily.map(d => d.revenue || 0), 1);

  return (
    <div style={{ padding:'24px', maxWidth:'1200px', margin:'0 auto', fontFamily:'sans-serif' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px' }}>
        <div>
          <Link to="/master/reports" style={{ color:'#1d4ed8', textDecoration:'none', fontSize:'14px', display:'inline-block', marginBottom:'6px' }}>← Back to Reports</Link>
          <h1 style={{ fontSize:'28px', fontWeight:700, color:'#1a1a1a', margin:0 }}>Revenue Summary</h1>
          <p style={{ color:'#666', margin:'4px 0 0', fontSize:'14px' }}>Gross revenue, discounts, tax & shipping breakdown</p>
        </div>
        <button style={btn} onClick={() => exportCSV(daily, 'revenue-report.csv', columns)}>⬇ Export CSV</button>
      </div>

      {/* Date Range */}
      <div style={{ display:'flex', gap:'12px', alignItems:'center', background:'#fff', padding:'14px 18px', borderRadius:'12px', border:'1px solid #E5E5E5', marginBottom:'24px', flexWrap:'wrap' }}>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding:'7px 10px', border:'1px solid #ccc', borderRadius:'6px' }} />
        <span style={{ color:'#666' }}>to</span>
        <input type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)}   style={{ padding:'7px 10px', border:'1px solid #ccc', borderRadius:'6px' }} />
        {[7,30,90].map(d => <button key={d} style={preset} onClick={() => setPreset(d)}>{d} Days</button>)}
        <button style={preset} onClick={() => setPreset('all')}>All Time</button>
      </div>

      {error && <div style={{ color:'#dc2626', background:'#fef2f2', border:'1px solid #fca5a5', padding:'14px', borderRadius:'8px', marginBottom:'20px' }}>{error}</div>}

      {/* KPI Cards */}
      <div style={{ display:'flex', gap:'16px', flexWrap:'wrap', marginBottom:'28px' }}>
        <div style={card}><div style={label}>Gross Revenue</div><p style={value}>{fmt(totals.grossRevenue)}</p></div>
        <div style={card}><div style={label}>Net Revenue</div><p style={value}>{fmt(totals.netRevenue)}</p></div>
        <div style={card}><div style={label}>Tax Collected</div><p style={value}>{fmt(totals.taxCollected)}</p></div>
        <div style={card}><div style={label}>Shipping Revenue</div><p style={value}>{fmt(totals.shippingRevenue)}</p></div>
        <div style={card}><div style={label}>Discount Given</div><p style={{ ...value, color:'#dc2626' }}>{fmt(totals.discountGiven)}</p></div>
        <div style={card}><div style={label}>Total Orders</div><p style={value}>{totals.totalOrders ?? '-'}</p></div>
        <div style={card}><div style={label}>Completed Orders</div><p style={{ ...value, color:'#15803d' }}>{totals.completedOrders ?? '-'}</p></div>
      </div>

      {loading ? (
        <div style={{ padding:'60px', textAlign:'center', color:'#666' }}>Loading report data…</div>
      ) : (
        <>
          {/* Bar Chart */}
          {daily.length > 0 && (
            <div style={{ background:'#fff', border:'1px solid #E5E5E5', borderRadius:'12px', padding:'20px', marginBottom:'24px' }}>
              <div style={{ fontSize:'13px', color:'#666', marginBottom:'12px', fontWeight:600 }}>Daily Revenue Trend</div>
              <div style={{ display:'flex', alignItems:'flex-end', height:'120px', gap:'3px' }}>
                {daily.slice(-60).map((d, i) => (
                  <div key={i} title={`${d.date}: ${fmt(d.revenue)} (${d.orders} orders)`}
                    style={{ flex:1, background:'#C5A059', borderRadius:'2px 2px 0 0', minHeight:'4px',
                      height:`${Math.max(4, ((d.revenue || 0) / maxRevenue) * 100)}%`,
                      opacity: 0.7 + 0.3 * ((d.revenue || 0) / maxRevenue) }} />
                ))}
              </div>
            </div>
          )}

          {/* Table */}
          <div style={{ background:'#fff', border:'1px solid #E5E5E5', borderRadius:'12px', overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Date</th>
                  <th style={th}>Orders</th>
                  <th style={{ ...th, textAlign:'right' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {daily.length === 0 ? (
                  <tr><td colSpan={3} style={{ ...td, textAlign:'center', padding:'40px', color:'#666' }}>No data found for this period.</td></tr>
                ) : (
                  daily.map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAF8' }}>
                      <td style={td}>{row.date}</td>
                      <td style={td}>{row.orders}</td>
                      <td style={{ ...td, textAlign:'right', fontWeight:500 }}>{fmt(row.revenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
