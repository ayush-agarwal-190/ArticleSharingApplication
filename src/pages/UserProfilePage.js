import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, collection, query, where, orderBy, onSnapshot } from "firebase/firestore";

function UserProfilePage() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile({ id: docSnap.id, ...docSnap.data() });
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    const fetchUserPosts = () => {
      const q = query(
        collection(db, "posts"),
        where("uid", "==", userId),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        setUserPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      });

      return unsubscribe;
    };

    if (userId) {
      fetchProfile();
      const unsubscribe = fetchUserPosts();
      return unsubscribe;
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="loading-container" style={{ textAlign: "center", padding: "40px" }}>
        <div className="spinner" style={{ marginBottom: "12px" }}></div>
        <p style={{ fontSize: "1.2rem", color: "#555" }}>Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="error-container" style={{ textAlign: "center", padding: "40px" }}>
        <h2 style={{ fontSize: "2rem", color: "#b00020" }}>Profile Not Found</h2>
        <p style={{ fontSize: "1.1rem", color: "#555" }}>The user profile you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div
      className="profile-page"
      style={{
        maxWidth: "1000px",
        margin: "auto",
        padding: "20px",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        color: "#333",
      }}
    >
      <header
        className="profile-header"
        style={{
          backgroundColor: "#1976d2",
          color: "white",
          borderRadius: "12px",
          padding: "40px 30px",
          marginBottom: "40px",
          boxShadow: "0 8px 16px rgba(25, 118, 210, 0.3)",
        }}
      >
        <div
          className="profile-info"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "30px",
            flexWrap: "wrap",
          }}
        >
          {profile.photoURL ? (
            <img
              src={profile.photoURL}
              alt={profile.displayName}
              className="profile-avatar-large"
              style={{
                width: "110px",
                height: "110px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "4px solid white",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              }}
            />
          ) : (
            <div
              style={{
                width: "110px",
                height: "110px",
                borderRadius: "50%",
                backgroundColor: "#1565c0",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "3rem",
                fontWeight: "700",
                color: "white",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              }}
            >
              {profile.displayName ? profile.displayName.charAt(0).toUpperCase() : "U"}
            </div>
          )}
          <div className="profile-details" style={{ flex: "1" }}>
            <h1 style={{ fontSize: "2.4rem", margin: "0 0 8px", fontWeight: "700" }}>
              {profile.displayName}
            </h1>
            <div
              className="profile-meta"
              style={{ fontSize: "1.1rem", color: "#bbdefb", marginBottom: "12px" }}
            >
              {profile.department && <span>{profile.department}</span>}
              {profile.year && <span> • {profile.year}</span>}
            </div>
            {profile.bio && (
              <p style={{ fontSize: "1.1rem", lineHeight: 1.5, maxWidth: "650px" }}>
                {profile.bio}
              </p>
            )}
          </div>
        </div>
      </header>

      <div
        className="profile-content"
        style={{ display: "flex", gap: "30px", flexWrap: "wrap" }}
      >
        <aside
          className="profile-sidebar"
          style={{
            flex: "1 1 280px",
            backgroundColor: "#f9f9f9",
            padding: "25px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            height: "fit-content",
          }}
        >
          <section className="profile-stats" style={{ marginBottom: "30px" }}>
            <h3
              style={{
                marginBottom: "20px",
                borderBottom: "2px solid #1976d2",
                paddingBottom: "6px",
                color: "#1976d2",
              }}
            >
              Stats
            </h3>
            <div
              className="stat"
              style={{
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "18px 25px",
                boxShadow: "0 1px 3px rgba(25, 118, 210, 0.15)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                fontWeight: "700",
                fontSize: "1.6rem",
                color: "#1976d2",
              }}
            >
              <span className="stat-number">{userPosts.length}</span>
              <span className="stat-label" style={{ fontSize: "1.2rem", marginTop: "6px", color: "#555" }}>
                Articles
              </span>
            </div>
          </section>

          {(profile.skills?.length > 0 || profile.interests?.length > 0) && (
            <section className="profile-tags">
              {profile.skills?.length > 0 && (
                <div className="tag-section" style={{ marginBottom: "25px" }}>
                  <h3
                    style={{
                      marginBottom: "12px",
                      borderBottom: "2px solid #6a1b9a",
                      paddingBottom: "6px",
                      color: "#6a1b9a",
                    }}
                  >
                    Skills
                  </h3>
                  <div
                    className="tags"
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    {profile.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="tag"
                        style={{
                          backgroundColor: "#e1bee7",
                          color: "#6a1b9a",
                          padding: "6px 14px",
                          borderRadius: "20px",
                          fontSize: "0.95rem",
                          fontWeight: "600",
                          boxShadow: "0 1px 2px rgba(106, 27, 154, 0.35)",
                          userSelect: "none",
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.interests?.length > 0 && (
                <div className="tag-section">
                  <h3
                    style={{
                      marginBottom: "12px",
                      borderBottom: "2px solid #1976d2",
                      paddingBottom: "6px",
                      color: "#1976d2",
                    }}
                  >
                    Interests
                  </h3>
                  <div
                    className="tags"
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    {profile.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="tag"
                        style={{
                          backgroundColor: "#bbdefb",
                          color: "#1976d2",
                          padding: "6px 14px",
                          borderRadius: "20px",
                          fontSize: "0.95rem",
                          fontWeight: "600",
                          boxShadow: "0 1px 2px rgba(25, 118, 210, 0.35)",
                          userSelect: "none",
                        }}
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </aside>

        <main
          className="profile-main"
          style={{ flex: "2 1 600px" }}
          aria-label="User articles"
        >
          <h2
            style={{
              marginBottom: "30px",
              fontSize: "2rem",
              borderBottom: "2px solid #1976d2",
              paddingBottom: "6px",
              color: "#1976d2",
            }}
          >
            Articles by {profile.displayName}
          </h2>

          {userPosts.length === 0 ? (
            <div
              className="no-posts"
              style={{
                textAlign: "center",
                padding: "40px",
                fontSize: "1.2rem",
                color: "#666",
                backgroundColor: "#f5f5f5",
                borderRadius: "12px",
              }}
            >
              <p>This user hasn't published any articles yet.</p>
            </div>
          ) : (
            <div
              className="user-articles"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "20px",
              }}
            >
              {userPosts.map((post) => (
                <article
                  key={post.id}
                  className="user-article-card"
                  style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    padding: "20px",
                    boxShadow: "0 3px 8px rgba(0,0,0,0.1)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "transform 0.2s",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    // Redirect to article page (adjust path accordingly)
                    window.location.href = `/articles/${post.id}`;
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  tabIndex={0}
                  aria-label={`Read article titled ${post.title}`}
                >
                  <h3
                    style={{
                      marginBottom: "12px",
                      fontSize: "1.3rem",
                      color: "#1976d2",
                      fontWeight: "700",
                      flexGrow: 0,
                    }}
                  >
                    {post.title}
                  </h3>
                  <p
                    className="article-excerpt"
                    style={{
                      flexGrow: 1,
                      color: "#555",
                      fontSize: "1rem",
                      lineHeight: 1.5,
                      marginBottom: "16px",
                      whiteSpace: "pre-wrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxHeight: "5.4em", // about 3 lines
                    }}
                  >
                    {post.content.length > 200 ? `${post.content.substring(0, 200)}...` : post.content}
                  </p>
                  <div
                    className="article-meta"
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}
                  >
                    <span
                      className="article-date"
                      style={{ fontSize: "0.85rem", color: "#999", flexShrink: 0 }}
                    >
                      {post.createdAt?.toDate().toLocaleDateString()}
                    </span>
                    <div className="article-tags" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {post.tags && post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="tag small"
                          style={{
                            backgroundColor: "#e0e0e0",
                            color: "#555",
                            padding: "4px 10px",
                            fontSize: "0.75rem",
                            borderRadius: "12px",
                            userSelect: "none",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default UserProfilePage;
