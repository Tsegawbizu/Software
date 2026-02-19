import { useState, useEffect } from 'react'
import './App.css'

function App() {
  // --- 1. STATE & STORAGE ---
  const [jobs, setJobs] = useState(() => {
    const savedJobs = localStorage.getItem("tsegaw-jobs");
    return savedJobs ? JSON.parse(savedJobs) : [];
  });
  
  const [input, setInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [editingJob, setEditingJob] = useState(null);

  useEffect(() => {
    localStorage.setItem("tsegaw-jobs", JSON.stringify(jobs));
  }, [jobs]);

  // --- 2. EXPORT LOGIC ---
  const exportToCSV = () => {
    const headers = ["Title,Status,Date,Notes\n"];
    const rows = jobs.map(j => 
      `"${j.title}","${j.status}","${j.date}","${j.notes.replace(/\n/g, " ")}"`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-job-applications.csv';
    a.click();
  };

  // --- 3. CALCULATED STATS ---
  const totalJobs = jobs.length;
  const interviewingCount = jobs.filter(j => j.status === "Interviewing").length;
  const offersCount = jobs.filter(j => j.status === "Offered").length;

  // --- 4. ACTIONS ---
  const addJob = () => {
    if (input.trim()) {
      const newJob = { 
        id: Date.now(), 
        title: input, 
        status: "Applied",
        date: new Date().toLocaleDateString(),
        notes: "" 
      };
      setJobs([...jobs, newJob]);
      setInput("");
    }
  };

  const deleteJob = (id) => {
    setJobs(jobs.filter(job => job.id !== id));
  };

  const clearAllJobs = () => {
    if (window.confirm("Are you sure you want to delete ALL jobs? This cannot be undone.")) {
      setJobs([]);
    }
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

  // --- 5. FILTERING LOGIC ---
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "All" || job.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="App">
      <h1>💼 Tsegaw's Career Tracker</h1>

      <div className="stats-container">
        <div className="stat-card"><span>Total</span><strong>{totalJobs}</strong></div>
        <div className="stat-card"><span>Interviews</span><strong>{interviewingCount}</strong></div>
        <div className="stat-card"><span>Offers</span><strong style={{color: '#4caf50'}}>{offersCount}</strong></div>
      </div>

      <div className="card add-job-box">
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Enter Company or Role..." 
        />
        <button onClick={addJob}>Add Job</button>
      </div>

      <hr />

      <div className="controls">
        <input 
          className="search-bar" 
          placeholder="🔍 Search applications..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="All">All Status</option>
          {["Applied", "Interviewing", "Offered", "Rejected"].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="job-list">
        {filteredJobs.map(job => (
          <div key={job.id} className="job-item">
            <div className="job-info">
              <strong>{job.title}</strong>
              <small>Added: {job.date}</small>
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

      {filteredJobs.length === 0 && <p className="empty-msg">No jobs found matching your criteria.</p>}
      
      {/* ACTION BUTTONS GROUP */}
      <div className="footer-actions">
        {jobs.length > 0 && (
          <>
            <button onClick={exportToCSV} className="export-btn">
              📥 Download List (.csv)
            </button>
            <button onClick={clearAllJobs} className="clear-btn">
              ⚠️ Clear All Data
            </button>
          </>
        )}
      </div>

      {/* --- MODAL --- */}
      {editingJob && (
        <div className="modal-overlay" onClick={() => setEditingJob(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Notes for {editingJob.title}</h3>
              <button className="close-x" onClick={() => setEditingJob(null)}>&times;</button>
            </div>
            
            <label>Notes & Interview Reminders:</label>
            <textarea 
              value={editingJob.notes} 
              onChange={(e) => {
                const updated = { ...editingJob, notes: e.target.value };
                setEditingJob(updated);
                setJobs(jobs.map(j => j.id === editingJob.id ? updated : j));
              }}
              placeholder="Add links, salary info, or contact names here..."
            />
            <button className="save-btn" onClick={() => setEditingJob(null)}>Save & Close</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App