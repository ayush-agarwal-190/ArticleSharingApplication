import React, { useEffect, useState, useMemo, useCallback } from "react";
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
import { calculateReadingTime, formatDate, generateExcerpt } from "../utils";
import "./ArticlesPage.css";

function ArticlesPage({ user }) {
  const [posts, setPosts] = useState([]);
  const [filterTag, setFilterTag] = useState("");
  const [userProfiles, setUserProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const postsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setPosts(postsData);

          const uniqueUserIds = [...new Set(postsData.map((post) => post.uid).filter(Boolean))];
          const profilesToFetch = uniqueUserIds.filter((uid) => !userProfiles[uid]);

          if (profilesToFetch.length > 0) {
            const profiles = {};
            const profilePromises = profilesToFetch.map(async (uid) => {
              try {
                const userDoc = await getDoc(doc(db, "users", uid));
                if (userDoc.exists()) {
                  profiles[uid] = userDoc.data();
                }
              } catch (error) {
                console.error(`Error fetching profile for ${uid}:`, error);
              }
            });
            await Promise.allSettled(profilePromises);
            setUserProfiles((prev) => ({ ...prev, ...profiles }));
          }
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error("Error fetching posts:", err);
          setError("Failed to load articles. Please try again.");
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error with posts subscription:", err);
        setError("Failed to connect to the database. Please check your connection.");
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [userProfiles]);

  const allTags = useMemo(() => {
    const tags = posts.flatMap((post) => post.tags || []);
    return [...new Set(tags)].sort();
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesTag = !filterTag || (post.tags && post.tags.includes(filterTag));
      const searchLower = debouncedSearchQuery.toLowerCase();
      const matchesSearch =
        !debouncedSearchQuery ||
        post.title.toLowerCase().includes(searchLower) ||
        post.content.toLowerCase().includes(searchLower) ||
        post.author.toLowerCase().includes(searchLower) ||
        (post.tags && post.tags.some((tag) => tag.toLowerCase().includes(searchLower)));
      return matchesTag && matchesSearch;
    });
  }, [posts, filterTag, debouncedSearchQuery]);

  const getUserProfile = useCallback((uid) => userProfiles[uid] || {}, [userProfiles]);

  if (loading) {
    return (
      <div className="articles-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading amazing articles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="articles-page">
        <div className="no-articles">
          <span className="emoji">⚠️</span>
          <h3>Oops! Something went wrong</h3>
          <p>{error}</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="articles-page">
      <header className="page-header">
        <h1>Knowledge Hub</h1>
        <p className="subtitle">
          Discover insights, tutorials, and stories from our vibrant community
        </p>
      </header>

      <div className="page-layout">
        <main className="main-content" aria-label="Latest articles">
          <div className="content-header">
            <h2>Latest Articles</h2>
            <div className="search-box">
              <input
                type="search"
                placeholder="Search articles, authors, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search articles"
              />
            </div>
          </div>

          <div className="articles-count">
            {filteredPosts.length} {filteredPosts.length === 1 ? "article" : "articles"} found
            {filterTag && (
              <span>
                {" "}
                in <strong>"{filterTag}"</strong>
              </span>
            )}
            {debouncedSearchQuery && (
              <span>
                {" "}
                matching <strong>"{debouncedSearchQuery}"</strong>
              </span>
            )}
          </div>

          <div className="articles-grid">
            {filteredPosts.length === 0 ? (
              <div className="no-articles">
                <span className="emoji">
                  {debouncedSearchQuery || filterTag ? "🔍" : "📝"}
                </span>
                <h3>
                  {debouncedSearchQuery || filterTag ? "No articles found" : "No articles yet"}
                </h3>
                <p>
                  {debouncedSearchQuery || filterTag
                    ? "Try adjusting your search terms or filters."
                    : "Be the first to share knowledge with the community!"}
                </p>
                {!debouncedSearchQuery && !filterTag && (
                  <Link to="/write" className="btn-primary">
                    Write First Article
                  </Link>
                )}
                {(debouncedSearchQuery || filterTag) && (
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterTag("");
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              filteredPosts.map((post) => {
                const userProfile = getUserProfile(post.uid);
                const upvoteCount = post.upvotes?.length || 0;
                
                const isAuthorAdmin = post.uid === user?.uid && user?.email === "ayushagarwaldesk@gmail.com";
                const authorDisplayName = isAuthorAdmin ? "Admin" : (post.author || "Anonymous");

                return (
                  <article key={post.id} className="article-card">
                    <Link
                      to={`/article/${post.id}`}
                      aria-label={`Read article: ${post.title}`}
                    >
                      <header className="card-header">
                        {post.tags && post.tags.length > 0 && (
                          <span className="tag">
                            {post.tags[0]}
                          </span>
                        )}
                        <div className="meta">
                          <span>⏱️ {calculateReadingTime(post.content)} min read</span>
                          <span>📅 {formatDate(post.createdAt)}</span>
                        </div>
                      </header>

                      <div className="card-body">
                        <h2 className="title">
                          {post.title}
                        </h2>
                        <p className="excerpt">
                          {generateExcerpt(post.content, 180)}
                        </p>
                      </div>

                      <footer className="card-footer">
                        <div className="author">
                          {userProfile.photoURL ? (
                            <img
                              src={userProfile.photoURL}
                              alt={`${post.author}'s profile`}
                              className="avatar"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="avatar">
                              {post.author ? post.author.charAt(0).toUpperCase() : "?"}
                            </div>
                          )}
                          <div className="author-info">
                            <p className="author-name">
                              {authorDisplayName}
                            </p>
                            {userProfile.department && (
                              <p className="author-dept">
                                {userProfile.department}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="vote-counts">
                          <span className="upvotes-count">
                            👍 {upvoteCount}
                          </span>
                          <span className="read-more">
                            Read more →
                          </span>
                        </div>
                      </footer>
                    </Link>
                  </article>
                );
              })
            )}
          </div>
        </main>

        <aside className="sidebar" aria-label="Article filters and stats">
          <section>
            <h3>Filter by Topic</h3>
            <div className="tags-filter">
              <button
                className={!filterTag ? "active" : ""}
                onClick={() => setFilterTag("")}
                aria-pressed={!filterTag}
              >
                All Topics ({posts.length})
              </button>
              {allTags.map((tag) => {
                const tagCount = posts.filter(
                  (post) => post.tags && post.tags.includes(tag)
                ).length;

                const isActive = filterTag === tag;

                return (
                  <button
                    key={tag}
                    className={isActive ? "active" : ""}
                    onClick={() => setFilterTag(tag)}
                    aria-pressed={isActive}
                  >
                    {tag} ({tagCount})
                  </button>
                );
              })}
            </div>
          </section>

          <section style={{ marginTop: "2rem" }}>
            <h3>Quick Stats</h3>
            <div className="stats-box">
              <div>
                📚 Total Articles: <span>{posts.length}</span>
              </div>
              <div>
                🏷️ Topics: <span>{allTags.length}</span>
              </div>
              <div>
                👥 Authors: <span>{Object.keys(userProfiles).length}</span>
              </div>
            </div>
          </section>

          {allTags.length > 0 && (
            <section style={{ marginTop: "2rem" }}>
              <h3>Popular Topics</h3>
              <div className="popular-tags">
                {allTags.slice(0, 6).map((tag) => {
                  const tagCount = posts.filter(
                    (post) => post.tags && post.tags.includes(tag)
                  ).length;
                  const isActive = filterTag === tag;

                  return (
                    <button
                      key={tag}
                      onClick={() => setFilterTag(tag)}
                      className={isActive ? "active" : ""}
                      aria-pressed={isActive}
                    >
                      {tag} ({tagCount})
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

export default ArticlesPage;