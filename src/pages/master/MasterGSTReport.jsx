import React, { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../api";
import "../../styles/admin.css";
import BackButton from "../../components/BackButton";
import { useToast, ToastContainer, TOAST_CSS } from "../../components/useToast";

const AP_KEYWORDS = [
    "andhra pradesh","ap","visakhapatnam","vizag","vijayawada",
    "guntur","tirupati","kurnool","rajahmundry","nellore",
    "kakinada","anantapur","kadapa","ongole","eluru","srikakulam"
];

function isAndhraPradesh(address = "") {
    const lower = address.toLowerCase();
    return AP_KEYWORDS.some(k => lower.includes(k));
}

function computeGstBreakdown(order) {
    const taxAmount = Number(order.tax_amount || 0);
    const country = order.country || "";
    const address = order.address || "";
    if (country !== "India") {
        return { cgst: 0, sgst: 0, igst: 0, taxAmount, supplyType: "Export" };
    }
    if (isAndhraPradesh(address)) {
        const half = Math.round(taxAmount / 2);
        return { cgst: half, sgst: taxAmount - half, igst: 0, taxAmount, supplyType: "Intra-State (AP)" };
    }
    return { cgst: 0, sgst: 0, igst: taxAmount, taxAmount, supplyType: "Inter-State" };
}

function fmtDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtINR(val) {
    return "₹" + Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getMonthOptions() {
    const opts = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
        const from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
        const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        const to = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${lastDay}`;
        opts.push({ label, from, to });
    }
    return opts;
}

export default function MasterGSTReport() {
    const { toasts, showToast } = useToast();

    const today = new Date().toISOString().split("T")[0];
    const firstOfMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`;
    const [fromDate, setFromDate] = useState(firstOfMonth);
    const [toDate, setToDate] = useState(today);
    const [selectedMonth, setSelectedMonth] = useState("");

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [invoiceLoading, setInvoiceLoading] = useState(null);

    const monthOptions = getMonthOptions();

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiFetch("/api/orders");
            const list = (data || []).map(o => {
                const gst = computeGstBreakdown(o);
                const taxable = Number(o.total_amount || 0) - Number(o.tax_amount || 0) - Number(o.shipping_amount || 0);
                return {
                    id: o.id,
                    orderId: o.order_id || o.id,
                    createdAt: o.created_at,
                    customerName: o.customer_name || "—",
                    country: o.country || "—",
                    address: o.address || "",
                    totalAmount: Number(o.total_amount || 0),
                    shippingAmount: Number(o.shipping_amount || 0),
                    taxAmount: Number(o.tax_amount || 0),
                    taxableValue: Math.max(0, taxable),
                    cgst: gst.cgst,
                    sgst: gst.sgst,
                    igst: gst.igst,
                    supplyType: gst.supplyType,
                    status: o.status,
                    items: o.items,
                    contact: o.contact,
                    phone: o.phone,
                    statusHistory: o.status_history,
                    designerUsername: o.designer_username,
                    designerEarnings: Number(o.designer_earnings || 0),
                    mfgEarnings: Number(o.mfg_earnings || 0),
                    platformEarnings: Number(o.platform_earnings || 0),
                };
            });
            setOrders(list);
        } catch (err) {
            console.error(err);
            showToast("Failed to fetch orders", "error");
        } finally {
            setLoading(false);
        }
    }, []); // eslint-disable-line

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const filtered = orders.filter(o => {
        if (!o.createdAt) return false;
        const d = o.createdAt.split("T")[0];
        return d >= fromDate && d <= toDate;
    });

    const totals = filtered.reduce((acc, o) => {
        acc.count++;
        acc.revenue += o.totalAmount;
        acc.taxable += o.taxableValue;
        acc.gst += o.taxAmount;
        acc.cgst += o.cgst;
        acc.sgst += o.sgst;
        acc.igst += o.igst;
        acc.shipping += o.shippingAmount;
        return acc;
    }, { count: 0, revenue: 0, taxable: 0, gst: 0, cgst: 0, sgst: 0, igst: 0, shipping: 0 });

    const applyMonth = (val) => {
        setSelectedMonth(val);
        if (!val) return;
        const opt = monthOptions.find(m => m.label === val);
        if (opt) { setFromDate(opt.from); setToDate(opt.to); }
    };

    const downloadInvoice = async (order) => {
        setInvoiceLoading(order.id);
        try {
            const { generateInvoice } = await import("../../utils/invoiceGenerator");
            generateInvoice(order);
        } catch (err) {
            console.error(err);
            showToast("Invoice generation failed", "error");
        } finally {
            setInvoiceLoading(null);
        }
    };

    const exportCSV = () => {
        const headers = [
            "Order ID","Date","Customer","Country","Supply Type",
            "Total Amount (Rs)","Taxable Value (Rs)","GST Rate Approx",
            "CGST (Rs)","SGST (Rs)","IGST (Rs)","Total GST (Rs)","Shipping (Rs)","Status"
        ];
        const rows = filtered.map(o => [
            o.orderId,
            fmtDate(o.createdAt),
            o.customerName,
            o.country,
            o.supplyType,
            o.totalAmount.toFixed(2),
            o.taxableValue.toFixed(2),
            o.taxableValue > 0 ? ((o.taxAmount / o.taxableValue) * 100).toFixed(1) + "%" : "0%",
            o.cgst.toFixed(2),
            o.sgst.toFixed(2),
            o.igst.toFixed(2),
            o.taxAmount.toFixed(2),
            o.shippingAmount.toFixed(2),
            o.status
        ]);
        rows.push([]);
        rows.push(["TOTALS","","","","",
            totals.revenue.toFixed(2),
            totals.taxable.toFixed(2),
            "",
            totals.cgst.toFixed(2),
            totals.sgst.toFixed(2),
            totals.igst.toFixed(2),
            totals.gst.toFixed(2),
            totals.shipping.toFixed(2),
            `${totals.count} orders`
        ]);
        const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `GST_Report_${fromDate}_to_${toDate}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("CSV exported successfully!", "success");
    };

    const CSS = `
        ${TOAST_CSS}
        .gst-page { min-height:100vh; background:#f5f5f0; padding:30px 3%; font-family:-apple-system,BlinkMacSystemFont,'Inter','Montserrat',sans-serif; }
        .gst-hero { background:linear-gradient(135deg,#0d0d0f 0%,#1a1a20 100%); border-radius:16px; padding:28px 32px; margin-bottom:28px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px; border:1px solid rgba(197,160,89,0.2); }
        .gst-hero h1 { font-family:'Cinzel',serif; font-size:1.6rem; font-weight:800; color:#fff; letter-spacing:2px; margin:0 0 4px; }
        .gst-hero p { color:rgba(197,160,89,0.85); font-size:0.78rem; letter-spacing:1.5px; text-transform:uppercase; margin:0; }
        .gst-btn-csv { display:flex; align-items:center; gap:8px; padding:10px 20px; background:linear-gradient(135deg,#2e7d32,#1b5e20); color:#fff; border:none; border-radius:8px; font-size:0.8rem; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; cursor:pointer; transition:all 0.2s; }
        .gst-btn-csv:hover { background:linear-gradient(135deg,#388e3c,#2e7d32); transform:translateY(-1px); }
        .gst-filter-bar { background:#fff; border:1px solid #e5e7eb; border-radius:14px; padding:20px 24px; margin-bottom:24px; display:flex; align-items:flex-end; gap:16px; flex-wrap:wrap; }
        .gst-filter-group { display:flex; flex-direction:column; gap:5px; }
        .gst-filter-group label { font-size:0.7rem; font-weight:700; letter-spacing:0.8px; text-transform:uppercase; color:#6b7280; }
        .gst-filter-group input, .gst-filter-group select { padding:9px 13px; border:1.5px solid #e5e7eb; border-radius:8px; font-size:0.85rem; color:#111; background:#fafafa; outline:none; transition:border-color 0.2s; min-width:150px; }
        .gst-filter-group input:focus, .gst-filter-group select:focus { border-color:#C5A059; background:#fff; }
        .gst-divider { height:32px; width:1px; background:#e5e7eb; margin:0 4px; }
        .gst-summary-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:16px; margin-bottom:28px; }
        .gst-card { background:#fff; border:1px solid #e5e7eb; border-radius:14px; padding:20px 20px 16px; position:relative; overflow:hidden; transition:box-shadow 0.2s; }
        .gst-card:hover { box-shadow:0 4px 20px rgba(0,0,0,0.07); }
        .gst-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:var(--card-accent,#C5A059); }
        .gst-card-icon { font-size:1.1rem; margin-bottom:10px; color:var(--card-accent,#C5A059); }
        .gst-card-label { font-size:0.68rem; font-weight:700; letter-spacing:0.8px; text-transform:uppercase; color:#6b7280; margin-bottom:6px; }
        .gst-card-value { font-size:1.25rem; font-weight:800; color:#111; font-family:'Montserrat',sans-serif; }
        .gst-card-sub { font-size:0.7rem; color:#9ca3af; margin-top:3px; }
        .gst-table-wrap { background:#fff; border:1px solid #e5e7eb; border-radius:16px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.04); }
        .gst-table-header { padding:18px 24px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #f0f0f0; }
        .gst-table-header h3 { font-size:0.9rem; font-weight:800; letter-spacing:1px; text-transform:uppercase; color:#111; margin:0; }
        .gst-count-badge { background:#f3f4f6; color:#374151; font-size:0.72rem; font-weight:700; padding:4px 12px; border-radius:20px; }
        .gst-table-scroll { overflow-x:auto; }
        .gst-table { width:100%; border-collapse:collapse; font-size:0.8rem; }
        .gst-table th { padding:12px 14px; text-align:left; font-size:0.68rem; font-weight:700; letter-spacing:0.8px; text-transform:uppercase; color:#6b7280; background:#f9fafb; border-bottom:1px solid #f0f0f0; white-space:nowrap; }
        .gst-table td { padding:12px 14px; border-bottom:1px solid #f5f5f5; vertical-align:middle; color:#374151; }
        .gst-table tr:last-child td { border-bottom:none; }
        .gst-table tr:hover td { background:#fafaf8; }
        .gst-order-id { font-family:'Courier New',monospace; font-size:0.72rem; font-weight:700; color:#111; background:#f3f4f6; padding:3px 7px; border-radius:5px; white-space:nowrap; }
        .gst-supply-badge { display:inline-block; padding:3px 8px; border-radius:20px; font-size:0.65rem; font-weight:700; white-space:nowrap; }
        .gst-supply-intra { background:#ecfdf5; color:#065f46; }
        .gst-supply-inter { background:#eff6ff; color:#1e40af; }
        .gst-supply-export { background:#fdf4ff; color:#6b21a8; }
        .gst-tax-cell { font-weight:600; color:#92400e; }
        .gst-btn-inv { display:inline-flex; align-items:center; gap:5px; padding:6px 12px; background:#000; color:#C5A059; border:none; border-radius:6px; font-size:0.7rem; font-weight:700; cursor:pointer; transition:all 0.2s; white-space:nowrap; text-transform:uppercase; letter-spacing:0.4px; }
        .gst-btn-inv:hover { background:#C5A059; color:#000; }
        .gst-btn-inv:disabled { opacity:0.5; cursor:not-allowed; }
        .gst-empty { text-align:center; padding:60px 20px; color:#9ca3af; }
        .gst-empty i { font-size:2.5rem; margin-bottom:12px; display:block; opacity:0.4; }
        .gst-totals-row td { background:#f9fafb; font-weight:800; color:#111; border-top:2px solid #e5e7eb; }
        @media (max-width:768px) {
            .gst-page { padding:16px 4%; }
            .gst-hero { padding:20px; }
            .gst-hero h1 { font-size:1.2rem; }
            .gst-summary-grid { grid-template-columns:repeat(2,1fr); }
            .gst-filter-bar { flex-direction:column; align-items:stretch; }
            .gst-divider { display:none; }
        }
    `;

    return (
        <>
            <style>{CSS}</style>
            <ToastContainer toasts={toasts} />
            <div className="gst-page">
                <BackButton />
                <div className="gst-hero">
                    <div>
                        <h1>GST Report</h1>
                        <p>Evores Technology LLP &middot; GSTIN: 37AAMFE8739J1ZQ &middot; HSN: 6109</p>
                    </div>
                    <div style={{ display:"flex", gap:"12px" }}>
                        <button className="gst-btn-csv" onClick={exportCSV} disabled={filtered.length === 0}>
                            <i className="fas fa-download"></i> Export CSV
                        </button>
                    </div>
                </div>

                <div className="gst-filter-bar">
                    <div className="gst-filter-group">
                        <label>Quick Month</label>
                        <select value={selectedMonth} onChange={e => applyMonth(e.target.value)}>
                            <option value="">Select Month</option>
                            {monthOptions.map(m => (
                                <option key={m.label} value={m.label}>{m.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="gst-divider" />
                    <div className="gst-filter-group">
                        <label>From Date</label>
                        <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setSelectedMonth(""); }} />
                    </div>
                    <div className="gst-filter-group">
                        <label>To Date</label>
                        <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setSelectedMonth(""); }} />
                    </div>
                </div>

                <div className="gst-summary-grid">
                    <div className="gst-card" style={{"--card-accent":"#C5A059"}}>
                        <div className="gst-card-icon"><i className="fas fa-receipt"></i></div>
                        <div className="gst-card-label">Total Orders</div>
                        <div className="gst-card-value">{totals.count}</div>
                        <div className="gst-card-sub">in selected range</div>
                    </div>
                    <div className="gst-card" style={{"--card-accent":"#1d4ed8"}}>
                        <div className="gst-card-icon"><i className="fas fa-rupee-sign"></i></div>
                        <div className="gst-card-label">Total Revenue</div>
                        <div className="gst-card-value">{fmtINR(totals.revenue)}</div>
                        <div className="gst-card-sub">incl. GST &amp; shipping</div>
                    </div>
                    <div className="gst-card" style={{"--card-accent":"#059669"}}>
                        <div className="gst-card-icon"><i className="fas fa-tags"></i></div>
                        <div className="gst-card-label">Taxable Value</div>
                        <div className="gst-card-value">{fmtINR(totals.taxable)}</div>
                        <div className="gst-card-sub">excl. GST &amp; shipping</div>
                    </div>
                    <div className="gst-card" style={{"--card-accent":"#d97706"}}>
                        <div className="gst-card-icon"><i className="fas fa-file-invoice-dollar"></i></div>
                        <div className="gst-card-label">Total GST Collected</div>
                        <div className="gst-card-value">{fmtINR(totals.gst)}</div>
                        <div className="gst-card-sub">GST payable to Govt</div>
                    </div>
                    <div className="gst-card" style={{"--card-accent":"#7c3aed"}}>
                        <div className="gst-card-icon"><i className="fas fa-balance-scale"></i></div>
                        <div className="gst-card-label">CGST</div>
                        <div className="gst-card-value">{fmtINR(totals.cgst)}</div>
                        <div className="gst-card-sub">Intra-state (Central)</div>
                    </div>
                    <div className="gst-card" style={{"--card-accent":"#0891b2"}}>
                        <div className="gst-card-icon"><i className="fas fa-balance-scale-right"></i></div>
                        <div className="gst-card-label">SGST</div>
                        <div className="gst-card-value">{fmtINR(totals.sgst)}</div>
                        <div className="gst-card-sub">Intra-state (State)</div>
                    </div>
                    <div className="gst-card" style={{"--card-accent":"#e11d48"}}>
                        <div className="gst-card-icon"><i className="fas fa-globe-asia"></i></div>
                        <div className="gst-card-label">IGST</div>
                        <div className="gst-card-value">{fmtINR(totals.igst)}</div>
                        <div className="gst-card-sub">Inter-state / Imports</div>
                    </div>
                </div>

                <div className="gst-table-wrap">
                    <div className="gst-table-header">
                        <h3>Order-Wise GST Breakdown</h3>
                        <span className="gst-count-badge">{filtered.length} orders</span>
                    </div>
                    {loading ? (
                        <div className="gst-empty">
                            <i className="fas fa-spinner fa-spin"></i>
                            <p>Loading orders...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="gst-empty">
                            <i className="fas fa-search"></i>
                            <p>No orders found in the selected date range.</p>
                        </div>
                    ) : (
                        <div className="gst-table-scroll">
                            <table className="gst-table">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Date</th>
                                        <th>Customer</th>
                                        <th>Supply Type</th>
                                        <th>Taxable Value</th>
                                        <th>CGST</th>
                                        <th>SGST</th>
                                        <th>IGST</th>
                                        <th>Total GST</th>
                                        <th>Grand Total</th>
                                        <th>Invoice</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(o => (
                                        <tr key={o.id}>
                                            <td><span className="gst-order-id">{o.orderId}</span></td>
                                            <td style={{whiteSpace:"nowrap"}}>{fmtDate(o.createdAt)}</td>
                                            <td style={{maxWidth:"140px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.customerName}</td>
                                            <td>
                                                <span className={`gst-supply-badge ${o.supplyType === "Export" ? "gst-supply-export" : o.supplyType.includes("Intra") ? "gst-supply-intra" : "gst-supply-inter"}`}>
                                                    {o.supplyType}
                                                </span>
                                            </td>
                                            <td style={{fontWeight:600}}>{fmtINR(o.taxableValue)}</td>
                                            <td className="gst-tax-cell">{o.cgst > 0 ? fmtINR(o.cgst) : "—"}</td>
                                            <td className="gst-tax-cell">{o.sgst > 0 ? fmtINR(o.sgst) : "—"}</td>
                                            <td className="gst-tax-cell">{o.igst > 0 ? fmtINR(o.igst) : "—"}</td>
                                            <td style={{fontWeight:700,color:"#92400e"}}>{fmtINR(o.taxAmount)}</td>
                                            <td style={{fontWeight:700}}>{fmtINR(o.totalAmount)}</td>
                                            <td>
                                                <button
                                                    className="gst-btn-inv"
                                                    onClick={() => downloadInvoice(o)}
                                                    disabled={invoiceLoading === o.id}
                                                >
                                                    {invoiceLoading === o.id
                                                        ? <><i className="fas fa-spinner fa-spin"></i> Loading...</>
                                                        : <><i className="fas fa-file-pdf"></i> PDF</>}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="gst-totals-row">
                                        <td colSpan={4} style={{textAlign:"right",paddingRight:"14px"}}>
                                            TOTALS ({filtered.length} orders)
                                        </td>
                                        <td>{fmtINR(totals.taxable)}</td>
                                        <td>{fmtINR(totals.cgst)}</td>
                                        <td>{fmtINR(totals.sgst)}</td>
                                        <td>{fmtINR(totals.igst)}</td>
                                        <td style={{color:"#92400e"}}>{fmtINR(totals.gst)}</td>
                                        <td>{fmtINR(totals.revenue)}</td>
                                        <td></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
