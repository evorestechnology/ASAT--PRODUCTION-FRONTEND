import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ProtectedRoute, GuestRoute } from './components/ProtectedRoute';

/* Scrolls to the top of the page on every route change */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

// Layouts
import UserLayout     from './layouts/UserLayout';
import DesignerLayout from './layouts/DesignerLayout';
import MasterLayout   from './layouts/MasterLayout';
import MfgLayout      from './layouts/MfgLayout';

// Main pages
import UserIndex    from './components/UserIndex';
import UserLogin    from './components/UserLogin';
import UserRegister from './components/UserRegister';

// User pages
import UserProfile  from './pages/user/UserProfile';
import UserOrders   from './pages/user/UserOrders';
import UserAddress  from './pages/user/UserAddress';
import UserTracking from './pages/user/UserTracking';
import UserTerms    from './pages/user/UserTerms';
import Products      from './pages/user/Products';
import ProductDetail from './pages/user/ProductDetail';
import Cart                   from './pages/user/Cart';
import Wishlist               from './pages/user/Wishlist';
import DesignerPublicProfile  from './pages/user/DesignerPublicProfile';
import DesignerRankings       from './pages/user/DesignerRankings';

// Designer pages
import DesignerIndex    from './pages/designer/DesignerIndex';
import DesignerLogin    from './pages/designer/DesignerLogin';
import DesignerRegister from './pages/designer/DesignerRegister';
import DesignerOrders   from './pages/designer/DesignerOrders';
import DesignerProfile  from './pages/designer/DesignerProfile';
import DesignerEarnings from './pages/designer/DesignerEarnings';
import DesignerAnalytics from './pages/designer/DesignerAnalytics';
import DesignerRanking  from './pages/designer/DesignerRanking';
import DesignerSupport  from './pages/designer/DesignerSupport';
import DesignerAbout    from './pages/designer/DesignerAbout';
import DesignerTerms    from './pages/designer/DesignerTerms';
import DesignerDesigns  from './pages/designer/DesignerDesigns';
import DesignerUpload   from './pages/designer/DesignerUpload';
import DesignerBaseProducts from './pages/designer/DesignerBaseProducts';
import DesignerProductDetail from './pages/designer/DesignerProductDetail';

// Master pages
import MasterDashboard    from './pages/master/MasterDashboard';
import MasterLogin        from './pages/master/MasterLogin';
import MasterOrderHistory from './pages/master/MasterOrderHistory';
import MasterWallets      from './pages/master/MasterWallets';
import MasterDesigners    from './pages/master/MasterDesigners';
import MasterManufacturers from './pages/master/MasterManufacturers';
import MasterDesigns      from './pages/master/MasterDesigns';
import MasterCatalogue    from './pages/master/MasterCatalogue';
import MasterProducts     from './pages/master/MasterProducts';
import MasterSettings     from './pages/master/MasterSettings';
import MasterActivity     from './pages/master/MasterActivity';
import MasterTickets      from './pages/master/MasterTickets';
import MasterCategories   from './pages/master/MasterCategories';
import MasterFinance      from './pages/master/MasterFinance';
import MasterDelivery     from './pages/master/MasterDelivery';
import MasterWithdrawals  from './pages/master/MasterWithdrawals';

// Mfg pages
import MfgIndex        from './pages/mfg/MfgIndex';
import MfgLogin        from './pages/mfg/MfgLogin';
import MfgOrders       from './pages/mfg/MfgOrders';
import MfgOrderHistory from './pages/mfg/MfgOrderHistory';
import MfgProfile      from './pages/mfg/MfgProfile';
import MfgWallets      from './pages/mfg/MfgWallets';
import MfgProducts     from './pages/mfg/MfgProducts';
import MfgPrintStyles  from './pages/mfg/MfgPrintStyles';
import MfgDesignDetail from './pages/mfg/MfgDesignDetail';


function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ScrollToTop />
      <Routes>

        {/* ─── User Routes ─── */}
        {/* Public pages inside UserLayout */}
        <Route element={<UserLayout />}>
          <Route path="/"         element={<UserIndex />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:productId" element={<ProductDetail />} />
          <Route path="/designers/:designerId" element={<DesignerPublicProfile />} />
          <Route path="/rankings" element={<DesignerRankings />} />
          <Route path="/terms"    element={<UserTerms />} />

          {/* Auth pages — redirect to home if already logged in */}
          <Route path="/login"    element={<GuestRoute><UserLogin /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><UserRegister /></GuestRoute>} />

          {/* Protected user pages — require 'user' role */}
          <Route path="/profile"  element={<ProtectedRoute allowedRoles={['user']} redirectTo="/login"><UserProfile /></ProtectedRoute>} />
          <Route path="/orders"   element={<ProtectedRoute allowedRoles={['user']} redirectTo="/login"><UserOrders /></ProtectedRoute>} />
          <Route path="/address"  element={<ProtectedRoute allowedRoles={['user']} redirectTo="/login"><UserAddress /></ProtectedRoute>} />
          <Route path="/tracking" element={<ProtectedRoute allowedRoles={['user']} redirectTo="/login"><UserTracking /></ProtectedRoute>} />
          <Route path="/cart"     element={<ProtectedRoute allowedRoles={['user']} redirectTo="/login"><Cart /></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute allowedRoles={['user']} redirectTo="/login"><Wishlist /></ProtectedRoute>} />
        </Route>

        {/* ─── Designer Auth (standalone — no header) ─── */}
        <Route path="/designer/login"    element={<GuestRoute><DesignerLogin /></GuestRoute>} />
        <Route path="/designer/register" element={<GuestRoute><DesignerRegister /></GuestRoute>} />

        {/* ─── Designer Routes (require 'designer' role) ─── */}
        <Route path="/designer" element={
          <ProtectedRoute allowedRoles={['designer']} redirectTo="/designer/login">
            <DesignerLayout />
          </ProtectedRoute>
        }>
          <Route index           element={<DesignerIndex />} />
          <Route path="orders"   element={<DesignerOrders />} />
          <Route path="profile"  element={<DesignerProfile />} />
          <Route path="earnings"      element={<DesignerEarnings />} />
          <Route path="analytics" element={<DesignerAnalytics />} />
          <Route path="ranking"  element={<DesignerRanking />} />
          <Route path="support"  element={<DesignerSupport />} />
          <Route path="about"    element={<DesignerAbout />} />
          <Route path="terms"    element={<DesignerTerms />} />
          <Route path="designs"  element={<DesignerDesigns />} />
          <Route path="designs/upload" element={<DesignerUpload />} />
          <Route path="base-products" element={<DesignerBaseProducts />} />
          <Route path="base-products/:id" element={<DesignerProductDetail />} />
        </Route>

        {/* ─── Master Auth (standalone — no header) ─── */}
        <Route path="/master/login" element={<GuestRoute><MasterLogin /></GuestRoute>} />

        {/* ─── Master Routes (require 'admin' role) ─── */}
        <Route path="/master" element={
          <ProtectedRoute allowedRoles={['admin']} redirectTo="/master/login">
            <MasterLayout />
          </ProtectedRoute>
        }>
          <Route index            element={<MasterDashboard />} />
          <Route path="orders"    element={<MasterOrderHistory />} />
          <Route path="wallet"    element={<MasterWallets />} />
          <Route path="designers" element={<MasterDesigners />} />
          <Route path="manufacturers" element={<MasterManufacturers />} />
          <Route path="designs"   element={<MasterDesigns />} />
          <Route path="catalogue" element={<MasterCatalogue />} />
          <Route path="products"  element={<MasterProducts />} />
           <Route path="tickets"   element={<MasterTickets />} />
          <Route path="settings"  element={<MasterSettings />} />
          <Route path="activity"  element={<MasterActivity />} />
          <Route path="categories" element={<MasterCategories />} />
          <Route path="finance"   element={<MasterFinance />} />
          <Route path="delivery"  element={<MasterDelivery />} />
          <Route path="withdrawals" element={<MasterWithdrawals />} />
        </Route>

        {/* ─── Mfg Auth (standalone — no header) ─── */}
        <Route path="/mfg/login" element={<GuestRoute><MfgLogin /></GuestRoute>} />

        {/* ─── Mfg Routes (require 'mfg' role) ─── */}
        <Route path="/mfg" element={
          <ProtectedRoute allowedRoles={['mfg']} redirectTo="/mfg/login">
            <MfgLayout />
          </ProtectedRoute>
        }>
          <Route index           element={<MfgIndex />} />
          <Route path="products"     element={<MfgProducts />} />
          <Route path="print-styles" element={<MfgPrintStyles />} />

          <Route path="orders"   element={<MfgOrders />} />
          <Route path="history"  element={<MfgOrderHistory />} />
          <Route path="wallet"   element={<MfgWallets />} />
          <Route path="profile"  element={<MfgProfile />} />
          <Route path="designs/:id" element={<MfgDesignDetail />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
