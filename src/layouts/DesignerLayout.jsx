import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import DesignerHeader from '../components/DesignerHeader';
import DesignerFooter from '../components/DesignerFooter';
import '../styles/designer.css';

function DesignerLayout() {
    const { pathname } = useLocation();
    const isAuth = pathname.includes('/login') || pathname.includes('/register');

    return (
        <>
            {!isAuth && <DesignerHeader />}
            <Outlet />
            {!isAuth && <DesignerFooter />}
        </>
    );
}

export default DesignerLayout;
