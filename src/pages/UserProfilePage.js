// src/pages/UserProfilePage.js
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
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="error-container">
        <h2>Profile Not Found</h2>
        <p>The user profile you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-cover">
          <div className="profile-info">
            {profile.photoURL && (
              <img src={profile.photoURL} alt={profile.displayName} className="profile-avatar-large" />
            )}
            <div className="profile-details">
              <h1>{profile.displayName}</h1>
              <div className="profile-meta">
                {profile.department && <span>{profile.department}</span>}
                {profile.year && <span> • {profile.year}</span>}
              </div>
              {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-sidebar">
          <div className="profile-stats">
            <h3>Stats</h3>
            <div className="stat">
              <span className="stat-number">{userPosts.length}</span>
              <span className="stat-label">Articles</span>
            </div>
          </div>

          {(profile.skills?.length > 0 || profile.interests?.length > 0) && (
            <div className="profile-tags">
              {profile.skills?.length > 0 && (
                <div className="tag-section">
                  <h3>Skills</h3>
                  <div className="tags">
                    {profile.skills.map((skill, index) => (
                      <span key={index} className="tag">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {profile.interests?.length > 0 && (
                <div className="tag-section">
                  <h3>Interests</h3>
                  <div className="tags">
                    {profile.interests.map((interest, index) => (
                      <span key={index} className="tag">{interest}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="profile-main">
          <h2>Articles by {profile.displayName}</h2>
          
          {userPosts.length === 0 ? (
            <div className="no-posts">
              <p>This user hasn't published any articles yet.</p>
            </div>
          ) : (
            <div className="user-articles">
              {userPosts.map((post) => (
                <article key={post.id} className="user-article-card">
                  <h3>{post.title}</h3>
                  <div className="article-excerpt">
                    {post.content.length > 200 
                      ? `${post.content.substring(0, 200)}...` 
                      : post.content
                    }
                  </div>
                  <div className="article-meta">
                    <span className="article-date">
                      {post.createdAt?.toDate().toLocaleDateString()}
                    </span>
                    <div className="article-tags">
                      {post.tags && post.tags.map(tag => (
                        <span key={tag} className="tag small">{tag}</span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserProfilePage;