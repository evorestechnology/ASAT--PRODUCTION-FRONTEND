import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../components/BackButton';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';

const styles = `
    .wallet-card { background: rgba(255, 255, 255, 0.72); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.5); border-radius: 16px; color: #000000; padding: 40px; margin: 40px 5%; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.03); position: relative; }
    .currency-selector { position: absolute; top: 20px; right: 20px; }
    .currency-selector select { background: transparent; color: #000000; border: 1px solid rgba(0, 0, 0, 0.15); padding: 5px; outline: none; border-radius: 4px; }
    .wallet-flex { display: flex; justify-content: space-around; align-items: center; text-align: center; margin-top: 20px; }
    .amount-box h3 { font-family: 'Cinzel', serif; font-size: 0.82rem; letter-spacing: 1.5px; color: #666; font-weight: 600; text-transform: uppercase; }
    .amount { font-size: 2.2rem; font-family: 'Cinzel', serif; color: #000000; margin: 10px 0; font-weight: 700; }
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
