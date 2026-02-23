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

  const jobsThisWeek = jobs.filter(job => {
    const jobDate = new Date(job.date);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return jobDate >= sevenDaysAgo;
  }).length;

  const goalProgress = Math.min(Math.round((jobsThisWeek / weeklyGoal) * 100), 100);

  // Weekly Trend Logic
  const getWeeklyHistory = () => {
    return [3, 2, 1, 0].map(weekOffset => {
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
  };
  const weeklyHistory = getWeeklyHistory();

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
    if (jobsThisWeek === weeklyGoal && jobsThisWeek > 0) {
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
      date: new Date(inputDate).toLocaleDateString(), 
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
        const nextStatus = statuses[(statuses.indexOf(job.status) + 1) % statuses.length];
        let iDate = job.interviewDate;
        if (nextStatus === "Interviewing") iDate = window.prompt("Interview Date?", iDate) || iDate;
        return { ...job, status: nextStatus, interviewDate: iDate };
      }
      return job;
    }));
  };

  const shareStats = async () => {
    const canvas = await html2canvas(document.getElementById('stats-summary'), {
      backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
      scale: 2,
    });
    const link = document.createElement('a');
    link.download = `tsegaw-career-progress.png`;
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
      setJobs(JSON.parse(event.target.result));
      alert("Data Restored!");
    };
    reader.readAsText(e.target.files[0]);
  };

  const getDaysSince = (dateString) => {
    const diff = Math.abs(new Date() - new Date(dateString));
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  // --- 5. RENDER ---
  return (
    <div className="App">
      <header className="header-nav">
        <h1>💼 Tsegaw's Tracker</h1>
        <label className="theme-switch">
          <input type="checkbox" onChange={() => setIsDarkMode(!isDarkMode)} checked={isDarkMode} />
          <div className="slider round"><span className="icon">{isDarkMode ? '🌙' : '☀️'}</span></div>
        </label>
      </header>

      <div className="stats-grid">
        <Stats 
          totalJobs={totalJobs} interviewingCount={interviewingCount} 
          offersCount={offersCount} successRate={successRate} 
          jobsThisWeek={jobsThisWeek} weeklyGoal={weeklyGoal}
          setWeeklyGoal={setWeeklyGoal} goalProgress={goalProgress}
        />
        
        <div className="card chart-box">
          <h3>📊 Weekly Activity</h3>
          <div className="chart-container">
            {weeklyHistory.map((w, i) => (
              <div key={i} className="chart-column">
                <div className="chart-bar" style={{ height: `${w.count * 15 + 5}px` }}>
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
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Company Name..." />
        <input type="date" className="date-input" value={inputDate} onChange={(e) => setInputDate(e.target.value)} />
        <button onClick={addJob}>Add Job</button>
      </div>

      <div className="controls">
        <input className="search-bar" placeholder="🔍 Search applications..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="All">All Status</option>
          {["Applied", "Interviewing", "Offered", "Rejected"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="job-list">
        {jobs.filter(j => (filterStatus === "All" || j.status === filterStatus) && j.title.toLowerCase().includes(searchTerm.toLowerCase())).map(job => {
          const days = getDaysSince(job.date);
          const isStale = days > 14 && job.status === "Applied";
          return (
            <div key={job.id} className={`job-item ${isStale ? 'stale' : ''}`}>
              <div className="job-info">
                <strong>{job.title}</strong>
                <small>{job.date} ({days}d ago) {isStale && <span className="warning">⚠️ Follow up!</span>}</small>
                <span className={`badge ${job.status.toLowerCase()}`}>{job.status}</span>
              </div>
              <div className="actions">
                <button onClick={() => setEditingJob(job)}>📝</button>
                <button onClick={() => toggleStatus(job.id)}>↻</button>
                <button onClick={() => setJobs(jobs.filter(j => j.id !== job.id))} className="delete-btn">🗑️</button>
              </div>
            </div>
          );
        })}
      </div>

      <footer className="footer-actions card">
        <div className="data-btns">
          <button onClick={backupData}>JSON Backup</button>
          <label className="upload-label">
            Restore <input type="file" onChange={restoreData} hidden />
          </label>
        </div>
        <button onClick={() => window.confirm("Clear all?") && setJobs([])} className="clear-btn">Clear All Data</button>
      </footer>

      {/* Hidden for Exporting */}
      <div style={{ position: 'absolute', left: '-9999px' }}>
        <div id="stats-summary" className="share-card">
          <h2>My Career Progress 🚀</h2>
          <div className="share-stats">
            <div><p>Applied</p><h3>{totalJobs}</h3></div>
            <div><p>Interviews</p><h3>{interviewingCount}</h3></div>
            <div><p>Offers</p><h3>{offersCount}</h3></div>
          </div>
          <p>Success Rate: {successRate}%</p>
        </div>
      </div>
    </div>
  );
}

export default App;