// src/utils.js
export const calculateReadingTime = (content) => {
  if (!content) return 0;
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
};

export const formatDate = (timestamp) => {
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
};

export const generateExcerpt = (content, maxLength = 150) => {
  if (!content) return "No content available...";
  const cleanContent = content.replace(/<[^>]*>/g, "");
  if (cleanContent.length <= maxLength) return cleanContent;
  const truncated = cleanContent.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  return lastSpace > maxLength * 0.8
    ? truncated.substring(0, lastSpace) + "..."
    : truncated + "...";
};