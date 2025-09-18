import React, { useState } from "react";
import { db } from "../firebase";
import { 
  collection, 
  addDoc, 
  serverTimestamp
} from "firebase/firestore";
import TagSelector from "./TagSelector";
import "./EnhancedPostForm.css";
import "./Modal.css";

const MINIMUM_WORD_COUNT = 150;

function EnhancedPostForm({ user, onPostSuccess }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const handlePost = async (e) => {
    e.preventDefault();
    if (!user) {
      setMessage("You must be logged in to post an article.");
      return;
    }
    if (!title.trim() || !content.trim()) {
      setMessage("Please add both a title and content to your article.");
      return;
    }

    // New client-side validation for word count
    const wordCount = content.trim().split(/\s+/).length;
    if (wordCount < MINIMUM_WORD_COUNT) {
      setModalMessage(`Your article must contain at least ${MINIMUM_WORD_COUNT} words. Please add more content.`);
      setShowModal(true);
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      await addDoc(collection(db, "posts"), {
        title,
        content,
        tags,
        author: user.displayName,
        uid: user.uid,
        createdAt: serverTimestamp(),
        upvotes: [],
        downvotes: []
      });
      setTitle("");
      setContent("");
      setTags([]);
      setMessage("Article published successfully!");
      if (onPostSuccess) onPostSuccess();
      
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error posting article:", error);
      setMessage("Error publishing article. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newContent = content.substring(0, start) + '\t' + content.substring(end);
      setContent(newContent);
      e.target.selectionStart = e.target.selectionEnd = start + 1;
    }
  };

  const formatText = (format) => {
    const textarea = document.getElementById('content-textarea');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let formattedText = '';
    
    switch(format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `_${selectedText}_`;
        break;
      case 'code':
        formattedText = `\`${selectedText}\``;
        break;
      case 'link':
        formattedText = `[${selectedText}](url)`;
        break;
      case 'quote':
        formattedText = `> ${selectedText}`;
        break;
      default:
        formattedText = selectedText;
    }
    
    setContent(content.substring(0, start) + formattedText + content.substring(end));
    
    setTimeout(() => {
      textarea.selectionStart = start + formattedText.length;
      textarea.selectionEnd = start + formattedText.length;
      textarea.focus();
    }, 0);
  };

  const insertPlaceholder = (placeholder) => {
    setContent(content + placeholder);
    
    setTimeout(() => {
      const textarea = document.getElementById('content-textarea');
      textarea.focus();
      textarea.selectionStart = content.length + placeholder.length;
      textarea.selectionEnd = content.length + placeholder.length;
    }, 0);
  };

  return (
    <div className="enhanced-post-form">
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Article Too Short</h2>
              <button className="close-button" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <p>{modalMessage}</p>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setShowModal(false)}>Got it!</button>
            </div>
          </div>
        </div>
      )}
      <h2>Write a New Article</h2>
      
      {message && (
        <div className={`message ${message.includes("Error") ? "error" : "success"}`}>
          {message}
        </div>
      )}
      
      <form onSubmit={handlePost}>
        <div className="form-group">
          <label htmlFor="title">Article Title</label>
          <input
            id="title"
            type="text"
            placeholder="Enter a compelling title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <div className="editor-header">
            <label htmlFor="content">Article Content</label>
            <div className="formatting-tools">
              <span>Format: </span>
              <button type="button" onClick={() => formatText('bold')} title="Bold">
                <strong>B</strong>
              </button>
              <button type="button" onClick={() => formatText('italic')} title="Italic">
                <em>I</em>
              </button>
              <button type="button" onClick={() => formatText('code')} title="Code">
                <code>&lt;/&gt;</code>
              </button>
              <button type="button" onClick={() => formatText('link')} title="Link">
                🔗
              </button>
              <button type="button" onClick={() => formatText('quote')} title="Quote">
                ❝
              </button>
            </div>
          </div>
          
          <textarea
            id="content-textarea"
            placeholder="Write your article here... You can use Markdown for formatting."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            required
          />
          
          <div className="content-tips">
            <p>Pro Tip: Use Markdown for formatting (## for headers, **bold**, _italic_, etc.)</p>
          </div>
        </div>

        <div className="form-group">
          <TagSelector selectedTags={tags} onTagChange={setTags} />
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={isSubmitting ? "submitting" : ""}
          >
            {isSubmitting ? "Publishing..." : "Publish Article"}
          </button>
          <button 
            type="button" 
            onClick={() => {
              setTitle("");
              setContent("");
              setTags([]);
            }}
            className="secondary"
          >
            Clear Form
          </button>
        </div>
      </form>
    </div>
  );
}

export default EnhancedPostForm;