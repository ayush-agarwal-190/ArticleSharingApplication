// src/components/EnhancedFooter.js
import React from "react";
import "./EnhancedFooter.css";

function EnhancedFooter() {
  return (
    <footer className="enhanced-footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>College Forum</h3>
            <p>Connecting students through knowledge sharing and collaboration.</p>
          </div>
          
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="/articles">Browse Articles</a></li>
              <li><a href="/write">Write Article</a></li>
              <li><a href="/jobs">Job Opportunities</a></li>
              <li><a href="/about">About Us</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Resources</h4>
            <ul>
              <li><a href="/help">Help Center</a></li>
              <li><a href="/guidelines">Community Guidelines</a></li>
              <li><a href="/privacy">Privacy Policy</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Connect</h4>
            <div className="social-links">
              <a href="#" aria-label="Twitter"><span>🐦</span></a>
              <a href="#" aria-label="Facebook"><span>📘</span></a>
              <a href="#" aria-label="Instagram"><span>📸</span></a>
              <a href="#" aria-label="LinkedIn"><span>💼</span></a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} College Forum. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default EnhancedFooter;