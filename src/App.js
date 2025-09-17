// src/App.js (updated)
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { loginWithGoogle } from "./auth";
import EnhancedHeader from "./components/EnhancedHeader";
import EnhancedFooter from "./components/EnhancedFooter";
import EnhancedPostForm from "./components/EnhancedPostForm";
import ArticlesPage from "./pages/ArticlesPage";
import ArticlePage from "./pages/ArticlePage";
import UserProfilePage from "./pages/UserProfilePage";
import ProfileForm from "./components/ProfileForm";
import "./styles.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ message: "", type: "" });

  // Track user authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (currentUser) {
        showNotification(`Welcome back, ${currentUser.displayName || 'User'}!`, "success");
      }
    });
    return unsubscribe;
  }, []);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: "", type: "" }), 5000);
  };

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Login failed:", error);
      showNotification("Login failed. Please try again.", "error");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showNotification("You have been logged out successfully.", "info");
    } catch (error) {
      console.error("Logout failed:", error);
      showNotification("Logout failed. Please try again.", "error");
    }
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Loading College Forum...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        {notification.message && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
            <button 
              onClick={() => setNotification({ message: "", type: "" })}
              className="notification-close"
            >
              Ã—
            </button>
          </div>
        )}

        <EnhancedHeader user={user} login={handleLogin} logout={handleLogout} />
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/articles" replace />} />
            <Route path="/articles" element={<ArticlesPage />} />
            <Route path="/article/:articleId" element={<ArticlePage />} />
            <Route 
              path="/write" 
              element={
                user ? (
                  <EnhancedPostForm 
                    user={user} 
                    onPostSuccess={() => showNotification("Article published successfully!", "success")} 
                  />
                ) : (
                  <div className="auth-required">
                    <div className="auth-card">
                      <h2>Login Required</h2>
                      <p>Please log in to write articles</p>
                      <button onClick={handleLogin} className="login-button">
                        Login with Google
                      </button>
                    </div>
                  </div>
                )
              } 
            />
            <Route 
              path="/profile" 
              element={
                user ? (
                  <ProfileForm 
                    user={user} 
                    onSaveSuccess={() => showNotification("Profile updated successfully!", "success")}
                    onError={(error) => showNotification(error, "error")}
                  />
                ) : (
                  <div className="auth-required">
                    <div className="auth-card">
                      <h2>Login Required</h2>
                      <p>Please log in to manage your profile</p>
                      <button onClick={handleLogin} className="login-button">
                        Login with Google
                      </button>
                    </div>
                  </div>
                )
              } 
            />
            <Route path="/profile/:userId" element={<UserProfilePage />} />
            <Route 
              path="/about" 
              element={
                <div className="about-container">
                  <div className="about-card">
                    <h2>About College Forum</h2>
                    <p>Welcome to our college community platform! This forum is designed for students to share knowledge, ask questions, and connect with peers.</p>
                    
                    <h3>Features:</h3>
                    <ul>
                      <li>Create and share articles on various topics</li>
                      <li>Tag your posts for better organization</li>
                      <li>Connect with other students</li>
                      <li>Build your academic profile</li>
                    </ul>
                    
                    <h3>How to use:</h3>
                    <ol>
                      <li>Create an account or sign in with Google</li>
                      <li>Complete your profile with your academic details</li>
                      <li>Start posting articles and engaging with others</li>
                    </ol>
                    
                    <div className="about-footer">
                      <p>Made with â¤ï¸ for the student community</p>
                    </div>
                  </div>
                </div>
              } 
            />
            <Route path="*" element={<Navigate to="/articles" replace />} />
          </Routes>
        </main>
        
        <EnhancedFooter />
      </div>
    </Router>
  );
}

export default App;