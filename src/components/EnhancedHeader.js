import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./EnhancedHeader.css";

function EnhancedHeader({ user, login, logout, isPremium }) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

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
        
        <nav className={`header-nav ${isMobileMenuOpen ? 'active' : ''}`}>
          <Link 
            to="/articles" 
            className={location.pathname === "/articles" ? "nav-link active" : "nav-link"}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <span className="nav-icon">📚</span>
            <span className="nav-text">Articles</span>
          </Link>
          {user && (
            <Link 
              to="/write" 
              className={location.pathname === "/write" ? "nav-link active" : "nav-link"}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="nav-icon">✏️</span>
              <span className="nav-text">Write</span>
            </Link>
          )}
          {user && (
            <Link 
              to="/my-articles" 
              className={location.pathname === "/my-articles" ? "nav-link active" : "nav-link"}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="nav-icon">📄</span>
              <span className="nav-text">My Articles</span>
            </Link>
          )}
          <Link 
            to="/jobs" 
            className={location.pathname === "/jobs" ? "nav-link active" : "nav-link"}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <span className="nav-icon">💼</span>
            <span className="nav-text">Jobs</span>
          </Link>
          {user && (
            <Link 
              to="/membership" 
              className={location.pathname === "/membership" ? "nav-link active" : "nav-link"}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="nav-icon">⭐</span>
              <span className="nav-text">Membership</span>
            </Link>
          )}
        </nav>
        
        <div className="header-user">
          {user ? (
            <div className="user-menu">
              <Link to="/profile" className="user-info" onClick={() => setIsMobileMenuOpen(false)}>
                <img src={user.photoURL} alt="profile" className="user-avatar" />
                <span className="user-name">{user.displayName}</span>
                {isPremium && <span className="premium-badge">PRO</span>}
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
        
        <button className="mobile-menu-toggle" onClick={toggleMobileMenu} aria-label="Toggle mobile menu">
          <span className={isMobileMenuOpen ? 'open' : ''}></span>
          <span className={isMobileMenuOpen ? 'open' : ''}></span>
          <span className={isMobileMenuOpen ? 'open' : ''}></span>
        </button>
      </div>
    </header>
  );
}

export default EnhancedHeader;