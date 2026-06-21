import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../api';
import BackButton from '../../components/BackButton';

function UserTerms() {
    const navigate = useNavigate();
    const [terms, setTerms] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTerms = async () => {
            try {
                const data = await apiFetch('/api/settings/general');
                if (data && data.value) {
                    setTerms(data.value.terms || '');
                }
            } catch (err) {
                console.error('Error fetching terms:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTerms();
    }, []);

    return (
        <>
            <main style={{ flex: 1, padding: '60px 10%', lineHeight: 1.8, background: 'white', margin: '40px 5%', border: '1px solid #eee' }}>
                <BackButton />
                <h1 style={{ fontFamily: "'Cinzel', serif", color: 'var(--gold)', textAlign: 'center', marginBottom: '30px' }}>TERMS &amp; CONDITIONS</h1>
                
                {loading ? (
                    <div style={{ textAlign: 'center', fontFamily: 'Montserrat', color: '#666', padding: '40px 0' }}>
                        Loading terms and conditions…
                    </div>
                ) : terms ? (
                    terms.split('\n').map((para, idx) => {
                        const trimmed = para.trim();
                        if (!trimmed) return null;
                        return (
                            <p key={idx} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.95rem', color: '#333', marginBottom: '20px' }}>
                                {trimmed}
                            </p>
                        );
                    })
                ) : (
                    <p style={{ fontFamily: 'Montserrat, sans-serif', textAlign: 'center', color: '#888' }}>
                        No terms and conditions published yet.
                    </p>
                )}
            </main>
        </>
    );
}

export default UserTerms;
