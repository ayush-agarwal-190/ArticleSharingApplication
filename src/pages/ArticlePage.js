// src/pages/ArticlePage.js

import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebase";
import "./ArticlePage-comments.css";

function ArticlePage() {
  const { articleId } = useParams();
  const auth = getAuth();

  const [article, setArticle] = useState(null);
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [textSize, setTextSize] = useState("medium");
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  // New: hide tags when any tag is clicked
  const [tagsHidden, setTagsHidden] = useState(false);

  // Fetch article and author
  useEffect(() => {
    async function fetchArticleAndAuthor() {
      try {
        const artRef = doc(db, "posts", articleId);
        const artSnap = await getDoc(artRef);
        if (artSnap.exists()) {
          const artData = { id: artSnap.id, ...artSnap.data() };
          setArticle(artData);

          if (artData.uid) {
            const authRef = doc(db, "users", artData.uid);
            const authSnap = await getDoc(authRef);
            if (authSnap.exists()) {
              setAuthor({ id: authSnap.id, ...authSnap.data() });
            }
          }
        }
      } catch (err) {
        console.error("Error fetching article:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchArticleAndAuthor();
  }, [articleId]);

  // Fetch comments in real time
  useEffect(() => {
    if (!articleId) return;
    const commentsRef = collection(db, "posts", articleId, "comments");
    const q = query(commentsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cmts = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setComments(cmts);
    });

    return unsubscribe;
  }, [articleId]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    try {
      const dt = timestamp.toDate();
      return dt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (err) {
      return "Date not available";
    }
  };

  const calculateReadingTime = (content) => {
    if (!content) return 0;
    const words = content.trim().split(/\s+/).length;
    return Math.ceil(words / 200);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    if (!auth.currentUser) return;

    try {
      const commentsRef = collection(db, "posts", articleId, "comments");
      await addDoc(commentsRef, {
        content: newComment,
        uid: auth.currentUser.uid,
        author: auth.currentUser.displayName || "Anonymous",
        photoURL: auth.currentUser.photoURL || null,
        createdAt: serverTimestamp(),
      });
      setNewComment("");
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading article...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="error-container">
        <h2>Article Not Found</h2>
        <p>
          The article you're looking for doesn't exist or may have been removed.
        </p>
        <Link to="/articles" className="back-button">
          Back to Articles
        </Link>
      </div>
    );
  }

  return (
    <div className="article-page">
      <div className="article-header">
        <Link to="/articles" className="back-button">
          ← Back to Articles
        </Link>

        <h1 className="article-title">{article.title}</h1>

        <div className="article-details">
          {author?.photoURL && (
            <img
              src={author.photoURL}
              alt={article.author}
              className="author-avatar"
            />
          )}
          <div className="author-meta">
            <Link to={`/profile/${article.uid}`} className="author-name">
              {article.author}
            </Link>
            <div className="meta-details">
              <span className="publish-date">
                {formatDate(article.createdAt)}
              </span>
              <span className="reading-time">
                {calculateReadingTime(article.content)} min read
              </span>
            </div>
          </div>
        </div>

        {/* Tags block: hidden once any tag is clicked */}
        {!tagsHidden && article.tags && article.tags.length > 0 && (
          <div className="article-tags">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="tag"
                onClick={() => setTagsHidden(true)}
                style={{ cursor: "pointer" }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="text-size-controls">
          {["small", "medium", "large"].map((size) => (
            <button
              key={size}
              className={textSize === size ? "active" : ""}
              onClick={() => setTextSize(size)}
            >
              A
            </button>
          ))}
        </div>
      </div>

      <div className="article-content-container">
        <article className={`article-content text-${textSize}`}>
          {article.content.split("\n").map((para, idx) =>
            para.trim() ? <p key={idx}>{para}</p> : <br key={idx} />
          )}
        </article>

        <div className="article-actions">
          <button className="action-button">👍 Helpful</button>
          <button className="action-button">💬 Comment</button>
          <button className="action-button">🔖 Save</button>
          <button className="action-button">📤 Share</button>
        </div>
      </div>

      <div className="article-footer">
        <div className="author-card">
          <h3>About the Author</h3>
          <div className="author-details-large">
            {author?.photoURL && (
              <img
                src={author.photoURL}
                alt={article.author}
                className="author-avatar-large"
              />
            )}
            <div className="author-info-detailed">
              <Link to={`/profile/${article.uid}`} className="author-name">
                {article.author}
              </Link>
              {author?.department && (
                <p className="author-department">{author.department}</p>
              )}
              {author?.bio && <p className="author-bio">{author.bio}</p>}
              <Link to={`/profile/${article.uid}`} className="view-profile-btn">
                View Full Profile
              </Link>
            </div>
          </div>
        </div>

        <div className="comments-section">
          <h3>Comments</h3>

          {auth.currentUser ? (
            <div className="add-comment">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
              />
              <button onClick={handleAddComment}>Post Comment</button>
            </div>
          ) : (
            <p>
              Please <Link to="/login">login</Link> to add a comment.
            </p>
          )}

          <div className="comments-list">
            {comments.length === 0 ? (
              <p>No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="comment">
                  <div className="comment-header">
                    {c.photoURL && (
                      <img
                        src={c.photoURL}
                        alt={c.author}
                        className="comment-avatar"
                      />
                    )}
                    <strong>{c.author}</strong>
                    <small>
                      {c.createdAt
                        ? c.createdAt.toDate().toLocaleString()
                        : "Just now"}
                    </small>
                  </div>
                  <p>{c.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ArticlePage;
