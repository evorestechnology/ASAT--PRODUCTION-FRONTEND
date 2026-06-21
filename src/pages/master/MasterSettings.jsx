import React, { useState, useEffect } from 'react';
import '../../styles/admin.css';
import BackButton from '../../components/BackButton';
import { apiFetch, uploadFile } from '../../api';
import { useCurrency } from '../../context/CurrencyContext';


const inlineStyles = `
    .video-preview-container {
        width: 100%;
        max-width: 640px;
        aspect-ratio: 16/9;
        background: #000;
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 6px;
        overflow: hidden;
        margin-bottom: 20px;
        position: relative;
    }
    .video-preview-player {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
    .video-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #666;
        gap: 10px;
        background: #0d0d0d;
    }
    .upload-drop-zone {
        display: block;
        border: 2px dashed rgba(197, 160, 89, 0.3);
        border-radius: 6px;
        padding: 30px;
        text-align: center;
        background: rgba(197, 160, 89, 0.02);
        cursor: pointer;
        transition: all 0.3s;
        margin-bottom: 20px;
    }
    .upload-drop-zone:hover {
        border-color: var(--gold);
        background: rgba(197, 160, 89, 0.05);
    }
    .upload-drop-zone i {
        font-size: 2rem;
        color: var(--gold);
        margin-bottom: 12px;
    }
    .editor-section {
        background: #141414;
        border: 1px solid rgba(197, 160, 89, 0.2);
        border-radius: 8px;
        padding: 24px;
        margin-top: 30px;
        margin-bottom: 40px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .editor-title {
        font-family: 'Cinzel', serif;
        font-size: 1.4rem;
        color: #fff;
        margin-bottom: 6px;
        letter-spacing: 1px;
    }
    .editor-subtitle {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.85rem;
        color: #888;
        margin-bottom: 24px;
        line-height: 1.5;
    }
    .slide-cards {
        display: flex;
        flex-direction: column;
        gap: 20px;
        margin-bottom: 24px;
    }
    .slide-card {
        background: #1c1c1c;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        padding: 20px;
        position: relative;
        transition: border-color 0.3s;
    }
    .slide-card:hover {
        border-color: rgba(197, 160, 89, 0.3);
    }
    .slide-card__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        padding-bottom: 12px;
    }
    .slide-card__badge {
        font-family: 'Cinzel', serif;
        font-size: 0.85rem;
        color: var(--gold);
        font-weight: 700;
        letter-spacing: 1px;
    }
    .slide-card__actions {
        display: flex;
        gap: 8px;
    }
    .slide-card__btn {
        background: rgba(255,255,255,0.05);
        color: #ccc;
        border: 1px solid rgba(255,255,255,0.1);
        padding: 5px 10px;
        font-size: 0.75rem;
        font-family: 'Montserrat', sans-serif;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        border-radius: 2px;
    }
    .slide-card__btn:hover {
        background: rgba(255,255,255,0.15);
        color: white;
    }
    .slide-card__btn--delete {
        background: rgba(229, 57, 53, 0.1);
        color: #ff5252;
        border-color: rgba(229, 57, 53, 0.2);
    }
    .slide-card__btn--delete:hover {
        background: #e53935;
        color: white;
    }
    .editor-input-group {
        margin-bottom: 16px;
    }
    .editor-input-group label {
        display: block;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.75rem;
        color: #aaa;
        margin-bottom: 6px;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 600;
    }
    .editor-input {
        width: 100%;
        padding: 10px 12px;
        background: #121212;
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #fff;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.9rem;
        outline: none;
        transition: border-color 0.3s;
        border-radius: 3px;
    }
    .editor-input:focus {
        border-color: var(--gold);
    }
    .editor-textarea {
        width: 100%;
        min-height: 80px;
        padding: 10px 12px;
        background: #121212;
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #fff;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.9rem;
        outline: none;
        resize: vertical;
        transition: border-color 0.3s;
        border-radius: 3px;
        line-height: 1.5;
    }
    .editor-textarea:focus {
        border-color: var(--gold);
    }
    .bullets-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 12px;
    }
    .bullet-row {
        display: flex;
        gap: 10px;
        align-items: center;
    }
    .bullet-row input {
        flex: 1;
    }
    .bullet-remove-btn {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.4);
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0 5px;
        transition: color 0.2s;
    }
    .bullet-remove-btn:hover {
        color: #ff5252;
    }
    .bullets-add-btn {
        background: transparent;
        color: var(--gold);
        border: 1px dashed rgba(197, 160, 89, 0.4);
        padding: 6px 12px;
        font-size: 0.78rem;
        font-family: 'Montserrat', sans-serif;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
        border-radius: 2px;
        align-self: flex-start;
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .bullets-add-btn:hover {
        background: rgba(197, 160, 89, 0.05);
        border-color: var(--gold);
    }
    .editor-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        padding-top: 20px;
        margin-top: 24px;
    }
    .editor-btn--save {
        background: var(--gold) !important;
        color: #0c0c0c !important;
        font-weight: 700 !important;
        box-shadow: 0 4px 15px rgba(197, 160, 89, 0.2);
    }
    .editor-btn--save:hover {
        background: #e8c97a !important;
        box-shadow: 0 6px 20px rgba(197, 160, 89, 0.3);
    }
    .editor-checkbox {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.8rem;
        color: #aaa;
        margin-top: 12px;
    }
    .editor-checkbox input {
        accent-color: var(--gold);
        width: 15px;
        height: 15px;
    }
    .save-toast {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.82rem;
        padding: 10px 16px;
        border-radius: 4px;
        margin-bottom: 20px;
        animation: toast-fadein 0.3s ease both;
    }
    .save-toast--success {
        color: #1e7e34;
        background: #eafaf1;
        border-left: 4px solid #28a745;
    }
    .save-toast--error {
        color: #c0392b;
        background: #fef0ee;
        border-left: 4px solid #c0392b;
    }
    @keyframes toast-fadein {
        from { opacity: 0; transform: translateY(-8px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.75);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(4px);
    }
    .modal-content {
        background: #1c1c1c;
        border: 1px solid rgba(197, 160, 89, 0.3);
        border-radius: 8px;
        padding: 30px;
        width: 100%;
        max-width: 500px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        color: #fff;
    }
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        border-bottom: 1px solid rgba(255,255,255,0.06);
        padding-bottom: 12px;
    }
    .modal-header h3 {
        margin: 0;
        font-family: 'Cinzel', serif;
        color: var(--gold);
        font-size: 1.1rem;
        letter-spacing: 1px;
    }
    .modal-close-btn {
        background: none;
        border: none;
        color: #888;
        font-size: 1.2rem;
        cursor: pointer;
        transition: color 0.2s;
    }
    .modal-close-btn:hover {
        color: #fff;
    }
    .modal-body {
        margin-bottom: 20px;
    }
    .modal-body .form-group {
        margin-bottom: 16px;
    }
    .modal-body .form-group label {
        display: block;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.75rem;
        color: #aaa;
        margin-bottom: 6px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .modal-body .form-group input, .modal-body .form-group select {
        width: 100%;
        padding: 10px 12px;
        background: #141414;
        border: 1px solid rgba(255,255,255,0.1);
        color: #fff;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.85rem;
        box-sizing: border-box;
    }
    .modal-body .form-group input:focus, .modal-body .form-group select:focus {
        border-color: var(--gold);
        outline: none;
    }
    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        border-top: 1px solid rgba(255,255,255,0.06);
        padding-top: 16px;
    }
`;

function MasterSettings() {
    const [terms, setTerms] = useState('');
    const [shippingNote, setShippingNote] = useState('');
    const [admins, setAdmins] = useState([]);
    const [adminsLoading, setAdminsLoading] = useState(true);
    const [cachedRates, setCachedRates] = useState(null);

    // Onboarding media state
    const [onboardingMedia, setOnboardingMedia] = useState({ type: 'video', urls: [] });
    const [mediaLoading, setMediaLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // { type: 'success'|'error', text: string }

    const { globalCurrencies } = useCurrency();
    const [supportedCurrencies, setSupportedCurrencies] = useState(['INR']);
    const [ratesRefreshLoading, setRatesRefreshLoading] = useState(false);
    const [currencySearchQuery, setCurrencySearchQuery] = useState('');
    const [adminSearchQuery, setAdminSearchQuery] = useState('');
    const [lastCacheTime, setLastCacheTime] = useState(null);

    // Add admin modal state
    const [showAddAdminModal, setShowAddAdminModal] = useState(false);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminName, setNewAdminName] = useState('');
    const [newAdminRole, setNewAdminRole] = useState('support');

    const handleDeleteAdmin = async (id) => {
        if (!window.confirm("Are you sure you want to remove this admin?")) return;
        try {
            await apiFetch(`/api/users/admins/${id}`, { method: 'DELETE' });
            fetchAdmins();
        } catch (err) {
            console.error('Failed to delete admin:', err);
            alert('Failed to delete admin');
        }
    };

    const toggleCurrency = async (code) => {
        const newArr = supportedCurrencies.includes(code)
            ? supportedCurrencies.filter(c => c !== code)
            : [...supportedCurrencies, code];
            
        // Always keep INR
        if (!newArr.includes('INR')) newArr.push('INR');

        setSupportedCurrencies(newArr);
        
        try {
            await apiFetch('/api/settings/supported_currencies', {
                method: 'PUT',
                body: JSON.stringify({ value: newArr })
            });
            window.dispatchEvent(new Event('force_currency_refresh'));
        } catch (err) {
            console.error('Failed to save supported currencies', err);
        }
    };

    const handleForceRefreshRates = async () => {
        if (ratesRefreshLoading) return;
        setRatesRefreshLoading(true);
        try {
            await apiFetch('/api/settings/force_rates_refresh_timestamp', {
                method: 'PUT',
                body: JSON.stringify({ value: Date.now() })
            });
            window.dispatchEvent(new Event('force_currency_refresh'));
            
            setTimeout(() => {
                fetchRatesCache();
                setRatesRefreshLoading(false);
            }, 1000);
        } catch (err) {
            console.error('Failed to force refresh rates', err);
            setRatesRefreshLoading(false);
        }
    };

    const fetchAdmins = async () => {
        setAdminsLoading(true);
        try {
            const data = await apiFetch('/api/users/admins');
            setAdmins(data || []);
        } catch (err) {
            console.error('Failed to fetch admins:', err);
        } finally {
            setAdminsLoading(false);
        }
    };

    const fetchRatesCache = async () => {
        try {
            // First, fetching this endpoint will force the backend to refresh the cache if needed
            const ratesData = await apiFetch('/api/currency/rates');
            if (ratesData) setCachedRates(ratesData);
            
            // Second, fetch the exact DB timestamp
            const res = await apiFetch('/api/settings/global_exchange_rates');
            if (res && res.updated_at) {
                setLastCacheTime(new Date(res.updated_at).toLocaleString());
            }
        } catch(e) {
            console.error('Failed to fetch backend cached rates', e);
        }
    };

    // Fetch terms, slides, and admins on mount
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Fetch all settings as key-value pair from GET /api/settings
                const settings = await apiFetch('/api/settings');
                
                // 1. Fetch terms (stored under key 'general' with value { terms })
                if (settings && settings.general && settings.general.terms) {
                    setTerms(settings.general.terms);
                }

                // 2. Fetch onboarding media
                if (settings && settings.designer_onboarding_media) {
                    setOnboardingMedia(settings.designer_onboarding_media.value || settings.designer_onboarding_media);
                } else if (settings && settings.designer_onboarding_video && settings.designer_onboarding_video.videoUrl) {
                    setOnboardingMedia({ type: 'video', urls: [settings.designer_onboarding_video.videoUrl] });
                }

                // 3. Fetch shipping note (stored under key 'global_shipping_note')
                if (settings && settings.global_shipping_note) {
                    setShippingNote(settings.global_shipping_note.text || '');
                }

                // 4. Fetch supported currencies
                if (settings && settings.supported_currencies) {
                    setSupportedCurrencies(settings.supported_currencies);
                }
            } catch (err) {
                console.error('Failed to fetch settings:', err);
            } finally {
                setMediaLoading(false);
            }
        };



        fetchSettings();
        fetchAdmins();
        fetchRatesCache();
    }, []);

    const saveTerms = async () => {
        setSaveStatus(null);
        try {
            await apiFetch('/api/settings/general', {
                method: 'PUT',
                body: JSON.stringify({ value: { terms } })
            });
            setSaveStatus({ type: 'success', text: 'Terms and conditions saved successfully!' });
            setTimeout(() => setSaveStatus(null), 5000);
        } catch (err) {
            console.error('Failed to save terms:', err);
            setSaveStatus({ type: 'error', text: 'Failed to save terms: ' + (err.error || err.message) });
            setTimeout(() => setSaveStatus(null), 5000);
        }
    };

    const saveShippingNote = async () => {
        setSaveStatus(null);
        try {
            await apiFetch('/api/settings/global_shipping_note', {
                method: 'PUT',
                body: JSON.stringify({ value: { text: shippingNote } })
            });
            setSaveStatus({ type: 'success', text: 'Global Shipping Note saved successfully!' });
            setTimeout(() => setSaveStatus(null), 5000);
        } catch (err) {
            console.error('Failed to save shipping note:', err);
            setSaveStatus({ type: 'error', text: 'Failed to save shipping note: ' + (err.error || err.message) });
            setTimeout(() => setSaveStatus(null), 5000);
        }
    };

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        setSaveStatus(null);
        if (!newAdminEmail || !newAdminName) {
            setSaveStatus({ type: 'error', text: 'Email and Display Name are required.' });
            return;
        }
        try {
            await apiFetch('/api/users/admins/invite', {
                method: 'POST',
                body: JSON.stringify({
                    email: newAdminEmail,
                    role: newAdminRole,
                    display_name: newAdminName
                })
            });
            setSaveStatus({ type: 'success', text: `Admin invite created for ${newAdminEmail}!` });
            setShowAddAdminModal(false);
            setNewAdminEmail('');
            setNewAdminName('');
            setNewAdminRole('support');
            fetchAdmins();
            setTimeout(() => setSaveStatus(null), 5000);
        } catch (err) {
            console.error('Failed to create admin invite:', err);
            setSaveStatus({ type: 'error', text: 'Failed to create invite: ' + (err.error || err.message) });
        }
    };

    const handleRemoveAdmin = async (adminId) => {
        setSaveStatus(null);
        try {
            await apiFetch(`/api/users/admins/${adminId}`, {
                method: 'PUT',
                body: JSON.stringify({ active: false })
            });
            setSaveStatus({ type: 'success', text: 'Admin account disabled successfully.' });
            fetchAdmins();
            setTimeout(() => setSaveStatus(null), 5000);
        } catch (err) {
            console.error('Failed to disable admin account:', err);
            setSaveStatus({ type: 'error', text: 'Failed to disable admin: ' + (err.error || err.message) });
        }
    };

    // Media handlers
    const handleMediaUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        setSaveStatus(null);
        try {
            const uploadedUrls = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const extension = file.name.split('.').pop();
                const filePath = `settings/onboarding_media_${Date.now()}_${i}.${extension}`;
                const url = await uploadFile('asat-uploads', filePath, file);
                uploadedUrls.push(url);
            }
            
            const newMedia = { 
                type: onboardingMedia.type, 
                urls: onboardingMedia.type === 'images' ? [...onboardingMedia.urls, ...uploadedUrls] : uploadedUrls 
            };
            
            await apiFetch('/api/settings/designer_onboarding_media', {
                method: 'PUT',
                body: JSON.stringify({ value: newMedia })
            });

            setOnboardingMedia(newMedia);
            setSaveStatus({ type: 'success', text: 'Onboarding media uploaded and saved successfully!' });
            setTimeout(() => setSaveStatus(null), 5000);
        } catch (err) {
            console.error('Failed to upload/save onboarding media:', err);
            setSaveStatus({ type: 'error', text: 'Failed to upload media: ' + (err.error || err.message) });
        } finally {
            setUploading(false);
        }
    };

    const handleSaveMediaUrl = async () => {
        setSaveStatus(null);
        try {
            await apiFetch('/api/settings/designer_onboarding_media', {
                method: 'PUT',
                body: JSON.stringify({ value: onboardingMedia })
            });

            setSaveStatus({ type: 'success', text: 'Onboarding media URL saved successfully!' });
            setTimeout(() => setSaveStatus(null), 5000);
        } catch (err) {
            console.error('Failed to save onboarding media URL:', err);
            setSaveStatus({ type: 'error', text: 'Failed to save media: ' + (err.error || err.message) });
            setTimeout(() => setSaveStatus(null), 5000);
        }
    };

    const removeImageUrl = async (indexToRemove) => {
        const newUrls = onboardingMedia.urls.filter((_, idx) => idx !== indexToRemove);
        const newMedia = { ...onboardingMedia, urls: newUrls };
        setOnboardingMedia(newMedia);
        try {
            await apiFetch('/api/settings/designer_onboarding_media', {
                method: 'PUT',
                body: JSON.stringify({ value: newMedia })
            });
        } catch(err) {
            console.error(err);
        }
    };


    return (
        <main className="adm-page">
            <style>{inlineStyles}</style>
            <BackButton />
            <h1 className="adm-page__title">SETTINGS</h1>
            <p className="adm-page__subtitle">Platform configuration and admin management</p>

            {/* General T&C Section */}
            <div className="adm-settings__section">
                <h3>Terms & Conditions</h3>
                <textarea
                    className="adm-settings__textarea"
                    placeholder="Enter the platform terms and conditions..."
                    value={terms}
                    onChange={e => setTerms(e.target.value)}
                />
                <button className="adm-settings__btn" onClick={saveTerms}>Save Terms</button>
            </div>

            {/* Global Shipping Note Section */}
            <div className="adm-settings__section">
                <h3>Global Shipping Note</h3>
                <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '15px' }}>
                    This text will be displayed in the "Shipping" tab for all products across the storefront. You can use HTML to format it if needed.
                </p>
                <textarea
                    className="adm-settings__textarea"
                    placeholder="Enter shipping information..."
                    value={shippingNote}
                    onChange={e => setShippingNote(e.target.value)}
                />
                <button className="adm-settings__btn" onClick={saveShippingNote}>Save Shipping Note</button>
            </div>

            {/* Designer Onboarding Media Editor */}
            <div className="editor-section">
                <h3 className="editor-title">Designer Onboarding Training</h3>
                <p className="editor-subtitle">
                    Configure the onboarding material presented to designers during registration. Choose between a Video, a PDF/PPT document, or an Image Gallery.
                </p>

                {saveStatus && (
                    <div className={`save-toast save-toast--${saveStatus.type}`} style={{ zIndex: 1000 }}>
                        {saveStatus.type === 'success' ? '✦ ' : '⚠️ '} {saveStatus.text}
                    </div>
                )}

                {mediaLoading ? (
                    <div style={{ color: '#aaa', fontFamily: 'Montserrat', fontSize: '0.85rem', padding: '20px 0' }}>
                        Loading onboarding settings…
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="editor-input-group" style={{ marginBottom: '10px' }}>
                            <label>Media Type</label>
                            <select 
                                className="editor-input" 
                                value={onboardingMedia.type} 
                                onChange={e => {
                                    setOnboardingMedia({ type: e.target.value, urls: [] });
                                }}
                            >
                                <option value="video">Video Player</option>
                                <option value="document">Document (PDF)</option>
                                <option value="images">Image Gallery</option>
                            </select>
                        </div>

                        <div className="video-preview-container" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {onboardingMedia.urls && onboardingMedia.urls.length > 0 ? (
                                onboardingMedia.type === 'video' ? (
                                    <video className="video-preview-player" src={onboardingMedia.urls[0]} controls />
                                ) : onboardingMedia.type === 'document' ? (
                                    <iframe src={onboardingMedia.urls[0]} style={{ width: '100%', height: '400px', border: 'none' }} title="Document Preview" />
                                ) : (
                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', padding: '20px', width: '100%' }}>
                                        {onboardingMedia.urls.map((url, i) => (
                                            <div key={i} style={{ position: 'relative', width: '100px', height: '100px' }}>
                                                <img src={url} alt={`Slide ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                                                <button 
                                                    onClick={() => removeImageUrl(i)}
                                                    style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}
                                                >×</button>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : (
                                <div className="video-placeholder">
                                    <i className={`fas fa-${onboardingMedia.type === 'video' ? 'video' : onboardingMedia.type === 'document' ? 'file-pdf' : 'images'}`} style={{ fontSize: '2.5rem', color: '#555' }}></i>
                                    <span style={{ fontSize: '0.9rem', fontFamily: 'Montserrat, sans-serif' }}>No {onboardingMedia.type} configured</span>
                                </div>
                            )}
                        </div>

                        <div className="editor-input-group">
                            <label>Media URL(s) - Comma separated for images</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input 
                                    type="text" 
                                    className="editor-input" 
                                    value={onboardingMedia.urls ? onboardingMedia.urls.join(',') : ''} 
                                    onChange={e => setOnboardingMedia({ ...onboardingMedia, urls: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) })} 
                                    placeholder="https://..."
                                    style={{ flex: 1 }}
                                />
                                <button 
                                    type="button" 
                                    className="adm-settings__btn" 
                                    style={{ marginTop: 0, padding: '10px 20px', whiteSpace: 'nowrap' }}
                                    onClick={handleSaveMediaUrl}
                                >
                                    Save URL(s)
                                </button>
                            </div>
                        </div>

                        <div className="editor-input-group">
                            <label>Upload File(s)</label>
                            <label className="upload-drop-zone">
                                <i className="fas fa-cloud-upload-alt"></i>
                                <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600, fontFamily: 'Montserrat', marginBottom: '5px' }}>
                                    {uploading ? 'Uploading...' : `Click to upload ${onboardingMedia.type === 'images' ? 'multiple images' : 'a file'}`}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#888', fontFamily: 'Montserrat' }}>
                                    {onboardingMedia.type === 'video' && 'Supports MP4, WebM (Max 100MB)'}
                                    {onboardingMedia.type === 'document' && 'Supports PDF (Max 20MB)'}
                                    {onboardingMedia.type === 'images' && 'Supports JPG, PNG (You can select multiple files)'}
                                </div>
                                <input 
                                    type="file" 
                                    accept={onboardingMedia.type === 'video' ? 'video/*' : onboardingMedia.type === 'document' ? 'application/pdf' : 'image/*'} 
                                    multiple={onboardingMedia.type === 'images'}
                                    onChange={handleMediaUpload} 
                                    style={{ display: 'none' }} 
                                    disabled={uploading}
                                />
                            </label>
                            {uploading && (
                                <div style={{ color: 'var(--gold)', fontSize: '0.85rem', fontFamily: 'Montserrat', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <i className="fas fa-circle-notch fa-spin"></i> Uploading to storage... please wait.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Exchange Rates & Currencies section */}
            <div className="adm-settings__section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                        <h3 style={{ marginBottom: 4 }}>Currency & Exchange Rates</h3>
                        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.8rem', color: '#999', margin: 0 }}>
                            Select supported currencies for your store and manually refresh their exchange rates.
                            <br/>
                            {lastCacheTime && <span style={{color: 'var(--gold)'}}>Last Cached: {lastCacheTime}</span>}
                        </p>
                    </div>
                    <button 
                        onClick={handleForceRefreshRates} 
                        disabled={ratesRefreshLoading}
                        style={{
                            background: 'var(--gold)',
                            color: '#000',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '4px',
                            fontFamily: "'Montserrat', sans-serif",
                            fontWeight: '600',
                            cursor: ratesRefreshLoading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            opacity: ratesRefreshLoading ? 0.7 : 1
                        }}
                    >
                        {ratesRefreshLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sync-alt"></i>}
                        {ratesRefreshLoading ? 'Fetching...' : 'Fetch Latest Rates Now'}
                    </button>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <input 
                        type="text" 
                        placeholder="Search currencies (e.g. USD, Euro, Yen...)" 
                        value={currencySearchQuery}
                        onChange={(e) => setCurrencySearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 15px',
                            background: '#141414',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '4px',
                            color: '#fff',
                            fontFamily: "'Montserrat', sans-serif"
                        }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px', maxHeight: '300px', overflowY: 'auto', padding: '10px 0' }}>
                    {globalCurrencies && Object.entries(globalCurrencies)
                        .filter(([code, info]) => {
                            if (!currencySearchQuery) return true;
                            const q = currencySearchQuery.toLowerCase();
                            return code.toLowerCase().includes(q) || (info.name && info.name.toLowerCase().includes(q));
                        })
                        .map(([code, info]) => {
                        const isSupported = supportedCurrencies.includes(code);
                        return (
                            <div key={code} onClick={() => toggleCurrency(code)} style={{
                                padding: '12px 16px',
                                background: isSupported ? 'rgba(197, 160, 89, 0.1)' : '#141414',
                                border: `1px solid ${isSupported ? 'var(--gold)' : 'rgba(255,255,255,0.1)'}`,
                                borderRadius: '6px',
                                cursor: code === 'INR' ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                opacity: code === 'INR' ? 0.5 : 1,
                                transition: 'all 0.2s'
                            }}>
                                <input 
                                    type="checkbox" 
                                    checked={isSupported} 
                                    readOnly 
                                    style={{ accentColor: 'var(--gold)' }} 
                                />
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 'bold', color: isSupported ? 'var(--gold)' : '#fff' }}>
                                        {code} <span style={{ color: '#888', fontWeight: 'normal', marginLeft: '5px' }}>{info.symbol}</span>
                                    </span>
                                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.7rem', color: '#888' }}>
                                        {info.name}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: '12px',
                    background: '#141414',
                    border: '1px solid rgba(197, 160, 89, 0.2)',
                    padding: '20px',
                    borderRadius: '8px'
                }}>
                    <div style={{ gridColumn: '1 / -1', marginBottom: '10px', fontFamily: "'Montserrat', sans-serif", fontSize: '0.85rem', color: '#999' }}>
                        <strong>Live Cache:</strong> These rates are currently live across the storefront.
                    </div>
                    {cachedRates ? (
                        Object.entries(cachedRates).filter(([code]) => code !== 'INR' && supportedCurrencies.includes(code)).map(([code, rate]) => (
                            <div key={code} style={{
                                padding: '10px',
                                background: '#1c1c1c',
                                borderRadius: '6px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 'bold', color: 'var(--gold)', letterSpacing: '1px' }}>
                                    1 {code}
                                </span>
                                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.85rem', color: '#ddd' }}>
                                    = ₹{(1 / rate).toFixed(2)}
                                </span>
                            </div>
                        ))
                    ) : (
                        <p style={{ color: '#888', fontSize: '0.85rem', gridColumn: '1 / -1' }}>No cached rates found in this browser.</p>
                    )}
                </div>
            </div>

            {/* Manage Admins section */}
            <div className="adm-settings__section">
                <h3>Manage Admins</h3>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.8rem', color: '#999', marginBottom: 16 }}>
                    Add admins for customer support and design approval roles.
                </p>
                <div className="adm-table-wrap">
                    <table className="adm-table">
                        <thead>
                            <tr>
                                <th>Admin ID</th>
                                <th>Username</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {adminsLoading ? (
                                <tr><td colSpan="5" className="adm-table__empty">Loading admins from database...</td></tr>
                            ) : admins.length === 0 ? (
                                <tr><td colSpan="5" className="adm-table__empty"><i className="fas fa-user-shield"></i>No additional admins. Add customer support or design approval admins.</td></tr>
                            ) : (
                                admins.map(a => (
                                    <tr key={a.id}>
                                        <td>{a.id}</td>
                                        <td>@{a.username || a.displayName || 'admin'}</td>
                                        <td><span className="adm-badge adm-badge--info">{a.role}</span></td>
                                        <td><span className={`adm-badge adm-badge--${a.active !== false ? 'active' : 'danger'}`}>{a.active !== false ? 'Active' : 'Disabled'}</span></td>
                                        <td>
                                            {a.active !== false ? (
                                                <button className="adm-action-btn adm-action-btn--reject" onClick={() => handleRemoveAdmin(a.id)}>Disable</button>
                                            ) : (
                                                <span style={{ fontSize: '0.75rem', color: '#86868b' }}>Disabled</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <button className="adm-settings__btn" style={{ marginTop: 16 }} onClick={() => setShowAddAdminModal(true)}>
                    <i className="fas fa-plus" style={{ marginRight: 6 }}></i> Add Admin
                </button>
            </div>

            {showAddAdminModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Add Admin</h3>
                            <button className="modal-close-btn" onClick={() => setShowAddAdminModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleAddAdmin}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Display Name</label>
                                    <input 
                                        type="text" 
                                        required 
                                        placeholder="Admin Full Name" 
                                        value={newAdminName} 
                                        onChange={e => setNewAdminName(e.target.value)} 
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input 
                                        type="email" 
                                        required 
                                        placeholder="admin@gmail.com" 
                                        value={newAdminEmail} 
                                        onChange={e => setNewAdminEmail(e.target.value)} 
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Role</label>
                                    <select value={newAdminRole} onChange={e => setNewAdminRole(e.target.value)}>
                                        <option value="support">Customer Support</option>
                                        <option value="design-reviewer">Design Reviewer</option>
                                        <option value="master">Master Admin</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="adm-settings__btn" style={{ background: '#3a3a3c', marginTop: 0 }} onClick={() => setShowAddAdminModal(false)}>Cancel</button>
                                <button type="submit" className="adm-settings__btn" style={{ background: 'var(--gold)', color: '#000', marginTop: 0 }}>Create Invite</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </main>
    );
}

export default MasterSettings;
