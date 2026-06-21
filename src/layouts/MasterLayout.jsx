import React from 'react';
import { Outlet } from 'react-router-dom';
import MasterHeader from '../components/MasterHeader';

function MasterLayout() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <MasterHeader />
            <div style={{ flex: 1 }}>
                <Outlet />
            </div>
        </div>
    );
}

export default MasterLayout;

