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
import "./ArticlesPage.css";

function ArticlesPage() {
  const [posts, setPosts] = useState([]);
  const [filterTag, setFilterTag] = useState("");
  const [userProfiles, setUserProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);

  // Debounced search to reduce excessive filtering calls
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

          // Efficiently fetch only needed user profiles
          const uniqueUserIds = [
            ...new Set(postsData.map((post) => post.uid).filter(Boolean)),
          ];
          const profilesToFetch = uniqueUserIds.filter(
            (uid) => !userProfiles[uid]
          );

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

  // Calculate reading time (words per minute)
  const calculateReadingTime = useCallback((content) => {
    if (!content) return 0;
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
  }, []);

  // Format date with friendly display
  const formatDate = useCallback((timestamp) => {
    if (!timestamp) return "Date not available";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) return "Yesterday";
      if (diffDays <= 7) return `${diffDays} days ago`;

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Date not available";
    }
  }, []);

  // Extract and sort tags
  const allTags = useMemo(() => {
    const tags = posts.flatMap((post) => post.tags || []);
    return [...new Set(tags)].sort();
  }, [posts]);

  // Filter posts by tag and search query
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

  // Safely get user profile by uid
  const getUserProfile = useCallback(
    (uid) => userProfiles[uid] || {},
    [userProfiles]
  );

  // Generate article excerpt without cutting words abruptly
  const generateExcerpt = useCallback((content, maxLength = 150) => {
    if (!content) return "No content available...";

    const cleanContent = content.replace(/<[^>]*>/g, "");

    if (cleanContent.length <= maxLength) return cleanContent;

    const truncated = cleanContent.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");

    return lastSpace > maxLength * 0.8
      ? truncated.substring(0, lastSpace) + "..."
      : truncated + "...";
  }, []);

  if (loading) {
    return (
      <div className="articles-page" style={{ textAlign: "center", padding: "60px 20px" }}>
        <div className="spinner" style={{ marginBottom: "20px" }}></div>
        <p style={{ fontSize: "1.2rem", color: "#555" }}>Loading amazing articles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="articles-page"
        style={{
          textAlign: "center",
          padding: "60px 20px",
          color: "#b00020",
          fontSize: "1.2rem",
          maxWidth: "600px",
          margin: "auto",
        }}
      >
        <span style={{ fontSize: "3rem", display: "block", marginBottom: "16px" }}>⚠️</span>
        <h3>Oops! Something went wrong</h3>
        <p>{error}</p>
        <button
          className="btn-primary"
          onClick={() => window.location.reload()}
          style={{
            marginTop: "20px",
            backgroundColor: "#1976d2",
            color: "white",
            border: "none",
            padding: "12px 28px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "1rem",
            transition: "background-color 0.3s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#155fa0")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1976d2")}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div
      className="articles-page"
      style={{
        maxWidth: "1100px",
        margin: "auto",
        padding: "25px 20px 50px",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        color: "#2c3e50",
      }}
    >
      <header
        className="page-header"
        style={{ marginBottom: "30px", textAlign: "center" }}
      >
        <h1 style={{ fontSize: "3rem", fontWeight: "700", color: "#1976d2", marginBottom: "6px" }}>
          Knowledge Hub
        </h1>
        <p style={{ fontSize: "1.25rem", color: "#555" }}>
          Discover insights, tutorials, and stories from our vibrant community
        </p>
      </header>

      <div
        className="page-layout"
        style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}
      >
        <main
          className="main-content"
          style={{ flex: "1 1 700px", minWidth: "320px" }}
          aria-label="Latest articles"
        >
          <div
            className="content-header"
            style={{
              marginBottom: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <h2 style={{ fontWeight: "700", fontSize: "2rem", margin: 0 }}>
              Latest Articles
            </h2>
            <div className="search-box" style={{ flexGrow: 1, maxWidth: "320px" }}>
              <input
                type="search"
                placeholder="Search articles, authors, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search articles"
                style={{
                  width: "100%",
                  padding: "10px 15px",
                  fontSize: "1rem",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  outlineColor: "#1976d2",
                  transition: "border-color 0.3s",
                }}
              />
            </div>
          </div>

          <div
            className="articles-count"
            style={{ fontWeight: "600", fontSize: "1rem", marginBottom: "12px" }}
          >
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

          <div
            className="articles-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
              gap: "20px",
            }}
          >
            {filteredPosts.length === 0 ? (
              <div
                className="no-articles"
                style={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  padding: "40px 20px",
                  color: "#777",
                }}
              >
                <span style={{ fontSize: "2.5rem" }}>
                  {debouncedSearchQuery || filterTag ? "🔍" : "📝"}
                </span>
                <h3 style={{ marginTop: "12px", marginBottom: "8px" }}>
                  {debouncedSearchQuery || filterTag ? "No articles found" : "No articles yet"}
                </h3>
                <p style={{ marginBottom: "16px", fontSize: "1.1rem" }}>
                  {debouncedSearchQuery || filterTag
                    ? "Try adjusting your search terms or filters."
                    : "Be the first to share knowledge with the community!"}
                </p>
                {!debouncedSearchQuery && !filterTag && (
                  <Link
                    to="/write"
                    className="btn-primary"
                    style={{
                      padding: "12px 28px",
                      backgroundColor: "#1976d2",
                      color: "white",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      fontWeight: "600",
                      textDecoration: "none",
                      display: "inline-block",
                      transition: "background-color 0.3s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#155fa0")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1976d2")}
                  >
                    Write First Article
                  </Link>
                )}
                {(debouncedSearchQuery || filterTag) && (
                  <button
                    className="btn-primary"
                    style={{
                      padding: "10px 26px",
                      backgroundColor: "#1976d2",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "background-color 0.3s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#155fa0")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1976d2")}
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
                return (
                  <article
                    key={post.id}
                    className="article-card"
                    style={{
                      backgroundColor: "white",
                      borderRadius: "12px",
                      boxShadow: "0 3px 6px rgba(0,0,0,0.1)",
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                      cursor: "pointer",
                      transition: "transform 0.2s",
                    }}
                  >
                    <Link
                      to={`/article/${post.id}`}
                      aria-label={`Read article: ${post.title}`}
                      style={{
                        color: "inherit",
                        textDecoration: "none",
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                        padding: "18px 20px",
                      }}
                    >
                      <header
                        className="card-header"
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "14px",
                          gap: "10px",
                          flexWrap: "wrap",
                        }}
                      >
                        {post.tags && post.tags.length > 0 && (
                          <span
                            className="tag"
                            style={{
                              backgroundColor: "#667eea",
                              color: "white",
                              padding: "5px 12px",
                              borderRadius: "16px",
                              fontSize: "0.9rem",
                              fontWeight: "700",
                              userSelect: "none",
                              flexShrink: 0,
                            }}
                          >
                            {post.tags[0]}
                          </span>
                        )}
                        <div
                          className="meta"
                          style={{
                            fontSize: "0.85rem",
                            color: "#555",
                            display: "flex",
                            gap: "16px",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          <span>⏱️ {calculateReadingTime(post.content)} min read</span>
                          <span>📅 {formatDate(post.createdAt)}</span>
                        </div>
                      </header>

                      <div className="card-body" style={{ flexGrow: 1 }}>
                        <h2
                          className="title"
                          style={{
                            fontSize: "1.25rem",
                            color: "#1a237e",
                            fontWeight: "700",
                            marginBottom: "10px",
                            lineHeight: 1.3,
                          }}
                        >
                          {post.title}
                        </h2>
                        <p
                          className="excerpt"
                          style={{
                            fontSize: "1rem",
                            color: "#434343",
                            lineHeight: 1.5,
                            marginBottom: "18px",
                            whiteSpace: "pre-wrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxHeight: "6em",
                          }}
                        >
                          {generateExcerpt(post.content, 180)}
                        </p>
                      </div>

                      <footer
                        className="card-footer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          justifyContent: "space-between",
                          marginTop: "auto",
                        }}
                      >
                        <div className="author" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {userProfile.photoURL ? (
                            <img
                              src={userProfile.photoURL}
                              alt={`${post.author}'s profile`}
                              className="avatar"
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "50%",
                                objectFit: "cover",
                              }}
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          ) : (
                            <div
                              className="avatar"
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "50%",
                                background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                fontWeight: "700",
                                fontSize: "1.2rem",
                              }}
                            >
                              {post.author ? post.author.charAt(0).toUpperCase() : "?"}
                            </div>
                          )}
                          <div className="author-info" style={{ fontSize: "0.9rem", color: "#555" }}>
                            <p className="author-name" style={{ margin: 0, fontWeight: "600" }}>
                              {post.author || "Anonymous"}
                            </p>
                            {userProfile.department && (
                              <p className="author-dept" style={{ margin: 0, fontWeight: "400", fontStyle: "italic" }}>
                                {userProfile.department}
                              </p>
                            )}
                          </div>
                        </div>
                        <span
                          className="read-more"
                          style={{
                            color: "#1976d2",
                            fontWeight: "700",
                            fontSize: "0.875rem",
                            userSelect: "none",
                            flexShrink: 0,
                          }}
                        >
                          Read more →
                        </span>
                      </footer>
                    </Link>
                  </article>
                );
              })
            )}
          </div>
        </main>

        <aside
          className="sidebar"
          style={{
            flex: "0 0 280px",
            backgroundColor: "#f7f9fc",
            borderRadius: "12px",
            padding: "24px 20px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
            height: "fit-content",
            fontSize: "0.95rem",
            color: "#34495e",
          }}
          aria-label="Article filters and stats"
        >
          <section>
            <h3
              style={{
                fontWeight: "700",
                fontSize: "1.25rem",
                marginBottom: "16px",
                borderBottom: "2px solid #1976d2",
                paddingBottom: "6px",
                color: "#1976d2",
              }}
            >
              Filter by Topic
            </h3>
            <div
              className="tags-filter"
              style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}
            >
              <button
                className={!filterTag ? "active" : ""}
                onClick={() => setFilterTag("")}
                aria-pressed={!filterTag}
                style={{
                  padding: "6px 15px",
                  borderRadius: "20px",
                  border: !filterTag ? "2px solid #1976d2" : "1px solid #ccc",
                  backgroundColor: !filterTag ? "#e3f2fd" : "white",
                  color: !filterTag ? "#1976d2" : "#444",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "0.85rem",
                  transition: "all 0.3s",
                }}
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
                    style={{
                      padding: "6px 15px",
                      borderRadius: "20px",
                      border: isActive ? "2px solid #1976d2" : "1px solid #ccc",
                      backgroundColor: isActive ? "#667eea" : "white",
                      color: isActive ? "white" : "#444",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "0.85rem",
                      transition: "all 0.3s",
                      whiteSpace: "nowrap",
                    }}
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
            <h3
              style={{
                fontWeight: "700",
                fontSize: "1.25rem",
                marginBottom: "16px",
                borderBottom: "2px solid #44a085",
                paddingBottom: "6px",
                color: "#44a085",
              }}
            >
              Quick Stats
            </h3>
            <div
              style={{
                padding: "1rem",
                background: "rgba(68, 160, 133, 0.1)",
                borderRadius: "12px",
                border: "1px solid rgba(68, 160, 133, 0.3)",
                color: "#2c3e50",
                fontWeight: "600",
                fontSize: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.8rem",
              }}
            >
              <div>
                📚 Total Articles: <span style={{ fontWeight: "700" }}>{posts.length}</span>
              </div>
              <div>
                🏷️ Topics: <span style={{ fontWeight: "700" }}>{allTags.length}</span>
              </div>
              <div>
                👥 Authors: <span style={{ fontWeight: "700" }}>{Object.keys(userProfiles).length}</span>
              </div>
            </div>
          </section>

          {allTags.length > 0 && (
            <section style={{ marginTop: "2rem" }}>
              <h3
                style={{
                  fontWeight: "700",
                  fontSize: "1.25rem",
                  marginBottom: "16px",
                  borderBottom: "2px solid #764ba2",
                  paddingBottom: "6px",
                  color: "#764ba2",
                }}
              >
                Popular Topics
              </h3>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                {allTags.slice(0, 6).map((tag) => {
                  const tagCount = posts.filter(
                    (post) => post.tags && post.tags.includes(tag)
                  ).length;
                  const isActive = filterTag === tag;

                  return (
                    <button
                      key={tag}
                      onClick={() => setFilterTag(tag)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "20px",
                        border: isActive ? "none" : "1px solid #ddd",
                        background: isActive
                          ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                          : "rgba(248, 250, 252, 0.85)",
                        color: isActive ? "white" : "#64748b",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        whiteSpace: "nowrap",
                        boxShadow: isActive ? "0 0 12px rgba(118, 75, 162, 0.6)" : "none",
                        transition: "all 0.3s ease",
                      }}
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
