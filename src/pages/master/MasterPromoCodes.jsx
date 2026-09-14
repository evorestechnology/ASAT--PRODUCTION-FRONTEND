import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { apiFetch } from '../../api';
import BackButton from '../../components/BackButton';
import '../../styles/admin.css';

function Toast({ toasts }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            padding: '12px 20px',
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 13,
            background: t.type === 'success' ? '#111114' : '#7f1d1d',
            color: '#fff',
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            minWidth: 240,
            borderLeft: `4px solid ${t.type === 'success' ? '#10b981' : '#ef4444'}`
          }}
        >
          {t.type === 'success' ? '✅ ' : '❌ '}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

export default function MasterPromoCodes() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);

  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDiscountType, setFormDiscountType] = useState('percentage');
  const [formDiscountValue, setFormDiscountValue] = useState('');
  const [formMinOrder, setFormMinOrder] = useState('0');
  const [hasExpiry, setHasExpiry] = useState(false);
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  const showToast = useCallback((msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Fetch all promo codes
  const loadPromos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/promos');
      if (Array.isArray(data)) {
        setPromos(data);
      }
    } catch (err) {
      console.error('Failed to load promo codes:', err);
      showToast(err.message || 'Failed to load promo codes', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadPromos();
  }, [loadPromos]);

  // Open modal for new promo code
  const handleOpenCreate = () => {
    setEditingPromo(null);
    setFormCode('');
    setFormDescription('');
    setFormDiscountType('percentage');
    setFormDiscountValue('');
    setFormMinOrder('0');
    setHasExpiry(false);
    setFormExpiryDate('');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  // Open modal for editing existing promo
  const handleOpenEdit = (promo) => {
    setEditingPromo(promo);
    setFormCode(promo.code || '');
    setFormDescription(promo.description || '');
    setFormDiscountType(promo.discountType || 'percentage');
    setFormDiscountValue(String(promo.discountValue ?? ''));
    setFormMinOrder(String(promo.minOrderAmount ?? 0));
    setHasExpiry(Boolean(promo.expiresAt));
    if (promo.expiresAt) {
      // format YYYY-MM-DD for date input
      const d = new Date(promo.expiresAt);
      const isoDate = d.toISOString().split('T')[0];
      setFormExpiryDate(isoDate);
    } else {
      setFormExpiryDate('');
    }
    setFormIsActive(Boolean(promo.isActive));
    setIsModalOpen(true);
  };

  // Save (Create or Update) Promo Code
  const handleSavePromo = async (e) => {
    e.preventDefault();
    if (!formCode.trim()) {
      showToast('Promo code is required.', 'error');
      return;
    }

    const val = parseFloat(formDiscountValue);
    if (isNaN(val) || val <= 0) {
      showToast('Please enter a valid discount value greater than 0.', 'error');
      return;
    }

    if (formDiscountType === 'percentage' && val > 100) {
      showToast('Percentage discount cannot exceed 100%.', 'error');
      return;
    }

    let expiresAt = null;
    if (hasExpiry) {
      if (!formExpiryDate) {
        showToast('Please select an expiry date.', 'error');
        return;
      }
      // End of day UTC
      expiresAt = new Date(`${formExpiryDate}T23:59:59.999Z`).toISOString();
    }

    const payload = {
      code: formCode.trim().toUpperCase(),
      description: formDescription.trim(),
      discountType: formDiscountType,
      discountValue: val,
      minOrderAmount: parseFloat(formMinOrder) || 0,
      expiresAt,
      isActive: formIsActive
    };

    setSaving(true);
    try {
      if (editingPromo) {
        // PUT update
        const res = await apiFetch(`/api/promos/${editingPromo.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast(res.message || `Promo code ${payload.code} updated!`, 'success');
      } else {
        // POST create
        const res = await apiFetch('/api/promos', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast(res.message || `Promo code ${payload.code} created!`, 'success');
      }
      setIsModalOpen(false);
      await loadPromos();
    } catch (err) {
      console.error('Error saving promo code:', err);
      showToast(err.error || err.message || 'Failed to save promo code.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Toggle active status
  const handleToggleActive = async (promo) => {
    try {
      const updatedStatus = !promo.isActive;
      await apiFetch(`/api/promos/${promo.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: updatedStatus })
      });
      showToast(`Promo code ${promo.code} is now ${updatedStatus ? 'Active' : 'Deactivated'}.`, 'success');
      setPromos((prev) =>
        prev.map((p) => (p.id === promo.id ? { ...p, isActive: updatedStatus, status: updatedStatus ? (p.isExpired ? 'expired' : 'active') : 'inactive' } : p))
      );
    } catch (err) {
      console.error('Error toggling promo status:', err);
      showToast(err.message || 'Failed to update promo status', 'error');
    }
  };

  // Delete promo code
  const handleDeletePromo = async (promo) => {
    if (!window.confirm(`Are you sure you want to permanently delete promo code "${promo.code}"?`)) {
      return;
    }
    try {
      await apiFetch(`/api/promos/${promo.id}`, { method: 'DELETE' });
      showToast(`Promo code ${promo.code} deleted.`, 'success');
      setPromos((prev) => prev.filter((p) => p.id !== promo.id));
    } catch (err) {
      console.error('Error deleting promo code:', err);
      showToast(err.message || 'Failed to delete promo code', 'error');
    }
  };

  // Filtered promos
  const filteredPromos = useMemo(() => {
    const q = search.trim().toLowerCase();
    return promos.filter((p) => {
      const matchesSearch =
        (p.code || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (statusFilter === 'active') return p.status === 'active';
      if (statusFilter === 'expired') return p.status === 'expired';
      if (statusFilter === 'inactive') return p.status === 'inactive';

      return true;
    });
  }, [promos, search, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = promos.length;
    const active = promos.filter((p) => p.status === 'active').length;
    const expired = promos.filter((p) => p.status === 'expired').length;
    const inactive = promos.filter((p) => p.status === 'inactive').length;
    return { total, active, expired, inactive };
  }, [promos]);

  return (
    <div className="adm-page">
      <Toast toasts={toasts} />

      {/* Header */}
      <div className="adm-page__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <BackButton />
          <h1 className="adm-page__title" style={{ marginTop: 12 }}>Promo Codes &amp; Discounts</h1>
          <p className="adm-page__subtitle">
            Create and manage customer promo codes, configure percentage or fixed discounts, and set optional expiry dates.
          </p>
        </div>
        <button
          className="adm-btn adm-btn--gold"
          onClick={handleOpenCreate}
          style={{ padding: '12px 24px', fontSize: 13, fontWeight: 700, borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <i className="fas fa-plus"></i>
          Create Promo Code
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, margin: '24px 0' }}>
        <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: 12, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Promo Codes</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#111', marginTop: 6 }}>{stats.total}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: 12, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '1px' }}>Active &amp; Valid</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981', marginTop: 6 }}>{stats.active}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: 12, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '1px' }}>Expired Codes</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#ef4444', marginTop: 6 }}>{stats.expired}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: 12, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Disabled / Inactive</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#666', marginTop: 6 }}>{stats.inactive}</div>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: 12, padding: 16, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
          <i className="fas fa-search" style={{ color: '#888' }} />
          <input
            type="text"
            placeholder="Search promo codes or descriptions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}>✕</button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'All', value: 'all' },
            { label: 'Active', value: 'active' },
            { label: 'Expired', value: 'expired' },
            { label: 'Inactive', value: 'inactive' }
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              style={{
                background: statusFilter === tab.value ? '#000000' : '#F5F5F5',
                color: statusFilter === tab.value ? '#FFFFFF' : '#444444',
                border: 'none',
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Promo Codes Table */}
      <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#888' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: 24, marginBottom: 12 }} />
            <div>Loading promo codes…</div>
          </div>
        ) : filteredPromos.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#888' }}>
            <i className="fas fa-ticket-alt" style={{ fontSize: 36, color: '#ccc', marginBottom: 12 }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: '#333' }}>No promo codes found</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>
              {search ? 'Try adjusting your search query or filter.' : 'Click "Create Promo Code" to create your first discount coupon.'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#FBFBFA', borderBottom: '1px solid #E5E5E5', color: '#888', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.8px' }}>
                  <th style={{ padding: '14px 20px' }}>Promo Code</th>
                  <th style={{ padding: '14px 20px' }}>Discount</th>
                  <th style={{ padding: '14px 20px' }}>Min. Order</th>
                  <th style={{ padding: '14px 20px' }}>Expiry Date</th>
                  <th style={{ padding: '14px 20px' }}>Status</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPromos.map((promo) => {
                  const isExpired = promo.status === 'expired';
                  const isInactive = promo.status === 'inactive';
                  const expiryDateObj = promo.expiresAt ? new Date(promo.expiresAt) : null;
                  const expiryDisplay = expiryDateObj
                    ? expiryDateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'No Expiry';

                  return (
                    <tr
                      key={promo.id}
                      style={{
                        borderBottom: '1px solid #F0F0F0',
                        background: isInactive ? '#FAFAFA' : 'transparent',
                        opacity: isInactive ? 0.75 : 1
                      }}
                    >
                      {/* Code + Description */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 800,
                              fontSize: 14,
                              background: '#F4EFE6',
                              color: '#92400E',
                              border: '1px dashed #D97706',
                              padding: '4px 10px',
                              borderRadius: 6,
                              letterSpacing: '1px'
                            }}
                          >
                            {promo.code}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(promo.code);
                              showToast(`Copied ${promo.code} to clipboard!`);
                            }}
                            title="Copy code"
                            style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 4 }}
                          >
                            <i className="far fa-copy" />
                          </button>
                        </div>
                        {promo.description && (
                          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{promo.description}</div>
                        )}
                      </td>

                      {/* Discount value */}
                      <td style={{ padding: '16px 20px', fontWeight: 700, color: '#111' }}>
                        {promo.discountType === 'fixed' ? `₹${promo.discountValue} OFF` : `${promo.discountValue}% OFF`}
                      </td>

                      {/* Min Order */}
                      <td style={{ padding: '16px 20px', color: '#555' }}>
                        {promo.minOrderAmount > 0 ? `₹${promo.minOrderAmount}` : 'None (₹0)'}
                      </td>

                      {/* Expiry Date */}
                      <td style={{ padding: '16px 20px' }}>
                        {expiryDateObj ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontWeight: 600, color: isExpired ? '#DC2626' : '#374151' }}>
                              {expiryDisplay}
                            </span>
                            <span style={{ fontSize: 11, color: isExpired ? '#DC2626' : '#6B7280' }}>
                              {isExpired ? '⚠️ Expired' : 'Expires at end of day'}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: '#059669', fontWeight: 600, fontSize: 12 }}>
                            <i className="fas fa-infinity" style={{ marginRight: 6 }} />
                            Never Expires
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '16px 20px' }}>
                        {isInactive ? (
                          <span style={{ background: '#F3F4F6', color: '#6B7280', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                            Inactive
                          </span>
                        ) : isExpired ? (
                          <span style={{ background: '#FEE2E2', color: '#DC2626', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                            Expired
                          </span>
                        ) : (
                          <span style={{ background: '#D1FAE5', color: '#059669', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                            Active
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                          {/* Toggle Active Button */}
                          <button
                            onClick={() => handleToggleActive(promo)}
                            title={promo.isActive ? 'Deactivate promo code' : 'Activate promo code'}
                            style={{
                              background: 'none',
                              border: '1px solid #E5E5E5',
                              padding: '6px 12px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              color: promo.isActive ? '#DC2626' : '#059669'
                            }}
                          >
                            {promo.isActive ? 'Disable' : 'Enable'}
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEdit(promo)}
                            title="Edit promo code"
                            style={{
                              background: '#F9FAFB',
                              border: '1px solid #E5E5E5',
                              padding: '6px 10px',
                              borderRadius: 6,
                              fontSize: 12,
                              cursor: 'pointer',
                              color: '#374151'
                            }}
                          >
                            <i className="fas fa-edit" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeletePromo(promo)}
                            title="Delete promo code"
                            style={{
                              background: '#FEF2F2',
                              border: '1px solid #FCA5A5',
                              padding: '6px 10px',
                              borderRadius: 6,
                              fontSize: 12,
                              cursor: 'pointer',
                              color: '#DC2626'
                            }}
                          >
                            <i className="fas fa-trash-alt" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal: Create / Edit Promo Code ── */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 520,
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E5E5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(197,160,89,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold, #C5A059)', fontSize: 16 }}>
                  <i className="fas fa-ticket-alt" />
                </span>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111' }}>
                  {editingPromo ? `Edit Promo Code: ${editingPromo.code}` : 'Create New Promo Code'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: 18, color: '#888', cursor: 'pointer', padding: 4 }}
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePromo} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Promo Code Input */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#444', marginBottom: 6 }}>
                  Promo Code <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER20, FESTIVE15"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1.5px solid #D1D5DB',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    letterSpacing: '1px',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ fontSize: 11, color: '#888', marginTop: 4, display: 'block' }}>
                  Uppercase letters, numbers, hyphens, and underscores only.
                </span>
              </div>

              {/* Discount Type & Value Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#444', marginBottom: 6 }}>
                    Discount Type
                  </label>
                  <select
                    value={formDiscountType}
                    onChange={(e) => setFormDiscountType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1.5px solid #D1D5DB',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      background: '#fff',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#444', marginBottom: 6 }}>
                    Discount Value <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      required
                      min="1"
                      max={formDiscountType === 'percentage' ? '100' : '100000'}
                      step="any"
                      placeholder={formDiscountType === 'percentage' ? '15' : '200'}
                      value={formDiscountValue}
                      onChange={(e) => setFormDiscountValue(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        paddingRight: 32,
                        border: '1.5px solid #D1D5DB',
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: 700,
                        boxSizing: 'border-box'
                      }}
                    />
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#888', fontSize: 13 }}>
                      {formDiscountType === 'percentage' ? '%' : '₹'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expiry Date Section */}
              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: 14 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#111' }}>
                  <input
                    type="checkbox"
                    checked={hasExpiry}
                    onChange={(e) => setHasExpiry(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#000' }}
                  />
                  <span>Set Expiry Date for this promo code</span>
                </label>

                {hasExpiry && (
                  <div style={{ marginTop: 12 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#666', marginBottom: 6 }}>
                      Expiration Date
                    </label>
                    <input
                      type="date"
                      required={hasExpiry}
                      min={new Date().toISOString().split('T')[0]}
                      value={formExpiryDate}
                      onChange={(e) => setFormExpiryDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1.5px solid #D1D5DB',
                        borderRadius: 8,
                        fontSize: 13,
                        boxSizing: 'border-box'
                      }}
                    />
                    <span style={{ fontSize: 11, color: '#6B7280', marginTop: 4, display: 'block' }}>
                      Promo code will expire automatically at 23:59:59 on this date.
                    </span>
                  </div>
                )}
              </div>

              {/* Min Order Amount & Description */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#444', marginBottom: 6 }}>
                    Min. Subtotal (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formMinOrder}
                    onChange={(e) => setFormMinOrder(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1.5px solid #D1D5DB',
                      borderRadius: 8,
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#444', marginBottom: 6 }}>
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 15% off first order"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1.5px solid #D1D5DB',
                      borderRadius: 8,
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Active Checkbox */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#111' }}>
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#000' }}
                />
                <span>Enable immediately (Active for customers)</span>
              </label>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10, paddingTop: 16, borderTop: '1px solid #E5E5E5' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 8,
                    border: '1px solid #D1D5DB',
                    background: '#fff',
                    color: '#374151',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'var(--gold, #C5A059)',
                    color: '#111',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(197,160,89,0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  {saving && <i className="fas fa-spinner fa-spin" />}
                  {editingPromo ? 'Update Promo Code' : 'Save Promo Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
