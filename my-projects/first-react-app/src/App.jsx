import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Stats from './components/Stats';
import confetti from 'canvas-confetti';
import { Toaster, toast } from 'react-hot-toast'; 
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import html2canvas from 'html2canvas'; 
import './App.css';

// ... (Keep HELPERS, OUTREACH_TEMPLATES, getCountdown, highlightText, CompanyLogo, JobCard, LocationDensity, and SalaryInsights)

// --- DAY 55: SKILL GAP ANALYSIS COMPONENT ---
const SkillAnalysis = ({ jobs }) => {
  const skillStats = useMemo(() => {
    const counts = {};
    jobs.forEach(job => {
      if (job.isArchived || !job.tags) return;
      job.tags.forEach(tag => {
        if (!counts[tag]) counts[tag] = { total: 0, success: 0 };
        counts[tag].total += 1;
        // Success = Interviewing or Offered status
        if (job.status === "Interviewing" || job.status === "Offered") {
          counts[tag].success += 1;
        }
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5); // Focus on top 5 tech stacks
  }, [jobs]);

  return (
    <div className="card skill-card">
      <h3>🚀 Tech Stack Success</h3>
      <div className="skill-list">
        {skillStats.length > 0 ? skillStats.map(([skill, stat]) => (
          <div key={skill} className="skill-row">
            <div className="skill-info">
              <span className="skill-name">{skill}</span>
              <span className="skill-ratio">
                {Math.round((stat.success / stat.total) * 100)}% Win Rate
              </span>
            </div>
            <div className="skill-bar-bg">
              <div 
                className="skill-bar-fill" 
                style={{ width: `${(stat.success / stat.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )) : <p className="empty-text">Add tags to analyze your stack!</p>}
      </div>
    </div>
  );
};

function App() {
  const [jobs, setJobs] = useState(() => {
    const savedJobs = localStorage.getItem("tsegaw-jobs");
    return savedJobs ? JSON.parse(savedJobs) : [];
  });
  
  // ... (Keep columnOrder, isDarkMode, weeklyGoal, viewMode, showArchived states)

  const [input, setInput] = useState("");
  const [inputLocation, setInputLocation] = useState("");
  const [inputDate, setInputDate] = useState(new Date().toISOString().split('T')[0]);
  const [inputSalary, setInputSalary] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [editingJob, setEditingJob] = useState(null);
  const [selectedJobIds, setSelectedJobIds] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const fileInputRef = useRef(null);

  // --- ACTIONS ---
  const handleAddJob = () => {
    if (!input.trim()) return toast.error("Enter a company!");
    const newJob = { 
        id: Date.now(), 
        title: input, 
        location: inputLocation || "Remote",
        maxSalary: inputSalary || 0,
        status: columnOrder[0], 
        date: inputDate, 
        tags: [], // Tags added later via Edit
        isArchived: false, 
        lastModified: Date.now() 
    };
    setJobs([newJob, ...jobs]);
    setInput("");
    setInputLocation("");
    setInputSalary("");
    toast.success(`Logged: ${input}`);
  };

  // ... (Keep exportData, importData, clearAllData, and useEffects)

  return (
    <div className="App">
      <Toaster position="bottom-right" />
      <header className="header-nav">
        <h1>💼 Career Tracker</h1>
        <div className="header-right">
          <div className="data-controls">
             <button className="pill small-btn" onClick={exportData}>📥 Export</button>
             <button className="pill small-btn" onClick={() => fileInputRef.current.click()}>📤 Import</button>
             <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={importData} accept=".json" />
          </div>
          <button className={`pill ${isSelectMode ? 'active-pill' : ''}`} onClick={() => { setIsSelectMode(!isSelectMode); setSelectedJobIds([]); }}>
            {isSelectMode ? "✅ Done" : "✔️ Select"}
          </button>
          <button className="pill" onClick={() => setIsDarkMode(!isDarkMode)}>{isDarkMode ? '🌙' : '☀️'}</button>
        </div>
      </header>

      {/* Day 55: Flexible Layout Grid for All Insights */}
      <div className="insights-grid-layout">
         <LocationDensity jobs={jobs} />
         <SalaryInsights jobs={jobs} />
         <SkillAnalysis jobs={jobs} />
      </div>

      <div className="card add-job-box">
        <div className="input-group-row">
          <input type="text" className="add-job-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Company..." />
          <input type="text" value={inputLocation} onChange={(e) => setInputLocation(e.target.value)} placeholder="Location..." />
          <input type="number" value={inputSalary} onChange={(e) => setInputSalary(e.target.value)} placeholder="Max Salary ($)" />
          <input type="date" value={inputDate} onChange={(e) => setInputDate(e.target.value)} />
          <button className="add-btn" onClick={handleAddJob}>Add Job</button>
        </div>
      </div>

      {/* ... (Rest of DragDropContext and JobCard mapping) */}

      <footer className="shortcut-legend">
        <div className="footer-left">
          <span>⌨️ <strong>N</strong>: New | 🔍 <strong>/</strong>: Search | 🌓 <strong>T</strong>: Theme</span>
        </div>
        <div className="footer-right">
          <button className="danger-text-btn" onClick={clearAllData}>Reset Database</button>
        </div>
      </footer>
    </div>
  );
}

export default App;