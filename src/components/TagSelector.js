// src/components/TagSelector.js
import React from 'react';

const TagSelector = ({ selectedTags, onTagChange }) => {
  const tags = ['Assignment', 'Lecture Notes', 'Event', 'Question', 'Discussion', 'Job Opportunity', 'Study Group'];
  
  const handleTagToggle = (tag) => {
    if (selectedTags.includes(tag)) {
      onTagChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagChange([...selectedTags, tag]);
    }
  };

  return (
    <div className="tag-selector">
      <label>Select Tags (click to select/deselect):</label>
      <div className="tags-container">
        {tags.map(tag => (
          <button
            key={tag}
            type="button"
            className={`tag ${selectedTags.includes(tag) ? 'selected' : ''}`}
            onClick={() => handleTagToggle(tag)}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TagSelector;