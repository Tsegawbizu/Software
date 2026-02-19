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

  useEffect(() => {
    localStorage.setItem("tsegaw-jobs", JSON.stringify(jobs));
  }, [jobs]);

  // --- 2. ACTIONS ---
  const addJob = () => {
    if (input.trim()) {
      const newJob = { 
        id: Date.now(), 
        title: input, 
        status: "Applied",
        date: new Date().toLocaleDateString() // Bonus: Track when you applied!
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

  // --- 3. FILTERING LOGIC ---
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "All" || job.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // --- 4. STATS CALCULATION ---
  const totalJobs = jobs.length;
  const interviewingCount = jobs.filter(j => j.status === "Interviewing").length;

  return (
    <div className="App">
      <h1>💼 Tsegaw's Career Tracker</h1>

      {/* DASHBOARD STATS */}
      <div className="stats-container">
        <div className="stat-card"><span>Total</span><strong>{totalJobs}</strong></div>
        <div className="stat-card"><span>Interviews</span><strong>{interviewingCount}</strong></div>
      </div>

      {/* ADD NEW JOB SECTION */}
      <div className="card add-job-box">
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Company or Role..." 
        />
        <button onClick={addJob}>Add Job</button>
      </div>

      <hr />

      {/* SEARCH & FILTER CONTROLS */}
      <div className="controls">
        <input 
          type="text" 
          placeholder="🔍 Search my applications..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar"
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="All">All Status</option>
          <option value="Applied">Applied</option>
          <option value="Interviewing">Interviewing</option>
          <option value="Offered">Offered</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* THE JOB LIST */}
      <div className="job-list">
        {filteredJobs.map(job => (
          <div key={job.id} className="job-item">
            <div className="job-info">
              <strong>{job.title}</strong>
              <small>Added: {job.date}</small>
              <span className={`badge ${job.status.toLowerCase()}`}>{job.status}</span>
            </div>
            <div className="actions">
              <button onClick={() => toggleStatus(job.id)}>Status ↻</button>
              <button onClick={() => deleteJob(job.id)} className="delete-btn">🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {filteredJobs.length === 0 && <p className="empty-msg">No jobs found matching your search.</p>}
    </div>
  )
}

export default App