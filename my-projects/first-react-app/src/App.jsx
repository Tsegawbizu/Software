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

  // --- 3. EFFECTS ---
  useEffect(() => {
    localStorage.setItem("tsegaw-jobs", JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    localStorage.setItem("tsegaw-goal", weeklyGoal);
  }, [weeklyGoal]);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (jobsThisWeek === weeklyGoal && jobsThisWeek > 0) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        confetti({ 
          particleCount: 40, 
          spread: 70, 
          origin: { y: 0.6 },
          colors: ['#2196f3', '#4caf50', '#ffeb3b'] 
        });
      }, 250);
    }
  }, [jobsThisWeek, weeklyGoal]);

  // --- 4. ACTIONS ---
  const shareStats = async () => {
    const element = document.getElementById('stats-summary');
    const canvas = await html2canvas(element, {
      backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
      scale: 2,
    });
    const link = document.createElement('a');
    link.download = `tsegaw-progress.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const addJob = () => {
    if (input.trim()) {
      const newJob = { 
        id: Date.now(), 
        title: input, 
        status: "Applied",
        date: new Date(inputDate).toLocaleDateString(), 
        notes: "",
        interviewDate: "" 
      };
      setJobs([...jobs, newJob]);
      setInput("");
      setInputDate(new Date().toISOString().split('T')[0]);
    }
  };

  const toggleStatus = (id) => {
    const statuses = ["Applied", "Interviewing", "Offered", "Rejected"];
    setJobs(jobs.map(job => {
      if (job.id === id) {
        const currentIndex = statuses.indexOf(job.status);
        const nextIndex = (currentIndex + 1) % statuses.length;
        const newStatus = statuses[nextIndex];
        let interviewDate = job.interviewDate || "";
        if (newStatus === "Interviewing") {
          const dateInput = window.prompt("When is the interview?", interviewDate);
          interviewDate = dateInput || "";
        }
        return { ...job, status: newStatus, interviewDate };
      }
      return job;
    }));
  };

  const getDaysSince = (dateString) => {
    const diffTime = Math.abs(new Date() - new Date(dateString));
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  // --- 5. RENDER ---
  return (
    <div className="App">
      <header className="header-nav">
        <h1>💼 Tsegaw's Tracker</h1>
        <div className="theme-switch-wrapper">
          <label className="theme-switch">
            <input type="checkbox" onChange={() => setIsDarkMode(!isDarkMode)} checked={isDarkMode} />
            <div className="slider round"><span className="icon">{isDarkMode ? '🌙' : '☀️'}</span></div>
          </label>
        </div>
      </header>

      <Stats 
        totalJobs={totalJobs} interviewingCount={interviewingCount} 
        offersCount={offersCount} successRate={successRate} 
        jobsThisWeek={jobsThisWeek} weeklyGoal={weeklyGoal}
        setWeeklyGoal={setWeeklyGoal} goalProgress={goalProgress}
      />

      {/* Share Button Trigger */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
         <button onClick={shareStats} className="share-btn">📤 Export Stats Image</button>
      </div>

      {/* Hidden Card for html2canvas */}
      <div style={{ position: 'absolute', left: '-9999px' }}>
        <div id="stats-summary" style={{ padding: '40px', width: '500px', background: isDarkMode ? '#1e1e1e' : '#ffffff', color: isDarkMode ? '#f0f0f0' : '#333', borderRadius: '16px', textAlign: 'center' }}>
          <h2 style={{ color: '#2196f3' }}>My Job Hunt Progress 🚀</h2>
          <div style={{ display: 'flex', justifyContent: 'space-around', margin: '30px 0' }}>
            <div><p>Applied</p><h3>{totalJobs}</h3></div>
            <div><p>Interviews</p><h3>{interviewingCount}</h3></div>
            <div><p>Success</p><h3>{successRate}%</h3></div>
          </div>
          <p style={{ fontSize: '12px', color: '#888' }}>Generated by Tsegaw's Career Tracker</p>
        </div>
      </div>

      <div className="card add-job-box">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Company..." />
        <input type="date" className="date-input" value={inputDate} onChange={(e) => setInputDate(e.target.value)} />
        <button onClick={addJob}>Add</button>
      </div>

      <div className="controls">
        <input className="search-bar" placeholder="🔍 Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="All">All</option>
          <option value="Applied">Applied</option>
          <option value="Interviewing">Interviewing</option>
          <option value="Offered">Offered</option>
        </select>
      </div>

      <div className="job-list">
        {jobs.filter(j => (filterStatus === "All" || j.status === filterStatus) && j.title.toLowerCase().includes(searchTerm.toLowerCase())).map(job => (
          <div key={job.id} className="job-item">
            <div className="job-info">
              <strong>{job.title}</strong>
              <small>Added: {job.date} ({getDaysSince(job.date)}d ago)</small>
              <span className={`badge ${job.status.toLowerCase()}`}>{job.status}</span>
            </div>
            <div className="actions">
              <button onClick={() => setEditingJob(job)}>📝</button>
              <button onClick={() => toggleStatus(job.id)}>↻</button>
              <button onClick={() => setJobs(jobs.filter(j => j.id !== job.id))} className="delete-btn">🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;