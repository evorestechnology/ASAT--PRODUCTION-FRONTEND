import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BackButton from '../../components/BackButton';


function DesignerTerms() {
    const navigate = useNavigate();

    return (
        <>
            

            <div style={{ padding: '60px 10%', lineHeight: 1.8, background: 'white', margin: '40px 5%', border: '1px solid #eee' }}>
                <BackButton />
                <h1 style={{ fontFamily: "'Cinzel', serif", color: 'var(--gold)' }}>DESIGNER TERMS &amp; CONDITIONS</h1>
                <p><strong>1. Intellectual Property:</strong> You retain ownership of your original art but grant 'As Simple As That' an exclusive license to produce and sell garments featuring said art.[cite: 2]</p>
                <p><strong>2. Royalties:</strong> Designers receive 15% of the gross sale price of each item sold.[cite: 2]</p>
                <p><strong>3. Conduct:</strong> Designers must adhere to premium quality standards and original work only.[cite: 2]</p>
            </div>

            
        </>
    );
}

export default DesignerTerms;
