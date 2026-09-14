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
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const card  = { background:'#fff', border:'1px solid #E5E5E5', borderRadius:'12px', padding:'20px', flex:'1 1 180px' };
const lbl   = { fontSize:'12px', color:'#666', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'8px' };
const val   = { fontSize:'24px', fontWeight:'bold', color:'#1a1a1a', margin:0 };
const th    = { padding:'12px 16px', textAlign:'left', borderBottom:'1px solid #E5E5E5', background:'#FAFAF8', color:'#666', fontSize:'13px', fontWeight:600 };
const td    = { padding:'12px 16px', borderBottom:'1px solid #E5E5E5', color:'#1a1a1a', fontSize:'14px' };
const btn   = { background:'#1a1a1a', color:'#fff', border:'none', padding:'8px 16px', borderRadius:'6px', cursor:'pointer', fontSize:'14px' };
const preset= { padding:'6px 12px', background:'#f3f4f6', border:'1px solid #e5e7eb', borderRadius:'4px', cursor:'pointer', fontSize:'13px' };

const columns = [
  { label:'Rank',       key:'rank' },
  { label:'Designer',   key:'displayName' },
  { label:'Username',   key:'username' },
  { label:'Orders',     key:'orderCount' },
  { label:'Earnings',   key:'earningsStr' },
];

export default function MasterReportDesigners() {
  const [dateFrom,   setDateFrom]   = useState(() => { const d = new Date(); d.setDate(d.getDate()-30); return d.toISOString().split('T')[0]; });
  const [dateTo,     setDateTo]     = useState(() => new Date().toISOString().split('T')[0]);
  const [designers,  setDesigners]  = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  const setPreset = (days) => {
    const to = new Date(); const from = new Date();
    if (days === 'all') { setDateFrom('2020-01-01'); } else { from.setDate(from.getDate()-days); setDateFrom(from.toISOString().split('T')[0]); }
    setDateTo(to.toISOString().split('T')[0]);
  };

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await apiFetch(`/api/reports/top-designers?from=${dateFrom}&to=${dateTo}`);
      setDesigners(res.designers || []);
    } catch (err) {
      setError(err?.data?.error || err.message || 'Failed to fetch report');
    } finally { setLoading(false); }
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPayout = designers.reduce((s, d) => s + d.totalEarnings, 0);
  const topEarner   = designers[0];

  const tableData = designers.map((d, i) => ({
    rank: i + 1,
    displayName:  d.name || d.username || 'Unknown',
    username:     d.username || '-',
    orderCount:   d.orderCount,
    earningsStr:  fmt(d.totalEarnings),
  }));

  return (
    <div style={{ padding:'24px', maxWidth:'1200px', margin:'0 auto', fontFamily:'sans-serif' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px' }}>
        <div>
          <Link to="/master/reports" style={{ color:'#1d4ed8', textDecoration:'none', fontSize:'14px', display:'inline-block', marginBottom:'6px' }}>← Back to Reports</Link>
          <h1 style={{ fontSize:'28px', fontWeight:700, color:'#1a1a1a', margin:0 }}>Top Designers</h1>
          <p style={{ color:'#666', margin:'4px 0 0', fontSize:'14px' }}>Best performing designers by revenue & orders</p>
        </div>
        <button style={btn} onClick={() => exportCSV(tableData, 'designers-report.csv', columns)}>⬇ Export CSV</button>
      </div>

      <div style={{ display:'flex', gap:'12px', alignItems:'center', background:'#fff', padding:'14px 18px', borderRadius:'12px', border:'1px solid #E5E5E5', marginBottom:'24px', flexWrap:'wrap' }}>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding:'7px 10px', border:'1px solid #ccc', borderRadius:'6px' }} />
        <span style={{ color:'#666' }}>to</span>
        <input type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)}   style={{ padding:'7px 10px', border:'1px solid #ccc', borderRadius:'6px' }} />
        {[7,30,90].map(d => <button key={d} style={preset} onClick={() => setPreset(d)}>{d} Days</button>)}
        <button style={preset} onClick={() => setPreset('all')}>All Time</button>
      </div>

      {error && <div style={{ color:'#dc2626', background:'#fef2f2', border:'1px solid #fca5a5', padding:'14px', borderRadius:'8px', marginBottom:'20px' }}>{error}</div>}

      <div style={{ display:'flex', gap:'16px', flexWrap:'wrap', marginBottom:'28px' }}>
        <div style={card}><div style={lbl}>Active Designers</div><p style={val}>{designers.length}</p></div>
        <div style={card}><div style={lbl}>Total Payouts</div><p style={val}>{fmt(totalPayout)}</p></div>
        <div style={card}><div style={lbl}>Avg per Designer</div><p style={val}>{designers.length ? fmt(totalPayout / designers.length) : '₹0'}</p></div>
        <div style={card}><div style={lbl}>Top Earner</div><p style={{ ...val, fontSize:'16px' }}>{topEarner ? (topEarner.name || topEarner.username || '-') : '-'}</p></div>
      </div>

      {loading ? (
        <div style={{ padding:'60px', textAlign:'center', color:'#666' }}>Loading report data…</div>
      ) : (
        <div style={{ background:'#fff', border:'1px solid #E5E5E5', borderRadius:'12px', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>{columns.map(c => <th key={c.key} style={th}>{c.label}</th>)}</tr></thead>
            <tbody>
              {tableData.length === 0 ? (
                <tr><td colSpan={columns.length} style={{ ...td, textAlign:'center', padding:'40px', color:'#666' }}>No designer data for this period.</td></tr>
              ) : tableData.map((row, i) => (
                <tr key={i} style={{ background: i%2===0?'#fff':'#FAFAF8' }}>
                  <td style={{ ...td, fontWeight:700, color: i===0?'#C5A059':'#1a1a1a' }}>#{row.rank}</td>
                  <td style={td}>{row.displayName}</td>
                  <td style={{ ...td, color:'#666' }}>@{row.username}</td>
                  <td style={td}>{row.orderCount}</td>
                  <td style={{ ...td, fontWeight:600 }}>{row.earningsStr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
