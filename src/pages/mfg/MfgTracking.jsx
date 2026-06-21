import React from 'react';
import BackButton from '../../components/BackButton';


const styles = `
    .tracking-card { border: 1px solid #eee; padding: 25px; margin-bottom: 20px; background: white; }
    .progress-bar-bg { height: 10px; background: #eee; border-radius: 5px; margin: 20px 0; overflow: hidden; }
    .progress-fill { height: 100%; background: var(--gold); }
    .status-labels { display: flex; justify-content: space-between; font-size: 0.7rem; font-weight: bold; color: #888; }
    .active-status { color: var(--gold); }
`;

function MfgTracking() {
    return (
        <>
            <style>{styles}</style>
            <div style={{ padding: '40px 5%' }}>
                <BackButton />
                <h2 style={{ fontFamily: "'Cinzel', serif", marginBottom: '30px' }}>REAL-TIME PRODUCTION TRACKING</h2>
                
                <div className="tracking-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong>BATCH #ASAT-JKT-001 (Elite Jackets)</strong>
                        <span style={{ color: 'var(--gold)' }}>ETA: May 05, 2026</span>
                    </div>
                    <div className="progress-bar-bg"><div className="progress-fill" style={{ width: '75%' }}></div></div>
                    <div className="status-labels">
                        <span>RAW MATERIAL</span>
                        <span>CUTTING</span>
                        <span className="active-status">STITCHING (75%)</span>
                        <span>QC CHECK</span>
                        <span>READY TO SHIP</span>
                    </div>
                </div>
            </div>
        </>
    );
}

export default MfgTracking;
