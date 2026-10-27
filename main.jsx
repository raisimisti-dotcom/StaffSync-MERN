import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  LayoutDashboard, Users, CalendarCheck, ClipboardList, Settings as SettingsIcon,
  Search, Bell, Plus, ArrowUpRight, Clock3, CheckCircle2, Menu, X, UserRound,
  Building2, MoreHorizontal, Database, ShieldCheck, RefreshCw, Save, Check,
  LogOut, KeyRound, Lock, Mail, User, Eye, EyeOff
} from 'lucide-react';
import './style.css';

const sample = [
  { _id:'1', name:'Aarav Sharma', email:'aarav@staffsync.demo', department:'Engineering', role:'Frontend Developer', status:'Active', joined:'2025-02-12' },
  { _id:'2', name:'Ananya Patel', email:'ananya@staffsync.demo', department:'Human Resources', role:'HR Executive', status:'Active', joined:'2024-11-04' },
  { _id:'3', name:'Rohan Mehta', email:'rohan@staffsync.demo', department:'Design', role:'UI/UX Designer', status:'On Leave', joined:'2025-05-19' },
  { _id:'4', name:'Priya Singh', email:'priya@staffsync.demo', department:'Marketing', role:'Marketing Lead', status:'Active', joined:'2024-08-21' },
  { _id:'5', name:'Kabir Verma', email:'kabir@staffsync.demo', department:'Engineering', role:'Backend Developer', status:'Inactive', joined:'2025-01-08' },
  { _id:'6', name:'Isha Gupta', email:'isha@staffsync.demo', department:'Finance', role:'Accountant', status:'Active', joined:'2025-06-02' }
];

const API = import.meta.env.VITE_API_URL || '/api';

function App() {
  // Authentication State
  const [token, setToken] = useState(() => localStorage.getItem('staffsync_token') || '');
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem('staffsync_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Workspace Admin',
    department: 'Engineering'
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Dashboard State
  const [tab, setTab] = useState('overview');
  const [employees, setEmployees] = useState(sample);
  const [connected, setConnected] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [modal, setModal] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ name:'', email:'', department:'Engineering', role:'', status:'Active' });

  // Settings State (persisted to localStorage)
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('staffsync_settings');
      return saved ? JSON.parse(saved) : {
        workspaceName: 'Acme Studio',
        timezone: 'IST (UTC+05:30)',
        emailNotifications: true,
        autoRefresh: '60s',
        requireApproval: true,
        defaultDepartment: 'Engineering',
        sessionTimeout: '8 hours'
      };
    } catch {
      return {
        workspaceName: 'Acme Studio',
        timezone: 'IST (UTC+05:30)',
        emailNotifications: true,
        autoRefresh: '60s',
        requireApproval: true,
        defaultDepartment: 'Engineering',
        sessionTimeout: '8 hours'
      };
    }
  });

  // Sample Attendance Data
  const [attendance, setAttendance] = useState([
    { id: '1', name: 'Aarav Sharma', department: 'Engineering', checkIn: '09:02 AM', status: 'Present' },
    { id: '2', name: 'Ananya Patel', department: 'Human Resources', checkIn: '08:55 AM', status: 'Present' },
    { id: '3', name: 'Rohan Mehta', department: 'Design', checkIn: '—', status: 'On Leave' },
    { id: '4', name: 'Priya Singh', department: 'Marketing', checkIn: '09:34 AM', status: 'Late' },
    { id: '5', name: 'Kabir Verma', department: 'Engineering', checkIn: '—', status: 'Absent' },
    { id: '6', name: 'Isha Gupta', department: 'Finance', checkIn: '09:10 AM', status: 'Present' }
  ]);

  // Sample Leaves Data
  const [leaves, setLeaves] = useState([
    { id: '1', name: 'Rohan Mehta', type: 'Annual Leave', duration: '3 Days', dates: 'Oct 26 - Oct 29, 2026', status: 'Approved' },
    { id: '2', name: 'Kabir Verma', type: 'Sick Leave', duration: '1 Day', dates: 'Oct 27, 2026', status: 'Pending' },
    { id: '3', name: 'Aarav Sharma', type: 'Casual Leave', duration: '2 Days', dates: 'Nov 02 - Nov 03, 2026', status: 'Pending' }
  ]);

  // Fetch employees
  const fetchEmployees = () => {
    fetch(`${API}/employees`)
      .then(r => { if (!r.ok) throw Error(); return r.json(); })
      .then(d => {
        if (Array.isArray(d)) {
          setEmployees(d);
          setConnected(true);
        }
      })
      .catch(() => setConnected(false));
  };

  useEffect(() => {
    if (token && user) {
      fetchEmployees();
    }
  }, [token, user]);

  // Authentication Handler
  async function handleAuthSubmit(e) {
    if (e) e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const endpoint = authMode === 'login' ? `${API}/auth/login` : `${API}/auth/register`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Authentication failed');

      localStorage.setItem('staffsync_token', data.token);
      localStorage.setItem('staffsync_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setNotice(`Welcome back, ${data.user.name}!`);
      setTimeout(() => setNotice(''), 4000);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  // Logout Handler
  function handleLogout() {
    localStorage.removeItem('staffsync_token');
    localStorage.removeItem('staffsync_user');
    setToken('');
    setUser(null);
    setNotice('You have been logged out.');
    setTimeout(() => setNotice(''), 3000);
  }

  const filtered = useMemo(() =>
    employees.filter(e =>
      (`${e.name} ${e.email} ${e.department} ${e.role}`.toLowerCase().includes(query.toLowerCase())) &&
      (filter === 'All' || e.status === filter)
    ), [employees, query, filter]);

  const active = employees.filter(e => e.status === 'Active').length;

  async function addEmployee(ev) {
    ev.preventDefault();
    const newEmp = { ...form, joined: new Date().toISOString().slice(0, 10) };
    try {
      const res = await fetch(`${API}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmp)
      });
      if (!res.ok) throw Error();
      const saved = await res.json();
      setEmployees(p => [saved, ...p]);
      setConnected(true);
      setNotice(`Employee ${saved.name} added successfully!`);
      setTimeout(() => setNotice(''), 4000);
    } catch {
      setEmployees(p => [{ ...newEmp, _id: String(Date.now()) }, ...p]);
      setNotice('Saved locally. Check MongoDB connection.');
      setTimeout(() => setNotice(''), 5000);
    }
    setForm({ name: '', email: '', department: settings.defaultDepartment || 'Engineering', role: '', status: 'Active' });
    setModal(false);
  }

  function handleSaveSettings(e) {
    e.preventDefault();
    localStorage.setItem('staffsync_settings', JSON.stringify(settings));
    setNotice('Settings saved successfully!');
    setTimeout(() => setNotice(''), 4000);
  }

  async function testDatabase() {
    setNotice('Checking backend API & MongoDB status...');
    try {
      const res = await fetch(`${API}/health`);
      const data = await res.json();
      if (data.database === 'connected') {
        setConnected(true);
        setNotice('✅ Connected: MongoDB Atlas & REST API are healthy!');
      } else {
        setConnected(false);
        setNotice('⚠️ API responded, but MongoDB is disconnected.');
      }
    } catch {
      setConnected(false);
      setNotice('❌ Could not connect to API at ' + API);
    }
    setTimeout(() => setNotice(''), 4500);
  }

  const adminInitials = useMemo(() => {
    return (user?.name || 'SR')
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }, [user]);

  // If not logged in, render the Authentication screen
  if (!token || !user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-brand">
            <div className="brand-mark">S</div>
            <div>
              <b style={{ fontSize: '20px', fontFamily: 'Manrope, sans-serif' }}>staffsync</b>
              <small style={{ display: 'block', color: '#94a3b8', fontSize: '9px', letterSpacing: '1px' }}>
                PEOPLE OPERATIONS
              </small>
            </div>
          </div>

          <div className="auth-head">
            <h2>{authMode === 'login' ? 'Sign In to StaffSync' : 'Create an Account'}</h2>
            <p>
              {authMode === 'login'
                ? 'Enter your work email and password to access the workspace.'
                : 'Enter your details below to create your account.'}
            </p>
          </div>

          {authError && (
            <div style={{ padding: '10px 12px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', color: '#b91c1c', fontSize: '11px', marginBottom: '16px' }}>
              ⚠️ {authError}
            </div>
          )}

          <form className="auth-form" onSubmit={handleAuthSubmit}>
            {authMode === 'register' && (
              <label>
                Full Name
                <input
                  required
                  type="text"
                  placeholder="e.g. Aditi Sharma"
                  value={authForm.name}
                  onChange={e => setAuthForm({ ...authForm, name: e.target.value })}
                />
              </label>
            )}

            <label>
              Work Email
              <input
                required
                type="email"
                placeholder="name@company.com"
                value={authForm.email}
                onChange={e => setAuthForm({ ...authForm, email: e.target.value })}
              />
            </label>

            <label>
              Password
              <div className="password-wrap">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={authForm.password}
                  onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                />
                <button
                  type="button"
                  className="pwd-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {authMode === 'register' && (
              <div className="form-row">
                <label>
                  Role / Title
                  <select
                    value={authForm.role}
                    onChange={e => setAuthForm({ ...authForm, role: e.target.value })}
                  >
                    <option value="Workspace Admin">Workspace Admin</option>
                    <option value="HR Manager">HR Manager</option>
                    <option value="Frontend Developer">Frontend Developer</option>
                    <option value="Backend Developer">Backend Developer</option>
                    <option value="UI/UX Designer">UI/UX Designer</option>
                    <option value="Marketing Lead">Marketing Lead</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Staff Member">Staff Member</option>
                  </select>
                </label>
                <label>
                  Department
                  <select
                    value={authForm.department || 'Engineering'}
                    onChange={e => setAuthForm({ ...authForm, department: e.target.value })}
                  >
                    {['Engineering', 'Human Resources', 'Design', 'Marketing', 'Finance', 'Operations', 'Sales'].map(d => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            <div className="auth-actions">
              <button className="primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} type="submit" disabled={authLoading}>
                {authLoading ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </div>
          </form>

          <div className="auth-switch">
            {authMode === 'login' ? (
              <>
                Don't have an account?{' '}
                <a onClick={() => { setAuthMode('register'); setAuthError(''); }}>Register</a>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <a onClick={() => { setAuthMode('login'); setAuthError(''); }}>Sign in</a>
              </>
            )}
          </div>
        </div>

        {notice && (
          <div className="toast" onClick={() => setNotice('')}>
            {notice}
            <button><X size={15} /></button>
          </div>
        )}
      </div>
    );
  }

  // Dashboard (when logged in)
  return (
    <div className="app">
      {/* Sidebar */}
      <aside className={`sidebar ${mobile ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">S</div>
          <div>
            <b>staffsync</b>
            <small>PEOPLE OPERATIONS</small>
          </div>
          <button className="close-nav" onClick={() => setMobile(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="workspace">
          <div className="workspace-icon">
            <Building2 size={18} />
          </div>
          <div>
            <b>{settings.workspaceName}</b>
            <small>Workspace</small>
          </div>
          <MoreHorizontal size={18} />
        </div>

        <p className="nav-label">WORKSPACE</p>
        <nav>
          <a
            className={tab === 'overview' ? 'selected' : ''}
            onClick={() => { setTab('overview'); setMobile(false); }}
          >
            <LayoutDashboard size={18} /> Overview
          </a>
          <a
            onClick={() => {
              setTab('overview');
              setMobile(false);
              setTimeout(() => document.getElementById('team')?.scrollIntoView({ behavior: 'smooth' }), 50);
            }}
          >
            <Users size={18} /> Employees <span className="nav-count">{employees.length}</span>
          </a>
          <a
            className={tab === 'attendance' ? 'selected' : ''}
            onClick={() => { setTab('attendance'); setMobile(false); }}
          >
            <CalendarCheck size={18} /> Attendance
          </a>
          <a
            className={tab === 'leave' ? 'selected' : ''}
            onClick={() => { setTab('leave'); setMobile(false); }}
          >
            <ClipboardList size={18} /> Leave requests <span className="nav-dot" />
          </a>
        </nav>

        <p className="nav-label">PREFERENCES</p>
        <nav>
          <a
            className={tab === 'settings' ? 'selected' : ''}
            onClick={() => { setTab('settings'); setMobile(false); }}
          >
            <SettingsIcon size={18} /> Settings
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">✦</div>
            <b>Need a hand?</b>
            <p>Manage employee records, attendance, and settings all in one place.</p>
            <button onClick={() => setNotice('StaffSync: Full-stack MERN People Operations platform.')}>
              Quick guide <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="profile">
            <div className="avatar admin">{adminInitials}</div>
            <div>
              <b>{user.name}</b>
              <small>{user.role || 'Workspace Admin'}</small>
            </div>
            <button
              className="profile-logout"
              title="Sign Out"
              onClick={handleLogout}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setMobile(!mobile)}>
            <Menu />
          </button>
          <div className="crumb">
            Workspace <span>/</span>{' '}
            <b>{tab.charAt(0).toUpperCase() + tab.slice(1)}</b>
          </div>
          <div className="top-actions">
            <div className={`connection ${connected ? 'live' : ''}`}>
              <i /> {connected ? 'API connected' : 'Demo preview'}
            </div>
            <button className="icon-btn" onClick={() => setNotice('No unread notifications.')}>
              <Bell size={19} />
              <i />
            </button>
            <button
              className="logout-btn"
              onClick={handleLogout}
              title="Log out of current session"
            >
              <LogOut size={14} /> Log out
            </button>
            <div className="avatar admin top-avatar">{adminInitials}</div>
          </div>
        </header>

        <div className="content">
          {/* TAB 1: OVERVIEW */}
          {tab === 'overview' && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">TUESDAY, OCTOBER 27, 2026</div>
                  <h1>Good morning, {user.name.split(' ')[0]} <span>✦</span></h1>
                  <p>Here’s what’s happening with your team today.</p>
                </div>
                <button className="primary" onClick={() => setModal(true)}>
                  <Plus size={17} /> Add employee
                </button>
              </div>

              <div className="banner">
                <div className="banner-copy">
                  <span className="banner-tag">YOUR TEAM, IN SYNC</span>
                  <h2>Great teams start with<br />great people management.</h2>
                  <p>Keep your people, schedules, and team updates organized — all in one place.</p>
                  <button onClick={() => document.getElementById('team')?.scrollIntoView({ behavior: 'smooth' })}>
                    Explore your team <ArrowUpRight size={15} />
                  </button>
                </div>
                <div className="banner-art">
                  <div className="orbit orbit-one" />
                  <div className="orbit orbit-two" />
                  <div className="art-person p1">AS</div>
                  <div className="art-person p2">NP</div>
                  <div className="art-person p3">RM</div>
                  <div className="art-center"><Users size={33} /></div>
                  <div className="floating-note"><CheckCircle2 size={16} /> Team is looking good</div>
                </div>
              </div>

              <div className="stats">
                <div className="stat-card">
                  <div className="stat-top">
                    <span>Total employees</span>
                    <span className="stat-icon purple"><Users size={18} /></span>
                  </div>
                  <div className="stat-value">
                    {employees.length}
                    <span className="stat-trend"><ArrowUpRight size={14} /> Team roster</span>
                  </div>
                  <div className="stat-foot">Across all departments</div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Active employees</span>
                    <span className="stat-icon green"><CheckCircle2 size={18} /></span>
                  </div>
                  <div className="stat-value">
                    {active}
                    <span className="stat-trend positive">{employees.length ? Math.round(active / employees.length * 100) : 0}%</span>
                  </div>
                  <div className="mini-progress">
                    <span style={{ width: `${employees.length ? active / employees.length * 100 : 0}%` }} />
                  </div>
                  <div className="stat-foot">Currently active on the team</div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>On leave</span>
                    <span className="stat-icon orange"><CalendarCheck size={18} /></span>
                  </div>
                  <div className="stat-value">
                    {employees.filter(e => e.status === 'On Leave').length}
                    <span className="stat-trend">This period</span>
                  </div>
                  <div className="stat-foot">Employees marked on leave</div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Departments</span>
                    <span className="stat-icon blue"><Building2 size={18} /></span>
                  </div>
                  <div className="stat-value">
                    {new Set(employees.map(e => e.department)).size}
                    <span className="stat-trend">Teams</span>
                  </div>
                  <div className="stat-foot">Distinct departments</div>
                </div>
              </div>

              <section className="team-section" id="team">
                <div className="section-head">
                  <div>
                    <h2>Team directory</h2>
                    <p>Manage your people and their information.</p>
                  </div>
                  <button className="outline" onClick={() => setModal(true)}>
                    <Plus size={16} /> New employee
                  </button>
                </div>

                <div className="table-tools">
                  <div className="search">
                    <Search size={17} />
                    <input
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder="Search people, roles, departments..."
                    />
                  </div>
                  <select value={filter} onChange={e => setFilter(e.target.value)}>
                    <option>All</option>
                    <option>Active</option>
                    <option>On Leave</option>
                    <option>Inactive</option>
                  </select>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>EMPLOYEE</th>
                        <th>DEPARTMENT</th>
                        <th>ROLE</th>
                        <th>STATUS</th>
                        <th>JOINED DATE</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((e, i) => (
                        <tr key={e._id}>
                          <td>
                            <div className="person-cell">
                              <div className={`avatar color-${i % 5}`}>
                                {e.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                              </div>
                              <div>
                                <b>{e.name}</b>
                                <small>{e.email}</small>
                              </div>
                            </div>
                          </td>
                          <td><span className="department">{e.department}</span></td>
                          <td>{e.role}</td>
                          <td>
                            <span className={`status ${e.status === 'Active' ? 'active' : e.status === 'On Leave' ? 'leave' : 'inactive'}`}>
                              <i />{e.status}
                            </span>
                          </td>
                          <td className="date">
                            {e.joined ? new Date(e.joined + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—'}
                          </td>
                          <td>
                            <button className="row-more" onClick={() => setNotice(`${e.name} · ${e.role} · ${e.department}`)}>
                              <MoreHorizontal size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filtered.length === 0 && (
                    <div className="empty">
                      <UserRound size={25} />
                      <b>No employees found</b>
                      <p>Try a different search or add a team member.</p>
                    </div>
                  )}
                </div>

                <div className="table-footer">
                  Showing <b>{filtered.length}</b> of <b>{employees.length}</b> employees{' '}
                  <span>StaffSync · Employee overview</span>
                </div>
              </section>
            </>
          )}

          {/* TAB 2: SETTINGS */}
          {tab === 'settings' && (
            <div className="settings-section">
              <div className="page-heading">
                <div>
                  <div className="eyebrow">PREFERENCES & SECURITY</div>
                  <h1>Workspace Settings <span>✦</span></h1>
                  <p>Configure your workspace, database connections, notifications, and defaults.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="outline" onClick={testDatabase}>
                    <RefreshCw size={15} /> Test DB Connection
                  </button>
                  <button className="primary" onClick={handleSaveSettings}>
                    <Save size={15} /> Save Changes
                  </button>
                </div>
              </div>

              {/* Current User Session Card */}
              <div className="settings-card">
                <div className="settings-header">
                  <div>
                    <h3><User size={17} color="#3849db" /> Authenticated Account</h3>
                    <p>Details of your currently active session.</p>
                  </div>
                  <button className="logout-btn" onClick={handleLogout}>
                    <LogOut size={13} /> Sign out
                  </button>
                </div>
                <div className="settings-grid">
                  <div className="settings-field">
                    <label>Logged-in Name</label>
                    <input readOnly value={user.name} style={{ background: '#f8fafc', color: '#1e293b' }} />
                  </div>
                  <div className="settings-field">
                    <label>Logged-in Email</label>
                    <input readOnly value={user.email} style={{ background: '#f8fafc', color: '#1e293b' }} />
                  </div>
                  <div className="settings-field">
                    <label>Assigned Role</label>
                    <input readOnly value={user.role || 'Workspace Admin'} style={{ background: '#f8fafc', color: '#1e293b' }} />
                  </div>
                  <div className="settings-field">
                    <label>Authentication Method</label>
                    <input readOnly value="JWT Bearer Token (Secure)" style={{ background: '#f8fafc', color: '#10b981', fontWeight: 600 }} />
                  </div>
                </div>
              </div>

              {/* Database & API Health Card */}
              <div className="settings-card">
                <div className="settings-header">
                  <div>
                    <h3><Database size={17} color="#3849db" /> System & Database Integration</h3>
                    <p>Live status of your MongoDB cluster and backend REST endpoints.</p>
                  </div>
                  <span className={`status-badge ${connected ? 'connected' : 'disconnected'}`}>
                    <i /> {connected ? 'Connected to MongoDB Atlas' : 'Database Disconnected'}
                  </span>
                </div>
                <div className="settings-grid">
                  <div className="settings-field">
                    <label>API Endpoint</label>
                    <input readOnly value={API} style={{ background: '#f8fafc', color: '#64748b' }} />
                  </div>
                  <div className="settings-field">
                    <label>Database Connection Target</label>
                    <input readOnly value="cluster0.bhjoo73.mongodb.net (MongoDB Atlas)" style={{ background: '#f8fafc', color: '#64748b' }} />
                  </div>
                  <div className="settings-field">
                    <label>Total Saved Employees</label>
                    <input readOnly value={`${employees.length} employees stored`} style={{ background: '#f8fafc', color: '#64748b' }} />
                  </div>
                  <div className="settings-field">
                    <label>JWT Token Security</label>
                    <input readOnly value="HMAC SHA-256 (Signed & Verified)" style={{ background: '#f8fafc', color: '#10b981', fontWeight: 600 }} />
                  </div>
                </div>
              </div>

              {/* Organization Profile */}
              <div className="settings-card">
                <div className="settings-header">
                  <div>
                    <h3><Building2 size={17} color="#3849db" /> Organization Profile</h3>
                    <p>Update your company details and primary administrative preferences.</p>
                  </div>
                </div>
                <form onSubmit={handleSaveSettings}>
                  <div className="settings-grid">
                    <div className="settings-field">
                      <label>Workspace / Company Name</label>
                      <input
                        value={settings.workspaceName}
                        onChange={e => setSettings({ ...settings, workspaceName: e.target.value })}
                        placeholder="e.g. Acme Studio"
                        required
                      />
                    </div>
                    <div className="settings-field">
                      <label>Operating Timezone</label>
                      <select
                        value={settings.timezone}
                        onChange={e => setSettings({ ...settings, timezone: e.target.value })}
                      >
                        <option>IST (UTC+05:30) - India</option>
                        <option>UTC (UTC+00:00) - Universal</option>
                        <option>EST (UTC-05:00) - New York</option>
                        <option>PST (UTC-08:00) - Los Angeles</option>
                        <option>GMT (UTC+01:00) - London</option>
                      </select>
                    </div>
                  </div>
                </form>
              </div>

              {/* Team Defaults & Automation */}
              <div className="settings-card">
                <div className="settings-header">
                  <div>
                    <h3><ShieldCheck size={17} color="#3849db" /> Team Defaults & Preferences</h3>
                    <p>Customize behavior for onboarding and operational workflows.</p>
                  </div>
                </div>
                <div className="settings-grid" style={{ marginBottom: '16px' }}>
                  <div className="settings-field">
                    <label>Default Department for New Hires</label>
                    <select
                      value={settings.defaultDepartment}
                      onChange={e => setSettings({ ...settings, defaultDepartment: e.target.value })}
                    >
                      {['Engineering', 'Human Resources', 'Design', 'Marketing', 'Finance', 'Operations', 'Sales'].map(d => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="settings-field">
                    <label>Admin Session Timeout</label>
                    <select
                      value={settings.sessionTimeout}
                      onChange={e => setSettings({ ...settings, sessionTimeout: e.target.value })}
                    >
                      <option>1 hour</option>
                      <option>4 hours</option>
                      <option>8 hours</option>
                      <option>24 hours</option>
                      <option>7 days</option>
                    </select>
                  </div>
                </div>

                <div className="toggle-row">
                  <div className="toggle-info">
                    <b>Email Notifications</b>
                    <small>Receive email alerts whenever a new employee is onboarded or updates profile.</small>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={e => setSettings({ ...settings, emailNotifications: e.target.checked })}
                    />
                    <span className="slider" />
                  </label>
                </div>

                <div className="toggle-row">
                  <div className="toggle-info">
                    <b>Require Leave Approval</b>
                    <small>Leave requests must be reviewed by workspace admin before becoming effective.</small>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.requireApproval}
                      onChange={e => setSettings({ ...settings, requireApproval: e.target.checked })}
                    />
                    <span className="slider" />
                  </label>
                </div>
              </div>

              <div className="settings-actions">
                <button
                  type="button"
                  className="outline"
                  onClick={() => {
                    localStorage.removeItem('staffsync_settings');
                    window.location.reload();
                  }}
                >
                  Reset Defaults
                </button>
                <button type="button" className="primary" onClick={handleSaveSettings}>
                  <Check size={16} /> Save Changes
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: ATTENDANCE */}
          {tab === 'attendance' && (
            <div className="settings-section">
              <div className="page-heading">
                <div>
                  <div className="eyebrow">TIME & ATTENDANCE</div>
                  <h1>Daily Attendance Log <span>✦</span></h1>
                  <p>Track team attendance, check-in timestamps, and daily presence.</p>
                </div>
                <button
                  className="primary"
                  onClick={() => {
                    setNotice('Attendance check-in logged for today.');
                    setTimeout(() => setNotice(''), 4000);
                  }}
                >
                  <Clock3 size={16} /> Clock In Now
                </button>
              </div>

              <section className="team-section">
                <div className="section-head">
                  <div>
                    <h2>Today's Attendance</h2>
                    <p>Status recorded for Tuesday, October 27, 2026</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span className="status-badge connected">Present: 4</span>
                    <span className="status-badge" style={{ background: '#fff3e9', color: '#e6a05b' }}>On Leave: 1</span>
                  </div>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>EMPLOYEE</th>
                        <th>DEPARTMENT</th>
                        <th>FIRST CHECK-IN</th>
                        <th>STATUS</th>
                        <th>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.map((a, i) => (
                        <tr key={a.id}>
                          <td>
                            <div className="person-cell">
                              <div className={`avatar color-${i % 5}`}>
                                {a.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                              </div>
                              <div>
                                <b>{a.name}</b>
                              </div>
                            </div>
                          </td>
                          <td><span className="department">{a.department}</span></td>
                          <td><b>{a.checkIn}</b></td>
                          <td>
                            <span className={`status ${a.status === 'Present' ? 'active' : a.status === 'On Leave' ? 'leave' : 'inactive'}`}>
                              <i />{a.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="outline"
                              style={{ padding: '5px 10px', fontSize: '10px' }}
                              onClick={() => {
                                setNotice(`Details logged for ${a.name}`);
                                setTimeout(() => setNotice(''), 3000);
                              }}
                            >
                              Log Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* TAB 4: LEAVE REQUESTS */}
          {tab === 'leave' && (
            <div className="settings-section">
              <div className="page-heading">
                <div>
                  <div className="eyebrow">TIME OFF MANAGEMENT</div>
                  <h1>Leave Requests <span>✦</span></h1>
                  <p>Review and approve employee time-off requests.</p>
                </div>
                <button
                  className="primary"
                  onClick={() => {
                    setNotice('New leave request modal opened.');
                    setTimeout(() => setNotice(''), 3000);
                  }}
                >
                  <Plus size={16} /> Request Time Off
                </button>
              </div>

              <section className="team-section">
                <div className="section-head">
                  <div>
                    <h2>Submitted Requests</h2>
                    <p>Pending approvals and recent decisions</p>
                  </div>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>EMPLOYEE</th>
                        <th>LEAVE TYPE</th>
                        <th>DURATION</th>
                        <th>DATES</th>
                        <th>STATUS</th>
                        <th>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaves.map((l, i) => (
                        <tr key={l.id}>
                          <td>
                            <div className="person-cell">
                              <div className={`avatar color-${i % 5}`}>
                                {l.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                              </div>
                              <div><b>{l.name}</b></div>
                            </div>
                          </td>
                          <td><span className="department">{l.type}</span></td>
                          <td><b>{l.duration}</b></td>
                          <td className="date">{l.dates}</td>
                          <td>
                            <span className={`status ${l.status === 'Approved' ? 'active' : 'leave'}`}>
                              <i />{l.status}
                            </span>
                          </td>
                          <td>
                            {l.status === 'Pending' ? (
                              <button
                                className="primary"
                                style={{ padding: '6px 11px', fontSize: '10px' }}
                                onClick={() => {
                                  setLeaves(leaves.map(item => item.id === l.id ? { ...item, status: 'Approved' } : item));
                                  setNotice(`Approved leave for ${l.name}`);
                                  setTimeout(() => setNotice(''), 3500);
                                }}
                              >
                                Approve
                              </button>
                            ) : (
                              <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>Approved</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          <footer>
            © 2026 {settings.workspaceName} <span>Built for better teamwork.</span>
          </footer>
        </div>
      </main>

      {/* Toast Notice */}
      {notice && (
        <div className="toast" onClick={() => setNotice('')}>
          {notice}
          <button><X size={15} /></button>
        </div>
      )}

      {/* Add Employee Modal */}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(false)}>
          <form className="modal" onSubmit={addEmployee} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <span className="eyebrow">TEAM DIRECTORY</span>
                <h2>Add a team member</h2>
                <p>Enter the employee’s details below.</p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setModal(false)}>
                <X />
              </button>
            </div>

            <label>
              Full name
              <input
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Aditi Sharma"
              />
            </label>

            <label>
              Work email
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="aditi@company.com"
              />
            </label>

            <div className="form-row">
              <label>
                Department
                <select
                  value={form.department}
                  onChange={e => setForm({ ...form, department: e.target.value })}
                >
                  {['Engineering', 'Human Resources', 'Design', 'Marketing', 'Finance', 'Operations', 'Sales'].map(x => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                >
                  <option>Active</option>
                  <option>On Leave</option>
                  <option>Inactive</option>
                </select>
              </label>
            </div>

            <label>
              Job title
              <input
                required
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                placeholder="e.g. Software Developer"
              />
            </label>

            <div className="modal-actions">
              <button type="button" className="outline" onClick={() => setModal(false)}>
                Cancel
              </button>
              <button className="primary" type="submit">
                <Plus size={16} /> Add employee
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
