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

const card  = { background:'#fff', border:'1px solid #E5E5E5', borderRadius:'12px', padding:'20px', flex:'1 1 160px' };
const lbl   = { fontSize:'12px', color:'#666', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'8px' };
const val   = { fontSize:'24px', fontWeight:'bold', color:'#1a1a1a', margin:0 };
const th    = { padding:'12px 16px', textAlign:'left', borderBottom:'1px solid #E5E5E5', background:'#FAFAF8', color:'#666', fontSize:'13px', fontWeight:600 };
const td    = { padding:'12px 16px', borderBottom:'1px solid #E5E5E5', color:'#1a1a1a', fontSize:'14px' };
const btn   = { background:'#1a1a1a', color:'#fff', border:'none', padding:'8px 16px', borderRadius:'6px', cursor:'pointer', fontSize:'14px' };
const preset= { padding:'6px 12px', background:'#f3f4f6', border:'1px solid #e5e7eb', borderRadius:'4px', cursor:'pointer', fontSize:'13px' };

const STATUS_COLORS = {
  pending:    { bg:'#fef9c3', color:'#854d0e' },
  confirmed:  { bg:'#dbeafe', color:'#1e40af' },
  processing: { bg:'#e0e7ff', color:'#3730a3' },
  shipped:    { bg:'#fef3c7', color:'#92400e' },
  delivered:  { bg:'#d1fae5', color:'#065f46' },
  completed:  { bg:'#dcfce7', color:'#15803d' },
  cancelled:  { bg:'#fee2e2', color:'#991b1b' },
};

const columns = [
  { label:'Status', key:'status' },
  { label:'Count', key:'count' },
  { label:'% of Total', key:'pct' },
];

export default function MasterReportOrders() {
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate()-30); return d.toISOString().split('T')[0]; });
  const [dateTo,   setDateTo]   = useState(() => new Date().toISOString().split('T')[0]);
  const [byStatus, setByStatus] = useState({});
  const [totals,   setTotals]   = useState({ totalOrders:0, avgOrderValue:0 });
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const setPreset = (days) => {
    const to = new Date(); const from = new Date();
    if (days === 'all') { setDateFrom('2020-01-01'); } else { from.setDate(from.getDate()-days); setDateFrom(from.toISOString().split('T')[0]); }
    setDateTo(to.toISOString().split('T')[0]);
  };

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await apiFetch(`/api/reports/orders-by-status?from=${dateFrom}&to=${dateTo}`);
      setByStatus(res.byStatus || {});
      setTotals({ totalOrders: res.totalOrders || 0, avgOrderValue: res.avgOrderValue || 0 });
    } catch (err) {
      setError(err?.data?.error || err.message || 'Failed to fetch report');
    } finally { setLoading(false); }
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const tableData = Object.entries(byStatus)
    .filter(([,count]) => count > 0)
    .map(([status, count]) => ({ status, count, pct: totals.totalOrders > 0 ? ((count / totals.totalOrders) * 100).toFixed(1) + '%' : '0%' }));

  const maxCount = Math.max(...Object.values(byStatus), 1);

  return (
    <div style={{ padding:'24px', maxWidth:'1200px', margin:'0 auto', fontFamily:'sans-serif' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px' }}>
        <div>
          <Link to="/master/reports" style={{ color:'#1d4ed8', textDecoration:'none', fontSize:'14px', display:'inline-block', marginBottom:'6px' }}>← Back to Reports</Link>
          <h1 style={{ fontSize:'28px', fontWeight:700, color:'#1a1a1a', margin:0 }}>Orders Analysis</h1>
          <p style={{ color:'#666', margin:'4px 0 0', fontSize:'14px' }}>Order volume, status breakdown & average order value</p>
        </div>
        <button style={btn} onClick={() => exportCSV(tableData, 'orders-report.csv', columns)}>⬇ Export CSV</button>
      </div>

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
        <div style={card}><div style={lbl}>Total Orders</div><p style={val}>{totals.totalOrders}</p></div>
        <div style={card}><div style={lbl}>Completed</div><p style={{ ...val, color:'#15803d' }}>{(byStatus.completed||0) + (byStatus.delivered||0)}</p></div>
        <div style={card}><div style={lbl}>Pending / Processing</div><p style={{ ...val, color:'#d97706' }}>{(byStatus.pending||0) + (byStatus.confirmed||0) + (byStatus.processing||0)}</p></div>
        <div style={card}><div style={lbl}>Cancelled</div><p style={{ ...val, color:'#dc2626' }}>{byStatus.cancelled||0}</p></div>
        <div style={card}><div style={lbl}>Avg Order Value</div><p style={val}>{fmt(totals.avgOrderValue)}</p></div>
      </div>

      {loading ? (
        <div style={{ padding:'60px', textAlign:'center', color:'#666' }}>Loading report data…</div>
      ) : (
        <>
          {/* Horizontal bars */}
          <div style={{ background:'#fff', border:'1px solid #E5E5E5', borderRadius:'12px', padding:'20px', marginBottom:'24px' }}>
            <div style={{ fontSize:'13px', color:'#666', marginBottom:'14px', fontWeight:600 }}>Orders by Status</div>
            {Object.entries(byStatus).filter(([,c])=>c>0).map(([status, count]) => (
              <div key={status} style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'10px' }}>
                <div style={{ width:'110px', fontSize:'13px', color:'#444', textTransform:'capitalize' }}>{status}</div>
                <div style={{ flex:1, height:'18px', background:'#f3f4f6', borderRadius:'9px', overflow:'hidden' }}>
                  <div style={{ width:`${(count/maxCount)*100}%`, height:'100%', background: STATUS_COLORS[status]?.bg?.replace('fef','d97') || '#C5A059', borderRadius:'9px' }} />
                </div>
                <div style={{ width:'36px', fontSize:'13px', textAlign:'right', fontWeight:600 }}>{count}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={{ background:'#fff', border:'1px solid #E5E5E5', borderRadius:'12px', overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>{columns.map(c => <th key={c.key} style={th}>{c.label}</th>)}</tr></thead>
              <tbody>
                {tableData.length === 0 ? (
                  <tr><td colSpan={3} style={{ ...td, textAlign:'center', padding:'40px', color:'#666' }}>No data found for this period.</td></tr>
                ) : tableData.map((row, i) => {
                  const colors = STATUS_COLORS[row.status] || {};
                  return (
                    <tr key={i} style={{ background: i%2===0 ? '#fff' : '#FAFAF8' }}>
                      <td style={td}>
                        <span style={{ padding:'4px 10px', borderRadius:'99px', fontSize:'12px', fontWeight:600,
                          background: colors.bg || '#f3f4f6', color: colors.color || '#374151' }}>
                          {row.status}
                        </span>
                      </td>
                      <td style={td}>{row.count}</td>
                      <td style={td}>{row.pct}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
