import React from 'react';
import { Outlet } from 'react-router-dom';
import MfgHeader from '../components/MfgHeader';

function MfgLayout() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <MfgHeader />
            <div style={{ flex: 1 }}>
                <Outlet />
            </div>
        </div>
    );
}

export default MfgLayout;

