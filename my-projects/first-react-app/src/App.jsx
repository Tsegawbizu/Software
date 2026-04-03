import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Stats from './components/Stats';
import confetti from 'canvas-confetti';
import { Toaster, toast } from 'react-hot-toast'; 
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import html2canvas from 'html2canvas'; 
import './App.css';

// ... (Keep HELPERS, OUTREACH_TEMPLATES, getCountdown, highlightText, CompanyLogo, and JobCard)

// --- DAY 53: GEOGRAPHIC DENSITY COMPONENT ---
const LocationDensity = ({ jobs }) => {
  const cityCounts = useMemo(() => {
    return jobs.reduce((acc, job) => {
      if (job.isArchived) return acc;
      const city = job.location || "Remote";
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {});
  }, [jobs]);

  const sortedCities = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const totalActive = jobs.filter(j => !j.isArchived).length || 1;

  return (
    <div className="card density-map-card">
      <h3>🌍 Application Density</h3>
      <div className="density-list">
        {sortedCities.map(([city, count]) => (
          <div key={city} className="density-item">
            <div className="density-label">
              <span>{city}</span>
              <span>{Math.round((count / totalActive) * 100)}%</span>
            </div>
            <div className="density-bar-bg">
              <div 
                className="density-bar-fill" 
                style={{ width: `${(count / totalActive) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function App() {
  const [jobs, setJobs] = useState(() => {
    const savedJobs = localStorage.getItem("tsegaw-jobs");
    return savedJobs ? JSON.parse(savedJobs) : [];
  });
  const [columnOrder, setColumnOrder] = useState(() => {
    const savedCols = localStorage.getItem("tsegaw-columns");
    return savedCols ? JSON.parse(savedCols) : ["Applied", "Interviewing", "Offered", "Rejected"];
  });
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const [weeklyGoal, setWeeklyGoal] = useState(() => parseInt(localStorage.getItem("tsegaw-goal")) || 5);
  
  const [viewMode, setViewMode] = useState("board"); 
  const [showArchived, setShowArchived] = useState(false);
  const [input, setInput] = useState("");
  const [inputDate, setInputDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Day 53: Location Input State
  const [inputLocation, setInputLocation] = useState("");
  
  const [searchTerm, setSearchTerm] = useState("");
  const [editingJob, setEditingJob] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedJobIds, setSelectedJobIds] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);

  const fileInputRef = useRef(null);

  // --- ACTIONS ---
  const handleAddJob = () => {
    if (!input.trim()) return toast.error("Enter a company!");
    const newJob = { 
        id: Date.now(), 
        title: input, 
        location: inputLocation || "Remote", // Day 53 update
        status: columnOrder[0], 
        date: inputDate, 
        tags: [], 
        isArchived: false, 
        lastModified: Date.now() 
    };
    setJobs([newJob, ...jobs]);
    setInput("");
    setInputLocation("");
    toast.success(`Logged: ${input} (${newJob.location})`);
  };

  // ... (Keep exportData, importData, clearAllData, and useEffects from Day 52)

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

      {/* Day 53: Layout grid for Stats and Location Insights */}
      <div className="insights-grid">
        <Stats totalJobs={jobs.length} jobsThisWeek={0} weeklyGoal={weeklyGoal} />
        <LocationDensity jobs={jobs} />
      </div>

      <div className="card add-job-box">
        <input type="text" className="add-job-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Company..." />
        {/* Day 53: New Location input */}
        <input type="text" value={inputLocation} onChange={(e) => setInputLocation(e.target.value)} placeholder="Addis, Remote, etc." />
        <input type="date" value={inputDate} onChange={(e) => setInputDate(e.target.value)} />
        <button onClick={handleAddJob}>Add Job</button>
      </div>

      {/* ... (Keep DragDropContext / ViewMode logic) */}

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