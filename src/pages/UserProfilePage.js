import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, deleteDoc } from "firebase/firestore";
import { generateExcerpt } from "../utils";
import "./UserProfilePage.css";

function UserProfilePage({ user }) {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

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
        setUserPosts(snapshot.docs.map((postDoc) => ({ id: postDoc.id, ...postDoc.data() })));
        setLoading(false);
      });
      return unsubscribe;
    };

    fetchProfile();
    const unsubscribe = fetchUserPosts();
    return unsubscribe;
  }, [userId]);

  const handleDelete = async (postId) => {
    if (window.confirm("Are you sure you want to delete this article?")) {
      try {
        await deleteDoc(doc(db, "posts", postId));
        window.alert("Article deleted successfully!");
      } catch (error) {
        console.error("Error deleting article:", error);
        window.alert("Error deleting article. Please try again.");
      }
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="error-container">
          <h2>Profile Not Found</h2>
          <p>The user profile you're looking for doesn't exist.</p>
          <Link to="/articles" className="btn-primary">
            Back to Articles
          </Link>
        </div>
      </div>
    );
  }
  
  const isCurrentUserProfile = user && user.uid === userId;
  const isAdmin = user && user.email === "ayushagarwaldesk@gmail.com";
  const profileDisplayName = isAdmin ? "Admin" : (profile.displayName || "Anonymous");
  
  return (
    <div className="profile-page">
      <header className="profile-header">
        <div className="profile-info">
          {profile.photoURL ? (
            <img
              src={profile.photoURL}
              alt={profile.displayName}
              className="profile-avatar-large"
            />
          ) : (
            <div className="profile-avatar-large">
              {profile.displayName ? profile.displayName.charAt(0).toUpperCase() : "U"}
            </div>
          )}
          <div className="profile-details">
            <h1>{profileDisplayName}</h1>
            <div className="profile-meta">
              {profile.department && <span>{profile.department}</span>}
              {profile.year && <span> • {profile.year}</span>}
            </div>
            {profile.bio && (
              <p className="profile-bio">{profile.bio}</p>
            )}
          </div>
        </div>
      </header>

      <div className="profile-content">
        <aside className="profile-sidebar">
          <section className="profile-stats">
            <h3>Stats</h3>
            <div className="stat">
              <span className="stat-number">{userPosts.length}</span>
              <span className="stat-label">Articles</span>
            </div>
          </section>
          {profile.skills && profile.skills.length > 0 && (
            <section className="profile-skills">
              <h3>Skills</h3>
              <div className="tags-list">
                {profile.skills.map((skill) => (
                  <span key={skill} className="tag small">{skill}</span>
                ))}
              </div>
            </section>
          )}
          {profile.interests && profile.interests.length > 0 && (
            <section className="profile-interests">
              <h3>Interests</h3>
              <div className="tags-list">
                {profile.interests.map((interest) => (
                  <span key={interest} className="tag small">{interest}</span>
                ))}
              </div>
            </section>
          )}
        </aside>

        <main className="profile-main">
          <h2>Articles by {profileDisplayName}</h2>

          {userPosts.length === 0 ? (
            <div className="no-posts">
              <p>This user hasn't published any articles yet.</p>
            </div>
          ) : (
            <div className="user-articles">
              {userPosts.map((post) => (
                <article key={post.id} className="user-article-card">
                  <Link to={`/article/${post.id}`}>
                    <h3>{post.title}</h3>
                    <p className="article-excerpt">
                      {generateExcerpt(post.content, 120)}
                    </p>
                    <div className="article-meta">
                      <span className="article-date">
                        {post.createdAt?.toDate().toLocaleDateString()}
                      </span>
                      {post.tags && post.tags.length > 0 && (
                        <div className="article-tags">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="tag small">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                  {(isCurrentUserProfile || isAdmin) && (
                    <button className="delete-btn" onClick={() => handleDelete(post.id)}>
                      Delete
                    </button>
                  )}
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