import React from 'react';
import BackButton from '../../components/BackButton';


const styles = `
    .ticket-list { width: 100%; border-collapse: collapse; }
    .ticket-list tr { border-bottom: 1px solid #eee; cursor: pointer; transition: 0.2s; }
    .ticket-list tr:hover { background: #fafafa; }
    .status-tag { padding: 5px 10px; border-radius: 3px; font-size: 0.7rem; color: white; }
`;

function MfgSupport() {
    return (
        <>
            <style>{styles}</style>
            <div style={{ padding: '40px 5%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <BackButton />
                <h2 style={{ fontFamily: "'Cinzel', serif" }}>MFG SUPPORT TICKETS</h2>
                    <button className="cta-gold" style={{ padding: '10px 20px' }}>OPEN NEW ISSUE</button>
                </div>
                <table className="ticket-list" style={{ marginTop: '30px' }}>
                    <thead>
                        <tr style={{ fontFamily: "'Cinzel'", fontWeight: 'bold' }}>
                            <td style={{ padding: '20px' }}>ID</td>
                            <td style={{ padding: '20px' }}>Subject</td>
                            <td style={{ padding: '20px' }}>Priority</td>
                            <td style={{ padding: '20px' }}>Status</td>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: '20px' }}>#TKT-881</td>
                            <td style={{ padding: '20px' }}>Inconsistent Gold Thread Batch #44</td>
                            <td style={{ padding: '20px', color: 'red' }}>HIGH</td>
                            <td style={{ padding: '20px' }}><span className="status-tag" style={{ background: 'orange' }}>OPEN</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </>
    );
}

export default MfgSupport;
