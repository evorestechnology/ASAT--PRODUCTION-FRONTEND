import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../api';
import { COUNTRIES } from '../../constants/countries';
import '../../styles/admin.css';

// ─── Helpers ────────────────────────────────────────────────────────────────

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function Toast({ toasts }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 13,
          background: t.type === 'success' ? 'linear-gradient(135deg,#1a6b3a,#22863a)' : 'linear-gradient(135deg,#7f1d1d,#991b1b)',
          color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', minWidth: 240,
          borderLeft: `4px solid ${t.type === 'success' ? '#4ade80' : '#f87171'}`
        }}>
          {t.type === 'success' ? '✅ ' : '❌ '}{t.msg}
        </div>
      ))}
    </div>
  );
}

function Section({ icon, title, children, action }) {
  return (
    <div className="fin-section">
      <div className="fin-section__header">
        <div className="fin-section__title">
          <span className="fin-section__icon">{icon}</span>
          <h2>{title}</h2>
        </div>
        {action}
      </div>
      <div className="fin-section__body">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="fin-field">
      <label className="fin-field__label">{label}{hint && <span className="fin-field__hint"> — {hint}</span>}</label>
      {children}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function MasterFinance() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [toasts, setToasts] = useState([]);

  // ── State ──
  const [markupPct, setMarkupPct] = useState(60);
  const [packingCost, setPackingCost] = useState(50);      // ₹ per piece
  const [operatingCost, setOperatingCost] = useState(100); // ₹ per piece
  const [taxRules, setTaxRules] = useState({
    india: { high_threshold: 2500, high_rate: 18, low_rate: 5 },
    usa_rate: 25, row_rate: 0, country_overrides: []
  });
  const [shippingRules, setShippingRules] = useState({
    mumbai: 100, india: 200, row: 5000, country_overrides: []
  });

  // ── Calculator ──
  const [calc, setCalc] = useState({
    rawCostPerPiece: 0,
    quantity: 1,
    region: 'india',
    selectedCountry: 'India',
  });

  // ────────────────────────────────────────────────────────────────────────────
  const toast = useCallback((msg, type = 'success') => {
    const id = uid();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);

  // ────────────────────────────────────────────────────────────────────────────
  // Load settings
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch('/api/settings');
        if (data.finance_cost_rules) {
          const cr = data.finance_cost_rules;
          if (cr.markup_pct   !== undefined) setMarkupPct(Number(cr.markup_pct));
          if (cr.packing_cost !== undefined) setPackingCost(Number(cr.packing_cost));
          if (cr.operating_cost !== undefined) setOperatingCost(Number(cr.operating_cost));
        }
        if (data.finance_tax_rules)      setTaxRules(data.finance_tax_rules);
        if (data.finance_shipping_rules) setShippingRules(data.finance_shipping_rules);
      } catch {
        toast('Failed to load finance settings', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ────────────────────────────────────────────────────────────────────────────
  // Save helpers
  // ────────────────────────────────────────────────────────────────────────────
  async function saveKey(key, value, label) {
    setSaving(p => ({ ...p, [key]: true }));
    try {
      await apiFetch(`/api/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value }) });
      toast(`${label} saved!`);
    } catch {
      toast(`Failed to save ${label}`, 'error');
    } finally {
      setSaving(p => ({ ...p, [key]: false }));
    }
  }

  const saveMarkup = () => saveKey('finance_cost_rules', {
    markup_pct: Number(markupPct),
    packing_cost: Number(packingCost),
    operating_cost: Number(operatingCost),
  }, 'Cost Rules');
  const saveTax    = () => saveKey('finance_tax_rules', taxRules, 'Tax Rules');
  const saveShip   = () => saveKey('finance_shipping_rules', shippingRules, 'Shipping Rules');

  // ────────────────────────────────────────────────────────────────────────────
  // Tax overrides CRUD
  // ────────────────────────────────────────────────────────────────────────────
  function addTaxOverride() {
    setTaxRules(p => ({ ...p, country_overrides: [...(p.country_overrides || []), { id: uid(), country: '', rate: 0 }] }));
  }
  function removeTaxOverride(id) {
    setTaxRules(p => ({ ...p, country_overrides: p.country_overrides.filter(o => o.id !== id) }));
  }
  function updateTaxOverride(id, field, val) {
    setTaxRules(p => ({ ...p, country_overrides: p.country_overrides.map(o => o.id === id ? { ...o, [field]: val } : o) }));
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Shipping overrides CRUD
  // ────────────────────────────────────────────────────────────────────────────
  function addShippingOverride() {
    setShippingRules(p => ({ ...p, country_overrides: [...(p.country_overrides || []), { id: uid(), country: '', shipping: 0 }] }));
  }
  function removeShippingOverride(id) {
    setShippingRules(p => ({ ...p, country_overrides: p.country_overrides.filter(o => o.id !== id) }));
  }
  function updateShippingOverride(id, field, val) {
    setShippingRules(p => ({ ...p, country_overrides: p.country_overrides.map(o => o.id === id ? { ...o, [field]: val } : o) }));
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Live Calculator
  // ────────────────────────────────────────────────────────────────────────────
  const calcResult = (() => {
    const baseRawCost = Number(calc.rawCostPerPiece) || 0;
    const qty         = Math.max(1, Number(calc.quantity) || 1);
    const pct         = Math.min(99, Math.max(0, Number(markupPct) || 0));
    const packing     = Number(packingCost) || 0;
    const operating   = Number(operatingCost) || 0;

    // Total raw cost per piece = base + packing + operating
    const rawCost = baseRawCost + packing + operating;

    // Markup formula: selling_price = raw_cost / (1 - pct/100)
    const pricePerPiece  = pct < 100 ? rawCost / (1 - pct / 100) : rawCost;
    const markupPerPiece = pricePerPiece - rawCost;

    // Tax
    let taxRate = 0, taxLabel = 'No Tax';
    const region = calc.region;
    if (region === 'mumbai' || region === 'india') {
      const threshold = taxRules.india?.high_threshold ?? 2500;
      const high      = taxRules.india?.high_rate ?? 18;
      const low       = taxRules.india?.low_rate ?? 5;
      taxRate  = pricePerPiece > threshold ? high : low;
      taxLabel = `India GST ${taxRate}%`;
    } else if (region === 'usa') {
      taxRate  = Number(taxRules.usa_rate) || 25;
      taxLabel = `USA Import Duty ${taxRate}%`;
    } else if (region === 'row') {
      taxRate  = Number(taxRules.row_rate) || 0;
      taxLabel = taxRate === 0 ? 'RoW — No Tax' : `RoW ${taxRate}%`;
    } else if (region === 'country') {
      const ovr = (taxRules.country_overrides || []).find(o => o.country === calc.selectedCountry);
      taxRate  = ovr ? Number(ovr.rate) : Number(taxRules.row_rate) || 0;
      taxLabel = `${calc.selectedCountry} — ${taxRate}%`;
    }
    const taxPerPiece = (pricePerPiece * taxRate) / 100;

    // Shipping
    let shipping = 0, shippingLabel = '';
    if (region === 'mumbai') { shipping = Number(shippingRules.mumbai) || 100; shippingLabel = 'Mumbai Local'; }
    else if (region === 'india') { shipping = Number(shippingRules.india) || 200; shippingLabel = 'India'; }
    else if (region === 'usa') {
      const ovr = (shippingRules.country_overrides || []).find(o => o.country === 'United States');
      shipping = ovr ? Number(ovr.shipping) : Number(shippingRules.row) || 5000;
      shippingLabel = 'USA';
    } else if (region === 'row') { shipping = Number(shippingRules.row) || 5000; shippingLabel = 'Rest of World'; }
    else if (region === 'country') {
      const ovr = (shippingRules.country_overrides || []).find(o => o.country === calc.selectedCountry);
      shipping = ovr ? Number(ovr.shipping) : Number(shippingRules.row) || 5000;
      shippingLabel = calc.selectedCountry || 'Country';
    }

    const grandTotal       = (pricePerPiece + taxPerPiece) * qty + shipping;
    const grandTotalPerPc  = grandTotal / qty;

    return { baseRawCost, packing, operating, rawCost, qty, pct, pricePerPiece, markupPerPiece, taxRate, taxLabel, taxPerPiece, shipping, shippingLabel, grandTotal, grandTotalPerPc };
  })();

  const fmt = n => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // ────────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16, color: '#C5A059' }}>
        <div className="adm-spinner" />
        <p>Loading Finance Settings…</p>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="fin-root">
      <Toast toasts={toasts} />

      <div className="fin-page-header">
        <h1>Finance Configuration</h1>
        <p>Master-controlled pricing rules — markup %, tax slabs, and shipping rates. Saved to database and applied at checkout.</p>
      </div>

      <div className="fin-grid">

        {/* ── LEFT: Settings ── */}
        <div className="fin-col fin-col--settings">

          {/* 1. Markup Percentage */}
          <Section icon="📈" title="Markup Percentage"
            action={
              <button className="fin-btn fin-btn--save" disabled={saving.finance_cost_rules} onClick={saveMarkup}>
                {saving.finance_cost_rules ? 'Saving…' : '💾 Save'}
              </button>
            }
          >
          <div className="fin-markup-card">
              <div className="fin-markup-visual">
                <div className="fin-markup-ring" style={{ '--pct': `${Math.min(99, markupPct)}` }}>
                  <span>{markupPct}%</span>
                </div>
                <div className="fin-markup-labels">
                  <div className="fin-markup-label fin-markup-label--cost">
                    <span>Cost (raw)</span>
                    <strong>{100 - Math.min(99, Number(markupPct))}%</strong>
                  </div>
                  <div className="fin-markup-label fin-markup-label--markup">
                    <span>Markup earned</span>
                    <strong>{Math.min(99, Number(markupPct))}%</strong>
                  </div>
                </div>
              </div>
              <Field label="Markup %" hint="Percentage of final selling price that is ASAT's profit">
                <input type="number" className="fin-input" min="1" max="99" step="0.5"
                  value={markupPct}
                  onChange={e => setMarkupPct(e.target.value)} />
              </Field>
              <div className="fin-row-2">
                <Field label="Packing Cost" hint="₹ per piece — charged to customer">
                  <input type="number" className="fin-input" min="0"
                    value={packingCost}
                    onChange={e => setPackingCost(e.target.value)} />
                </Field>
                <Field label="Operating Cost" hint="₹ per piece — charged to customer">
                  <input type="number" className="fin-input" min="0"
                    value={operatingCost}
                    onChange={e => setOperatingCost(e.target.value)} />
                </Field>
              </div>
              <div className="fin-formula-hint">
                Formula: <code>Selling Price = (Base + Packing + Operating) ÷ (1 − Markup% ÷ 100)</code><br />
                <br />
                Example: Base ₹250 + Packing ₹{packingCost} + Operating ₹{operatingCost} = Raw ₹{250 + Number(packingCost) + Number(operatingCost)}, Markup {markupPct}% → Selling Price = <strong>₹{((250 + Number(packingCost) + Number(operatingCost)) / (1 - Number(markupPct) / 100)).toFixed(0)}</strong>
              </div>
            </div>
          </Section>

          {/* 2. Tax Rules */}
          <Section icon="🧾" title="Tax Rules"
            action={
              <button className="fin-btn fin-btn--save" disabled={saving.finance_tax_rules} onClick={saveTax}>
                {saving.finance_tax_rules ? 'Saving…' : '💾 Save'}
              </button>
            }
          >
            <div className="fin-subsection-label">🇮🇳 India — GST</div>
            <div className="fin-row-3">
              <Field label="GST Threshold" hint="₹ price/piece">
                <input type="number" className="fin-input" min="0"
                  value={taxRules.india?.high_threshold ?? 2500}
                  onChange={e => setTaxRules(p => ({ ...p, india: { ...p.india, high_threshold: e.target.value } }))} />
              </Field>
              <Field label="GST if Above" hint="%">
                <input type="number" className="fin-input" min="0" max="100"
                  value={taxRules.india?.high_rate ?? 18}
                  onChange={e => setTaxRules(p => ({ ...p, india: { ...p.india, high_rate: e.target.value } }))} />
              </Field>
              <Field label="GST if Below" hint="%">
                <input type="number" className="fin-input" min="0" max="100"
                  value={taxRules.india?.low_rate ?? 5}
                  onChange={e => setTaxRules(p => ({ ...p, india: { ...p.india, low_rate: e.target.value } }))} />
              </Field>
            </div>

            <div className="fin-row-2" style={{ marginTop: 16 }}>
              <Field label="🇺🇸 USA Import Duty" hint="%">
                <input type="number" className="fin-input" min="0" max="100"
                  value={taxRules.usa_rate ?? 25}
                  onChange={e => setTaxRules(p => ({ ...p, usa_rate: e.target.value }))} />
              </Field>
              <Field label="🌍 Rest of World Default" hint="% (0 = tax-free)">
                <input type="number" className="fin-input" min="0" max="100"
                  value={taxRules.row_rate ?? 0}
                  onChange={e => setTaxRules(p => ({ ...p, row_rate: e.target.value }))} />
              </Field>
            </div>

            <div className="fin-subsection-label" style={{ marginTop: 16 }}>
              Country Tax Overrides
              <button className="fin-btn fin-btn--add fin-btn--small" onClick={addTaxOverride} style={{ marginLeft: 10 }}>+ Add</button>
            </div>
            {(taxRules.country_overrides || []).length === 0 && (
              <div className="fin-empty" style={{ padding: 12 }}>No country overrides set. Defaults (above) will apply.</div>
            )}
            {(taxRules.country_overrides || []).map(o => (
              <div key={o.id} className="fin-list-item">
                <div className="fin-list-item__fields">
                  <Field label="Country">
                    <select className="fin-input" value={o.country}
                      onChange={e => updateTaxOverride(o.id, 'country', e.target.value)}>
                      <option value="">— Select Country —</option>
                      {COUNTRIES.filter(c => c.code !== 'IN').map(c => (
                        <option key={c.code} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Tax Rate" hint="%">
                    <input type="number" className="fin-input" min="0" max="100"
                      value={o.rate}
                      onChange={e => updateTaxOverride(o.id, 'rate', e.target.value)} />
                  </Field>
                </div>
                <button className="fin-btn fin-btn--remove" onClick={() => removeTaxOverride(o.id)}>✕</button>
              </div>
            ))}
          </Section>

          {/* 3. Shipping Rules */}
          <Section icon="🚚" title="Shipping Rates"
            action={
              <button className="fin-btn fin-btn--save" disabled={saving.finance_shipping_rules} onClick={saveShip}>
                {saving.finance_shipping_rules ? 'Saving…' : '💾 Save'}
              </button>
            }
          >
            <div className="fin-row-3">
              <Field label="📍 Mumbai (Local)" hint="₹ flat">
                <input type="number" className="fin-input" min="0"
                  value={shippingRules.mumbai}
                  onChange={e => setShippingRules(p => ({ ...p, mumbai: e.target.value }))} />
              </Field>
              <Field label="🇮🇳 India (Non-Mumbai)" hint="₹ flat">
                <input type="number" className="fin-input" min="0"
                  value={shippingRules.india}
                  onChange={e => setShippingRules(p => ({ ...p, india: e.target.value }))} />
              </Field>
              <Field label="🌍 Rest of World Default" hint="₹ flat">
                <input type="number" className="fin-input" min="0"
                  value={shippingRules.row}
                  onChange={e => setShippingRules(p => ({ ...p, row: e.target.value }))} />
              </Field>
            </div>

            <div className="fin-subsection-label" style={{ marginTop: 16 }}>
              Country Shipping Overrides
              <button className="fin-btn fin-btn--add fin-btn--small" onClick={addShippingOverride} style={{ marginLeft: 10 }}>+ Add</button>
            </div>
            {(shippingRules.country_overrides || []).length === 0 && (
              <div className="fin-empty" style={{ padding: 12 }}>No country overrides set. Default RoW rate will apply.</div>
            )}
            {(shippingRules.country_overrides || []).map(o => (
              <div key={o.id} className="fin-list-item">
                <div className="fin-list-item__fields">
                  <Field label="Country">
                    <select className="fin-input" value={o.country}
                      onChange={e => updateShippingOverride(o.id, 'country', e.target.value)}>
                      <option value="">— Select Country —</option>
                      {COUNTRIES.filter(c => c.code !== 'IN').map(c => (
                        <option key={c.code} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Shipping Cost" hint="₹ flat">
                    <input type="number" className="fin-input" min="0"
                      value={o.shipping}
                      onChange={e => updateShippingOverride(o.id, 'shipping', e.target.value)} />
                  </Field>
                </div>
                <button className="fin-btn fin-btn--remove" onClick={() => removeShippingOverride(o.id)}>✕</button>
              </div>
            ))}
          </Section>
        </div>

        {/* ── RIGHT: Live Calculator ── */}
        <div className="fin-col fin-col--calc">
          <div className="fin-calc">
            <div className="fin-calc__header">
              <span className="fin-calc__icon">🧮</span>
              <div>
                <h2>Price Simulator</h2>
                <p>Enter raw cost to see markup, tax &amp; shipping applied live.</p>
              </div>
            </div>

            <div className="fin-calc__body">
              <div className="fin-calc__group">
                <div className="fin-calc__group-label">Base Cost (before packing &amp; operating)</div>
                <Field label="Base Cost Per Piece (₹)" hint="Item cost + printing — packing &amp; operating auto-added from settings">
                  <input type="number" className="fin-input" min="0"
                    value={calc.rawCostPerPiece}
                    onChange={e => setCalc(p => ({ ...p, rawCostPerPiece: e.target.value }))} />
                </Field>
                <Field label="Quantity (pieces)">
                  <input type="number" className="fin-input" min="1"
                    value={calc.quantity}
                    onChange={e => setCalc(p => ({ ...p, quantity: e.target.value }))} />
                </Field>
              </div>

              <div className="fin-calc__group">
                <div className="fin-calc__group-label">Destination</div>
                <Field label="Region">
                  <select className="fin-input" value={calc.region}
                    onChange={e => setCalc(p => ({ ...p, region: e.target.value, selectedCountry: 'India' }))}>
                    <option value="mumbai">📍 Mumbai (Local)</option>
                    <option value="india">🇮🇳 India (Non-Mumbai)</option>
                    <option value="usa">🇺🇸 United States</option>
                    <option value="row">🌍 Rest of World</option>
                    <option value="country">🌐 Specific Country</option>
                  </select>
                </Field>
                {calc.region === 'country' && (
                  <Field label="Select Country">
                    <select className="fin-input" value={calc.selectedCountry}
                      onChange={e => setCalc(p => ({ ...p, selectedCountry: e.target.value }))}>
                      <option value="">— Select —</option>
                      {COUNTRIES.filter(c => c.code !== 'IN' && c.code !== 'US').map(c => (
                        <option key={c.code} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </Field>
                )}
              </div>

              <div className="fin-calc__results">
                <div className="fin-calc__results-title">📊 Price Breakdown</div>
                <div className="fin-calc__result-rows">
                  <div className="fin-calc__result-row">
                    <span>Base Cost / Piece</span>
                    <span>{fmt(calcResult.baseRawCost)}</span>
                  </div>
                  <div className="fin-calc__result-row">
                    <span>Packing Cost / Piece</span>
                    <span>+ {fmt(calcResult.packing)}</span>
                  </div>
                  <div className="fin-calc__result-row">
                    <span>Operating Cost / Piece</span>
                    <span>+ {fmt(calcResult.operating)}</span>
                  </div>
                  <div className="fin-calc__result-row fin-calc__result-row--subtotal">
                    <span>Total Raw Cost / Piece</span>
                    <span>{fmt(calcResult.rawCost)}</span>
                  </div>
                  <div className="fin-calc__result-row fin-calc__result-row--subtotal">
                    <span>Selling Price / Piece</span>
                    <span className="fin-calc__highlight">{fmt(calcResult.pricePerPiece)}</span>
                  </div>
                  <div className="fin-calc__result-row">
                    <span>Markup Earned / Piece ({calcResult.pct}%)</span>
                    <span>+ {fmt(calcResult.markupPerPiece)}</span>
                  </div>
                  <div className="fin-calc__result-row">
                    <span>{calcResult.taxLabel}</span>
                    <span>+ {fmt(calcResult.taxPerPiece)} ({calcResult.taxRate}%)</span>
                  </div>
                  <div className="fin-calc__result-row fin-calc__result-row--subtotal">
                    <span>Price / Piece (incl. tax)</span>
                    <span>{fmt(calcResult.pricePerPiece + calcResult.taxPerPiece)}</span>
                  </div>
                  <div className="fin-calc__result-row">
                    <span>× {calcResult.qty} pieces</span>
                    <span>{fmt((calcResult.pricePerPiece + calcResult.taxPerPiece) * calcResult.qty)}</span>
                  </div>
                  <div className="fin-calc__result-row">
                    <span>Shipping ({calcResult.shippingLabel})</span>
                    <span>+ {fmt(calcResult.shipping)}</span>
                  </div>
                </div>

                <div className="fin-calc__grand-total">
                  <span>Grand Total</span>
                  <span>{fmt(calcResult.grandTotal)}</span>
                </div>
                <div className="fin-calc__per-piece-final">
                  Effective per piece (all-in): <strong>{fmt(calcResult.grandTotalPerPc)}</strong>
                </div>
              </div>

              {/* Markup explain */}
              {calcResult.rawCost > 0 && (
                <div style={{
                  marginTop: 14, padding: '12px 14px',
                  background: 'rgba(197,160,89,0.08)', borderRadius: 10,
                  border: '1px solid rgba(197,160,89,0.2)', fontSize: '0.78rem', color: '#bbb',
                  lineHeight: 1.6
                }}>
                  <strong style={{ color: '#C5A059' }}>Markup breakdown:</strong><br />
                  Raw cost {fmt(calcResult.rawCost)} is {(100 - calcResult.pct).toFixed(1)}% of selling price {fmt(calcResult.pricePerPiece)}.<br />
                  ASAT earns {fmt(calcResult.markupPerPiece)} per piece ({calcResult.pct}% markup).
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
