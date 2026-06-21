import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProfileDropdown() {
    const navigate = useNavigate();
    const { logout, role } = useAuth();

    // Dynamic routing paths based on role
    const getAccountPath = () => {
        if (role === 'admin') return '/master';
        if (role === 'designer') return '/designer/profile';
        if (role === 'mfg') return '/mfg/profile';
        return '/profile';
    };

    const getOrdersPath = () => {
        if (role === 'admin') return '/master/orders';
        if (role === 'designer') return '/designer/orders';
        if (role === 'mfg') return '/mfg/orders';
        return '/orders';
    };

    return (
        <>
            <Link to={getAccountPath()}><i className="fas fa-user-circle"></i> Account Details</Link>
            <Link to={getOrdersPath()}><i className="fas fa-box-open"></i> Order History</Link>
            {role === 'user' && (
                <>
                    <Link to="/address"><i className="fas fa-map-marker-alt"></i> Manage Delivery Address</Link>
                    <Link to="/tracking"><i className="fas fa-route"></i> Order Tracking</Link>
                </>
            )}
            <div className="popup-divider"></div>
            <Link to="/terms"><i className="fas fa-file-alt"></i> Terms and Conditions</Link>
            <button className="logout-btn" onClick={async () => {
                try {
                    await logout();
                    navigate('/login');
                } catch (err) {
                    console.error('Logout error:', err);
                }
            }}>
                <i className="fas fa-sign-out-alt"></i> Log-out
            </button>
        </>
    );
}

export default ProfileDropdown;
