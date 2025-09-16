// src/components/PostForm.js
import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import TagSelector from "./TagSelector";

function PostForm({ user }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);

// In your handlePost function in PostForm.js
const handlePost = async (e) => {
  e.preventDefault();
  if (!title.trim() || !content.trim()) return;

  try {
// When adding a comment
await addDoc(collection(db, "posts", postId, "comments"), {
  content: commentText,
  author: user.displayName,
  uid: user.uid, // Include UID for security rules
  createdAt: serverTimestamp(),
});
    setTitle("");
    setContent("");
    setTags([]);
  } catch (error) {
    console.error("Error posting article:", error);
  }
};
  return (
    <form onSubmit={handlePost} className="post-form">
      <input
        type="text"
        placeholder="Article title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        placeholder="Write your article content here... You can use markdown for formatting."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />
      <TagSelector selectedTags={tags} onTagChange={setTags} />
      <button type="submit">Publish Article</button>
    </form>
  );
}

export default PostForm;