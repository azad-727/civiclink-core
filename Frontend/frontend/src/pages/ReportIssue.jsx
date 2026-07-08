import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../apiClient';
import './ReportIssue.css';

export default function ReportIssue() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Roads & Transit',
  });
  const [file, setFile] = useState(null);
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [status, setStatus] = useState({ loading: false, error: null, success: false });
  const [manualSearchQuery,setManualSearchQuery] = useState('');
  const [isSearchingLocation,setIsSearchingLocation]=useState(false);
  const [locationError,setLocationError]=useState(null);
  // 1. Function to trigger the animation and fetch location
  const fetchLocation = (e) => {
    if (e) e.preventDefault(); // Prevents the form from submitting when clicking the button
    
    // Clear current location to instantly trigger the "Searching..." radar animation
    setLocation({ latitude: null, longitude: null }); 
    setStatus(prev => ({ ...prev, error: null }));

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => setStatus(prev => ({ ...prev, error: 'Location access is required to report an issue.' }))
      );
    } else {
      setStatus(prev => ({ ...prev, error: 'Geolocation is not supported by your browser.' }));
    }
  };

const handleManualSearch = async (e) => {
    e.preventDefault();
    if (!manualSearchQuery.trim()) return;

    setIsSearchingLocation(true);
    setLocationError(null);

    try {
      // Use OpenStreetMap's Nominatim API for free geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualSearchQuery)}`
      );
      
      const data = await response.json();

      if (data && data.length > 0) {
        // Grab the most relevant result
        const firstResult = data[0];
        setLocation({
          latitude: parseFloat(firstResult.lat),
          longitude: parseFloat(firstResult.lon)
        });
      } else {
        setLocationError("Location not found. Try a more specific address or city.");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setLocationError("Failed to search location. Please try again.");
    } finally {
      setIsSearchingLocation(false);
    }
  };
  // Automatically fetch on initial mount
  useEffect(() => {
    fetchLocation();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // 2. The Multi-Step Submit Flow
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) return setStatus({ loading: false, error: 'Please attach a photo of the issue.', success: false });
    if (!location.latitude || !location.longitude) return setStatus({ loading: false, error: 'Waiting for GPS location...', success: false });

    try {
      setStatus({ loading: true, error: null, success: false });

      // STEP A: Request the Presigned URL from Spring Boot
      const presignedRes = await apiClient.get(`/issues/storage/presigned-url?filename=${encodeURIComponent(file.name)}`);
      const presignedUrl = presignedRes.data?.presignedUrl || presignedRes.presignedUrl;

      if (!presignedUrl) throw new Error("Failed to generate secure upload link.");

      // STEP B: Upload directly to AWS S3
      const s3Response = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': 'image/jpeg' 
        }
      });

      if (!s3Response.ok) throw new Error("Failed to upload image to S3 bucket.");

      // Extract the clean image URL 
      const finalImageUrl = presignedUrl.split('?')[0];

      // STEP C: Submit the final DTO to the IssueController
      const issuePayload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        latitude: location.latitude,
        longitude: location.longitude,
        imageLink: finalImageUrl
      };

      await apiClient.post('/issues', issuePayload, {
        headers: {
          'X-User-Email': user.email
        }
      });

      setStatus({ loading: false, error: null, success: true });
      
      // Redirect to home after 2 seconds
      setTimeout(() => navigate('/home'), 2000);

    } catch (error) {
      console.error("Submission error:", error);
      setStatus({ loading: false, error: error.message || 'Failed to submit the report.', success: false });
    }
  };

  return (
    <div className="report-container">
      <div className="report-card">
        <div className="report-header">
          <h2>Report a Civic Issue</h2>
          <p>Your report will be pinned to the live map and routed to the correct municipal department.</p>
        </div>

        {status.error && <div className="alert-error">{status.error}</div>}
        {status.success && <div className="alert-success">Issue reported successfully! Redirecting...</div>}

        <form onSubmit={handleSubmit} className="report-form">
          <div className="form-group">
            <label htmlFor="title">Issue Title</label>
            <input type="text" id="title" name="title" required placeholder="e.g., Deep Pothole on Main St." value={formData.title} onChange={handleInputChange} disabled={status.loading} />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select id="category" name="category" value={formData.category} onChange={handleInputChange} disabled={status.loading}>
              <option value="Roads & Transit">Roads & Transit</option>
              <option value="Public Safety">Public Safety</option>
              <option value="Parks & Vandalism">Parks & Vandalism</option>
              <option value="Sanitation & Waste">Sanitation & Waste</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" required rows="4" placeholder="Provide specific details to help the repair crew..." value={formData.description} onChange={handleInputChange} disabled={status.loading}></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="photo">Attach Photo (JPEG only)</label>
            <div className="file-upload-wrapper">
              <input type="file" id="photo" accept="image/jpeg, image/jpg" onChange={handleFileChange} disabled={status.loading} required />
              {file && <span className="file-name">{file.name}</span>}
            </div>
            <small>Images are uploaded directly to secure cloud storage.</small>
          </div>

          <div className="form-group location-group">
            <div className="location-header-row">
              <label>Add Location</label>
              <button type="button" className="btn-locate-me" onClick={fetchLocation} title="Refresh GPS Location">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                </svg>
                Locate Me
              </button>
            </div>
            <div className="manual-search-wrapper" style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input 
                type="text" 
                placeholder="Or type an address manually (e.g., Times Square, NY)" 
                value={manualSearchQuery}
                onChange={(e) => setManualSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualSearch(e)}
                style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              <button 
                type="button" 
                onClick={handleManualSearch}
                disabled={isSearchingLocation || !manualSearchQuery}
                style={{ padding: '8px 16px', backgroundColor: '#637599', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                {isSearchingLocation ? '...' : 'Search'}
              </button>
            </div>
            
            {locationError && <div style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '8px' }}>{locationError}</div>}

            <div className="map-preview-container">
              {location.latitude ? (
                <>
                  <iframe
                    title="Location Preview Map"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight="0"
                    marginWidth="0"
                    className="map-iframe-background"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.005},${location.latitude - 0.005},${location.longitude + 0.005},${location.latitude + 0.005}&layer=mapnik`}
                  ></iframe>
                  
                  <div className="location-marker-wrapper">
                    <div className="pulsing-ring"></div>
                    <div className="pulsing-dot"></div>
                  </div>
                  
                  <div className="coordinate-label">
                    📍 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </div>
                </>
              ) : (
                <div className="loc-searching">
                  <div className="radar-spinner"></div>
                  Searching for GPS signal...
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="btn-primary submit-btn" disabled={status.loading || !location.latitude || status.success}>
            {status.loading ? 'Processing & Uploading...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
}