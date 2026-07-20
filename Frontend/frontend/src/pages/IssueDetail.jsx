import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import apiClient from '../apiClient';
import './IssueDetail.css';

// Vite-compatible Leaflet icon imports
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center[0] && center[1]) {
      map.setView(center, 16);
    }
  }, [center, map]);
  return null;
}

export default function IssueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasVerified, setHasVerified] = useState(false);
  
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const fetchIssueDetails = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/issues/${id}`);
        
        // FIX: Extract data safely, just like you did in Home.js!
        const issueData = response?.data || response;
        
        setIssue(issueData);
      } catch (err) {
        console.error("Failed to fetch issue details:", err);
        setError("Could not load the issue details. It may have been removed.");
      } finally {
        setLoading(false);
      }
    };

    fetchIssueDetails();
  }, [id]);

  const handleVerify = async () => {
    if (hasVerified) return;
    try {
      await apiClient.patch(`/issues/${id}/verify`);
      setIssue(prev => ({ ...prev, verificationCount: (prev.verificationCount || 0) + 1 }));
      setHasVerified(true);
    } catch (err) {
      // 409 Conflict means user already verified this issue
      if (err?.status === 409 || err?.message?.includes('409') || err?.message?.toLowerCase().includes('already')) {
        setHasVerified(true);
      } else {
        alert('Failed to verify. Please try again.');
      }
    }
  };

    if (loading) return <div className="detail-loading" style={{ padding: '40px', textAlign: 'center' }}>Loading issue details...</div>;
  if (error) return <div className="detail-error" style={{ padding: '40px', textAlign: 'center' }}>{error} <button onClick={() => navigate(-1)}>Go Back</button></div>;
  if (!issue) return <div style={{ padding: '40px', textAlign: 'center' }}>No issue data found.</div>;

  // FIX: Map to `imageUrl` from your JSON
  // Creating an array just in case you ever support multiple images later
  const images = issue.imageUrl ? [issue.imageUrl] : [];
  
  const lat = issue.location?.coordinates?.[1] || issue.latitude;
  const lng = issue.location?.coordinates?.[0] || issue.longitude;
  const hasCoordinates = lat !== undefined && lng !== undefined;

  const formattedDate = issue.createdAt 
    ? new Date(issue.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Recently';

  // FIX: Extract display name from the reportedBy email
  const submitterEmail = issue.reportedBy || 'Anonymous';
  const submitterName = submitterEmail.includes('@') ? submitterEmail.split('@')[0] : submitterEmail;

  return (
    <div className="issue-detail-container">
      <button className="back-button" onClick={() => navigate(-1)}>
        &larr; Back to Map
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <h1 className="issue-title" style={{ marginBottom: '8px' }}>{issue.title}</h1>
        
        {/* NEW: Display the AI Severity Score */}
        {issue.aiSeverityScore !== undefined && (
          <div style={{ 
            backgroundColor: issue.aiSeverityScore > 7 ? '#fee2e2' : '#fef3c7', 
            color: issue.aiSeverityScore > 7 ? '#991b1b' : '#92400e', 
            padding: '8px 16px', 
            borderRadius: '8px', 
            fontWeight: 'bold',
            marginTop: '8px'
          }}>
            ⚠️ Danger Score: {issue.aiSeverityScore}/10
          </div>
        )}
      </div>

      <div className="issue-content-grid" style={{ marginTop: '24px' }}>
        <div className="issue-main-col">
          
          {images.length > 0 ? (
            <div className="image-gallery">
              {/* Show the main active image much larger */}
              <img 
                src={images[activeImageIndex]} 
                alt="Main Issue View" 
                style={{ width: '100%', height: '400px', objectFit: 'cover', borderRadius: '12px', marginBottom: '12px' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          ) : (
             <div className="no-image-placeholder">No image provided</div>
          )}

          <div className="issue-description-section">
            <h3>Description</h3>
            {/* FIX: Map to `descriptions` (plural) from your JSON */}
            <p className="issue-description-text">{issue.descriptions || issue.description || "No description provided."}</p>
          </div>
        </div>

        <div className="issue-sidebar-col">
          <div className="info-card">
            <div className="map-preview-wrapper">
              {hasCoordinates ? (
                <MapContainer 
                  center={[lat, lng]} 
                  zoom={15} 
                  className="static-map-preview"
                  zoomControl={false}
                  dragging={false}
                  scrollWheelZoom={false}
                  doubleClickZoom={false}
                >
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                  <Marker position={[lat, lng]} />
                  <MapUpdater center={[lat, lng]} />
                </MapContainer>
              ) : (
                <div className="map-placeholder">Location data unavailable</div>
              )}
            </div>

            <div className="action-row">
              <button 
                className={`verify-button ${hasVerified ? 'verified' : ''}`} 
                onClick={handleVerify}
                disabled={hasVerified}
              >
                {hasVerified ? '✓ Already Verified' : '✓ Verify Issue'}
              </button>
              <div className="verification-badge" title="Citizens Verified">
                <span className="count">{issue.verificationCount || 0}</span>
              </div>
            </div>

            <hr className="divider" />

            <div className="submitter-info">
              <div className="submitter-avatar">
                {submitterName.charAt(0).toUpperCase()}
              </div>
              <div className="submitter-details">
                <p className="submitted-by">{submitterName}</p>
                <p className="submitted-date">{formattedDate}</p>
              </div>
            </div>

            <hr className="divider" />

            <div className="meta-info">
              <p><strong>Category:</strong> {issue.category}</p>
              <p>
                <strong>Status:</strong> 
                <span className={`status-badge ${issue.status?.toLowerCase() || 'open'}`}>
                  {issue.status || 'Under Review'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}