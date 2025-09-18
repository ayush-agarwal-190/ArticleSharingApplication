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

function ArticlePage({ user }) {
  const { articleId } = useParams();
  const [article, setArticle] = useState(null);
  const [authorProfile, setAuthorProfile] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState("medium");
  const [userVote, setUserVote] = useState(null);

  useEffect(() => {
    let unsubscribeArticle;
    let unsubscribeComments;
    
    const fetchArticleAndComments = async () => {
      try {
        const docRef = doc(db, "posts", articleId);
        
        unsubscribeArticle = onSnapshot(docRef, async (docSnap) => {
          if (docSnap.exists()) {
            const articleData = { id: docSnap.id, ...docSnap.data() };
            setArticle(articleData);
            
            if (user) {
              if (articleData.upvotes?.includes(user.uid)) {
                setUserVote('upvote');
              } else if (articleData.downvotes?.includes(user.uid)) {
                setUserVote('downvote');
              } else {
                setUserVote(null);
              }
            }
            
            if (articleData.uid) {
              const authorDoc = await getDoc(doc(db, "users", articleData.uid));
              if (authorDoc.exists()) {
                setAuthorProfile(authorDoc.data());
              }
            }
          } else {
            console.log("No such article!");
            setArticle(null);
          }
          setLoading(false);
        });

        const commentsRef = collection(db, "posts", articleId, "comments");
        const qComments = query(commentsRef, orderBy("createdAt", "asc"));
        
        unsubscribeComments = onSnapshot(qComments, (snapshot) => {
          const commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setComments(commentsData);
        });

      } catch (error) {
        console.error("Error fetching article or comments:", error);
        setLoading(false);
      }
    };

    if (articleId) {
      fetchArticleAndComments();
    }
    
    // This is the crucial part: always return a function that calls the unsubscribers.
    return () => {
      if (unsubscribeArticle) unsubscribeArticle();
      if (unsubscribeComments) unsubscribeComments();
    };
    
  }, [articleId, user]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    try {
      await addDoc(collection(db, "posts", articleId, "comments"), {
        content: newComment,
        author: user.displayName,
        authorId: user.uid,
        authorPhoto: user.photoURL,
        createdAt: serverTimestamp(),
      });
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      try {
        await deleteDoc(doc(db, "posts", articleId, "comments", commentId));
      } catch (error) {
        console.error("Error deleting comment:", error);
      }
    }
  };
  
  const handleVote = async (voteType) => {
    if (!user) return;
    const docRef = doc(db, "posts", articleId);
    
    const upvoteToAdd = voteType === 'upvote' ? user.uid : null;
    const downvoteToAdd = voteType === 'downvote' ? user.uid : null;
    const upvoteToRemove = userVote === 'upvote' ? user.uid : (voteType === 'downvote' ? user.uid : null);
    const downvoteToRemove = userVote === 'downvote' ? user.uid : (voteType === 'upvote' ? user.uid : null);
    
    const updates = {};
    if (upvoteToAdd) updates.upvotes = arrayUnion(upvoteToAdd);
    if (downvoteToAdd) updates.downvotes = arrayUnion(downvoteToAdd);
    if (upvoteToRemove) updates.upvotes = arrayRemove(upvoteToRemove);
    if (downvoteToRemove) updates.downvotes = arrayRemove(downvoteToRemove);

    if (Object.keys(updates).length > 0) {
      try {
        await updateDoc(docRef, updates);
      } catch (error) {
        console.error("Error updating vote:", error);
      }
    }
  };

  const handleDeleteArticle = async () => {
    if (window.confirm("Are you sure you want to delete this article? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, "posts", articleId));
        window.location.href = "/articles"; 
      } catch (error) {
        console.error("Error deleting article:", error);
        alert("Error deleting article. Please try again.");
      }
    }
  };

  if (loading) {
    return (
      <div className="article-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading article...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="article-page">
        <div className="error-container">
          <h2>Article Not Found</h2>
          <p>The article you're looking for doesn't exist.</p>
          <Link to="/articles" className="btn-primary">
            Back to Articles
          </Link>
        </div>
      </div>
    );
  }

  const isAuthor = user && article.uid === user.uid;
  const upvoteCount = article.upvotes?.length || 0;
  const downvoteCount = article.downvotes?.length || 0;
  
  return (
    <div className="article-page">
      <Link to="/articles" className="back-button">
        ← Back to Articles
      </Link>

      <article className="article-container">
        <header className="article-header">
          <h1 className="article-title">{article.title}</h1>
          
          <div className="article-meta">
            <div className="author-info">
              {authorProfile?.photoURL ? (
                <img src={authorProfile.photoURL} alt={article.author} className="author-avatar" />
              ) : (
                <div className="author-avatar">
                  {article.author ? article.author.charAt(0).toUpperCase() : "A"}
                </div>
              )}
              <div>
                <div className="author-name">{article.author}</div>
                {authorProfile?.department && (
                  <div className="author-department">{authorProfile.department}</div>
                )}
              </div>
            </div>
            
            <div className="article-stats">
              <span>{calculateReadingTime(article.content)} min read</span>
              <span>•</span>
              <span>{article.createdAt?.toDate().toLocaleDateString()}</span>
            </div>
          </div>

          {article.tags && article.tags.length > 0 && (
            <div className="article-tags">
              {article.tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <div className="article-content-container">
          <div className="text-size-controls">
            <span>Text size:</span>
            <button 
              className={fontSize === "small" ? "active" : ""} 
              onClick={() => setFontSize("small")}
            >
              S
            </button>
            <button 
              className={fontSize === "medium" ? "active" : ""} 
              onClick={() => setFontSize("medium")}
            >
              M
            </button>
            <button 
              className={fontSize === "large" ? "active" : ""} 
              onClick={() => setFontSize("large")}
            >
              L
            </button>
          </div>

          <div className={`article-content ${fontSize}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {article.content}
            </ReactMarkdown>
          </div>
        </div>
        
        <div className="vote-section">
          <button 
            className={`vote-btn upvote-btn ${userVote === 'upvote' ? 'active' : ''}`}
            onClick={() => handleVote('upvote')}
            disabled={!user}
          >
            👍 {upvoteCount}
          </button>
          <button 
            className={`vote-btn downvote-btn ${userVote === 'downvote' ? 'active' : ''}`}
            onClick={() => handleVote('downvote')}
            disabled={!user}
          >
            👎
          </button>
          {isAuthor && (
            <span className="downvote-count">
              <span className="downvote-icon">👎</span> {downvoteCount}
            </span>
          )}
        </div>

        <footer className="article-footer">
          <div className="author-card">
            <h3>About the Author</h3>
            <div className="author-details">
              {authorProfile?.photoURL ? (
                <img src={authorProfile.photoURL} alt={article.author} className="author-avatar-large" />
              ) : (
                <div className="author-avatar-large">
                  {article.author ? article.author.charAt(0).toUpperCase() : "A"}
                </div>
              )}
              <div className="author-info-detailed">
                <h4>{article.author}</h4>
                {authorProfile?.department && (
                  <p className="author-department">{authorProfile.department}</p>
                )}
                {authorProfile?.bio && (
                  <p className="author-bio">{authorProfile.bio}</p>
                )}
                <Link to={`/profile/${article.uid}`} className="view-profile-btn">
                  View Profile
                </Link>
                {isAuthor && (
                  <button onClick={handleDeleteArticle} className="delete-article-btn">
                    Delete My Article
                  </button>
                )}
              </div>
            </div>
          </div>

          <section className="comments-section">
            <h3>Comments ({comments.length})</h3>
            
            {user ? (
              <form onSubmit={handleAddComment} className="add-comment">
                <textarea
                  placeholder="Share your thoughts..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows="3"
                />
                <button type="submit" className="post-btn">
                  Post Comment
                </button>
              </form>
            ) : (
              <p className="login-to-comment">
                <Link to="/login">Log in</Link> to leave a comment
              </p>
            )}

            <div className="comments-list">
              {comments.length === 0 ? (
                <p className="no-comments">No comments yet. Be the first to share your thoughts!</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="comment">
                    {comment.authorPhoto ? (
                      <img src={comment.authorPhoto} alt={comment.author} className="comment-avatar" />
                    ) : (
                      <div className="comment-avatar">
                        {comment.author ? comment.author.charAt(0).toUpperCase() : "U"}
                      </div>
                    )}
                    <div className="comment-body">
                      <div className="comment-header">
                        <span className="comment-author">{comment.author}</span>
                        <span className="comment-time">
                          {comment.createdAt?.toDate().toLocaleDateString()}
                        </span>
                      </div>
                      <p className="comment-content">{comment.content}</p>
                      {user && user.uid === comment.authorId && (
                        <button onClick={() => handleDeleteComment(comment.id)} className="delete-btn">
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </footer>
      </article>
    </div>
  );
}

export default ArticlePage;