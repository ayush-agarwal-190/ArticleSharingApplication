import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";

function ArticlesPage() {
  const [posts, setPosts] = useState([]);
  const [filterTag, setFilterTag] = useState("");
  const [userProfiles, setUserProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const postsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(postsData);

      // Get unique user IDs from posts
      const uniqueUserIds = [
        ...new Set(postsData.map((post) => post.uid).filter(Boolean)),
      ];

      // Fetch missing user profiles only
      const profilesToFetch = uniqueUserIds.filter((uid) => !userProfiles[uid]);

      if (profilesToFetch.length > 0) {
        const profiles = {};

        await Promise.all(
          profilesToFetch.map(async (uid) => {
            try {
              const userDoc = await getDoc(doc(db, "users", uid));
              if (userDoc.exists()) {
                profiles[uid] = userDoc.data();
              }
            } catch (error) {
              console.error("Error fetching user profile:", error);
            }
          })
        );

        setUserProfiles((prev) => ({ ...prev, ...profiles }));
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [userProfiles]);

  const calculateReadingTime = (content) => {
    if (!content) return 0;
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = timestamp.toDate();
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Date not available";
    }
  };

  // Extract unique tags from posts
  const allTags = [...new Set(posts.flatMap((post) => post.tags || []))].sort();

  // Filter posts by tag and search query
  const filteredPosts = posts.filter((post) => {
    const matchesTag = !filterTag || (post.tags && post.tags.includes(filterTag));
    const matchesSearch =
      !searchQuery ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesSearch;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading articles...</p>
      </div>
    );
  }

  return (
    <div className="articles-page">
      <div className="page-header">
        <h1>Community Hub</h1>
        <p>Insights & tutorials from fellow students</p>
      </div>

      <div className="page-layout">
        <div className="main-content">
          <div className="content-header">
            <h2>Latest Articles</h2>
            <div className="mobile-controls">
              <div className="mobile-search">
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                  aria-label="Search articles"
                />
                <span className="search-icon" aria-hidden="true">
                  🔍
                </span>
              </div>
            </div>
          </div>

          <div className="articles-stats">
            <p>
              {filteredPosts.length}{" "}
              {filteredPosts.length === 1 ? "article" : "articles"} found
            </p>
          </div>

          <div className="articles-grid">
            {filteredPosts.length === 0 ? (
              <div className="no-articles">
                <div className="no-articles-icon" aria-hidden="true">
                  📝
                </div>
                <h3>No articles found</h3>
                <p>
                  Try adjusting your search or filters, or be the first to share
                  knowledge!
                </p>
                <Link to="/write" className="cta-button">
                  Write an Article
                </Link>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <article key={post.id} className="article-card">
                  <Link to={`/article/${post.id}`} className="article-card-link">
                    <div className="article-card-header">
                      {post.tags && post.tags.length > 0 && (
                        <div className="article-tags">
                          <span className="article-tag">{post.tags[0]}</span>
                        </div>
                      )}
                      <div className="article-meta">
                        <span className="reading-time">
                          {calculateReadingTime(post.content)} min read
                        </span>
                        <span className="publish-date">{formatDate(post.createdAt)}</span>
                      </div>
                    </div>

                    <div className="article-card-content">
                      <h2 className="article-title">{post.title}</h2>
                      <div className="article-excerpt">
                        {post.content.length > 120
                          ? `${post.content.substring(0, 120)}...`
                          : post.content}
                      </div>
                    </div>

                    <div className="article-card-footer">
                      <div className="author-info">
                        {userProfiles[post.uid]?.photoURL && (
                          <img
                            src={userProfiles[post.uid].photoURL}
                            alt={post.author}
                            className="author-avatar"
                          />
                        )}
                        <div className="author-details">
                          <span className="author-name">{post.author}</span>
                          {userProfiles[post.uid]?.department && (
                            <span className="author-department">
                              {userProfiles[post.uid].department}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="article-actions">
                        <span className="read-more">Read more →</span>
                      </div>
                    </div>
                  </Link>
                </article>
              ))
            )}
          </div>
        </div>

        <aside className="sidebar" aria-label="Sidebar">
          <section className="sidebar-section" aria-labelledby="search-articles">
            <h3 id="search-articles">Search Articles</h3>
            <div className="search-container">
              <input
                type="text"
                placeholder="Search by title or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                aria-label="Search articles by title or content"
              />
              <span className="search-icon" aria-hidden="true">
                🔍
              </span>
            </div>
          </section>

          <section className="sidebar-section" aria-labelledby="filter-topics">
            <h3 id="filter-topics">Filter by Topic</h3>
            <div className="tag-filters">
              <button
                className={!filterTag ? "active" : ""}
                onClick={() => setFilterTag("")}
              >
                All Topics
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  className={filterTag === tag ? "active" : ""}
                  onClick={() => setFilterTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </section>

          <section className="sidebar-section" aria-labelledby="popular-tags">
            <h3 id="popular-tags">Popular Tags</h3>
            <div className="popular-tags">
              {allTags.slice(0, 10).map((tag) => (
                <span
                  key={tag}
                  className="tag-pill"
                  onClick={() => setFilterTag(tag)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setFilterTag(tag);
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>

          <section className="sidebar-section">
            <div className="write-article-cta">
              <h3>Share Your Knowledge</h3>
              <p>Contribute to the community by writing an article</p>
              <Link to="/write" className="cta-button">
                Write an Article
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default ArticlesPage;
