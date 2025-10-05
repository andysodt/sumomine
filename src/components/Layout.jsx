import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';

function Layout() {
  return (
    <>
      <header className="top-header">
        <div className="header-content">
          <img src="/logo.svg" alt="SumoMine Logo" className="header-logo" />
          <div className="header-text">
            <h1>SumoMine</h1>
            <p>Sumo Statistics Tracker</p>
          </div>
        </div>
      </header>

      <div className="main-layout">
        <aside className="sidebar">
          <nav>
            <ul>
              <li>
                <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink to="/rikishi" className={({ isActive }) => isActive ? 'active' : ''}>
                  Rikishi
                </NavLink>
              </li>
              <li>
                <NavLink to="/basho" className={({ isActive }) => isActive ? 'active' : ''}>
                  Basho
                </NavLink>
              </li>
              <li>
                <NavLink to="/banzuke" className={({ isActive }) => isActive ? 'active' : ''}>
                  Banzuke
                </NavLink>
              </li>
              <li>
                <NavLink to="/rank-progression" className={({ isActive }) => isActive ? 'active' : ''}>
                  Rank Progression
                </NavLink>
              </li>
              <li>
                <NavLink to="/measurement-progression" className={({ isActive }) => isActive ? 'active' : ''}>
                  Measurement Progression
                </NavLink>
              </li>
              <li>
                <NavLink to="/kimarite-progression" className={({ isActive }) => isActive ? 'active' : ''}>
                  Kimarite Progression
                </NavLink>
              </li>
            </ul>
          </nav>
        </aside>

        <main className="content">
          <div className="container">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
}

export default Layout;
