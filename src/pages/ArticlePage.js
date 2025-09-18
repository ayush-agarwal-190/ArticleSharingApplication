import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { calculateReadingTime } from "../utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./ArticlePage.css";
import "./ArticlePage-comments.css"; // Keep your comment styles

function ArticlePage({ user }) {
  const { articleId } = useParams();
  const [article, setArticle] = useState(null);
  const [authorProfile, setAuthorProfile] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [userVote, setUserVote] = useState(null);

  useEffect(() => {
    let unsubscribeArticle;
    let unsubscribeComments;
    
    if (articleId) {
      const docRef = doc(db, "posts", articleId);
      
      unsubscribeArticle = onSnapshot(docRef, async (docSnap) => {
        if (docSnap.exists()) {
          const articleData = { id: docSnap.id, ...docSnap.data() };
          setArticle(articleData);
          
          if (user) {
            setUserVote(
              articleData.upvotes?.includes(user.uid) ? 'upvote' :
              articleData.downvotes?.includes(user.uid) ? 'downvote' : null
            );
          }
          
          if (articleData.uid) {
            const authorDoc = await getDoc(doc(db, "users", articleData.uid));
            if (authorDoc.exists()) setAuthorProfile(authorDoc.data());
          }
        } else {
          setArticle(null);
        }
        setLoading(false);
      });

      const commentsRef = collection(db, "posts", articleId, "comments");
      const qComments = query(commentsRef, orderBy("createdAt", "asc"));
      unsubscribeComments = onSnapshot(qComments, (snapshot) => {
        setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }
    
    return () => {
      if (unsubscribeArticle) unsubscribeArticle();
      if (unsubscribeComments) unsubscribeComments();
    };
  }, [articleId, user]);

  const handleVote = async (voteType) => {
    if (!user) return;
    const docRef = doc(db, "posts", articleId);
    
    const updates = {};
    const isCurrentlyUpvoted = userVote === 'upvote';
    const isCurrentlyDownvoted = userVote === 'downvote';

    if (voteType === 'upvote') {
        updates.upvotes = isCurrentlyUpvoted ? arrayRemove(user.uid) : arrayUnion(user.uid);
        if (isCurrentlyDownvoted) updates.downvotes = arrayRemove(user.uid);
    } else if (voteType === 'downvote') {
        updates.downvotes = isCurrentlyDownvoted ? arrayRemove(user.uid) : arrayUnion(user.uid);
        if (isCurrentlyUpvoted) updates.upvotes = arrayRemove(user.uid);
    }
    
    await updateDoc(docRef, updates);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    await addDoc(collection(db, "posts", articleId, "comments"), {
      content: newComment,
      author: user.displayName,
      authorId: user.uid,
      authorPhoto: user.photoURL,
      createdAt: serverTimestamp(),
    });
    setNewComment("");
  };

  const handleDeleteComment = async (commentId) => {
    // Basic confirmation dialog
    if (window.confirm("Are you sure you want to delete this comment?")) {
      await deleteDoc(doc(db, "posts", articleId, "comments", commentId));
    }
  };

  if (loading) {
    return (
      <div className="article-page-enhanced">
        <div className="loading-container"><div className="spinner"></div><p>Loading article...</p></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="article-page-enhanced">
        <div className="error-container"><h2>Article Not Found</h2><Link to="/articles" className="btn-primary">Back to Articles</Link></div>
      </div>
    );
  }

  return (
    <div className="article-page-enhanced">
      <div className="article-layout">
        {/* Main Article Content */}
        <main className="article-main-content">
          <header className="article-header-enhanced">
            <Link to="/articles" className="back-link">
              <span>←</span> Back to Articles
            </Link>
            <h1 className="article-title">{article.title}</h1>
          </header>
          <div className="article-content-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.content}</ReactMarkdown>
          </div>
        </main>

        {/* Sticky Sidebar */}
        <aside className="article-sidebar">
          {authorProfile && (
            <div className="sidebar-card">
              <h3>About the Author</h3>
              <div className="author-info-sidebar">
                <img src={authorProfile.photoURL} alt={authorProfile.displayName} className="author-avatar" />
                <div className="author-details">
                  <div className="author-name">{authorProfile.displayName}</div>
                  <div className="author-dept">{authorProfile.department}</div>
                </div>
              </div>
              <Link to={`/profile/${article.uid}`} className="view-profile-btn">View Profile</Link>
            </div>
          )}

          <div className="sidebar-card">
            <h3>Article Details</h3>
            <ul className="article-stats-sidebar">
              <li><span className="icon">⏱️</span> {calculateReadingTime(article.content)} min read</li>
              <li><span className="icon">📅</span> Published on {article.createdAt?.toDate().toLocaleDateString()}</li>
            </ul>
            {article.tags && article.tags.length > 0 && (
              <>
                <h4 style={{marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1rem'}}>Topics</h4>
                <div className="article-tags-sidebar">
                  {article.tags.map(tag => <span key={tag} className="tag-item">{tag}</span>)}
                </div>
              </>
            )}
          </div>

          <div className="sidebar-card">
            <h3>Was this article helpful?</h3>
            <div className="vote-section-sidebar">
              <button
                className={`vote-btn upvote-btn ${userVote === 'upvote' ? 'active' : ''}`}
                onClick={() => handleVote('upvote')}
                disabled={!user}
              >
                👍 {article.upvotes?.length || 0}
              </button>
              <button
                className={`vote-btn downvote-btn ${userVote === 'downvote' ? 'active' : ''}`}
                onClick={() => handleVote('downvote')}
                disabled={!user}
              >
                👎 {article.downvotes?.length || 0}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Comments Section (remains below the content) */}
      <div className="comments-section-container">
        <section className="comments-section">
          <h3>Comments ({comments.length})</h3>
          {user ? (
            <form onSubmit={handleAddComment} className="add-comment">
              <textarea placeholder="Share your thoughts..." value={newComment} onChange={(e) => setNewComment(e.target.value)} />
              <button type="submit" className="post-btn">Post Comment</button>
            </form>
          ) : (
            <p className="login-to-comment"><Link to="/login">Log in</Link> to leave a comment</p>
          )}
          <div className="comments-list">
            {comments.length > 0 ? comments.map(comment => (
              <div key={comment.id} className="comment">
                <img src={comment.authorPhoto} alt={comment.author} className="comment-avatar" />
                <div className="comment-body">
                  <div className="comment-header">
                    <span className="comment-author">{comment.author}</span>
                    <span className="comment-time">{comment.createdAt?.toDate().toLocaleDateString()}</span>
                  </div>
                  <p className="comment-content">{comment.content}</p>
                  {user && user.uid === comment.authorId && (
                    <button onClick={() => handleDeleteComment(comment.id)} className="delete-btn">Delete</button>
                  )}
                </div>
              </div>
            )) : <p className="no-comments">Be the first to share your thoughts!</p>}
          </div>
        </section>
      </div>
    </div>
  );
}

export default ArticlePage;

