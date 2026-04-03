import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Stats from './components/Stats';
import confetti from 'canvas-confetti';
import { Toaster, toast } from 'react-hot-toast'; 
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import html2canvas from 'html2canvas'; 
import './App.css';

// ... (Keep HELPERS, OUTREACH_TEMPLATES, getCountdown, highlightText, CompanyLogo, JobCard, and LocationDensity)

// --- DAY 54: FINANCIAL INSIGHTS COMPONENT ---
const SalaryInsights = ({ jobs }) => {
  const activeJobs = useMemo(() => 
    jobs.filter(j => !j.isArchived && j.maxSalary && j.maxSalary > 0), 
  [jobs]);
  
  const avgSalary = useMemo(() => {
    if (activeJobs.length === 0) return 0;
    const total = activeJobs.reduce((acc, job) => acc + Number(job.maxSalary), 0);
    return Math.round(total / activeJobs.length);
  }, [activeJobs]);

  return (
    <div className="card salary-card">
      <h3>💰 Pipeline Value</h3>
      <div className="salary-display">
        <span className="salary-avg">${avgSalary.toLocaleString()}</span>
        <p className="salary-subtitle">Average Potential Max</p>
      </div>
      <div className="salary-meta">
        <span>Tracked: {activeJobs.length} jobs</span>
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
  
  // Day 54: New Salary Input State
  const [inputSalary, setInputSalary] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [editingJob, setEditingJob] = useState(null);
  const [selectedJobIds, setSelectedJobIds] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const fileInputRef = useRef(null);

  // --- UPDATED ACTIONS ---
  const handleAddJob = () => {
    if (!input.trim()) return toast.error("Enter a company!");
    const newJob = { 
        id: Date.now(), 
        title: input, 
        location: inputLocation || "Remote",
        maxSalary: inputSalary || 0, // Day 54 Field
        status: columnOrder[0], 
        date: inputDate, 
        tags: [], 
        isArchived: false, 
        lastModified: Date.now() 
    };
    setJobs([newJob, ...jobs]);
    setInput("");
    setInputLocation("");
    setInputSalary("");
    toast.success(`Logged: ${input} ($${newJob.maxSalary || 'N/A'})`);
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

      {/* Day 54: Updated Triple Layout Grid */}
      <div className="insights-grid-triple">
        <Stats totalJobs={jobs.length} jobsThisWeek={0} weeklyGoal={weeklyGoal} />
        <LocationDensity jobs={jobs} />
        <SalaryInsights jobs={jobs} />
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