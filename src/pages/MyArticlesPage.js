import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { generateExcerpt, formatDate } from "../utils";
import "./MyArticlesPage.css";

function MyArticlesPage({ user }) {
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "posts"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setUserPosts(
          snapshot.docs.map((postDoc) => ({
            id: postDoc.id,
            ...postDoc.data(),
          }))
        );
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching user posts:", error);
        setMessage("Failed to load your articles. Please try again.");
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [user]);

  const handleDelete = async (postId) => {
    if (window.confirm("Are you sure you want to delete this article?")) {
      try {
        await deleteDoc(doc(db, "posts", postId));
        setMessage("Article deleted successfully!");
        setTimeout(() => setMessage(""), 3000);
      } catch (error) {
        console.error("Error deleting article:", error);
        setMessage("Error deleting article. Please try again.");
      }
    }
  };

  if (loading) {
    return (
      <div className="my-articles-page loading-container">
        <div className="spinner"></div>
        <p>Loading your articles...</p>
      </div>
    );
  }

  return (
    <div className="my-articles-page">
      <header className="page-header">
        <h1>My Articles</h1>
        <p className="subtitle">Manage and review your published work.</p>
      </header>
      
      {message && (
        <div className={`notification ${message.includes("Error") ? "error" : "success"}`}>
          {message}
        </div>
      )}

      {userPosts.length === 0 ? (
        <div className="no-articles">
          <span className="emoji">📝</span>
          <h3>You haven't published any articles yet.</h3>
          <p>Start sharing your knowledge with the community!</p>
          <Link to="/write" className="btn-primary">
            Write Your First Article
          </Link>
        </div>
      ) : (
        <div className="my-articles-grid">
          {userPosts.map((post) => (
            <article key={post.id} className="article-card">
              <Link to={`/article/${post.id}`} className="card-link">
                <div className="card-content">
                  <h3 className="title">{post.title}</h3>
                  <p className="excerpt">{generateExcerpt(post.content, 120)}</p>
                  <div className="article-meta">
                    <span className="article-date">
                      {formatDate(post.createdAt)}
                    </span>
                    <span className="upvotes-count">
                      👍 {post.upvotes?.length || 0}
                    </span>
                  </div>
                </div>
              </Link>
              <div className="card-actions">
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(post.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyArticlesPage;
