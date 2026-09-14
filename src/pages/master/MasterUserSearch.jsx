import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../../api';
import '../../styles/admin.css';

// Reuse Toast from the app if possible, else simple local
const TOAST_CSS = { position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 };

const exportCSV = (data, filename, columns) => {
  const header = columns.map(c => c.label).join(',');
  const rows = data.map(row => columns.map(c => `"${(row[c.key] ?? '').toString().replace(/"/g, '""')}"`).join(','));
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

export default function MasterUserSearch() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all'); // all, with_orders, no_orders
  const [stats, setStats] = useState({ totalUsers: 0, recentOrders: 0, activeUsers: 0 });

  // Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [userData, setUserData] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/users/search?q=${query}&page=${page}&limit=20&filter=${filter}`);
      setUsers(res.users || []);
      if (!query && filter === 'all') {
        setStats({
          totalUsers: res.total || res.users?.length || 0,
          recentOrders: res.recentOrders || 0,
          activeUsers: res.activeUsers || 0
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [query, page, filter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [query, page, filter, fetchUsers]);

  const loadUserDetails = async (user) => {
    setSelectedUser(user);
    setModalLoading(true);
    setActiveTab('profile');
    try {
      const profile = await apiFetch(`/api/users/${user.id}/profile`);
      setUserData(profile);
      const orders = await apiFetch(`/api/users/${user.id}/orders`);
      setUserOrders(orders);
      const activity = await apiFetch(`/api/users/${user.id}/activity`);
      setUserActivity(activity);
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedUser(null);
    setUserData(null);
    setUserOrders([]);
    setUserActivity([]);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#1a1a1a', margin: '0 0 8px 0' }}>User Management</h1>
          <p style={{ color: '#666', margin: 0 }}>Search and inspect customer accounts</p>
        </div>
        {users.length > 0 && (
          <button
            onClick={() => {
              const exportData = users.map(u => ({
                id: u.id,
                name: u.full_name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Customer',
                email: u.email || '-',
                phone: u.phone || '-',
                country: u.country || 'India',
                joined: u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : '-',
                orders: u.order_count || 0
              }));
              exportCSV(exportData, 'customers-list.csv', [
                { label: 'User ID', key: 'id' },
                { label: 'Full Name', key: 'name' },
                { label: 'Email', key: 'email' },
                { label: 'Phone', key: 'phone' },
                { label: 'Country', key: 'country' },
                { label: 'Joined', key: 'joined' },
                { label: 'Orders Placed', key: 'orders' }
              ]);
            }}
            style={{
              background: '#1a1a1a',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            ⬇ Export Users (CSV)
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '32px' }}>
        <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '12px', padding: '20px', flex: '1 1 200px' }}>
          <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Total Users</div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1a1a', margin: 0 }}>{stats.totalUsers}</p>
        </div>
        <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '12px', padding: '20px', flex: '1 1 200px' }}>
          <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Recent Orders</div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1a1a', margin: 0 }}>{stats.recentOrders}</p>
        </div>
        <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '12px', padding: '20px', flex: '1 1 200px' }}>
          <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Active Users</div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1a1a', margin: 0 }}>{stats.activeUsers}</p>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
          <input 
            type="text" 
            placeholder="Search by name, email, phone..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, padding: '10px 16px', border: '1px solid #ccc', borderRadius: '8px', fontSize: '15px' }}
          />
          <div style={{ display: 'flex', gap: '8px', background: '#FAFAF8', padding: '4px', borderRadius: '8px', border: '1px solid #E5E5E5' }}>
            <button onClick={() => setFilter('all')} style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', background: filter === 'all' ? '#fff' : 'transparent', boxShadow: filter === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', fontWeight: filter === 'all' ? 600 : 400 }}>All</button>
            <button onClick={() => setFilter('with_orders')} style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', background: filter === 'with_orders' ? '#fff' : 'transparent', boxShadow: filter === 'with_orders' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', fontWeight: filter === 'with_orders' ? 600 : 400 }}>With Orders</button>
            <button onClick={() => setFilter('no_orders')} style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', background: filter === 'no_orders' ? '#fff' : 'transparent', boxShadow: filter === 'no_orders' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', fontWeight: filter === 'no_orders' ? 600 : 400 }}>No Orders</button>
          </div>
        </div>
        
        {error && <div style={{ color: '#dc2626', border: '1px solid #f87171', background: '#fef2f2', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>{error}</div>}
        
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #E5E5E5', color: '#666', fontSize: '13px', fontWeight: 600 }}>User</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #E5E5E5', color: '#666', fontSize: '13px', fontWeight: 600 }}>Contact</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #E5E5E5', color: '#666', fontSize: '13px', fontWeight: 600 }}>Country</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #E5E5E5', color: '#666', fontSize: '13px', fontWeight: 600 }}>Join Date</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #E5E5E5', color: '#666', fontSize: '13px', fontWeight: 600 }}>Orders</th>
            </tr>
          </thead>
          <tbody>
            {loading && users.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: '#666' }}>Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: '#666' }}>No users found.</td></tr>
            ) : (
              users.map(u => (
                <tr key={u.id} onClick={() => loadUserDetails(u)} style={{ cursor: 'pointer', ':hover': { background: '#FAFAF8' } }}>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #E5E5E5' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#C5A059', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {(u.firstName?.[0] || u.name?.[0] || '?').toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#1a1a1a' }}>{u.firstName} {u.lastName}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #E5E5E5' }}>
                    <div style={{ fontSize: '14px', color: '#1a1a1a' }}>{u.email}</div>
                    <div style={{ fontSize: '13px', color: '#666' }}>{u.phone || '-'}</div>
                  </td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #E5E5E5', fontSize: '14px', color: '#1a1a1a' }}>{u.country || '-'}</td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #E5E5E5', fontSize: '14px', color: '#1a1a1a' }}>{new Date(u.createdAt || u.joinDate || Date.now()).toLocaleDateString('en-IN')}</td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #E5E5E5', fontSize: '14px', color: '#1a1a1a' }}>{u.orderCount || 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #ccc', borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>Previous</button>
          <span style={{ fontSize: '14px', color: '#666' }}>Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer' }}>Next</button>
        </div>
      </div>

      {selectedUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff', width: '90%', maxWidth: '800px', height: '90%', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #E5E5E5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>User Details: {selectedUser.firstName} {selectedUser.lastName}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}>&times;</button>
            </div>
            
            <div style={{ display: 'flex', borderBottom: '1px solid #E5E5E5', background: '#FAFAF8' }}>
              <button onClick={() => setActiveTab('profile')} style={{ padding: '16px 24px', border: 'none', background: 'none', cursor: 'pointer', borderBottom: activeTab === 'profile' ? '2px solid #1d4ed8' : '2px solid transparent', color: activeTab === 'profile' ? '#1d4ed8' : '#666', fontWeight: activeTab === 'profile' ? 600 : 400 }}>Profile</button>
              <button onClick={() => setActiveTab('orders')} style={{ padding: '16px 24px', border: 'none', background: 'none', cursor: 'pointer', borderBottom: activeTab === 'orders' ? '2px solid #1d4ed8' : '2px solid transparent', color: activeTab === 'orders' ? '#1d4ed8' : '#666', fontWeight: activeTab === 'orders' ? 600 : 400 }}>Orders</button>
              <button onClick={() => setActiveTab('activity')} style={{ padding: '16px 24px', border: 'none', background: 'none', cursor: 'pointer', borderBottom: activeTab === 'activity' ? '2px solid #1d4ed8' : '2px solid transparent', color: activeTab === 'activity' ? '#1d4ed8' : '#666', fontWeight: activeTab === 'activity' ? 600 : 400 }}>Activity</button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {modalLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading...</div>
              ) : activeTab === 'profile' ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div>
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Full Name</div>
                      <div style={{ fontSize: '16px', color: '#1a1a1a', marginBottom: '16px' }}>{userData?.firstName} {userData?.lastName}</div>
                      
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Email Address</div>
                      <div style={{ fontSize: '16px', color: '#1a1a1a', marginBottom: '16px' }}>{userData?.email}</div>
                      
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Phone Number</div>
                      <div style={{ fontSize: '16px', color: '#1a1a1a', marginBottom: '16px' }}>{userData?.phone || '-'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Wallet Balance</div>
                      <div style={{ fontSize: '16px', color: '#1a1a1a', marginBottom: '16px', fontWeight: 'bold' }}>₹{userData?.walletBalance || 0}</div>
                      
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Join Date</div>
                      <div style={{ fontSize: '16px', color: '#1a1a1a', marginBottom: '16px' }}>{userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-IN') : '-'}</div>
                      
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Country</div>
                      <div style={{ fontSize: '16px', color: '#1a1a1a', marginBottom: '16px' }}>{userData?.country || '-'}</div>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'orders' ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #E5E5E5', color: '#666' }}>Order ID</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #E5E5E5', color: '#666' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #E5E5E5', color: '#666' }}>Items</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #E5E5E5', color: '#666' }}>Total</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #E5E5E5', color: '#666' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userOrders?.length === 0 ? (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>No orders found.</td></tr>
                    ) : (
                      userOrders?.map(o => (
                        <tr key={o.id}>
                          <td style={{ padding: '12px', borderBottom: '1px solid #E5E5E5' }}>#{o.id}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #E5E5E5' }}>{new Date(o.createdAt || o.date).toLocaleDateString('en-IN')}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #E5E5E5' }}>{o.itemsCount || o.items?.length || 0}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #E5E5E5' }}>₹{o.total || o.totalAmount || 0}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #E5E5E5' }}>
                            <span style={{ padding: '4px 8px', borderRadius: '99px', fontSize: '12px', background: '#f3f4f6' }}>{o.status}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {userActivity?.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: '#666' }}>No activity found.</div>
                  ) : (
                    userActivity?.map((a, i) => (
                      <div key={i} style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className={`fas ${a.type === 'order' ? 'fa-receipt' : a.type === 'ticket' ? 'fa-headset' : 'fa-info'}`}></i>
                        </div>
                        <div>
                          <div style={{ color: '#1a1a1a', fontWeight: 500 }}>{a.description}</div>
                          <div style={{ color: '#666', fontSize: '13px' }}>{new Date(a.date || a.createdAt).toLocaleString('en-IN')}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
