import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [jobs, setJobs] = useState(() => {
    const savedJobs = localStorage.getItem("tsegaw-jobs");
    return savedJobs ? JSON.parse(savedJobs) : [];
  });
  
  const [input, setInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  
  // Day 4: State for the Modal
  const [editingJob, setEditingJob] = useState(null);

  useEffect(() => {
    localStorage.setItem("tsegaw-jobs", JSON.stringify(jobs));
  }, [jobs]);

  const addJob = () => {
    if (input.trim()) {
      const newJob = { 
        id: Date.now(), 
        title: input, 
        status: "Applied",
        date: new Date().toLocaleDateString(),
        notes: "" // Day 4: Initialize empty notes
      };
      setJobs([...jobs, newJob]);
      setInput("");
    }
  };

  const deleteJob = (id) => {
    setJobs(jobs.filter(job => job.id !== id));
  };

  const toggleStatus = (id) => {
    const statuses = ["Applied", "Interviewing", "Offered", "Rejected"];
    setJobs(jobs.map(job => {
      if (job.id === id) {
        const currentIndex = statuses.indexOf(job.status);
        const nextIndex = (currentIndex + 1) % statuses.length;
        return { ...job, status: statuses[nextIndex] };
      }
      return job;
    }));
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "All" || job.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="App">
      <h1>💼 Tsegaw's Career Tracker</h1>

      <div className="card add-job-box">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Company or Role..." />
        <button onClick={addJob}>Add Job</button>
      </div>

      <div className="controls">
        <input className="search-bar" placeholder="🔍 Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="All">All Status</option>
          {["Applied", "Interviewing", "Offered", "Rejected"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="job-list">
        {filteredJobs.map(job => (
          <div key={job.id} className="job-item">
            <div className="job-info">
              <strong>{job.title}</strong>
              <small>{job.date}</small>
              <span className={`badge ${job.status.toLowerCase()}`}>{job.status}</span>
            </div>
            <div className="actions">
              <button onClick={() => setEditingJob(job)}>📝 Notes</button>
              <button onClick={() => toggleStatus(job.id)}>↻</button>
              <button onClick={() => deleteJob(job.id)} className="delete-btn">🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {/* --- DAY 4: THE MODAL --- */}
      {editingJob && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Notes for {editingJob.title}</h3>
            <textarea 
              value={editingJob.notes} 
              onChange={(e) => {
                const updated = { ...editingJob, notes: e.target.value };
                setEditingJob(updated);
                // Update master list in real-time
                setJobs(jobs.map(j => j.id === editingJob.id ? updated : j));
              }}
              placeholder="Add interview links, salary info, or contact names..."
            />
            <button onClick={() => setEditingJob(null)}>Close & Save</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App