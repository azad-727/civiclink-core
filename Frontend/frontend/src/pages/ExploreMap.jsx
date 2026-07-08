import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import apiClient from '../apiClient';
import './ExploreMap.css';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
};

const createIssueIcon = () => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `<div class="marker-pin"><div class="marker-pulse"></div></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

const createUserIcon = () => {
  return L.divIcon({
    className: 'user-map-marker',
    html: `<div class="user-pin"><div class="user-pulse"></div></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

function MapBoundsController({ issues, currentLocation, isInitialized }) {
  const map = useMap();
  
  useEffect(() => {
    if (!isInitialized.current && issues.length > 0) {
      const bounds = L.latLngBounds([currentLocation]); 
      
      issues.forEach(issue => {
        if (!isNaN(issue.latitude) && !isNaN(issue.longitude)) {
          bounds.extend([issue.latitude, issue.longitude]); 
        }
      });
      
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true });
        isInitialized.current = true; 
      }
    }
  }, [issues, currentLocation, map, isInitialized]);
  
  return null;
}

export default function ExploreMap() {
  const [currentLocation, setCurrentLocation] = useState([23.0225, 72.5714]);
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [activeFilter, setActiveFilter] = useState('active'); 
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [quickAction, setQuickAction] = useState(null);
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const mapRef = useRef(null);
  const mapInitialized = useRef(false);
  const CATEGORIES = ['All', 'Road & Transit', 'Sanitation & Waste', 'Public Safety','Park & Vandalism'];
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const liveLat = pos.coords.latitude;
          const liveLng = pos.coords.longitude;
          setCurrentLocation([liveLat, liveLng]);
          fetchActiveIssues(liveLat, liveLng);
        },
        (err) => {
          console.warn("GPS access denied.");
          fetchActiveIssues(currentLocation[0], currentLocation[1]);
        }
      );
    } else {
      fetchActiveIssues(currentLocation[0], currentLocation[1]);
    }
  }, []);

  const fetchActiveIssues = async (lat, lng) => {
    try {
      const response = await apiClient.get(`/issues/nearby?longitude=${lng}&latitude=${lat}&radius=10000.0`);
      const data = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
      
      const issuesWithDistance = data.map(issue => {
        const issueLng = parseFloat(issue.location?.coordinates?.[0]);
        const issueLat = parseFloat(issue.location?.coordinates?.[1]);

        return {
          ...issue,
          latitude: issueLat, 
          longitude: issueLng, 
          distance: parseFloat(calculateDistance(lat, lng, issueLat, issueLng))
        };
      });
      
      setIssues(issuesWithDistance);
    } catch (error) {
      console.error("Failed to load map issues", error);
    }
  };

  const handleCardClick = (issue) => {
    setSelectedIssue(issue);
    
    if (mapRef.current && issue.latitude && issue.longitude) {
      mapRef.current.flyTo([issue.latitude, issue.longitude], 17, {
        animate: true,
        duration: 1.5
      });
    }
    if (window.innerWidth <= 768) setIsMobileSidebarOpen(false);
  };
  
  const handleRecenter = () => {
    if (mapRef.current) {
      mapRef.current.flyTo(currentLocation, 14, {
        animate: true,
        duration: 1.5
      });
    }
  };

  const handleVerifyIssue = async (e, issueId) => {
    e.stopPropagation(); 
    
    try {
      await apiClient.patch(`/issues/${issueId}/verify`);
      
      setIssues(prevIssues => 
        prevIssues.map(issue => 
          issue.id === issueId 
            ? { ...issue, verificationCount: (issue.verificationCount || 0) + 1 } 
            : issue
        )
      );
      
      alert("Thanks for verifying! This helps dispatch crews faster.");
    } catch (error) {
      console.error("Verification failed:", error);
      alert("Verification failed or you have already verified this issue.");
    }
  };

  let processedIssues = issues.filter(issue =>{
    
   const matchesSearch = 
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.category.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Category Match
    const matchesCategory = 
      selectedCategory === 'All' || 
      (issue.category && issue.category.toLowerCase() === selectedCategory.toLowerCase());

    // 3. Quick Action Match
    let matchesQuickAction = true;
    if (quickAction === 'high_severity') {
      matchesQuickAction = issue.aiSeverityScore !== undefined && issue.aiSeverityScore > 7;
    } else if (quickAction === 'resolved') {
      matchesQuickAction = issue.status === 'RESOLVED';
    } else if (quickAction === 'open') {
      matchesQuickAction = issue.status !== 'RESOLVED';
    }

    return matchesSearch && matchesCategory && matchesQuickAction;
  });

  if (activeFilter === 'nearest') {
    processedIssues.sort((a, b) => a.distance - b.distance);
  }

  return (
    <div className="explore-container">
      <button 
        className="mobile-toggle-btn" 
        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      >
        {isMobileSidebarOpen ? 'Show Map' : 'View Issues List'}
      </button>

      {/* LEFT SIDEBAR */}
      <div className={`map-sidebar ${isMobileSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Local Issues</h2>
          <div className="search-bar">
            <input 
              type="text" 
              placeholder="Search issues..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>{/* Layer 1: Distance & Status */}
          <div className="filter-chips">
            <button 
              className={`chip ${activeFilter === 'active' ? 'active' : ''}`}
              onClick={() => setActiveFilter('active')}
            >
              Active
            </button>
            <button 
              className={`chip ${activeFilter === 'nearest' ? 'active' : ''}`}
              onClick={() => setActiveFilter('nearest')}
            >
              Nearest
            </button>
          </div>

          <div 
            className="category-filters" 
            style={{ 
              display: 'flex', 
              flexWrap: 'wrap', /* This is the magic property that fixes mobile */
              gap: '8px', 
              padding: '8px 0', 
              marginTop: '8px' 
            }}
          >
            {CATEGORIES.map(cat => (
              <button 
                key={cat}
                className={`chip ${selectedCategory === cat ? 'active' : ''}`}
                style={{ 
                  borderRadius: '16px', 
                  padding: '6px 12px', /* Slightly increased padding for better mobile tapping */
                  border: '1px solid #e5e7eb', 
                  backgroundColor: selectedCategory === cat ? '#4f46e5' : 'white', 
                  color: selectedCategory === cat ? 'white' : '#374151',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* NEW Layer 3: Quick Actions */}
          <div 
            className="quick-actions" 
            style={{ 
              display: 'flex', 
              flexWrap: 'wrap', /* Allows actions to drop to the next line on small screens */
              gap: '8px', 
              marginTop: '4px',
              paddingBottom: '12px'
            }}
          >
             <button 
                className={`chip ${quickAction === 'high_severity' ? 'active' : ''}`}
                style={{ 
                  fontSize: '0.85rem', 
                  padding: '6px 12px', 
                  backgroundColor: quickAction === 'high_severity' ? '#fee2e2' : '#f3f4f6', 
                  color: quickAction === 'high_severity' ? '#991b1b' : '#4b5563', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: 'pointer' 
                }}
                onClick={() => setQuickAction(quickAction === 'high_severity' ? null : 'high_severity')}
             >
                ⚠️ High Severity
             </button>
             <button 
                className={`chip ${quickAction === 'resolved' ? 'active' : ''}`}
                style={{ 
                  fontSize: '0.85rem', 
                  padding: '6px 12px', 
                  backgroundColor: quickAction === 'resolved' ? '#d1fae5' : '#f3f4f6', 
                  color: quickAction === 'resolved' ? '#065f46' : '#4b5563', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: 'pointer' 
                }}
                onClick={() => setQuickAction(quickAction === 'resolved' ? null : 'resolved')}
             >
                ✅ Resolved
             </button>
          </div>
        </div>

        <div className="issue-list">
          {processedIssues.map((issue, index) => (
            <div 
              key={issue.id || index} 
              className={`issue-card ${selectedIssue === issue ? 'selected' : ''}`}
              onClick={() => handleCardClick(issue)}
            >
              <div className="card-header">
                <h3>{issue.title}</h3>
                {issue.aiSeverityScore !== undefined && (
                  <span style={{ 
                    fontSize: '0.75rem', 
                    padding: '2px 6px', 
                    borderRadius: '4px', 
                    backgroundColor: issue.aiSeverityScore > 7 ? '#fee2e2' : '#fef3c7',
                    color: issue.aiSeverityScore > 7 ? '#991b1b' : '#92400e',
                    fontWeight: 'bold'
                  }}>
                     Danger : {issue.aiSeverityScore}/10
                  </span>
                )}
              </div>
              <p>{issue.category}</p>
              
              <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>✅ {issue.verificationCount || 0} Citizens Verified</span>
                <span>{issue.distance} km away</span>
              </div>

              <div className="card-footer">
                <span className="status-open">🔴 {issue.status || 'OPEN'}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn-route-small" 
                    style={{ backgroundColor: '#10b981' }}
                    onClick={(e) => handleVerifyIssue(e, issue.id)}
                  >
                    Verify
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT MAP AREA */}
      <div className="map-area">
        <button className="btn-recenter" onClick={handleRecenter} title="My Location">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
          </svg>
        </button>

        <MapContainer ref={mapRef} center={currentLocation} zoom={14} className="full-screen-map" zoomControl={false}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />
          
          <MapBoundsController 
            issues={processedIssues} 
            currentLocation={currentLocation} 
            isInitialized={mapInitialized} 
          />
          <Marker position={currentLocation} icon={createUserIcon()}>
            <Popup className="light-popup">
              <div className="popup-content" style={{ padding: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '1rem' }}>You are here</h4>
              </div>
            </Popup>
          </Marker>

          {processedIssues.map((issue, index) => {
            if (isNaN(issue.latitude) || isNaN(issue.longitude)) return null;

            return (
              <Marker 
                key={issue.id || index} 
                position={[issue.latitude, issue.longitude]} 
                icon={createIssueIcon()}
                eventHandlers={{
                  click: () => handleCardClick(issue),
                }}
              >
                <Popup className="light-popup">
                  <div className="popup-content">
                    <Link 
                        to={`/issue/${issue.id}`} 
                        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                      ><h4>{issue.title}</h4>
                        
                    <p>{issue.category}</p>
                    
                    {/* FIXED: Added onError to elegantly hide broken S3 image links */}
                    {issue.imageUrl && (
                      <img 
                        src={issue.imageUrl} 
                        alt="Issue" 
                        className="popup-img" 
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    </Link>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}