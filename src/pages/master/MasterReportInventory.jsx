import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../api';

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

const columns = [
  { label:'Design Title', key:'title' },
  { label:'Status', key:'status' },
  { label:'Orders Count', key:'orders_count' },
  { label:'Submitted Date', key:'createdDate' },
];

export default function MasterReportInventory() {
  const [data, setData] = useState({ summary: {}, slowMoverDesigns: [], pendingApproval: [] });
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'slowMovers'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await apiFetch('/api/reports/inventory-alerts');
      setData(res || { summary: {}, slowMoverDesigns: [], pendingApproval: [] });
    } catch (err) {
      setError(err?.data?.error || err.message || 'Failed to fetch report');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const summary = data.summary || {};
  const currentList = activeTab === 'pending' ? (data.pendingApproval || []) : (data.slowMoverDesigns || []);

  const tableData = currentList.map(d => ({
    title: d.title || 'Untitled Design',
    status: (d.status || 'unknown').toUpperCase(),
    orders_count: d.orders_count || 0,
    createdDate: d.created_at ? new Date(d.created_at).toLocaleDateString('en-IN') : '-'
  }));

  return (
    <div style={{ padding:'24px', maxWidth:'1200px', margin:'0 auto', fontFamily:'sans-serif' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px' }}>
        <div>
          <Link to="/master/reports" style={{ color:'#1d4ed8', textDecoration:'none', fontSize:'14px', display:'inline-block', marginBottom:'6px' }}>← Back to Reports</Link>
          <h1 style={{ fontSize:'28px', fontWeight:700, color:'#1a1a1a', margin:0 }}>Catalog & Inventory Health</h1>
          <p style={{ color:'#666', margin:'4px 0 0', fontSize:'14px' }}>Pending designer submissions, approval backlog & slow-moving designs</p>
        </div>
        <button style={btn} onClick={() => exportCSV(tableData, `${activeTab}-designs-report.csv`, columns)}>⬇ Export CSV</button>
      </div>

      {error && <div style={{ color:'#dc2626', background:'#fef2f2', border:'1px solid #fca5a5', padding:'14px', borderRadius:'8px', marginBottom:'20px' }}>{error}</div>}

      <div style={{ display:'flex', gap:'16px', flexWrap:'wrap', marginBottom:'28px' }}>
        <div style={card}><div style={lbl}>Total Submissions</div><p style={val}>{summary.totalDesigns ?? 0}</p></div>
        <div style={card}><div style={lbl}>Approved Active</div><p style={{ ...val, color:'#15803d' }}>{summary.approved ?? 0}</p></div>
        <div style={card}><div style={lbl}>Pending Review</div><p style={{ ...val, color:'#d97706' }}>{summary.pending ?? 0}</p></div>
        <div style={card}><div style={lbl}>Slow Movers (&lt; 3 orders)</div><p style={{ ...val, color:'#dc2626' }}>{summary.slowMovers ?? 0}</p></div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
        <button
          onClick={() => setActiveTab('pending')}
          style={{
            padding:'10px 18px', borderRadius:'8px', border:'none', cursor:'pointer', fontSize:'14px', fontWeight:600,
            background: activeTab === 'pending' ? '#1a1a1a' : '#f3f4f6',
            color: activeTab === 'pending' ? '#fff' : '#4b5563'
          }}
        >
          Pending Review ({summary.pending ?? 0})
        </button>
        <button
          onClick={() => setActiveTab('slowMovers')}
          style={{
            padding:'10px 18px', borderRadius:'8px', border:'none', cursor:'pointer', fontSize:'14px', fontWeight:600,
            background: activeTab === 'slowMovers' ? '#1a1a1a' : '#f3f4f6',
            color: activeTab === 'slowMovers' ? '#fff' : '#4b5563'
          }}
        >
          Slow-Moving Designs ({summary.slowMovers ?? 0})
        </button>
      </div>

      {loading ? (
        <div style={{ padding:'60px', textAlign:'center', color:'#666' }}>Loading report data…</div>
      ) : (
        <div style={{ background:'#fff', border:'1px solid #E5E5E5', borderRadius:'12px', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>{columns.map(c => <th key={c.key} style={th}>{c.label}</th>)}</tr></thead>
            <tbody>
              {tableData.length === 0 ? (
                <tr><td colSpan={columns.length} style={{ ...td, textAlign:'center', padding:'40px', color:'#666' }}>No designs in this category.</td></tr>
              ) : tableData.map((row, i) => (
                <tr key={i} style={{ background: i%2===0?'#fff':'#FAFAF8' }}>
                  <td style={{ ...td, fontWeight:600 }}>{row.title}</td>
                  <td style={td}>
                    <span style={{ 
                      padding:'3px 8px', borderRadius:'99px', fontSize:'12px', fontWeight:600,
                      background: row.status === 'APPROVED' ? '#dcfce7' : row.status === 'PENDING' ? '#fef3c7' : '#fee2e2',
                      color: row.status === 'APPROVED' ? '#15803d' : row.status === 'PENDING' ? '#b45309' : '#991b1b'
                    }}>
                      {row.status}
                    </span>
                  </td>
                  <td style={td}>{row.orders_count}</td>
                  <td style={{ ...td, color:'#666', fontSize:'13px' }}>{row.createdDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
