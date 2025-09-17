import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

function ProfileForm({ user, onSaveSuccess, onError }) {
  const [profile, setProfile] = useState({
    displayName: "",
    department: "",
    year: "",
    bio: "",
    skills: [],
    interests: [],
  });
  const [newSkill, setNewSkill] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user && initialLoad) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setProfile({
              displayName: userData.displayName || user.displayName || "",
              department: userData.department || "",
              year: userData.year || "",
              bio: userData.bio || "",
              skills: userData.skills || [],
              interests: userData.interests || [],
            });
          } else {
            setProfile((prev) => ({
              ...prev,
              displayName: user.displayName || "",
            }));
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
          if (onError) onError("Error loading profile. Please try again.");
        } finally {
          setInitialLoad(false);
        }
      }
    };
    fetchProfile();
  }, [user, initialLoad, onError]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const addSkill = () => {
    const skill = newSkill.trim();
    if (skill && !profile.skills.includes(skill)) {
      setProfile({ ...profile, skills: [...profile.skills, skill] });
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove) => {
    setProfile({
      ...profile,
      skills: profile.skills.filter((skill) => skill !== skillToRemove),
    });
  };

  const addInterest = () => {
    const interest = newInterest.trim();
    if (interest && !profile.interests.includes(interest)) {
      setProfile({ ...profile, interests: [...profile.interests, interest] });
      setNewInterest("");
    }
  };

  const removeInterest = (interestToRemove) => {
    setProfile({
      ...profile,
      interests: profile.interests.filter((interest) => interest !== interestToRemove),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage("");
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          displayName: profile.displayName,
          department: profile.department,
          year: profile.year,
          bio: profile.bio,
          skills: profile.skills,
          interests: profile.interests,
          lastUpdated: new Date(),
          email: user.email,
          photoURL: user.photoURL,
          uid: user.uid,
        },
        { merge: true }
      );
      setMessage("Profile saved successfully!");
      if (onSaveSuccess) onSaveSuccess();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage("Error saving profile. Please try again.");
      if (onError) onError("Error saving profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e, type) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (type === "skill") addSkill();
      if (type === "interest") addInterest();
    }
  };

  return (
    <div
      className="profile-form-container"
      style={{
        maxWidth: "700px",
        margin: "auto",
        padding: "20px",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        backgroundColor: "#fff",
        boxShadow:
          "0 4px 6px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.06)",
        borderRadius: "10px",
      }}
    >
      <div
        className="profile-header"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          marginBottom: "25px",
          borderBottom: "2px solid #e0e0e0",
          paddingBottom: "12px",
        }}
      >
        <h2 style={{ margin: 0, fontWeight: "700", fontSize: "1.8rem", color: "#333" }}>
          Your Profile
        </h2>
        {user?.photoURL && (
          <img
            src={user.photoURL}
            alt="Profile"
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "3px solid #1976d2",
            }}
          />
        )}
      </div>

      {message && (
        <div
          className={`message ${message.includes("Error") ? "error" : "success"}`}
          style={{
            marginBottom: "20px",
            padding: "12px 15px",
            borderRadius: "6px",
            color: message.includes("Error") ? "#b00020" : "#2e7d32",
            backgroundColor: message.includes("Error") ? "#fce4ec" : "#e8f5e9",
            border: `1px solid ${message.includes("Error") ? "#b00020" : "#2e7d32"}`,
            fontWeight: "600",
            textAlign: "center",
          }}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <section
          className="form-section"
          style={{ marginBottom: "30px" }}
          aria-label="Basic Information"
        >
          <h3 style={{ borderBottom: "1px solid #ddd", paddingBottom: "8px", color: "#444" }}>
            Basic Information
          </h3>

          <div className="form-group" style={{ marginTop: "20px" }}>
            <label
              htmlFor="displayName"
              style={{ display: "block", marginBottom: "6px", fontWeight: "600", color: "#222" }}
            >
              Display Name *
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              required
              value={profile.displayName}
              onChange={handleChange}
              placeholder="Your name as it will appear to others"
              style={{
                width: "100%",
                padding: "10px 14px",
                fontSize: "1rem",
                borderRadius: "6px",
                border: "1px solid #ccc",
                outlineColor: "#1976d2",
                transition: "border-color 0.3s",
              }}
            />
          </div>

          <div
            className="form-row"
            style={{ display: "flex", gap: "20px", marginTop: "20px", flexWrap: "wrap" }}
          >
            <div className="form-group" style={{ flex: "1 1 45%" }}>
              <label
                htmlFor="department"
                style={{ display: "block", marginBottom: "6px", fontWeight: "600", color: "#222" }}
              >
                Department *
              </label>
              <select
                id="department"
                name="department"
                required
                value={profile.department}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  fontSize: "1rem",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  outlineColor: "#1976d2",
                  cursor: "pointer",
                  transition: "border-color 0.3s",
                }}
              >
                <option value="">Select Department</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Business Administration">Business Administration</option>
                <option value="Arts and Sciences">Arts and Sciences</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group" style={{ flex: "1 1 45%" }}>
              <label
                htmlFor="year"
                style={{ display: "block", marginBottom: "6px", fontWeight: "600", color: "#222" }}
              >
                Year *
              </label>
              <select
                id="year"
                name="year"
                required
                value={profile.year}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  fontSize: "1rem",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  outlineColor: "#1976d2",
                  cursor: "pointer",
                  transition: "border-color 0.3s",
                }}
              >
                <option value="">Select Year</option>
                <option value="Freshman">Freshman</option>
                <option value="Sophomore">Sophomore</option>
                <option value="Junior">Junior</option>
                <option value="Senior">Senior</option>
                <option value="Graduate">Graduate</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: "20px" }}>
            <label
              htmlFor="bio"
              style={{ display: "block", marginBottom: "6px", fontWeight: "600", color: "#222" }}
            >
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows="5"
              placeholder="Tell others about yourself, your interests, and what you're studying..."
              value={profile.bio}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "10px 14px",
                fontSize: "1rem",
                borderRadius: "6px",
                border: "1px solid #ccc",
                outlineColor: "#1976d2",
                resize: "vertical",
                transition: "border-color 0.3s",
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                color: "#333",
              }}
            />
          </div>
        </section>

        <section
          className="form-section"
          style={{ marginBottom: "25px" }}
          aria-label="Skills and Interests"
        >
          <h3 style={{ borderBottom: "1px solid #ddd", paddingBottom: "8px", color: "#444" }}>
            Skills & Interests
          </h3>

          <div className="form-group" style={{ marginTop: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#222" }}>
              Skills
            </label>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, "skill")}
                placeholder="Add a skill (e.g., Python, Graphic Design)"
                className="tag-input"
                style={{
                  flexGrow: 1,
                  minWidth: "160px",
                  padding: "8px 12px",
                  fontSize: "1rem",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  outlineColor: "#1976d2",
                  transition: "border-color 0.3s",
                }}
              />
              <button
                type="button"
                onClick={addSkill}
                className="add-tag-btn"
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#1976d2",
                  color: "#fff",
                  fontWeight: "600",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  transition: "background-color 0.3s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#155fa0")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1976d2")}
                aria-label="Add skill"
              >
                Add
              </button>
            </div>

            <div className="tags-container" style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {profile.skills.map((skill, index) => (
                <span
                  key={index}
                  className="tag"
                  style={{
                    backgroundColor: "#e3f2fd",
                    color: "#1976d2",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "0.9rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    userSelect: "none",
                    boxShadow: "0 1px 3px rgba(25, 118, 210, 0.3)",
                  }}
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="remove-tag-btn"
                    aria-label={`Remove skill ${skill}`}
                    style={{
                      backgroundColor: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "#1976d2",
                      fontWeight: "700",
                      fontSize: "1.2rem",
                      lineHeight: "1",
                      padding: 0,
                      marginLeft: "5px",
                      transition: "color 0.3s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#0d47a1")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#1976d2")}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: "25px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#222" }}>
              Interests
            </label>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
              <input
                type="text"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, "interest")}
                placeholder="Add an interest (e.g., AI, Basketball)"
                className="tag-input"
                style={{
                  flexGrow: 1,
                  minWidth: "160px",
                  padding: "8px 12px",
                  fontSize: "1rem",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  outlineColor: "#1976d2",
                  transition: "border-color 0.3s",
                }}
              />
              <button
                type="button"
                onClick={addInterest}
                className="add-tag-btn"
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#1976d2",
                  color: "#fff",
                  fontWeight: "600",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  transition: "background-color 0.3s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#155fa0")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1976d2")}
                aria-label="Add interest"
              >
                Add
              </button>
            </div>

            <div className="tags-container" style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {profile.interests.map((interest, index) => (
                <span
                  key={index}
                  className="tag"
                  style={{
                    backgroundColor: "#f3e5f5",
                    color: "#6a1b9a",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "0.9rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    userSelect: "none",
                    boxShadow: "0 1px 3px rgba(106, 27, 154, 0.3)",
                  }}
                >
                  {interest}
                  <button
                    type="button"
                    onClick={() => removeInterest(interest)}
                    className="remove-tag-btn"
                    aria-label={`Remove interest ${interest}`}
                    style={{
                      backgroundColor: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "#6a1b9a",
                      fontWeight: "700",
                      fontSize: "1.2rem",
                      lineHeight: "1",
                      padding: 0,
                      marginLeft: "5px",
                      transition: "color 0.3s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#4a148c")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#6a1b9a")}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </section>

        <div
          className="form-actions"
          style={{ textAlign: "center", marginTop: "30px" }}
        >
          <button
            type="submit"
            disabled={isSaving}
            className={`save-btn ${isSaving ? "saving" : ""}`}
            style={{
              backgroundColor: isSaving ? "#9e9e9e" : "#1976d2",
              color: "#fff",
              fontWeight: "700",
              fontSize: "1.15rem",
              padding: "12px 30px",
              borderRadius: "8px",
              border: "none",
              cursor: isSaving ? "not-allowed" : "pointer",
              boxShadow:
                "0px 4px 10px rgba(25, 118, 210, 0.4)",
              transition: "background-color 0.3s",
            }}
            aria-label="Save profile"
            onMouseEnter={(e) => {
              if (!isSaving) e.currentTarget.style.backgroundColor = "#155fa0";
            }}
            onMouseLeave={(e) => {
              if (!isSaving) e.currentTarget.style.backgroundColor = "#1976d2";
            }}
          >
            {isSaving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProfileForm;
