import { useState, useEffect } from 'react';
import Stats from './components/Stats';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import './App.css';

function App() {
  // --- 1. STATE & STORAGE ---
  const [jobs, setJobs] = useState(() => {
    const savedJobs = localStorage.getItem("tsegaw-jobs");
    return savedJobs ? JSON.parse(savedJobs) : [];
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  const [weeklyGoal, setWeeklyGoal] = useState(() => {
    const savedGoal = localStorage.getItem("tsegaw-goal");
    return savedGoal ? parseInt(savedGoal) : 5;
  });

  const [input, setInput] = useState("");
  const [inputDate, setInputDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [editingJob, setEditingJob] = useState(null);

  // --- 2. CALCULATED DATA ---
  const totalJobs = jobs.length;
  const interviewingCount = jobs.filter(j => j.status === "Interviewing").length;
  const offersCount = jobs.filter(j => j.status === "Offered").length;
  const successRate = totalJobs > 0 ? Math.round(((interviewingCount + offersCount) / totalJobs) * 100) : 0;

  // Day 11: Pipeline Value Logic
  const pipelineValue = jobs
    .filter(j => j.status !== "Rejected")
    .reduce((sum, job) => sum + (Number(job.salary) || 0), 0);

  const jobsThisWeek = jobs.filter(job => {
    const jobDate = new Date(job.date);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return jobDate >= sevenDaysAgo;
  }).length;

  const goalProgress = Math.min(Math.round((jobsThisWeek / weeklyGoal) * 100), 100);

  const weeklyHistory = [3, 2, 1, 0].map(weekOffset => {
    const end = new Date();
    end.setDate(end.getDate() - (weekOffset * 7));
    const start = new Date();
    start.setDate(start.getDate() - ((weekOffset + 1) * 7));
    const count = jobs.filter(job => {
      const d = new Date(job.date);
      return d > start && d <= end;
    }).length;
    return { label: weekOffset === 0 ? "Now" : `${weekOffset}w ago`, count };
  });

  const filteredJobs = jobs.filter(j => 
    (filterStatus === "All" || j.status === filterStatus) && 
    j.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- 3. EFFECTS ---
  useEffect(() => {
    localStorage.setItem("tsegaw-jobs", JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    localStorage.setItem("tsegaw-goal", weeklyGoal);
  }, [weeklyGoal]);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    if (jobsThisWeek >= weeklyGoal && jobsThisWeek > 0) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  }, [jobsThisWeek, weeklyGoal]);

  // --- 4. ACTIONS ---
  const addJob = () => {
    if (!input.trim()) return;
    const newJob = { 
      id: Date.now(), 
      title: input, 
      status: "Applied",
      date: inputDate, 
      salary: 0, 
      notes: "",
      interviewDate: "" 
    };
    setJobs([newJob, ...jobs]);
    setInput("");
  };

  const toggleStatus = (id) => {
    const statuses = ["Applied", "Interviewing", "Offered", "Rejected"];
    setJobs(jobs.map(job => {
      if (job.id === id) {
        const currentIndex = statuses.indexOf(job.status);
        const nextStatus = statuses[(currentIndex + 1) % statuses.length];
        return { ...job, status: nextStatus };
      }
      return job;
    }));
  };

  const shareStats = async () => {
    const element = document.getElementById('stats-summary');
    const canvas = await html2canvas(element, {
      backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
      scale: 2,
    });
    const link = document.createElement('a');
    link.download = `career-progress.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const backupData = () => {
    const blob = new Blob([JSON.stringify(jobs)], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = "tsegaw_backup.json";
    link.click();
  };

  const restoreData = (e) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        setJobs(data);
        alert("Data Restored!");
      } catch(err) { alert("Invalid backup file."); }
    };
    reader.readAsText(e.target.files[0]);
  };

  const getDaysSince = (dateString) => {
    const diff = Math.abs(new Date() - new Date(dateString));
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="App">
      <header className="header-nav">
        <h1>💼 Tsegaw's Tracker</h1>
        <div className="pipeline-mini">💰 Pipeline: ${pipelineValue.toLocaleString()}</div>
        <label className="theme-switch">
          <input type="checkbox" onChange={() => setIsDarkMode(!isDarkMode)} checked={isDarkMode} />
          <div className="slider round">
            <span className="icon">{isDarkMode ? '🌙' : '☀️'}</span>
          </div>
        </label>
      </header>

      <div className="stats-grid">
      <Stats 
  totalJobs={totalJobs} 
  interviewingCount={interviewingCount} 
  offersCount={offersCount} 
  successRate={successRate} 
  jobsThisWeek={jobsThisWeek} 
  weeklyGoal={weeklyGoal}
  setWeeklyGoal={setWeeklyGoal} 
  goalProgress={goalProgress}
  pipelineValue={pipelineValue} // <--- Don't forget this!
/>
        
        <div className="card chart-box">
          <h3>📊 Weekly Activity</h3>
          <div className="chart-container">
            {weeklyHistory.map((w, i) => (
              <div key={i} className="chart-column">
                <div className="chart-bar" style={{ height: `${(w.count * 15) + 5}px` }}>
                  <span className="bar-value">{w.count}</span>
                </div>
                <span className="bar-label">{w.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="main-actions">
        <button onClick={shareStats} className="share-btn">📤 Export Stats Image</button>
      </div>

      <div className="card add-job-box">
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Company Name..." 
          onKeyDown={(e) => e.key === 'Enter' && addJob()}
        />
        <input 
          type="date" 
          className="date-input" 
          value={inputDate} 
          onChange={(e) => setInputDate(e.target.value)} 
        />
        <button onClick={addJob}>Add Job</button>
      </div>

      <div className="controls-container">
        <input 
          className="search-bar" 
          placeholder="🔍 Search applications..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
        <div className="status-pills">
          {["All", "Applied", "Interviewing", "Offered", "Rejected"].map(status => (
            <button 
              key={status}
              className={`pill ${filterStatus === status ? 'active' : ''}`}
              onClick={() => setFilterStatus(status)}
            >
              {status} 
              <span className="pill-count">
                {status === "All" ? jobs.length : jobs.filter(j => j.status === status).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="job-list">
        {filteredJobs.length > 0 ? (
          filteredJobs.map(job => {
            const days = getDaysSince(job.date);
            const isStale = days >= 7 && job.status === "Applied";
            
            // Interview Countdown Calculation
            let countdown = null;
            if (job.status === "Interviewing" && job.interviewDate) {
                const diff = new Date(job.interviewDate) - new Date();
                countdown = Math.ceil(diff / (1000 * 60 * 60 * 24));
            }

            return (
              <div key={job.id} className={`job-item ${isStale ? 'stale' : ''}`}>
                <div className="job-info">
                  <div className="title-row">
                    <strong>{job.title}</strong>
                    {isStale && <span className="follow-up-pill">🔔 Follow up!</span>}
                  </div>
                  
                  <small>{job.date} ({days}d ago)</small>
                  
                  {countdown !== null && (
                    <div className="interview-countdown">
                      📅 {countdown > 0 ? `Interview in ${countdown} days` : countdown === 0 ? "Interview Today!" : "Interview Passed"}
                    </div>
                  )}

                  <div className="job-meta">
                    <span className={`badge ${job.status.toLowerCase()}`}>{job.status}</span>
                    {job.salary > 0 && <span className="salary-tag">💰 ${job.salary.toLocaleString()}</span>}
                  </div>
                </div>
                <div className="actions">
                  <button onClick={() => setEditingJob(job)} title="Edit Details">📝</button>
                  <button onClick={() => toggleStatus(job.id)} title="Next Status">↻</button>
                  <button onClick={() => setJobs(jobs.filter(j => j.id !== job.id))} className="delete-btn">🗑️</button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <p>No results found</p>
          </div>
        )}
      </div>

      <footer className="footer-actions card">
        <div className="data-btns">
          <button onClick={backupData} className="btn-secondary">JSON Backup</button>
          <label className="btn-secondary upload-label">
            Restore <input type="file" onChange={restoreData} hidden />
          </label>
        </div>
        <button onClick={() => window.confirm("Clear all?") && setJobs([])} className="clear-btn">Clear All</button>
      </footer>

      {editingJob && (
        <div className="modal-overlay" onClick={() => setEditingJob(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
             <h3>Edit: {editingJob.title}</h3>
             
             <label>Salary Expectation ($)</label>
             <input 
                type="number"
                value={editingJob.salary || ""}
                onChange={(e) => {
                    const updated = {...editingJob, salary: Number(e.target.value)};
                    setEditingJob(updated);
                    setJobs(jobs.map(j => j.id === editingJob.id ? updated : j));
                }}
                className="modal-input"
             />

             <label>Interview Date</label>
             <input 
                type="date"
                value={editingJob.interviewDate || ""}
                onChange={(e) => {
                    const updated = {...editingJob, interviewDate: e.target.value};
                    setEditingJob(updated);
                    setJobs(jobs.map(j => j.id === editingJob.id ? updated : j));
                }}
                className="modal-input"
             />

             <label>Notes</label>
             <textarea 
               value={editingJob.notes} 
               onChange={(e) => {
                 const updated = {...editingJob, notes: e.target.value};
                 setEditingJob(updated);
                 setJobs(jobs.map(j => j.id === editingJob.id ? updated : j));
               }}
               placeholder="Job link, contact person, etc..."
             />
             <button onClick={() => setEditingJob(null)} className="save-btn">Save & Close</button>
          </div>
        </div>
      )}

      <div style={{ position: 'absolute', left: '-9999px' }}>
        <div id="stats-summary" style={{ padding: '20px', width: '400px', textAlign: 'center', background: 'white', color: 'black' }}>
          <h2>My Career Progress 🚀</h2>
          <p>Applied: {totalJobs} | Offers: {offersCount}</p>
          <p>Success Rate: {successRate}%</p>
        </div>
      </div>
    </div>
  );
}

export default App;