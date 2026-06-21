import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BackButton from '../../components/BackButton';


const styles = `
    .designs-container { padding: 40px 5%; }
    .designs-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 2px solid var(--dark); padding-bottom: 15px; }
    .design-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 30px; }
    .design-spec-card { background: white; border: 1px solid #eee; transition: 0.3s; position: relative; }
    .design-spec-card:hover { box-shadow: 0 10px 20px rgba(0,0,0,0.05); transform: translateY(-5px); }
    .design-preview { height: 250px; background: var(--gray); display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.1); font-size: 4rem; overflow: hidden; }
    .design-details { padding: 20px; }
    .design-details h4 { font-family: 'Cinzel', serif; margin: 0 0 10px 0; color: var(--dark); letter-spacing: 1px; }
    .spec-meta { font-size: 0.8rem; color: #666; margin-bottom: 15px; display: flex; justify-content: space-between; }
    .btn-download-spec { width: 100%; padding: 12px; background: var(--dark); color: white; border: none; font-family: 'Montserrat', sans-serif; font-weight: bold; font-size: 0.75rem; letter-spacing: 1px; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 10px; }
    .btn-download-spec:hover { background: var(--gold); }
    .tag-authorized { position: absolute; top: 10px; right: 10px; background: var(--gold); color: white; padding: 4px 10px; font-size: 0.6rem; font-weight: bold; letter-spacing: 1px; }
`;

function MfgDesigns() {
    const navigate = useNavigate();
    return (
        <>
            <style>{styles}</style>
            

            <main className="designs-container">
                <BackButton />
                <div className="designs-header">
                    <h2 style={{ fontFamily: "'Cinzel', serif", margin: 0 }}>AUTHORIZED DESIGNS</h2>
                    <div className="search-specs">
                        <input type="text" placeholder="Search Design ID..." style={{ padding: '8px 15px', border: '1px solid #ddd', fontFamily: "'Montserrat'" }} />
                    </div>
                </div>

                <div className="design-grid">
                    <div className="design-spec-card">
                        <div className="tag-authorized">ACTIVE</div>
                        <div className="design-preview"><i className="fas fa-tshirt"></i></div>
                        <div className="design-details">
                            <h4>GOLD EMBLEM TEE</h4>
                            <div className="spec-meta"><span>ID: #DS-9901</span><span>Designer: @UrbanElite</span></div>
                            <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: '20px' }}>Fabric: 100% Egyptian Cotton<br />Print: Gold Foil Transfer</p>
                            <button className="btn-download-spec"><i className="fas fa-file-pdf"></i> DOWNLOAD TECH PACK</button>
                        </div>
                    </div>

                    <div className="design-spec-card">
                        <div className="tag-authorized">ACTIVE</div>
                        <div className="design-preview"><i className="fas fa-vest"></i></div>
                        <div className="design-details">
                            <h4>OBSIDIAN UTILITY JACKET</h4>
                            <div className="spec-meta"><span>ID: #DS-8722</span><span>Designer: @MinimalistKing</span></div>
                            <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: '20px' }}>Fabric: Weatherproof Nylon<br />Hardware: Matte Black Zinc</p>
                            <button className="btn-download-spec"><i className="fas fa-file-pdf"></i> DOWNLOAD TECH PACK</button>
                        </div>
                    </div>

                    <div className="design-spec-card">
                        <div className="tag-authorized">ACTIVE</div>
                        <div className="design-preview"><i className="fas fa-socks"></i></div>
                        <div className="design-details">
                            <h4>ROYAL KNIT SWEATER</h4>
                            <div className="spec-meta"><span>ID: #DS-4410</span><span>Designer: @RoyalCreations</span></div>
                            <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: '20px' }}>Fabric: Merino Wool Blend<br />Pattern: Intarsia Gold Knit</p>
                            <button className="btn-download-spec"><i className="fas fa-file-pdf"></i> DOWNLOAD TECH PACK</button>
                        </div>
                    </div>
                </div>
            </main>

            
        </>
    );
}

export default MfgDesigns;
