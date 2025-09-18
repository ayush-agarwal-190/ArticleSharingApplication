import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import "./JobOpportunities.css";
import "./Modal.css";

function JobOpportunities({ user }) {
  const [jobs, setJobs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [location, setLocation] = useState("");
  const [formYear, setFormYear] = useState(""); 

  // Filter state
  const [yearFilter, setYearFilter] = useState("all");

  const [isAdmin, setIsAdmin] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const yearOptions = ["1st year", "2nd year", "3rd year", "final year", "freshers"];

  useEffect(() => {
    // --- SIMPLIFIED LOGIC ---
    // We only need to check if the user is an admin to show the "Post a Job" button.
    // The logic for premium membership is removed from this component.
    const checkAdminStatus = () => {
      if (user && user.email === "ayushagarwaldesk@gmail.com") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    };
    
    checkAdminStatus();

    // --- SIMPLIFIED QUERY ---
    // This query now runs the same for ALL users.
    let q = collection(db, "jobOpportunities");
    
    if (yearFilter !== "all") {
      q = query(q, where("year", "==", yearFilter));
    }
    
    // --- REMOVED ---
    // The check for premium members and the `publishedDate` filter are completely removed.
    // All jobs will be fetched immediately.
    
    q = query(q, orderBy("createdAt", "desc"));

    const unsubscribeJobs = onSnapshot(q, (querySnapshot) => {
      const jobsData = [];
      querySnapshot.forEach((doc) => {
        jobsData.push({ id: doc.id, ...doc.data() });
      });
      setJobs(jobsData);
    });

    return () => unsubscribeJobs();
  }, [user, yearFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      setModalMessage("You do not have permission to post job opportunities.");
      setShowModal(true);
      return;
    }
    
    setIsPosting(true);
    try {
      await addDoc(collection(db, "jobOpportunities"), {
        title,
        company,
        description,
        link,
        location,
        year: formYear, 
        createdAt: serverTimestamp(),
        postedBy: user.uid,
        author: user.displayName,
        // --- REMOVED ---
        // The `publishedDate` field is no longer needed.
      });
      
      // Reset only the form fields
      setTitle("");
      setCompany("");
      setDescription("");
      setLink("");
      setLocation("");
      setFormYear("");
      setShowForm(false);
      
      setModalMessage("Job opportunity posted successfully!");
      setShowModal(true);
    } catch (error) {
      console.error("Error posting job: ", error);
      setModalMessage(`Error: Could not post job. Reason: ${error.message}`);
      setShowModal(true);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="job-opportunities-page">
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Message</h2>
              <button className="close-button" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <p>{modalMessage}</p>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setShowModal(false)}>Got it!</button>
            </div>
          </div>
        </div>
      )}
      <header className="page-header">
        <h1>Job Opportunities</h1>
        <p className="subtitle">Discover internships and full-time positions tailored for you.</p>
        {isAdmin && (
          <button 
            className="btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "Post a Job"}
          </button>
        )}
      </header>

      {showForm && isAdmin && (
        <div className="job-form-container">
          <h2>Post a New Job Opportunity</h2>
          <form onSubmit={handleSubmit} className="job-form">
            <div className="form-group">
              <label>Job Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Company</label>
              <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Target Year</label>
              <select value={formYear} onChange={(e) => setFormYear(e.target.value)} required>
                <option value="">Select a year...</option>
                {yearOptions.map(year => (
                  <option key={year} value={year}>{year.replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows="5" />
            </div>
            <div className="form-group">
              <label>Application Link</label>
              <input type="url" value={link} onChange={(e) => setLink(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary" disabled={isPosting}>
              {isPosting ? "Posting..." : "Post Job"}
            </button>
          </form>
        </div>
      )}

      <div className="filter-controls">
        <h3>Filter by Year:</h3>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${yearFilter === "all" ? "active" : ""}`}
            onClick={() => setYearFilter("all")}
          >
            All Years
          </button>
          {yearOptions.map((year) => (
            <button
              key={year}
              className={`filter-btn ${yearFilter === year ? "active" : ""}`}
              onClick={() => setYearFilter(year)}
            >
              {year.replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      <div className="jobs-list">
        {jobs.length === 0 ? (
          <div className="no-jobs">
            <span className="emoji">😔</span>
            <p>No job opportunities posted yet for this category.</p>
            {/* --- REMOVED --- The premium upsell message is gone. */}
          </div>
        ) : (
          jobs.map((job) => (
            <div key={job.id} className="job-card">
              <div className="card-header">
                <h3>{job.title}</h3>
                <span className="job-year-tag">{job.year}</span>
              </div>
              <p className="company">{job.company} - {job.location}</p>
              <p className="description">{job.description}</p>
              <div className="job-footer">
                <a href={job.link} target="_blank" rel="noopener noreferrer" className="apply-link">
                  Apply Now →
                </a>
                <span className="posted-by">Posted by {job.author}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default JobOpportunities;
