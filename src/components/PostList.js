import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from "firebase/firestore";

function PostList({ user, onError }) {
  const [posts, setPosts] = useState([]);
  const [filterTag, setFilterTag] = useState("");
  const [userProfiles, setUserProfiles] = useState({});

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  // Extract all unique tags for filtering
  const allTags = [...new Set(posts.flatMap(post => post.tags || []))];
  
  // Filter posts if a tag is selected
  const filteredPosts = filterTag 
    ? posts.filter(post => post.tags && post.tags.includes(filterTag))
    : posts;

  // Check if current user is the post owner
  const isPostOwner = (post) => {
    return user && post.uid === user.uid;
  };

  // Function to delete a post
  const deletePost = async (postId) => {
    try {
      await deleteDoc(doc(db, "posts", postId));
      if (onError) onError("Post deleted successfully");
    } catch (error) {
      console.error("Error deleting post:", error);
      if (error.code === 'permission-denied') {
        if (onError) onError("You can only delete your own posts");
      } else {
        if (onError) onError("Error deleting post");
      }
    }
  };

  return (
    <div className="post-list">
      <div className="filter-section">
        <h3>Filter by Tag:</h3>
        <div className="tag-filters">
          <button 
            className={!filterTag ? "active" : ""} 
            onClick={() => setFilterTag("")}
          >
            All Posts
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              className={filterTag === tag ? "active" : ""}
              onClick={() => setFilterTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {filteredPosts.map((post) => (
        <div key={post.id} className="post-card">
          <h3>{post.title}</h3>
          <p>{post.content}</p>
          <div className="post-tags">
            {post.tags && post.tags.map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
          <div className="post-author">
            <small>
              By {post.author}
              {post.department && ` • ${post.department}`}
              {post.year && ` • ${post.year}`}
            </small>
          </div>
          
          {/* Add owner actions */}
          {isPostOwner(post) && (
            <div className="post-actions">
              <button onClick={() => deletePost(post.id)}>Delete</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default PostList;