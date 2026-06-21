import React, { useState, useEffect } from "react";
import { apiFetch } from "../../api";
import "../../styles/admin.css";
import BackButton from "../../components/BackButton";
import { useToast, ToastContainer, TOAST_CSS } from "../../components/useToast";

const styles = `
    .bp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-top: 20px; }
    .bp-card { background: #fff; border: 1px solid #e8e8e8; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; }
    .bp-card:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,0.1); }
    .bp-card__img { width: 100%; height: 200px; object-fit: cover; background: #f5f5f5; display: flex; align-items: center; justify-content: center; color: #ccc; font-size: 3rem; }
    .bp-card__img img { width: 100%; height: 100%; object-fit: cover; }
    .bp-card__body { padding: 16px; }
    .bp-card__title { font-size: 1rem; font-weight: 700; color: var(--admin-dark); text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px; }
    .bp-card__mfg { font-size: 0.78rem; color: #888; margin-bottom: 10px; }
    .bp-card__meta { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
    .bp-tag { background: var(--admin-light); border: 1px solid var(--admin-border); border-radius: 4px; padding: 2px 8px; font-size: 0.72rem; font-weight: 600; color: var(--admin-dark); text-transform: uppercase; }
    .bp-tag--gold { background: rgba(197,160,89,0.1); border-color: rgba(197,160,89,0.4); color: #a07820; }
    .bp-card__colors { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
    .bp-color-swatch { width: 22px; height: 22px; border-radius: 50%; border: 2px solid rgba(0,0,0,0.1); cursor: help; }
    .bp-card__sizes { font-size: 0.75rem; color: #666; }
    .bp-card__cost { font-size: 1.1rem; font-weight: 700; color: #a07820; margin-top: 10px; }
    .bp-status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
    .bp-status-badge--active { background: rgba(34,197,94,0.1); color: #16a34a; }
    .bp-status-badge--inactive { background: rgba(239,68,68,0.1); color: #dc2626; }
    .bp-filter-bar { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; }
    .bp-filter-bar select, .bp-filter-bar input { padding: 8px 12px; border: 1px solid var(--admin-border); border-radius: 6px; font-size: 0.85rem; }
    .bp-empty { text-align: center; padding: 60px 20px; color: #aaa; }
    .bp-empty i { font-size: 3rem; margin-bottom: 16px; display: block; }
    .bp-printing-styles { margin-top: 8px; font-size: 0.75rem; color: #666; }
    .bp-printing-styles span { display: inline-block; background: #f0f0f0; border-radius: 4px; padding: 1px 7px; margin: 2px 2px 0 0; font-size: 0.7rem; }
    .bp-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .bp-modal { background: #fff; border-radius: 12px; max-width: 700px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 30px; position: relative; }
    .bp-modal__close { position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 1.4rem; cursor: pointer; color: #666; }
    .bp-color-row { display: flex; gap: 12px; align-items: flex-start; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
    .bp-color-row:last-child { border-bottom: none; }
    .bp-color-images { display: flex; gap: 8px; }
    .bp-color-images img { width: 80px; height: 80px; object-fit: cover; border-radius: 6px; border: 1px solid #eee; }
`;

export default function MasterProducts() {
    const { toasts, showToast } = useToast();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [filterMfg, setFilterMfg] = useState("all");
    const [filterCategory, setFilterCategory] = useState("all");
    const [selected, setSelected] = useState(null);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const data = await apiFetch("/api/products");
            setProducts(data || []);
        } catch (err) {
            setError("Failed to load base products.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProducts(); }, []);

    const mfgList = [...new Set(products.map(p => p.mfg_name).filter(Boolean))];
    const categoryList = [...new Set(products.map(p => p.category).filter(Boolean))];
    const filtered = products.filter(p => {
        const q = search.toLowerCase();
        return (!q || p.title?.toLowerCase().includes(q) || p.mfg_name?.toLowerCase().includes(q))
            && (filterMfg === "all" || p.mfg_name === filterMfg)
            && (filterCategory === "all" || p.category === filterCategory);
    });

    return (
        <div className="adm-page">
            <style>{styles}</style>
            <style>{TOAST_CSS}</style>
            <ToastContainer toasts={toasts} />
            <BackButton />
            <div className="adm-page__header">
                <div>
                    <h1 className="adm-page__title">BASE PRODUCTS</h1>
                    <p className="adm-page__subtitle">Manufacturer-listed blank garments that designers design on. Not visible to customers.</p>
                </div>
                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                    <span style={{ fontSize:"0.85rem", color:"#888" }}>{filtered.length} product{filtered.length !== 1 ? "s" : ""}</span>
                    <button className="adm-btn adm-btn--secondary" onClick={fetchProducts} style={{ padding:"8px 16px", fontSize:"0.8rem" }}>
                        <i className="fas fa-sync-alt" style={{ marginRight:6 }} />Refresh
                    </button>
                </div>
            </div>

            <div className="bp-filter-bar">
                <input type="text" placeholder="Search products or manufacturers..." value={search} onChange={e => setSearch(e.target.value)} style={{ minWidth:240 }} />
                <select value={filterMfg} onChange={e => setFilterMfg(e.target.value)}>
                    <option value="all">All Manufacturers</option>
                    {mfgList.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                    <option value="all">All Categories</option>
                    {categoryList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            <div style={{ background:"rgba(197,160,89,0.08)", border:"1px solid rgba(197,160,89,0.3)", borderRadius:8, padding:"10px 16px", fontSize:"0.82rem", color:"#8a6a20", marginBottom:12, display:"flex", alignItems:"center", gap:10 }}>
                <i className="fas fa-info-circle" />
                <span>Base products are added by <strong>manufacturers</strong>. Designers pick from these to create their designs. <strong>Not visible to customers.</strong></span>
            </div>

            {loading ? (
                <div className="adm-loading"><i className="fas fa-spinner fa-spin" style={{ marginRight:8 }} />Loading...</div>
            ) : error ? (
                <div className="adm-error">{error}</div>
            ) : filtered.length === 0 ? (
                <div className="bp-empty">
                    <i className="fas fa-box-open" />
                    <p style={{ fontWeight:600 }}>No base products found</p>
                    <p style={{ fontSize:"0.85rem" }}>Manufacturers add base products from their dashboard.</p>
                </div>
            ) : (
                <div className="bp-grid">
                    {filtered.map(p => (
                        <div key={p.id} className="bp-card" onClick={() => setSelected(p)}>
                            <div className="bp-card__img">
                                {p.cover_image ? <img src={p.cover_image} alt={p.title} /> : <i className="fas fa-tshirt" />}
                            </div>
                            <div className="bp-card__body">
                                <h3 className="bp-card__title">{p.title}</h3>
                                <div className="bp-card__mfg"><i className="fas fa-industry" style={{ marginRight:5 }} />{p.mfg_name || "Unknown"}</div>
                                <div className="bp-card__meta">
                                    <span className="bp-tag">{p.category || "N/A"}</span>
                                    <span className="bp-tag">{p.gender || "Unisex"}</span>
                                    <span className={`bp-status-badge ${p.available !== false ? "bp-status-badge--active" : "bp-status-badge--inactive"}`}>
                                        {p.available !== false ? "Available" : "Unavailable"}
                                    </span>
                                </div>
                                {p.colors?.length > 0 && (
                                    <div className="bp-card__colors">
                                        {p.colors.slice(0,8).map((c,i) => (
                                            <div key={i} className="bp-color-swatch" style={{ background: c.color || "#ccc" }} title={c.colorName} />
                                        ))}
                                        {p.colors.length > 8 && <span style={{ fontSize:"0.75rem", color:"#888", lineHeight:"22px" }}>+{p.colors.length - 8}</span>}
                                    </div>
                                )}
                                {p.sizes?.length > 0 && <div className="bp-card__sizes"><strong>Sizes:</strong> {p.sizes.join(", ")}</div>}
                                {p.printing_styles?.length > 0 && (
                                    <div className="bp-printing-styles">
                                        <strong>Print:</strong> {p.printing_styles.map((ps,i) => <span key={i}>{ps.style} +?{ps.cost}</span>)}
                                    </div>
                                )}
                                <div className="bp-card__cost">Base Cost: ?{p.cost}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selected && (
                <div className="bp-modal-backdrop" onClick={() => setSelected(null)}>
                    <div className="bp-modal" onClick={e => e.stopPropagation()}>
                        <button className="bp-modal__close" onClick={() => setSelected(null)}><i className="fas fa-times" /></button>
                        <h2 style={{ marginTop:0, textTransform:"uppercase" }}>{selected.title}</h2>
                        <p style={{ color:"#888", fontSize:"0.85rem", marginBottom:16 }}>
                            <i className="fas fa-industry" style={{ marginRight:6 }} />{selected.mfg_name} &nbsp;|&nbsp; {selected.category} &nbsp;|&nbsp; {selected.gender} &nbsp;|&nbsp; <strong>?{selected.cost}</strong> base cost
                        </p>
                        <h4 style={{ marginBottom:10, fontSize:"0.9rem" }}>Colours ({selected.colors?.length || 0})</h4>
                        {(selected.colors || []).map((c,i) => (
                            <div key={i} className="bp-color-row">
                                <div className="bp-color-swatch" style={{ background:c.color, width:30, height:30, flexShrink:0 }} title={c.colorName} />
                                <div>
                                    <div style={{ fontWeight:700, fontSize:"0.85rem", marginBottom:6 }}>{c.colorName}</div>
                                    <div className="bp-color-images">
                                        {c.frontImage && <img src={c.frontImage} alt="Front" />}
                                        {c.backImage && <img src={c.backImage} alt="Back" />}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <h4 style={{ marginTop:16, marginBottom:8, fontSize:"0.9rem" }}>Sizes</h4>
                        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                            {(selected.sizes || []).map(s => <span key={s} className="bp-tag">{s}</span>)}
                        </div>
                        <h4 style={{ marginTop:16, marginBottom:8, fontSize:"0.9rem" }}>Printing Styles</h4>
                        {!(selected.printing_styles?.length) ? <p style={{ color:"#aaa", fontSize:"0.85rem" }}>None defined.</p>
                            : selected.printing_styles.map((ps,i) => (
                                <div key={i} style={{ marginBottom:10 }}>
                                    <span className="bp-tag bp-tag--gold">{ps.style} — ?{ps.cost}</span>
                                    {ps.placements?.length > 0 && (
                                        <div style={{ marginTop:6, display:"flex", gap:6, flexWrap:"wrap" }}>
                                            {ps.placements.map((pl,j) => <span key={j} className="bp-tag" style={{ background:"#f9f9f9" }}>{pl.label}</span>)}
                                        </div>
                                    )}
                                </div>
                            ))
                        }
                        {selected.size_chart_image && (
                            <>
                                <h4 style={{ marginTop:16, marginBottom:8, fontSize:"0.9rem" }}>Size Chart</h4>
                                <img src={selected.size_chart_image} alt="Size Chart" style={{ maxWidth:"100%", borderRadius:8 }} />
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
