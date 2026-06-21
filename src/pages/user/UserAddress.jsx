import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';

const styles = `
    body { display: flex; flex-direction: column; min-height: 100vh; }
    .address-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; margin-top: 20px; }
    .address-card { border: 1px solid #eee; padding: 24px; background: white; position: relative; box-shadow: 0 4px 12px rgba(0,0,0,0.03); transition: transform 0.2s, box-shadow 0.2s; display: flex; flex-direction: column; justify-content: space-between; }
    .address-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.06); }
    .address-card h4 { font-family: 'Cinzel', serif; margin-top: 0; color: #111; letter-spacing: 1px; display: flex; justify-content: space-between; align-items: center; }
    .address-card p { font-family: 'Montserrat', sans-serif; font-size: 0.85rem; color: #555; line-height: 1.5; margin: 8px 0; }
    .address-card .phone { font-size: 0.8rem; color: #888; font-weight: 500; }
    .address-actions { display: flex; gap: 10px; margin-top: 15px; border-top: 1px solid #f0f0f0; padding-top: 15px; }
    .address-btn { padding: 6px 12px; border: 1px solid #ddd; background: white; font-family: 'Montserrat', sans-serif; font-size: 0.72rem; cursor: pointer; transition: all 0.2s; }
    .address-btn:hover { border-color: #111; color: #111; }
    .address-btn--delete:hover { border-color: #c0392b; color: #c0392b; }
    .default-badge { font-family: 'Montserrat', sans-serif; font-size: 0.65rem; color: var(--gold); border: 1px solid var(--gold); padding: 2px 6px; font-weight: bold; letter-spacing: 0.5px; }
    
    .toast {
        padding: 12px;
        margin-bottom: 20px;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.85rem;
        border-radius: 4px;
        text-align: center;
    }
    .toast--success { background: #eafaf1; color: #1e7e34; border: 1px solid #28a745; }
    .toast--error { background: #fef0ee; color: #c0392b; border: 1px solid #c0392b; }
    
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
    .modal-content { background: white; border: 1px solid #eee; padding: 30px; width: 100%; max-width: 550px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border-radius: 4px; box-sizing: border-box; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #f0f0f0; padding-bottom: 12px; }
    .modal-header h3 { font-family: 'Cinzel', serif; margin: 0; letter-spacing: 1px; }
    .modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #888; }
    .modal-close:hover { color: #000; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .form-group { display: flex; flex-direction: column; }
    .form-group label { font-family: 'Cinzel', serif; font-size: 0.72rem; font-weight: bold; margin-bottom: 6px; }
    .form-group input, .form-group select { padding: 10px; border: 1px solid #ddd; font-family: 'Montserrat', sans-serif; font-size: 0.8rem; box-sizing: border-box; }
    .form-group input:focus, .form-group select:focus { border-color: var(--gold); outline: none; }
    .full-width { grid-column: span 2; }
`;

function UserAddress() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    
    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [label, setLabel] = useState('HOME');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [addressLine1, setAddressLine1] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [pincode, setPincode] = useState('');
    const [country, setCountry] = useState('');

    const fetchAddresses = async () => {
        if (!user) return;
        try {
            const data = await apiFetch('/api/users/addresses');
            
            const list = (data || []).map(addr => ({
                id: addr.id,
                label: addr.label,
                fullName: addr.full_name,
                phone: addr.phone,
                addressLine1: addr.line1,
                city: addr.city,
                state: addr.state,
                pincode: addr.pincode,
                country: addr.country,
                isDefault: addr.is_default
            }));
            setAddresses(list);
        } catch (err) {
            console.error('Error fetching addresses:', err);
            setToast({ type: 'error', msg: 'Failed to fetch addresses.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;
        fetchAddresses();
    }, [user]);

    const openAddModal = () => {
        setEditingAddress(null);
        setLabel('HOME');
        setFullName(user?.user_metadata?.full_name || '');
        setPhone('');
        setAddressLine1('');
        setCity('');
        setState('');
        setPincode('');
        setCountry('');
        setShowModal(true);
    };

    const openEditModal = (addr) => {
        setEditingAddress(addr);
        setLabel(addr.label || 'HOME');
        setFullName(addr.fullName || '');
        setPhone(addr.phone || '');
        setAddressLine1(addr.addressLine1 || '');
        setCity(addr.city || '');
        setState(addr.state || '');
        setPincode(addr.pincode || '');
        setCountry(addr.country || '');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;
        setToast(null);

        const payload = {
            label,
            full_name: fullName,
            phone,
            line1: addressLine1,
            city,
            state,
            pincode,
            country,
        };

        try {
            if (editingAddress) {
                await apiFetch(`/api/users/addresses/${editingAddress.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                setToast({ type: 'success', msg: 'Address updated successfully!' });
            } else {
                payload.is_default = addresses.length === 0;
                await apiFetch('/api/users/addresses', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                setToast({ type: 'success', msg: 'Address added successfully!' });
            }
            setShowModal(false);
            fetchAddresses();
            setTimeout(() => setToast(null), 3000);
        } catch (err) {
            console.error('Error saving address:', err);
            setToast({ type: 'error', msg: 'Failed to save address: ' + (err.error || err.message) });
        }
    };

    const handleDelete = async (addrId) => {
        if (!user) return;
        setToast(null);
        try {
            await apiFetch(`/api/users/addresses/${addrId}`, {
                method: 'DELETE'
            });
            setToast({ type: 'success', msg: 'Address deleted successfully!' });
            fetchAddresses();
            setTimeout(() => setToast(null), 3000);
        } catch (err) {
            console.error('Error deleting address:', err);
            setToast({ type: 'error', msg: 'Failed to delete address: ' + (err.error || err.message) });
        }
    };

    const handleSetDefault = async (addrId) => {
        if (!user) return;
        setToast(null);
        try {
            await apiFetch(`/api/users/addresses/${addrId}`, {
                method: 'PUT',
                body: JSON.stringify({ is_default: true })
            });

            setToast({ type: 'success', msg: 'Default address set!' });
            fetchAddresses();
            setTimeout(() => setToast(null), 3000);
        } catch (err) {
            console.error('Error setting default address:', err);
            setToast({ type: 'error', msg: 'Failed to set default: ' + (err.error || err.message) });
        }
    };

    return (
        <>
            <style>{styles}</style>

            <main style={{ flex: 1, padding: '40px 5%' }}>
                <BackButton />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h2 style={{ fontFamily: "'Cinzel', serif", margin: 0 }}>STORED ADDRESSES</h2>
                    <button className="cta-gold" onClick={openAddModal}>+ ADD NEW ADDRESS</button>
                </div>
                
                {toast && (
                    <div className={`toast toast--${toast.type}`}>
                        {toast.msg}
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: 'center', fontFamily: 'Montserrat', color: '#666', padding: '40px 0' }}>
                        Loading delivery addresses…
                    </div>
                ) : addresses.length === 0 ? (
                    <div style={{ textAlign: 'center', fontFamily: 'Montserrat', color: '#888', padding: '60px 0', border: '1px dashed #ddd', background: '#fafafa' }}>
                        No stored addresses found. Add a delivery address to proceed.
                    </div>
                ) : (
                    <div className="address-grid">
                        {addresses.map(addr => (
                            <div className="address-card" key={addr.id}>
                                <div>
                                    <h4>
                                        {addr.label}
                                        {addr.isDefault && <span className="default-badge">DEFAULT</span>}
                                    </h4>
                                    <p style={{ fontWeight: '600', color: '#111' }}>{addr.fullName}</p>
                                    <p>{addr.addressLine1}</p>
                                    <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                                    <p>{addr.country}</p>
                                    <p className="phone"><i className="fas fa-phone-alt"></i> {addr.phone}</p>
                                </div>
                                <div className="address-actions">
                                    <button className="address-btn" onClick={() => openEditModal(addr)}>Edit</button>
                                    <button className="address-btn address-btn--delete" onClick={() => handleDelete(addr.id)}>Delete</button>
                                    {!addr.isDefault && (
                                        <button className="address-btn" style={{ marginLeft: 'auto', borderColor: 'var(--gold)', color: 'var(--gold)' }} onClick={() => handleSetDefault(addr.id)}>
                                            Set as Default
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{editingAddress ? 'EDIT ADDRESS' : 'ADD NEW ADDRESS'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Label</label>
                                    <select value={label} onChange={e => setLabel(e.target.value)}>
                                        <option value="HOME">HOME</option>
                                        <option value="WORK">WORK</option>
                                        <option value="OTHER">OTHER</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input type="text" required placeholder="Recipient Name" value={fullName} onChange={e => setFullName(e.target.value)} />
                                </div>
                                <div className="form-group full-width">
                                    <label>Address Line 1</label>
                                    <input type="text" required placeholder="Street address, P.O. box, company name" value={addressLine1} onChange={e => setAddressLine1(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>City</label>
                                    <input type="text" required placeholder="City" value={city} onChange={e => setCity(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>State / Province</label>
                                    <input type="text" required placeholder="State" value={state} onChange={e => setState(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Pincode / ZIP Code</label>
                                    <input type="text" required placeholder="ZIP Code" value={pincode} onChange={e => setPincode(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Country</label>
                                    <input type="text" required placeholder="Country Name" value={country} onChange={e => setCountry(e.target.value)} />
                                </div>
                                <div className="form-group full-width">
                                    <label>Phone Number</label>
                                    <input type="text" required placeholder="Contact Number" value={phone} onChange={e => setPhone(e.target.value)} />
                                </div>
                                <div className="full-width" style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
                                    <button type="button" className="address-btn" style={{ padding: '10px 20px' }} onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="cta-gold" style={{ padding: '10px 25px' }}>{editingAddress ? 'SAVE CHANGES' : 'ADD ADDRESS'}</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export default UserAddress;
