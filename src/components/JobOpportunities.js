// src/components/JobOpportunities.js
import React, { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import "./JobOpportunities.css"; // Assuming a new CSS file for styling

function JobOpportunities({ user }) {
  const [jobs, setJobs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [location, setLocation] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user && user.email === "ayushagarwaldesk@gmail.com") {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }

    const q = query(
      collection(db, "jobOpportunities"),
      orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const jobsData = [];
      querySnapshot.forEach((doc) => {
        jobsData.push({ id: doc.id, ...doc.data() });
      });
      setJobs(jobsData);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      alert("You do not have permission to post job opportunities.");
      return;
    }
    
    try {
      await addDoc(collection(db, "jobOpportunities"), {
        title,
        company,
        description,
        link,
        location,
        createdAt: serverTimestamp(),
        postedBy: user.uid,
        author: user.displayName
      });
      
      setTitle("");
      setCompany("");
      setDescription("");
      setLink("");
      setLocation("");
      setShowForm(false);
      
      alert("Job opportunity posted successfully!");
    } catch (error) {
      console.error("Error posting job: ", error);
      alert("Error posting job opportunity");
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Job Opportunities</h1>
        {isAdmin && (
          <button 
            className="btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "Post Job Opportunity"}
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <div className="job-form">
          <h2>Post a New Job Opportunity</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Job Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Company</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows="5"
              />
            </div>
            
            <div className="form-group">
              <label>Application Link</label>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                required
              />
            </div>
            
            <button type="submit" className="btn-primary">
              Post Job
            </button>
          </form>
        </div>
      )}

      <div className="jobs-list">
        {jobs.length === 0 ? (
          <p>No job opportunities posted yet.</p>
        ) : (
          jobs.map((job) => (
            <div key={job.id} className="job-card">
              <h3>{job.title}</h3>
              <p className="company">{job.company} - {job.location}</p>
              <p className="description">{job.description}</p>
              <div className="job-footer">
                <a href={job.link} target="_blank" rel="noopener noreferrer" className="apply-link">
                  Apply Now
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