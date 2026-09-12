import React, { useState, useEffect } from 'react';
import { apiFetch, uploadFile } from '../../api';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';
import { useToast, ToastContainer, TOAST_CSS } from '../../components/useToast';
import '../../styles/admin.css';

function MasterCategories() {
    const { user } = useAuth();
    const { toasts, showToast } = useToast();
    const [dbCategories, setDbCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form states
    const [categoryName, setCategoryName] = useState('');
    const [categoryFile, setCategoryFile] = useState(null);
    const [categoryPreview, setCategoryPreview] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    // Delete confirmation modal
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Real-time categories subscription
    const fetchCategories = async () => {
        try {
            const data = await apiFetch('/api/categories/all');
            const list = (data || []).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            setDbCategories(list);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching categories:', err);
            setError('Failed to fetch categories.');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleCoverUpload = (file) => {
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        setCategoryFile(file);
        setCategoryPreview(previewUrl);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (isSaving) return;
        if (!categoryName.trim()) {
            showToast('Please enter a category name.', 'warning');
            return;
        }

        setIsSaving(true);

        try {
            if (editingCategory) {
                let downloadUrl = editingCategory.image;
                if (categoryFile) {
                    const cleanName = categoryFile.name.replace(/[^a-zA-Z0-9.]/g, "_");
                    const path = `categories/${Date.now()}_${cleanName}`;
                    downloadUrl = await uploadFile(categoryFile, path, "asat-uploads");
                }

                await apiFetch(`/api/categories/${editingCategory.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        name: categoryName.trim(),
                        image: downloadUrl
                    })
                });

                showToast('Category updated successfully!', 'success');
                setEditingCategory(null);
            } else {
                if (!categoryFile) {
                    showToast('Please select a category image.', 'warning');
                    setIsSaving(false);
                    return;
                }

                const cleanName = categoryFile.name.replace(/[^a-zA-Z0-9.]/g, "_");
                const path = `categories/${Date.now()}_${cleanName}`;
                const downloadUrl = await uploadFile(categoryFile, path, "asat-uploads");

                await apiFetch('/api/categories', {
                    method: 'POST',
                    body: JSON.stringify({
                        name: categoryName.trim(),
                        image: downloadUrl,
                        area: 'default',
                        order: dbCategories.length + 1,
                        active: true
                    })
                });

                showToast('Category added successfully!', 'success');
            }

            setCategoryName('');
            setCategoryFile(null);
            setCategoryPreview('');
            fetchCategories();
        } catch (err) {
            console.error('Error saving category:', err);
            showToast('Failed to save category: ' + (err.error || err.message), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditStart = (cat) => {
        setEditingCategory(cat);
        setCategoryName(cat.name || '');
        setCategoryPreview(cat.image || '');
        setCategoryFile(null);
    };

    const handleCancelEdit = () => {
        setEditingCategory(null);
        setCategoryName('');
        setCategoryFile(null);
        setCategoryPreview('');
    };

    const handleDeleteCategory = (cat) => {
        setDeleteTarget(cat);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await apiFetch(`/api/categories/${deleteTarget.id}`, { method: 'DELETE' });
            showToast(`"${deleteTarget.name}" deleted. Affected products marked unavailable.`, 'success');
            fetchCategories();
        } catch (err) {
            console.error('Error deleting category:', err);
            showToast('Failed to delete category: ' + (err.error || err.message), 'error');
        } finally {
            setIsDeleting(false);
            setDeleteTarget(null);
        }
    };

    const handleToggleAvailability = async (cat) => {
        const newStatus = cat.active === false ? true : false;
        try {
            await apiFetch(`/api/categories/${cat.id}`, {
                method: 'PUT',
                body: JSON.stringify({ active: newStatus })
            });

            showToast(`Category status set to ${newStatus ? 'Active' : 'Inactive'}.`, 'success');
            fetchCategories();
        } catch (err) {
            console.error('Error toggling category availability:', err);
            showToast('Failed to update availability: ' + (err.error || err.message), 'error');
        }
    };

    return (
        <main className="adm-page">
            <BackButton label="Dashboard" />
            <h1 className="adm-page__title" style={{ marginTop: '10px' }}>CATEGORY MANAGEMENT</h1>
            <p className="adm-page__subtitle">Create and edit categories in the product catalogue</p>

            {error && (
                <div className="adm-error-alert" style={{ marginBottom: 20 }}>
                    <i className="fas fa-exclamation-triangle"></i> {error}
                </div>
            )}

            <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', marginTop: '20px' }}>
                
                {/* Left Column - Form Card */}
                <div style={{ flex: '1 1 360px', maxWidth: '440px' }}>
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '14px',
                        padding: '24px 26px',
                        color: '#111827',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                        position: 'sticky',
                        top: '100px'
                    }}>
                        <h3 style={{
                            fontFamily: "'Cinzel', serif",
                            color: '#111827',
                            fontSize: '1.05rem',
                            fontWeight: 700,
                            margin: '0 0 20px 0',
                            letterSpacing: '0.8px',
                            textTransform: 'uppercase',
                            borderBottom: '1px solid #f3f4f6',
                            paddingBottom: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <span>{editingCategory ? '✏️ Edit Category' : '➕ Add New Category'}</span>
                        </h3>

                        {isSaving ? (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '24px 0',
                                color: '#111827',
                                fontWeight: 'bold'
                            }}>
                                <div className="adm-spinner" style={{ marginBottom: 12 }}></div>
                                <p style={{ fontSize: '0.85rem' }}>
                                    {editingCategory ? 'Saving changes...' : 'Creating category... uploading cover...'}
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <label style={{ fontSize: '0.72rem', color: '#4b5563', marginBottom: 8, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                        Category Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Hoodies & Sweaters"
                                        value={categoryName}
                                        onChange={e => setCategoryName(e.target.value)}
                                        style={{
                                            padding: '11px 14px',
                                            background: '#f9fafb',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                            color: '#111827',
                                            outline: 'none',
                                            fontSize: '0.875rem',
                                            fontFamily: "'Montserrat', sans-serif",
                                            transition: 'border-color 0.2s, box-shadow 0.2s',
                                            width: '100%',
                                            boxSizing: 'border-box'
                                        }}
                                        onFocus={e => { e.target.style.borderColor = '#111114'; e.target.style.boxShadow = '0 0 0 3px rgba(17,17,20,0.08)'; }}
                                        onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <label style={{ fontSize: '0.72rem', color: '#4b5563', marginBottom: 8, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                        Cover Image *
                                    </label>
                                    
                                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                        {categoryPreview && (
                                            <div style={{
                                                width: '58px',
                                                height: '58px',
                                                backgroundImage: `url(${categoryPreview})`,
                                                backgroundPosition: 'center',
                                                backgroundSize: 'cover',
                                                borderRadius: '8px',
                                                border: '1px solid #e5e7eb',
                                                flexShrink: 0,
                                                boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                                            }}></div>
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                required={!editingCategory}
                                                onChange={e => handleCoverUpload(e.target.files[0])}
                                                style={{ fontSize: '0.8rem', color: '#4b5563' }}
                                            />
                                            <p style={{ fontSize: '0.7rem', color: '#9ca3af', margin: '4px 0 0 0' }}>
                                                Supported: JPG, PNG, WEBP. Recommended: 600×600px.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                                    {editingCategory && (
                                        <button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            style={{
                                                padding: '9px 18px',
                                                background: '#ffffff',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '20px',
                                                color: '#6b7280',
                                                cursor: 'pointer',
                                                fontFamily: "'Montserrat', sans-serif",
                                                fontSize: '0.78rem',
                                                fontWeight: 600,
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            Cancel Edit
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        style={{
                                            padding: '10px 22px',
                                            background: '#111114',
                                            border: 'none',
                                            borderRadius: '20px',
                                            color: '#ffffff',
                                            cursor: 'pointer',
                                            fontFamily: "'Montserrat', sans-serif",
                                            fontSize: '0.78rem',
                                            fontWeight: 600,
                                            letterSpacing: '0.5px',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {editingCategory ? 'Save Changes' : 'Add Category'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* Right Column - Categories Grid */}
                <div style={{ flex: '2 2 500px', minWidth: '350px' }}>
                    <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', padding: '24px 28px', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f3f4f6', paddingBottom: '12px' }}>
                            <h3 style={{
                                fontFamily: "'Cinzel', serif",
                                color: '#111827',
                                fontSize: '1.05rem',
                                fontWeight: 700,
                                margin: 0,
                                letterSpacing: '0.8px'
                            }}>
                                ALL CATEGORIES
                            </h3>
                            <span style={{
                                background: '#f3f4f6',
                                color: '#4b5563',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                padding: '4px 10px',
                                borderRadius: '12px'
                            }}>
                                {dbCategories.length} items
                            </span>
                        </div>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
                                <div className="adm-spinner" style={{ margin: '0 auto 12px auto' }}></div>
                                <p>Loading categories...</p>
                            </div>
                        ) : dbCategories.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
                                <i className="fas fa-tags" style={{ fontSize: '2.5rem', marginBottom: '12px', display: 'block', color: '#d1d5db' }}></i>
                                No categories created yet. Use the form to add one.
                            </div>
                        ) : (
                            <div className="adm-catalogue__grid">
                                {dbCategories.map(cat => (
                                    <div key={cat.id} className="adm-catalogue__card" style={{ 
                                        borderRadius: '12px', 
                                        overflow: 'hidden',
                                        opacity: cat.active === false ? 0.65 : 1,
                                        border: cat.active === false ? '1.5px dashed #fca5a5' : '1px solid #e5e7eb',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                                        transition: 'all 0.2s ease',
                                        background: '#ffffff'
                                    }}>
                                        <div 
                                            className="adm-catalogue__img" 
                                            style={{ 
                                                backgroundImage: `url(${cat.image})`,
                                                height: '170px',
                                                backgroundPosition: 'center',
                                                backgroundSize: 'cover',
                                                position: 'relative'
                                            }}
                                        >
                                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '60px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 100%)' }} />

                                            {/* Availability badge top-left */}
                                            <div style={{
                                                position: 'absolute',
                                                top: '10px',
                                                left: '10px',
                                                background: cat.active === false ? '#ef4444' : '#10b981',
                                                color: '#ffffff',
                                                fontSize: '0.62rem',
                                                fontWeight: 700,
                                                letterSpacing: '0.8px',
                                                padding: '3px 8px',
                                                borderRadius: '20px',
                                                textTransform: 'uppercase',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                            }}>
                                                {cat.active === false ? 'Inactive' : 'Active'}
                                            </div>

                                            {/* Top right action buttons */}
                                            <div style={{
                                                position: 'absolute',
                                                top: '10px',
                                                right: '10px',
                                                display: 'flex',
                                                gap: '6px'
                                            }}>
                                                {/* Toggle availability */}
                                                <button
                                                    onClick={() => handleToggleAvailability(cat)}
                                                    style={{
                                                        background: 'rgba(255, 255, 255, 0.92)',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        color: cat.active === false ? '#10b981' : '#6b7280',
                                                        padding: '6px 9px',
                                                        fontSize: '0.75rem',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    title={cat.active === false ? 'Mark Active' : 'Mark Inactive'}
                                                >
                                                    <i className={cat.active === false ? 'fas fa-toggle-off' : 'fas fa-toggle-on'}></i>
                                                </button>
                                                <button
                                                    onClick={() => handleEditStart(cat)}
                                                    style={{
                                                        background: 'rgba(255, 255, 255, 0.92)',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        color: '#111827',
                                                        padding: '6px 9px',
                                                        fontSize: '0.75rem',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    title="Edit Category"
                                                >
                                                    <i className="fas fa-pencil-alt"></i>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCategory(cat)}
                                                    style={{
                                                        background: 'rgba(255, 255, 255, 0.92)',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        color: '#ef4444',
                                                        padding: '6px 9px',
                                                        fontSize: '0.75rem',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    title="Delete Category"
                                                >
                                                    <i className="fas fa-trash-alt"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="adm-catalogue__body" style={{ padding: '14px 16px', background: '#ffffff', borderTop: '1px solid #f3f4f6' }}>
                                            <h4 className="adm-catalogue__name" style={{ margin: 0, textTransform: 'uppercase', fontSize: '0.82rem', fontWeight: 700, color: '#111827', letterSpacing: '0.5px' }}>
                                                {cat.name}
                                            </h4>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div style={{ position:'fixed',top:0,left:0,width:'100%',height:'100%',background:'rgba(17,24,39,0.5)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1100,padding:20 }}>
                    <div style={{ background:'#ffffff',borderRadius:16,padding:32,maxWidth:420,width:'100%',boxShadow:'0 20px 50px rgba(0,0,0,0.15)',fontFamily:"'Montserrat',sans-serif",border:'1px solid #f3f4f6' }}>
                        <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', fontSize: '1.25rem' }}>
                            <i className="fas fa-exclamation-triangle" />
                        </div>
                        <h3 style={{ fontFamily:"'Cinzel',serif",textAlign:'center',marginBottom:10,color:'#111827',fontSize:'1.15rem' }}>Delete Category?</h3>
                        <p style={{ fontSize:'0.85rem',color:'#6b7280',textAlign:'center',marginBottom:24,lineHeight:1.5 }}>
                            Permanently delete <strong>"{deleteTarget.name}"</strong>? All products in this category across all manufacturers will be marked as <em>Not Available</em>.
                        </p>
                        <div style={{ display:'flex',gap:12 }}>
                            <button onClick={() => setDeleteTarget(null)} style={{ flex:1,padding:'11px',border:'1px solid #d1d5db',borderRadius:24,background:'#ffffff',color:'#374151',cursor:'pointer',fontFamily:"'Montserrat',sans-serif",fontSize:'0.82rem',fontWeight:600 }}>Cancel</button>
                            <button onClick={confirmDelete} disabled={isDeleting} style={{ flex:1,padding:'11px',border:'none',borderRadius:24,background:'#dc2626',color:'#ffffff',cursor:'pointer',fontFamily:"'Montserrat',sans-serif",fontSize:'0.82rem',fontWeight:600,boxShadow:'0 2px 8px rgba(220,38,38,0.25)' }}>
                                {isDeleting ? <i className="fas fa-spinner fa-spin" /> : 'Delete Category'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <style>{TOAST_CSS}</style>
            <ToastContainer toasts={toasts} />
        </main>
    );
}

export default MasterCategories;

