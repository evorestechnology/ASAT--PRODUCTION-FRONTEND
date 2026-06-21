import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BackButton from '../../components/BackButton';


const styles = `
    body { display: flex; flex-direction: column; min-height: 100vh; margin: 0; }
    header { padding: 20px 5%; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; background: white; position: sticky; top: 0; z-index: 1000; }
    .logo { font-family: 'Cinzel', serif; font-weight: bold; font-size: 1.5rem; letter-spacing: 2px; cursor: pointer; }
    main { flex: 1; padding: 40px 5%; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; border-bottom: 2px solid var(--dark); padding-bottom: 15px; }
    .orders-table-wrapper { background: white; border: 1px solid #eee; overflow-x: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.02); }
    .orders-table { width: 100%; border-collapse: collapse; font-family: 'Montserrat', sans-serif; }
    .orders-table th { background: var(--dark); color: white; font-family: 'Cinzel', serif; padding: 18px; text-align: left; font-size: 0.85rem; letter-spacing: 1px; }
    .orders-table td { padding: 18px; border-bottom: 1px solid #eee; font-size: 0.85rem; }
    .orders-table tr:hover { background: #fcfcfc; }
    .badge { padding: 5px 12px; font-size: 0.7rem; font-weight: bold; text-transform: uppercase; border-radius: 2px; }
    .status-paid { background: #e8f5e9; color: #2e7d32; }
    .status-pending { background: #fff3e0; color: #ef6c00; }
    footer { background: var(--dark); color: white; padding: 30px 5% 10px; width: 100%; box-sizing: border-box; }
    .copyright { text-align: center; border-top: 1px solid #333; padding-top: 15px; font-size: 0.75rem; }
`;

function MasterOrders() {
    const navigate = useNavigate();

    return (
        <>
            <style>{styles}</style>
            
            <main>
                <BackButton />
                <div className="page-header">
                    <h2 style={{ fontFamily: "'Cinzel', serif", margin: 0 }}>GLOBAL ORDER MANAGEMENT</h2>
                    <div>
                        <span style={{ fontWeight: 'bold', fontSize: '0.8rem', marginRight: '10px' }}>SORT BY:</span>
                        <select style={{ padding: '8px', border: '1px solid var(--gold)', outline: 'none', fontFamily: "'Montserrat'" }}>
                            <option defaultValue>Newest First</option>
                            <option>High Quantity</option>
                            <option>Status: Pending</option>
                        </select>
                    </div>
                </div>
                <div className="orders-table-wrapper">
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>ORDER ID</th><th>TIMESTAMP</th><th>ITEM DETAILS</th>
                                <th>QTY</th><th>CUSTOMER</th><th>TOTAL AMOUNT</th><th>PAYMENT STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>#AS-101</td><td>Apr 24, 2026 | 11:20 AM</td><td>Elite Obsidian Jacket</td>
                                <td>1</td><td>@VaibhavAdmin</td><td>$450.00</td>
                                <td><span className="badge status-paid">Paid</span></td>
                            </tr>
                            <tr>
                                <td>#AS-102</td><td>Apr 24, 2026 | 09:45 AM</td><td>Signature Silk Tee</td>
                                <td>3</td><td>@User_Luxury</td><td>$360.00</td>
                                <td><span className="badge status-pending">Pending</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </main>
            
        </>
    );
}

export default MasterOrders;
