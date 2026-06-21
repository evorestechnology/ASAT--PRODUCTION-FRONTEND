import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import UserFooter from '../components/UserFooter';

function UserLayout() {
    return (
        <>
            <Navbar />
            <Outlet />
            <UserFooter />
        </>
    );
}

export default UserLayout;
