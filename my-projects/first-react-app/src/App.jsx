import { useState, useEffect } from 'react'
import './App.css'

function App() {
  // 1. Load initial data from localStorage (or empty array if none exists)
  const [jobs, setJobs] = useState(() => {
    const savedJobs = localStorage.getItem("tsegaw-jobs");
    return savedJobs ? JSON.parse(savedJobs) : [];
  });
  
  const [input, setInput] = useState("");

  // 2. useEffect: Runs every time 'jobs' changes to save it
  useEffect(() => {
    localStorage.setItem("tsegaw-jobs", JSON.stringify(jobs));
  }, [jobs]);

  const addJob = () => {
    if (input.trim()) {
      setJobs([...jobs, { id: Date.now(), title: input, status: "Applied" }]);
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

  return (
    <div className="App">
      <h1>✅ Tsegaw's Job Tracker</h1>
      <div className="card">
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Enter Job Title..." 
        />
        <button onClick={addJob}>Add Job</button>
      </div>
      
      <div className="job-list">
        {jobs.map(job => (
          <div key={job.id} className="job-item">
            <div>
              <strong style={{ color: job.status === 'Rejected' ? 'gray' : 'inherit' }}>
                {job.title}
              </strong> 
              <span className={`badge ${job.status.toLowerCase()}`}>
                {job.status}
              </span>
            </div>
            
            <div className="actions">
              <button onClick={() => toggleStatus(job.id)}>Next Status</button>
              <button onClick={() => deleteJob(job.id)} className="delete-btn">🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {jobs.length === 0 && <p>No applications yet. Start hunting!</p>}
    </div>
  )
}

export default App