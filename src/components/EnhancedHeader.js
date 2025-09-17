// src/components/EnhancedHeader.js
import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./EnhancedHeader.css";

function EnhancedHeader({ user, login, logout }) {
  const location = useLocation();
  
  return (
    <header className="enhanced-header">
      <div className="header-container">
        <div className="header-brand">
          <Link to="/">
            <div className="logo-container">
              <span className="logo-icon">🎓</span>
              <h1>College Forum</h1>
            </div>
          </Link>
        </div>
        
        <nav className="header-nav">
          <Link 
            to="/articles" 
            className={location.pathname === "/articles" ? "nav-link active" : "nav-link"}
          >
            <span className="nav-icon">📚</span>
            <span className="nav-text">Articles</span>
          </Link>
          {user && (
            <Link 
              to="/write" 
              className={location.pathname === "/write" ? "nav-link active" : "nav-link"}
            >
              <span className="nav-icon">✏️</span>
              <span className="nav-text">Write</span>
            </Link>
          )}
        </nav>
        
        <div className="header-user">
          {user ? (
            <div className="user-menu">
              <Link to="/profile" className="user-info">
                <img src={user.photoURL} alt="profile" className="user-avatar" />
                <span className="user-name">{user.displayName}</span>
              </Link>
              <button onClick={logout} className="logout-btn">
                <span className="logout-icon">🚪</span>
                Logout
              </button>
            </div>
          ) : (
            <button onClick={login} className="login-btn">
              <span className="login-icon">🔐</span>
              Login with Google
            </button>
          )}
        </div>
        
        <div className="mobile-menu-toggle">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </header>
  );
}

export default EnhancedHeader;