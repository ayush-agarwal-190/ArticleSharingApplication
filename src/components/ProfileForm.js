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
    interests: []
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
              interests: userData.interests || []
            });
          } else {
            // Initialize with user data from authentication
            setProfile(prev => ({
              ...prev,
              displayName: user.displayName || ""
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
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
  };

  const addSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile({
        ...profile,
        skills: [...profile.skills, newSkill.trim()]
      });
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove) => {
    setProfile({
      ...profile,
      skills: profile.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const addInterest = () => {
    if (newInterest.trim() && !profile.interests.includes(newInterest.trim())) {
      setProfile({
        ...profile,
        interests: [...profile.interests, newInterest.trim()]
      });
      setNewInterest("");
    }
  };

  const removeInterest = (interestToRemove) => {
    setProfile({
      ...profile,
      interests: profile.interests.filter(interest => interest !== interestToRemove)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage("");
    
    try {
      // Use setDoc with merge: true to update only specified fields
      await setDoc(doc(db, "users", user.uid), {
        displayName: profile.displayName,
        department: profile.department,
        year: profile.year,
        bio: profile.bio,
        skills: profile.skills,
        interests: profile.interests,
        lastUpdated: new Date(),
        email: user.email,
        photoURL: user.photoURL,
        uid: user.uid // Store the UID for reference
      }, { merge: true }); // This is crucial - it merges with existing document
      
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
    if (e.key === 'Enter') {
      e.preventDefault();
      if (type === 'skill') addSkill();
      if (type === 'interest') addInterest();
    }
  };

  return (
    <div className="profile-form-container">
      <div className="profile-header">
        <h2>Your Profile</h2>
        {user.photoURL && (
          <img src={user.photoURL} alt="Profile" className="profile-avatar" />
        )}
      </div>
      
      {message && (
        <div className={`message ${message.includes("Error") ? "error" : "success"}`}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-section">
          <h3>Basic Information</h3>
          
          <div className="form-group">
            <label htmlFor="displayName">Display Name *</label>
            <input
              id="displayName"
              type="text"
              name="displayName"
              value={profile.displayName}
              onChange={handleChange}
              required
              placeholder="Your name as it will appear to others"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="department">Department *</label>
              <select
                id="department"
                name="department"
                value={profile.department}
                onChange={handleChange}
                required
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

            <div className="form-group">
              <label htmlFor="year">Year *</label>
              <select
                id="year"
                name="year"
                value={profile.year}
                onChange={handleChange}
                required
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

          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={profile.bio}
              onChange={handleChange}
              rows="4"
              placeholder="Tell others about yourself, your interests, and what you're studying..."
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Skills & Interests</h3>
          
          <div className="form-group">
            <label>Skills</label>
            <div className="tag-input-group">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'skill')}
                placeholder="Add a skill (e.g., Python, Graphic Design)"
                className="tag-input"
              />
              <button 
                type="button" 
                onClick={addSkill}
                className="add-tag-btn"
              >
                Add
              </button>
            </div>
            <div className="tags-container">
              {profile.skills.map((skill, index) => (
                <span key={index} className="tag">
                  {skill}
                  <button 
                    type="button" 
                    onClick={() => removeSkill(skill)}
                    className="remove-tag-btn"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Interests</label>
            <div className="tag-input-group">
              <input
                type="text"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'interest')}
                placeholder="Add an interest (e.g., AI, Basketball)"
                className="tag-input"
              />
              <button 
                type="button" 
                onClick={addInterest}
                className="add-tag-btn"
              >
                Add
              </button>
            </div>
            <div className="tags-container">
              {profile.interests.map((interest, index) => (
                <span key={index} className="tag">
                  {interest}
                  <button 
                    type="button" 
                    onClick={() => removeInterest(interest)}
                    className="remove-tag-btn"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            disabled={isSaving}
            className={`save-btn ${isSaving ? 'saving' : ''}`}
          >
            {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProfileForm;