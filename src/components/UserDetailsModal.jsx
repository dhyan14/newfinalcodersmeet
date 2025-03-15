import { useState } from 'react';
import './UserDetailsModal.css';

function UserDetailsModal({ user, onClose }) {
  const [activeTab, setActiveTab] = useState('profile');

  if (!user) return null;

  return (
    <div className="modal-overlay">
      <div className="user-details-modal">
        <div className="modal-header">
          <h3>User Details: {user.fullName}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-tabs">
          <button 
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button 
            className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            Activity
          </button>
          <button 
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>
        
        <div className="modal-content">
          {activeTab === 'profile' && (
            <div className="profile-tab">
              <div className="user-info-item">
                <strong>Full Name:</strong> {user.fullName}
              </div>
              <div className="user-info-item">
                <strong>Email:</strong> {user.email}
              </div>
              <div className="user-info-item">
                <strong>Role:</strong> {user.role || (user.isAdmin ? 'admin' : 'user')}
              </div>
              <div className="user-info-item">
                <strong>Registered:</strong> {new Date(user.createdAt).toLocaleString()}
              </div>
              <div className="user-info-item">
                <strong>Last Active:</strong> {user.lastLocationUpdate ? new Date(user.lastLocationUpdate).toLocaleString() : 'Never'}
              </div>
              <div className="user-info-item">
                <strong>Location:</strong> {user.location?.coordinates ? 
                  `Latitude: ${user.location.coordinates[1].toFixed(6)}, Longitude: ${user.location.coordinates[0].toFixed(6)}` : 
                  'Not available'}
              </div>
            </div>
          )}
          
          {activeTab === 'activity' && (
            <div className="activity-tab">
              <p>User activity log will be displayed here.</p>
              <div className="activity-log">
                <div className="log-item">
                  <span className="log-time">{new Date(user.createdAt).toLocaleString()}</span>
                  <span className="log-action">User account created</span>
                </div>
                {user.lastLocationUpdate && (
                  <div className="log-item">
                    <span className="log-time">{new Date(user.lastLocationUpdate).toLocaleString()}</span>
                    <span className="log-action">Location updated</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div className="settings-tab">
              <div className="admin-actions">
                <h4>Admin Actions</h4>
                <button className="action-btn warning">Reset Password</button>
                <button className="action-btn danger">Disable Account</button>
                {!user.isAdmin && (
                  <button className="action-btn primary">
                    {user.role === 'admin' ? 'Remove Admin Role' : 'Make Admin'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserDetailsModal; 