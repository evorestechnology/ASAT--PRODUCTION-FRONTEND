import os
import json

imports = """import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../../api';
import '../../styles/admin.css';
"""

csv_helper = """
const exportCSV = (data, filename, columns) => {
  const header = columns.map(c => c.label).join(',');
  const rows = data.map(row => columns.map(c => `"${(row[c.key] ?? '').toString().replace(/"/g, '""')}"`).join(','));
  const csv = [header, ...rows].join('\\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
"""

date_pattern = """
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  const setPreset = (days) => {
    const to = new Date();
    const from = new Date();
    if (days === 'all') {
      setDateFrom('2020-01-01');
    } else {
      from.setDate(from.getDate() - days);
      setDateFrom(from.toISOString().split('T')[0]);
    }
    setDateTo(to.toISOString().split('T')[0]);
  };
"""

styles = """
const cardStyle = { background: '#fff', border: '1px solid #E5E5E5', borderRadius: '12px', padding: '20px', flex: '1 1 200px' };
const labelStyle = { fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' };
const valueStyle = { fontSize: '24px', fontWeight: 'bold', color: '#1a1a1a', margin: 0 };
const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: '24px', background: '#fff', border: '1px solid #E5E5E5', borderRadius: '12px', overflow: 'hidden' };
const thStyle = { padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #E5E5E5', background: '#FAFAF8', color: '#666', fontSize: '13px', fontWeight: 600 };
const tdStyle = { padding: '12px 16px', borderBottom: '1px solid #E5E5E5', color: '#1a1a1a', fontSize: '14px' };
const headerBtnStyle = { background: '#1a1a1a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 };
"""

reports = [
    {
        "file": "MasterReportRevenue.jsx",
        "name": "MasterReportRevenue",
        "title": "Revenue Summary",
        "api": "/api/reports/revenue-summary",
        "kpi_keys": ["Gross Revenue", "Discount Given", "Tax Collected", "Shipping Revenue"],
        "kpi_props": ["gross", "discount", "tax", "shipping"],
        "columns": [
            {"label": "Date", "key": "date"},
            {"label": "Orders", "key": "orders"},
            {"label": "Gross Revenue", "key": "gross"},
            {"label": "Discount", "key": "discount"},
            {"label": "Tax", "key": "tax"},
            {"label": "Net", "key": "net"}
        ],
        "chart": """
        <div style={{ display: 'flex', alignItems: 'flex-end', height: '150px', gap: '4px', marginBottom: '24px', padding: '16px', background: '#fff', border: '1px solid #E5E5E5', borderRadius: '12px' }}>
          {data.slice(0, 30).map((d, i) => (
            <div key={i} style={{ flex: 1, background: '#1d4ed8', height: `${Math.max(5, (d.gross / (Math.max(...data.map(x => x.gross)) || 1)) * 100)}%`, minHeight: '5px', borderRadius: '2px 2px 0 0' }} title={`${d.date}: ${fmt(d.gross)}`} />
          ))}
        </div>
        """
    },
    {
        "file": "MasterReportOrders.jsx",
        "name": "MasterReportOrders",
        "title": "Orders Analysis",
        "api": "/api/reports/orders-by-status",
        "kpi_keys": ["Total Orders", "Completed", "Pending/Processing", "Cancelled", "Avg Order Value"],
        "kpi_props": ["total", "completed", "pending", "cancelled", "avgValue"],
        "columns": [
            {"label": "Status", "key": "status"},
            {"label": "Count", "key": "count"},
            {"label": "% of Total", "key": "percentage"}
        ],
        "chart": """
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', padding: '16px', background: '#fff', border: '1px solid #E5E5E5', borderRadius: '12px' }}>
          {data.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '120px', fontSize: '13px', color: '#666' }}>{d.status}</div>
              <div style={{ flex: 1, height: '16px', background: '#f3f4f6', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ width: `${d.percentage || (d.count / (kpis?.total || 1) * 100)}%`, height: '100%', background: '#3b82f6' }} />
              </div>
              <div style={{ width: '50px', fontSize: '13px', textAlign: 'right' }}>{d.count}</div>
            </div>
          ))}
        </div>
        """
    },
    {
        "file": "MasterReportDesigners.jsx",
        "name": "MasterReportDesigners",
        "title": "Top Designers",
        "api": "/api/reports/top-designers",
        "kpi_keys": ["Active Designers", "Total Designer Payouts", "Avg per Designer", "Top Earner"],
        "kpi_props": ["active", "totalPayout", "avgPayout", "topEarner"],
        "columns": [
            {"label": "Rank", "key": "rank"},
            {"label": "Designer", "key": "designer"},
            {"label": "Orders", "key": "orders"},
            {"label": "Earnings", "key": "earnings"},
            {"label": "Avg Order", "key": "avgOrder"}
        ]
    },
    {
        "file": "MasterReportManufacturers.jsx",
        "name": "MasterReportManufacturers",
        "title": "Manufacturer Performance",
        "api": "/api/reports/mfg-performance",
        "kpi_keys": ["Active Manufacturers", "Total Mfg Payouts", "Orders Fulfilled"],
        "kpi_props": ["active", "totalPayout", "fulfilled"],
        "columns": [
            {"label": "Rank", "key": "rank"},
            {"label": "Manufacturer", "key": "manufacturer"},
            {"label": "Orders", "key": "orders"},
            {"label": "Completed", "key": "completed"},
            {"label": "Earnings", "key": "earnings"}
        ]
    },
    {
        "file": "MasterReportProducts.jsx",
        "name": "MasterReportProducts",
        "title": "Top Products",
        "api": "/api/reports/top-products",
        "kpi_keys": ["Total Designs Ordered", "Total Revenue from Designs", "Most Ordered Design"],
        "kpi_props": ["totalDesigns", "totalRevenue", "topDesign"],
        "columns": [
            {"label": "Rank", "key": "rank"},
            {"label": "Design Name", "key": "designName"},
            {"label": "Designer", "key": "designer"},
            {"label": "Orders", "key": "orders"},
            {"label": "Qty Sold", "key": "qty"},
            {"label": "Revenue", "key": "revenue"}
        ]
    },
    {
        "file": "MasterReportCustomers.jsx",
        "name": "MasterReportCustomers",
        "title": "Customer Analytics",
        "api": "/api/reports/customer-activity",
        "kpi_keys": ["Total Customers", "Repeat Buyers", "Avg Order Value", "Top Spender"],
        "kpi_props": ["total", "repeat", "avgOrder", "topSpender"],
        "columns": [
            {"label": "Customer", "key": "customer"},
            {"label": "Email", "key": "email"},
            {"label": "Country", "key": "country"},
            {"label": "Orders", "key": "orders"},
            {"label": "Total Spend", "key": "spend"},
            {"label": "Last Order", "key": "lastOrder"}
        ]
    },
    {
        "file": "MasterReportPromos.jsx",
        "name": "MasterReportPromos",
        "title": "Promo Code Performance",
        "api": "/api/reports/promo-usage",
        "kpi_keys": ["Total Promo Orders", "Total Discount Given", "Most Used Code", "Avg Discount"],
        "kpi_props": ["totalOrders", "totalDiscount", "topCode", "avgDiscount"],
        "columns": [
            {"label": "Code", "key": "code"},
            {"label": "Uses", "key": "uses"},
            {"label": "Total Discount", "key": "discount"},
            {"label": "Avg Discount", "key": "avgDiscount"},
            {"label": "Status", "key": "status"}
        ]
    },
    {
        "file": "MasterReportSupport.jsx",
        "name": "MasterReportSupport",
        "title": "Support Ticket Report",
        "api": "/api/reports/support-tickets",
        "kpi_keys": ["Total Tickets", "Open Tickets", "Closed Tickets", "Avg Resolution"],
        "kpi_props": ["total", "open", "closed", "avgResolution"],
        "columns": [
            {"label": "Ticket ID", "key": "ticketId"},
            {"label": "Subject", "key": "subject"},
            {"label": "User", "key": "user"},
            {"label": "Status", "key": "status"},
            {"label": "Created", "key": "created"},
            {"label": "Updated", "key": "updated"}
        ]
    },
    {
        "file": "MasterReportInventory.jsx",
        "name": "MasterReportInventory",
        "title": "Design & Inventory Health",
        "api": "/api/reports/inventory-alerts",
        "no_date": True,
        "kpi_keys": ["Total Designs", "Approved", "Pending Review", "Slow Movers (< 3 orders)"],
        "kpi_props": ["total", "approved", "pending", "slowMovers"],
        "columns": [
            {"label": "Design Name", "key": "designName"},
            {"label": "Designer", "key": "designer"},
            {"label": "Status", "key": "status"},
            {"label": "Orders", "key": "orders"},
            {"label": "Uploaded Date", "key": "uploaded"}
        ]
    }
]

base_dir = "e:/ASAT(Main)/frontend/src/pages/master"
os.makedirs(base_dir, exist_ok=True)

for r in reports:
    columns_json = json.dumps(r['columns'])
    no_date = r.get("no_date", False)
    
    date_code = "" if no_date else date_pattern
    fetch_url = f"`{r['api']}`" if no_date else f"`{r['api']}?from=${{dateFrom}}&to=${{dateTo}}`"
    dep_array = "[]" if no_date else "[dateFrom, dateTo]"
    
    date_picker_ui = ""
    if not no_date:
        date_picker_ui = """
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center', background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #E5E5E5' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
          <span>to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setPreset(7)} style={{ padding: '6px 12px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer' }}>7 Days</button>
          <button onClick={() => setPreset(30)} style={{ padding: '6px 12px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer' }}>30 Days</button>
          <button onClick={() => setPreset(90)} style={{ padding: '6px 12px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer' }}>90 Days</button>
          <button onClick={() => setPreset('all')} style={{ padding: '6px 12px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer' }}>All Time</button>
        </div>
      </div>
"""
    
    content = f'''{imports}
{csv_helper}
{styles}

export default function {r['name']}() {{
{date_code}
  const [data, setData] = useState([]);
  const [kpis, setKpis] = useState({{}});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const columns = {columns_json};

  const fetchData = useCallback(async () => {{
    setLoading(true);
    setError(null);
    try {{
      const res = await apiFetch({fetch_url});
      setData(res.data || []);
      setKpis(res.kpis || {{}});
    }} catch (err) {{
      setError(err.message || "Failed to fetch report data");
    }} finally {{
      setLoading(false);
    }}
  }}, {dep_array});

  useEffect(() => {{
    fetchData();
  }}, [fetchData]);

  return (
    <div style={{{{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}}}>
      <div style={{{{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}}}>
        <div>
          <Link to="/master/reports" style={{{{ color: '#1d4ed8', textDecoration: 'none', fontSize: '14px', marginBottom: '8px', display: 'inline-block' }}}}>&larr; Back to Reports</Link>
          <h1 style={{{{ fontSize: '28px', fontWeight: 600, color: '#1a1a1a', margin: '0' }}}}>{r['title']}</h1>
        </div>
        <button style={{headerBtnStyle}} onClick={{() => exportCSV(data, '{r['file'].replace('.jsx', '')}.csv', columns)}}>
          Export CSV
        </button>
      </div>
      {date_picker_ui}
      {{error && <div style={{{{ color: '#dc2626', border: '1px solid #f87171', background: '#fef2f2', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}}}>{{error}}</div>}}

      <div style={{{{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '32px' }}}}>
        { " ".join([f"""<div style={{cardStyle}}><div style={{labelStyle}}>{k}</div><p style={{valueStyle}}>{{kpis?.{p} || '-'}}</p></div>""" for k, p in zip(r['kpi_keys'], r['kpi_props'])]) }
      </div>

      {{loading ? (
        <div style={{{{ padding: '40px', textAlign: 'center', color: '#666' }}}}>Loading...</div>
      ) : (
        <>
          {r.get('chart', '')}
          <table style={{tableStyle}}>
            <thead>
              <tr>
                {{columns.map(c => <th key={{c.key}} style={{thStyle}}>{{c.label}}</th>)}}
              </tr>
            </thead>
            <tbody>
              {{data.length === 0 ? (
                <tr><td colSpan={{columns.length}} style={{{{ ...tdStyle, textAlign: 'center', padding: '32px' }}}}>No data found.</td></tr>
              ) : (
                data.map((row, i) => (
                  <tr key={{i}}>
                    {{columns.map(c => (
                      <td key={{c.key}} style={{tdStyle}}>
                        {{c.key === 'status' ? (
                          <span style={{{{ 
                            padding: '4px 8px', borderRadius: '99px', fontSize: '12px', fontWeight: 500,
                            background: row[c.key]?.toLowerCase() === 'open' ? '#fef3c7' : row[c.key]?.toLowerCase() === 'closed' || row[c.key]?.toLowerCase() === 'resolved' ? '#dcfce3' : '#f3f4f6',
                            color: row[c.key]?.toLowerCase() === 'open' ? '#92400e' : row[c.key]?.toLowerCase() === 'closed' || row[c.key]?.toLowerCase() === 'resolved' ? '#166534' : '#374151'
                          }}}}>
                            {{row[c.key]}}
                          </span>
                        ) : (
                          row[c.key]
                        )}}
                      </td>
                    ))}}
                  </tr>
                ))
              )}}
            </tbody>
          </table>
        </>
      )}}
    </div>
  );
}}
'''
    with open(os.path.join(base_dir, r['file']), "w", encoding="utf-8") as f:
        f.write(content)
