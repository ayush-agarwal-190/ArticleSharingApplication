// src/components/Header.js
import React from "react";
import { Link } from "react-router-dom";

function Header({ user, login, logout }) {
  return (
    <header className="header">
      <div className="header-brand">
        <Link to="/">
          <h1>College Forum</h1>
        </Link>
      </div>
      
      <nav className="header-nav">
        <Link to="/articles">Articles</Link>
        {user && <Link to="/write">Write</Link>}
      </nav>
      
      {user ? (
        <div className="header-user">
          <Link to="/profile" className="user-info">
            <img src={user.photoURL} alt="profile" className="avatar" />
            <span>{user.displayName}</span>
          </Link>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <button onClick={login}>Login with Google</button>
      )}
    </header>
  );
}

export default Header;