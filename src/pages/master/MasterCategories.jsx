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
                <div style={{ flex: '1 1 350px', maxWidth: '480px' }}>
                    <div style={{
                        background: 'rgba(18, 18, 18, 0.95)',
                        border: '1px solid var(--admin-gold)',
                        borderRadius: '8px',
                        padding: '24px',
                        color: 'white',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                        fontFamily: "'Montserrat', sans-serif",
                        position: 'sticky',
                        top: '100px'
                    }}>
                        <h3 style={{
                            fontFamily: "'Cinzel', serif",
                            color: 'var(--admin-gold)',
                            fontSize: '1.2rem',
                            margin: '0 0 20px 0',
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                            borderBottom: '1px solid rgba(197, 160, 89, 0.3)',
                            paddingBottom: '10px'
                        }}>
                            {editingCategory ? 'Edit Category' : 'Add New Category'}
                        </h3>

                        {isSaving ? (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '24px 0',
                                color: 'var(--admin-gold)',
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
                                    <label style={{ fontSize: '0.75rem', color: '#ccc', marginBottom: 8, fontWeight: 600, letterSpacing: '0.5px' }}>
                                        Category Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Hoodies & Sweaters"
                                        value={categoryName}
                                        onChange={e => setCategoryName(e.target.value)}
                                        style={{
                                            padding: '12px 14px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid #444',
                                            borderRadius: '4px',
                                            color: 'white',
                                            outline: 'none',
                                            fontSize: '0.85rem',
                                            fontFamily: "'Montserrat', sans-serif",
                                            transition: 'border-color 0.2s'
                                        }}
                                        onFocus={e => e.target.style.borderColor = 'var(--admin-gold)'}
                                        onBlur={e => e.target.style.borderColor = '#444'}
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <label style={{ fontSize: '0.75rem', color: '#ccc', marginBottom: 8, fontWeight: 600, letterSpacing: '0.5px' }}>
                                        Cover Image *
                                    </label>
                                    
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        {categoryPreview && (
                                            <div style={{
                                                width: '54px',
                                                height: '54px',
                                                background: `url(${categoryPreview}) center/cover no-repeat`,
                                                borderRadius: '4px',
                                                border: '1px solid var(--admin-gold)'
                                            }}></div>
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                required={!editingCategory}
                                                onChange={e => handleCoverUpload(e.target.files[0])}
                                                style={{ fontSize: '0.8rem', color: '#ccc' }}
                                            />
                                            <p style={{ fontSize: '0.65rem', color: '#888', margin: '4px 0 0 0' }}>
                                                Supported formats: JPG, PNG, WEBP.
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
                                                padding: '10px 20px',
                                                background: 'transparent',
                                                border: '1px solid var(--admin-danger)',
                                                borderRadius: '4px',
                                                color: 'var(--admin-danger)',
                                                cursor: 'pointer',
                                                fontFamily: "'Montserrat', sans-serif",
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                letterSpacing: '0.5px'
                                            }}
                                        >
                                            Cancel Edit
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        className="adm-settings__btn"
                                        style={{
                                            padding: '10px 20px',
                                            borderRadius: '4px',
                                            margin: 0,
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            letterSpacing: '0.5px'
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
                    <div style={{ background: 'white', border: '1px solid var(--admin-border)', padding: '24px', borderRadius: '8px' }}>
                        <h3 style={{
                            fontFamily: "'Cinzel', serif",
                            color: 'var(--admin-dark)',
                            fontSize: '1.2rem',
                            margin: '0 0 20px 0',
                            letterSpacing: '1px',
                            borderBottom: '1px solid #f0f0f0',
                            paddingBottom: '10px'
                        }}>
                            All Categories ({dbCategories.length})
                        </h3>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--admin-muted)' }}>
                                <div className="adm-spinner" style={{ margin: '0 auto 12px auto' }}></div>
                                <p>Loading categories...</p>
                            </div>
                        ) : dbCategories.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--admin-muted)' }}>
                                <i className="fas fa-tags" style={{ fontSize: '2.5rem', marginBottom: '12px', display: 'block', color: '#ddd' }}></i>
                                No categories created yet. Use the form to add one.
                            </div>
                        ) : (
                            <div className="adm-catalogue__grid">
                                {dbCategories.map(cat => (
                                    <div key={cat.id} className="adm-catalogue__card" style={{ 
                                        borderRadius: '6px', 
                                        overflow: 'hidden',
                                        opacity: cat.active === false ? 0.6 : 1,
                                        outline: cat.active === false ? '2px solid rgba(220,53,69,0.5)' : 'none'
                                    }}>
                                        <div 
                                            className="adm-catalogue__img" 
                                            style={{ 
                                                backgroundImage: `url(${cat.image})`,
                                                height: '160px',
                                                position: 'relative'
                                            }}
                                        >
                                            {/* Availability badge top-left */}
                                            <div style={{
                                                position: 'absolute',
                                                top: '10px',
                                                left: '10px',
                                                background: cat.active === false ? 'rgba(220,53,69,0.9)' : 'rgba(40,167,69,0.9)',
                                                color: '#fff',
                                                fontSize: '0.6rem',
                                                fontWeight: 700,
                                                letterSpacing: '1px',
                                                padding: '3px 8px',
                                                borderRadius: '4px',
                                                textTransform: 'uppercase'
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
                                                        background: cat.active === false ? 'rgba(40,167,69,0.85)' : 'rgba(220,53,69,0.85)',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        color: '#fff',
                                                        padding: '6px 8px',
                                                        fontSize: '0.7rem',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        fontWeight: 600,
                                                        transition: 'transform 0.2s'
                                                    }}
                                                    title={cat.active === false ? 'Mark Active' : 'Mark Inactive'}
                                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                                >
                                                    <i className={cat.active === false ? 'fas fa-toggle-off' : 'fas fa-toggle-on'}></i>
                                                </button>
                                                <button
                                                    onClick={() => handleEditStart(cat)}
                                                    style={{
                                                        background: 'rgba(18, 18, 18, 0.85)',
                                                        border: '1px solid var(--admin-gold)',
                                                        borderRadius: '4px',
                                                        color: 'var(--admin-gold)',
                                                        padding: '6px 8px',
                                                        fontSize: '0.75rem',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'transform 0.2s, background-color 0.2s'
                                                    }}
                                                    title="Edit Category"
                                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                                >
                                                    <i className="fas fa-pencil-alt"></i>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCategory(cat)}
                                                    style={{
                                                        background: 'rgba(18, 18, 18, 0.85)',
                                                        border: '1px solid var(--admin-danger)',
                                                        borderRadius: '4px',
                                                        color: 'var(--admin-danger)',
                                                        padding: '6px 8px',
                                                        fontSize: '0.75rem',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'transform 0.2s, background-color 0.2s'
                                                    }}
                                                    title="Delete Category"
                                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                                >
                                                    <i className="fas fa-trash-alt"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="adm-catalogue__body" style={{ padding: '14px', background: '#fafafa' }}>
                                            <h4 className="adm-catalogue__name" style={{ margin: 0, textTransform: 'uppercase', fontSize: '0.85rem', color: 'var(--admin-dark)' }}>
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
                <div style={{ position:'fixed',top:0,left:0,width:'100%',height:'100%',background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1100,padding:20 }}>
                    <div style={{ background:'#fff',borderRadius:12,padding:32,maxWidth:420,width:'100%',boxShadow:'0 10px 40px rgba(0,0,0,0.3)',fontFamily:"'Montserrat',sans-serif" }}>
                        <div style={{ fontSize:'2rem',textAlign:'center',marginBottom:12 }}>âš ï¸</div>
                        <h3 style={{ fontFamily:"'Cinzel',serif",textAlign:'center',marginBottom:10,color:'#121212' }}>Delete Category?</h3>
                        <p style={{ fontSize:'0.82rem',color:'#555',textAlign:'center',marginBottom:24,lineHeight:1.5 }}>
                            Permanently delete <strong>"{deleteTarget.name}"</strong>? All products in this category across all manufacturers will be marked as <em>Not Available</em>.
                        </p>
                        <div style={{ display:'flex',gap:12 }}>
                            <button onClick={() => setDeleteTarget(null)} style={{ flex:1,padding:'11px',border:'1px solid #ddd',borderRadius:6,background:'transparent',cursor:'pointer',fontFamily:"'Montserrat',sans-serif",fontSize:'0.82rem' }}>Cancel</button>
                            <button onClick={confirmDelete} disabled={isDeleting} style={{ flex:1,padding:'11px',border:'none',borderRadius:6,background:'#dc3545',color:'#fff',cursor:'pointer',fontFamily:"'Montserrat',sans-serif",fontSize:'0.82rem',fontWeight:600 }}>
                                {isDeleting ? <i className="fas fa-spinner fa-spin" /> : 'Delete'}
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

