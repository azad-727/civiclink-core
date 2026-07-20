import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../apiClient';
import './Home.css';

export default function Home() {
  const [userLocation, setUserLocation] = useState({ latitude: 23.0225, longitude: 72.5714 });
  const [mapBbox, setMapBbox] = useState("");
  
  // Real-time calculated statistics
  const [stats, setStats] = useState({ totalIssues: 0, resolvedIssues: 0, activeCitizens: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [topContributors, setTopContributors] = useState([]);

  const [loadingData, setLoadingData] = useState(true);

  // Fetch geolocation coordinates dynamically
  useEffect(() => {
    const handleLocation = (lat, lng) => {
      setUserLocation({ latitude: lat, longitude: lng });
      setMapBbox(`${(lng - 0.3).toFixed(4)},${(lat - 0.3).toFixed(4)},${(lng + 0.3).toFixed(4)},${(lat + 0.3).toFixed(4)}`);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => handleLocation(pos.coords.latitude, pos.coords.longitude),
        () => handleLocation(23.0225, 72.5714) // Fallback city coordinates
      );
    } else {
      handleLocation(23.0225, 72.5714);
    }
  }, []);

  // Fetch all data from Spring Boot backend production endpoints
  useEffect(() => {
    if (!mapBbox) return;

    const fetchDashboardData = async () => {
      try {
        setLoadingData(true);

        const [issuesRes, contributorsRes] = await Promise.all([
          apiClient.get(`/issues/nearby?latitude=${userLocation.latitude}&longitude=${userLocation.longitude}&radius=30.0`),
          apiClient.get('/issues/contributors/top')
        ]);

        // BULLETPROOF EXTRACTION: Guarantee we always have an array
        const rawIssues = issuesRes?.data || issuesRes;
        const issues = Array.isArray(rawIssues) ? rawIssues : [];

        const rawContributors = contributorsRes?.data || contributorsRes;
        const contributors = Array.isArray(rawContributors) ? rawContributors : [];

        // Now .filter() will NEVER crash, because 'issues' is guaranteed to be an array
        const resolved = issues.filter(i => i.status === 'RESOLVED').length;
        const uniqueUsers = new Set(issues.map(i => i.reportedBy)).size;

        setStats({ totalIssues: issues.length, resolvedIssues: resolved, activeCitizens: uniqueUsers });
        setRecentActivity(issues.slice(0, 5));
        setTopContributors(contributors);

      } catch (err) {
        console.error("Error synchronizing dashboard with database services", err);
      } finally {
        setLoadingData(false);
      }
    };
    
    fetchDashboardData();
  }, [userLocation, mapBbox]);

  return (
    <div className="home-container">
      
      {/* HERO BANNER OVERLAY */}
      <section className="hero-section">
        <div className="hero-banner-container">
          <h1 className="sr-only">Empowering Citizens. Transforming Cities.</h1>
          <img src="/images/homepage-banner.png" alt="CivicLink Banner" className="hero-banner-img" />
          <div className="hero-actions-overlay">
            <Link to="/report" className="btn-primary">Report an Issue</Link>
            <Link to="/explore" className="btn-secondary">Explore Map</Link>
          </div>
        </div>
      </section>

      {/* OPERATIONAL METRICS */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>{loadingData ? '...' : stats.totalIssues}</h3>
            <p>Local Issues</p>
          </div>
          <div className="stat-card">
            <h3>{loadingData ? '...' : stats.resolvedIssues}</h3>
            <p>Locally Resolved</p>
          </div>
          <div className="stat-card">
            <h3>{loadingData ? '...' : stats.activeCitizens}</h3>
            <p>Local Contributors</p>
          </div>
        </div>
      </section>

      {/* LIVE INTERACTIVE DASHBOARD GRID */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2>Live Issues Dashboard</h2>
          <p>Real-time system updates derived within a 30km operational radius.</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-main-card">
            <div className="map-background">
              {mapBbox && (
                <iframe title="Live Issues Map" width="100%" height="100%" frameBorder="0" src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapBbox}&layer=mapnik`}></iframe>
              )}
            </div>
            <div className="map-overlay"></div>
            <div className="dashboard-card-content relative-z">
              <h2>Connecting Communities.<br/>Building Better Cities.</h2>
              <Link to="/about" className="btn-solid-blue">Learn More</Link>
            </div>
            <div className="dashboard-legend relative-z">
              <div className="legend-item"><span className="dot dot-blue"></span> Roads & Transit</div>
              <div className="legend-item"><span className="dot dot-orange"></span> Public Safety</div>
              <div className="legend-item"><span className="dot dot-green"></span> Parks & Vandalism</div>
            </div>
          </div>

          {/* SIDEBAR: RECENT LIVE ACTIVITY */}
          <div className="dashboard-sidebar-card">
            <div className="sidebar-header">
              <h3>Recent Activity</h3>
            </div>
            <div className="sidebar-content">
              {loadingData ? (
                <p className="loading-text">Synchronizing records...</p>
              ) : recentActivity.length > 0 ? (
                <ul className="activity-list">
                  {recentActivity.map((issue) => (
                    <li key={issue.id} className="activity-item">
                      <Link 
                        to={`/issue/${issue.id}`} 
                        style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '12px' }}
                      >
                        {/* Issue thumbnail */}
                        <div className="activity-thumb">
                          {issue.imageUrl ? (
                            <img 
                              src={issue.imageUrl} 
                              alt={issue.title} 
                              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                            />
                          ) : null}
                          <div className="activity-thumb-fallback" style={{ display: issue.imageUrl ? 'none' : 'flex' }}>
                            📍
                          </div>
                        </div>
                        <div>
                          <strong className="activity-title">{issue.title}</strong>
                          <span className="activity-meta">{issue.category} • {issue.status}</span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="loading-text">No issues active in this sector.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* TOP COMMUNITY CONTRIBUTORS SECTION */}
      <section className="contributors-section">
        <div className="section-header">
          <h2>Top Community Contributors</h2>
          <p>Honoring verified citizens actively improving municipal infrastructure.</p>
        </div>

        <div className="contributors-grid">
          {loadingData ? (
            <p className="loading-text">Aggregating database contributions...</p>
          ) : topContributors.length > 0 ? (
            topContributors.map((user, index) => (
              <div key={user.email} className="contributor-profile-card">
                <div className="contributor-rank">#{index + 1}</div>
                <div className="contributor-details">
                  <h4>{user.email.split('@')[0]}</h4>
                  <p>{user.count} Issues Logged</p>
                </div>
              </div>
            ))
          ) : (
            <p className="loading-text">No recorded contributions found.</p>
          )}
        </div>
      </section>

    </div>
  );
}