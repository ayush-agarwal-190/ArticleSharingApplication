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
  const [tagsHidden, setTagsHidden] = useState(false);

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
    } catch {
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
        <p>The article you're looking for doesn't exist or may have been removed.</p>
        <Link to="/articles" className="back-button">
          Back to Articles
        </Link>
      </div>
    );
  }

  return (
    <div className="article-page" style={{ maxWidth: "900px", margin: "auto", padding: "20px" }}>
      <header className="article-header" style={{ marginBottom: "2rem" }}>
        <Link to="/articles" className="back-button" style={{ color: "#1976d2", fontWeight: "bold", textDecoration: "none" }}>
          ← Back to Articles
        </Link>
        <h1 style={{ fontSize: "2.5rem", margin: "15px 0", lineHeight: 1.2 }}>{article.title}</h1>

        <div className="article-details" style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          {author?.photoURL && (
            <img
              src={author.photoURL}
              alt={article.author}
              style={{ width: "60px", height: "60px", borderRadius: "50%" }}
            />
          )}
          <div className="author-meta" style={{ flexGrow: 1 }}>
            <Link to={`/profile/${article.uid}`} style={{ fontSize: "1.1rem", fontWeight: "600", color: "#333", textDecoration: "none" }}>
              {article.author}
            </Link>
            <div className="meta-details" style={{ fontSize: "0.9rem", color: "#666", marginTop: "4px" }}>
              <span>{formatDate(article.createdAt)}</span> &middot; <span>{calculateReadingTime(article.content)} min read</span>
            </div>
          </div>
        </div>

        {!tagsHidden && article.tags && article.tags.length > 0 && (
          <div
            className="article-tags"
            style={{
              marginTop: "1rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              userSelect: "none"
            }}
          >
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="tag"
                onClick={() => setTagsHidden(true)}
                style={{
                  cursor: "pointer",
                  padding: "5px 12px",
                  backgroundColor: "#e0e0e0",
                  borderRadius: "15px",
                  fontSize: "0.85rem",
                  color: "#555",
                  transition: "background-color 0.3s",
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#b0b0b0")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#e0e0e0")}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div
          className="text-size-controls"
          style={{ marginTop: "2rem", display: "flex", gap: "10px", justifyContent: "flex-start" }}
        >
          {["small", "medium", "large"].map((size) => (
            <button
              key={size}
              className={textSize === size ? "active" : ""}
              onClick={() => setTextSize(size)}
              style={{
                cursor: "pointer",
                padding: "6px 12px",
                fontSize: "1rem",
                borderRadius: "4px",
                border: textSize === size ? "2px solid #1976d2" : "1px solid #ccc",
                backgroundColor: textSize === size ? "#e3f2fd" : "#fff",
                fontWeight: textSize === size ? "600" : "400",
                transition: "all 0.3s",
                lineHeight: 1,
              }}
              aria-label={`Set text size to ${size}`}
            >
              A
            </button>
          ))}
        </div>
      </header>

      <main className="article-content-container" style={{ marginBottom: "3rem" }}>
        <article className={`article-content text-${textSize}`} style={{ fontSize: textSize === "small" ? "16px" : textSize === "medium" ? "18px" : "20px", lineHeight: 1.6, color: "#222" }}>
          {article.content.split("\n").map((para, idx) =>
            para.trim() ? (
              <p key={idx} style={{ marginBottom: "1rem" }}>
                {para}
              </p>
            ) : (
              <br key={idx} />
            )
          )}
        </article>

        <div
          className="article-actions"
          style={{ display: "flex", gap: "15px", marginTop: "2rem", justifyContent: "flex-start" }}
        >
          {["👍 Helpful", "💬 Comment", "🔖 Save", "📤 Share"].map((action, idx) => (
            <button
              key={idx}
              className="action-button"
              style={{
                cursor: "pointer",
                padding: "10px 16px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "#1976d2",
                color: "#fff",
                fontWeight: "600",
                transition: "background-color 0.3s",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#155fa0")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1976d2")}
              aria-label={action}
            >
              {action}
            </button>
          ))}
        </div>
      </main>

      <footer className="article-footer" style={{ borderTop: "1px solid #ddd", paddingTop: "2rem" }}>
        <section
          className="author-card"
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "20px",
            display: "flex",
            gap: "20px",
            marginBottom: "2rem",
            alignItems: "center",
            backgroundColor: "#fafafa",
          }}
        >
          {author?.photoURL && (
            <img
              src={author.photoURL}
              alt={article.author}
              className="author-avatar-large"
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid #1976d2",
              }}
            />
          )}
          <div className="author-info-detailed" style={{ flexGrow: 1 }}>
            <h3 style={{ margin: "0 0 8px 0" }}>About the Author</h3>
            <Link
              to={`/profile/${article.uid}`}
              className="author-name"
              style={{ fontWeight: "700", fontSize: "1.2rem", color: "#1976d2", textDecoration: "none" }}
            >
              {article.author}
            </Link>
            {author?.department && <p style={{ margin: "6px 0", color: "#555" }}>{author.department}</p>}
            {author?.bio && <p style={{ color: "#666" }}>{author.bio}</p>}
            <Link
              to={`/profile/${article.uid}`}
              className="view-profile-btn"
              style={{
                display: "inline-block",
                marginTop: "10px",
                padding: "8px 14px",
                backgroundColor: "#1976d2",
                color: "#fff",
                borderRadius: "5px",
                textDecoration: "none",
                fontWeight: "600",
                transition: "background-color 0.3s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#155fa0")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1976d2")}
              aria-label="View full profile"
            >
              View Full Profile
            </Link>
          </div>
        </section>

        <section className="comments-section" style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "20px" }}>
          <h3 style={{ marginBottom: "1rem" }}>Comments</h3>

          {auth.currentUser ? (
            <div className="add-comment" style={{ marginBottom: "1.5rem" }}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "1rem",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                  resize: "vertical",
                  boxSizing: "border-box",
                  marginBottom: "8px",
                  fontFamily: "inherit",
                }}
                aria-label="Write a comment"
              />
              <button
                onClick={handleAddComment}
                style={{
                  backgroundColor: "#1976d2",
                  color: "#fff",
                  border: "none",
                  padding: "10px 20px",
                  cursor: "pointer",
                  borderRadius: "5px",
                  fontWeight: "600",
                  transition: "background-color 0.3s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#155fa0")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1976d2")}
              >
                Post Comment
              </button>
            </div>
          ) : (
            <p>
              Please <Link to="/login" style={{ color: "#1976d2", textDecoration: "none" }}>login</Link> to add a comment.
            </p>
          )}

          <div className="comments-list" style={{ maxHeight: "300px", overflowY: "auto" }}>
            {comments.length === 0 ? (
              <p style={{ color: "#555" }}>No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="comment" style={{ padding: "10px 0", borderBottom: "1px solid #eee" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
                    {c.photoURL && (
                      <img
                        src={c.photoURL}
                        alt={c.author}
                        className="comment-avatar"
                        style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }}
                      />
                    )}
                    <strong style={{ color: "#333" }}>{c.author}</strong>
                    <small style={{ marginLeft: "auto", color: "#999", fontSize: "0.8rem" }}>
                      {c.createdAt ? c.createdAt.toDate().toLocaleString() : "Just now"}
                    </small>
                  </div>
                  <p style={{ marginLeft: "46px", color: "#444", whiteSpace: "pre-wrap" }}>{c.content}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </footer>
    </div>
  );
}

export default ArticlePage;
