import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../apiClient';
import { User, MapPin, CheckCircle, Clock, LogOut, AlertTriangle } from 'lucide-react';
import './Profile.css';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [userIssues, setUserIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserContributions = async () => {
      if (!user?.email) return;

      try {
        setLoading(true);
        // Assuming your backend has an endpoint to get a user's specific issues
        // If it doesn't, you can fetch all and filter, but an endpoint is better for performance.
        const response = await apiClient.get('/issues/profile', {
          headers: { 'X-User-Email': user.email }
        });
        
        const data = response?.data || response || [];
        // If the endpoint returns all issues, filter them client-side just in case
        const myIssues = Array.isArray(data) ? data.filter(issue => issue.reportedBy === user.email) : [];
        
        // Sort by newest first
        myIssues.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setUserIssues(myIssues);
      } catch (err) {
        console.error("Failed to fetch contributions:", err);
        setError("Could not load your contribution history.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserContributions();
  }, [user]);

  const handleLogout = () => {
    if (logout) logout();
    navigate('/login');
  };

  // Calculate statistics
  const totalContributions = userIssues.length;
  const resolvedIssues = userIssues.filter(issue => issue.status === 'RESOLVED').length;
  const pendingIssues = totalContributions - resolvedIssues;

  // Extract display name from email
  const displayName = user?.email ? user.email.split('@')[0] : 'Citizen';

  return (
    <div className="profile-container">
      
      {/* LEFT SIDEBAR: User Details */}
      <aside className="profile-sidebar">
        <div className="profile-card">
          <div className="profile-avatar-large">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <h2 className="profile-name">{displayName}</h2>
          <p className="profile-email">{user?.email}</p>
          
          <div className="profile-badge">
            <CheckCircle size={16} /> Verified Contributor
          </div>

          <hr className="profile-divider" />

          <button onClick={handleLogout} className="btn-logout">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT: Stats & Contributions */}
      <main className="profile-main">
        
        <div className="section-header">
          <h2>My Impact Dashboard</h2>
          <p>Track the status of the civic issues you have reported.</p>
        </div>

        {/* STATS ROW */}
        <section className="profile-stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper blue">
              <MapPin size={24} />
            </div>
            <div className="stat-info">
              <h3>{loading ? '-' : totalContributions}</h3>
              <p>Total Reported</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon-wrapper green">
              <CheckCircle size={24} />
            </div>
            <div className="stat-info">
              <h3>{loading ? '-' : resolvedIssues}</h3>
              <p>Resolved</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon-wrapper orange">
              <Clock size={24} />
            </div>
            <div className="stat-info">
              <h3>{loading ? '-' : pendingIssues}</h3>
              <p>In Progress</p>
            </div>
          </div>
        </section>

        {/* CONTRIBUTIONS LIST */}
        <section className="contributions-section">
          <h3>Recent Contributions</h3>
          
          {loading ? (
            <div className="loading-state">Loading your reports...</div>
          ) : error ? (
            <div className="error-state">{error}</div>
          ) : userIssues.length > 0 ? (
            <div className="contributions-list">
              {userIssues.map(issue => {
                const isResolved = issue.status === 'RESOLVED';
                const formattedDate = new Date(issue.createdAt).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric'
                });

                return (
                  <Link to={`/issue/${issue.id}`} key={issue.id} className="contribution-card">
                    
                    {issue.imageUrl && (
                      <div className="contribution-img-wrapper">
                        <img src={issue.imageUrl} alt={issue.title} onError={(e) => { e.target.style.display = 'none'; }} />
                      </div>
                    )}

                    <div className="contribution-details">
                      <div className="contribution-header">
                        <h4>{issue.title}</h4>
                        <span className={`status-badge ${isResolved ? 'resolved' : 'open'}`}>
                          {issue.status || 'OPEN'}
                        </span>
                      </div>
                      
                      <div className="contribution-meta">
                        <span>{issue.category}</span>
                        <span>•</span>
                        <span>{formattedDate}</span>
                      </div>
                      
                      {issue.aiSeverityScore !== undefined && (
                        <div className="contribution-severity">
                          <AlertTriangle size={14} /> AI Severity: {issue.aiSeverityScore}/10
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><MapPin size={48} /></div>
              <h4>No Contributions Yet</h4>
              <p>You haven't reported any civic issues yet. Help improve your city by submitting your first report!</p>
              <Link to="/report" className="btn-primary mt-4" style={{ display: 'inline-block' }}>Report an Issue</Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}