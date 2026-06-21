import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../components/BackButton';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';

const styles = `
    .wallet-card { background: var(--dark); color: white; padding: 40px; margin: 40px 5%; border-bottom: 5px solid var(--gold); position: relative; }
    .currency-selector { position: absolute; top: 20px; right: 20px; }
    .currency-selector select { background: transparent; color: var(--gold); border: 1px solid var(--gold); padding: 5px; outline: none; }
    .wallet-flex { display: flex; justify-content: space-around; align-items: center; text-align: center; margin-top: 20px; }
    .amount-box h3 { font-family: 'Cinzel', serif; font-size: 0.9rem; letter-spacing: 1px; }
    .amount { font-size: 2.5rem; font-family: 'Cinzel', serif; color: var(--gold); margin: 10px 0; }
`;

function DesignerWallet() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [wallet, setWallet] = useState({ balance: 0, totalWithdrawn: 0 });
    const [loading, setLoading] = useState(true);

    const fetchWallet = async () => {
        if (!user) return;
        try {
            const data = await apiFetch('/api/wallets/me').catch(() => null);
            if (data) {
                setWallet({
                    balance: Number(data.balance) || 0,
                    totalWithdrawn: Number(data.total_withdrawn) || 0
                });
            }
            setLoading(false);
        } catch (err) {
            console.error("Error fetching wallet balance:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;
        fetchWallet();
    }, [user]);

    const totalEarnings = wallet.balance + wallet.totalWithdrawn;

    return (
        <>
            <style>{styles}</style>
            <div style={{ padding: '20px 5% 0' }}><BackButton /></div>
            
            {loading ? (
                <div className="wallet-card" style={{ textAlign: 'center' }}>
                    <p style={{ fontFamily: 'Montserrat', fontSize: '0.9rem', color: '#aaa' }}>Loading live wallet details...</p>
                </div>
            ) : (
                <div className="wallet-card">
                    <div className="wallet-flex">
                        <div className="amount-box">
                            <h3>EARNINGS TILL DATE</h3>
                            <div className="amount">₹{totalEarnings.toLocaleString('en-IN')}</div>
                        </div>
                        <div className="amount-box">
                            <h3>AVAILABLE BALANCE</h3>
                            <div className="amount">₹{wallet.balance.toLocaleString('en-IN')}</div>
                        </div>
                    </div>
                    <button 
                        className="cta-gold" 
                        style={{ display: 'block', margin: '20px auto 0' }}
                        onClick={() => navigate('/designer/earnings')}
                    >
                        WITHDRAW FUNDS
                    </button>
                </div>
            )}
        </>
    );
}

export default DesignerWallet;
