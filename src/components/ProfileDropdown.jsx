import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProfileDropdown({ onClose }) {
    const navigate = useNavigate();
    const { logout, role, user } = useAuth();

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
        <div className="blu-profile-menu">
            <style>{`
                .blu-profile-menu {
                    padding: 8px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Montserrat', sans-serif;
                    box-sizing: border-box;
                    width: 100%;
                }

                .blu-profile-menu__header {
                    padding: 10px 14px 8px;
                    border-bottom: 1px solid #F0F0F0;
                    margin-bottom: 6px;
                }

                .blu-profile-menu__role-tag {
                    font-size: 10px;
                    font-weight: 800;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    color: #888888;
                    display: block;
                }

                .blu-profile-menu__user-name {
                    font-size: 13px;
                    font-weight: 700;
                    color: #000000;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    margin-top: 2px;
                }

                .blu-profile-menu__item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 14px;
                    border-radius: 10px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #111111;
                    text-decoration: none;
                    transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
                    cursor: pointer;
                }

                .blu-profile-menu__item:hover {
                    background: #F5F5F5;
                    color: #000000;
                    transform: translateX(3px);
                }

                .blu-profile-menu__item i {
                    font-size: 14px;
                    width: 18px;
                    color: #666666;
                    text-align: center;
                }

                .blu-profile-menu__divider {
                    height: 1px;
                    background: #F0F0F0;
                    margin: 6px 4px;
                }

                .blu-profile-menu__logout {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 100%;
                    padding: 10px 14px;
                    border-radius: 10px;
                    font-size: 13px;
                    font-weight: 700;
                    color: #D32F2F;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    text-align: left;
                    font-family: inherit;
                    transition: all 0.18s ease;
                }

                .blu-profile-menu__logout:hover {
                    background: #FDE8E8;
                    color: #C62828;
                }

                .blu-profile-menu__logout i {
                    font-size: 14px;
                    width: 18px;
                    text-align: center;
                }
            `}</style>

            <div className="blu-profile-menu__header">
                <span className="blu-profile-menu__role-tag">
                    {role === 'designer' ? 'Creator Atelier' : role === 'admin' ? 'Master Admin' : role === 'mfg' ? 'Manufacturer' : 'Member'}
                </span>
                <div className="blu-profile-menu__user-name">
                    {user?.user_metadata?.full_name || user?.email || 'My Account'}
                </div>
            </div>

            <Link to={getAccountPath()} className="blu-profile-menu__item" onClick={onClose}>
                <i className="fas fa-user-circle" /> Account Details
            </Link>

            <Link to={getOrdersPath()} className="blu-profile-menu__item" onClick={onClose}>
                <i className="fas fa-box-open" /> Order History
            </Link>

            <Link to="/wishlist" className="blu-profile-menu__item" onClick={onClose}>
                <i className="far fa-heart" /> My Wishlist
            </Link>

            {role === 'user' && (
                <>
                    <Link to="/address" className="blu-profile-menu__item" onClick={onClose}>
                        <i className="fas fa-map-marker-alt" /> Delivery Addresses
                    </Link>
                    <Link to="/tracking" className="blu-profile-menu__item" onClick={onClose}>
                        <i className="fas fa-route" /> Order Tracking
                    </Link>
                    <Link to="/support" className="blu-profile-menu__item" onClick={onClose}>
                        <i className="fas fa-headset" /> Support Center
                    </Link>
                </>
            )}

            {role === 'designer' && (
                <Link to="/designer/support" className="blu-profile-menu__item" onClick={onClose}>
                    <i className="fas fa-headset" /> Support Center
                </Link>
            )}

            {role === 'mfg' && (
                <Link to="/mfg/support" className="blu-profile-menu__item" onClick={onClose}>
                    <i className="fas fa-headset" /> Support Center
                </Link>
            )}

            <div className="blu-profile-menu__divider" />

            <Link to="/terms" className="blu-profile-menu__item" onClick={onClose}>
                <i className="fas fa-file-alt" /> Terms &amp; Policies
            </Link>

            <button
                className="blu-profile-menu__logout"
                onClick={async () => {
                    try {
                        if (onClose) onClose();
                        await logout();
                        navigate('/login');
                    } catch (err) {
                        console.error('Logout error:', err);
                    }
                }}
            >
                <i className="fas fa-sign-out-alt" /> Sign Out
            </button>
        </div>
    );
}

export default ProfileDropdown;
