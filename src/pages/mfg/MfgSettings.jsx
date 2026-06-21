import React from 'react';
import BackButton from '../../components/BackButton';


function MfgSettings() {
    return (
        <>
            <div style={{ maxWidth: '600px', margin: '60px auto', padding: '40px', border: '1px solid #eee', background: 'white' }}>
                <BackButton />
                <h2 style={{ fontFamily: "'Cinzel', serif", marginBottom: '30px' }}>MFG CONSOLE SETTINGS</h2>
                <div style={{ marginBottom: '30px' }}>
                    <h4 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Security</h4>
                    <label>Current Password</label>
                    <input type="password" style={{ width: '100%', padding: '12px', margin: '10px 0', boxSizing: 'border-box' }} />
                    <label>New Password</label>
                    <input type="password" style={{ width: '100%', padding: '12px', margin: '10px 0', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: '30px' }}>
                    <h4 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Production Notifications</h4>
                    <label><input type="checkbox" defaultChecked /> New Order Alerts</label><br /><br />
                    <label><input type="checkbox" defaultChecked /> Material Shipment Updates</label>
                </div>
                <button className="cta-gold" style={{ width: '100%' }}>SAVE SETTINGS</button>
            </div>
            
        </>
    );
}

export default MfgSettings;
