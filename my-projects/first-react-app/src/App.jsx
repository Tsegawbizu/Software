import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Stats from './components/Stats';
import confetti from 'canvas-confetti';
import { Toaster, toast } from 'react-hot-toast'; 
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import './App.css';

// --- HELPERS & LOGIC ---
const columnOrder = ["Applied", "Interviewing", "Offered", "Rejected"];

const getInterviewCountdown = (dateString) => {
  if (!dateString) return null;
  const now = new Date();
  const target = new Date(dateString);
  const diff = target - now;
  if (diff < 0) return "Started/Passed";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  return days > 0 ? `${days}d ${hours}h left` : `${hours}h remaining!`;
};

const calculateStreak = (jobs) => {
  if (jobs.length === 0) return 0;
  const appDates = [...new Set(jobs.map(j => j.date))].sort((a, b) => new Date(b) - new Date(a));
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (appDates[0] !== today && appDates[0] !== yesterday) return 0;
  
  let streak = 0;
  let currentDate = new Date(appDates[0]);
  for (let i = 0; i < appDates.length; i++) {
    const checkDate = new Date(appDates[i]);
    const diffDays = Math.ceil(Math.abs(currentDate - checkDate) / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) {
      streak++;
      currentDate = checkDate;
    } else { break; }
  }
  return streak;
};

// --- SUB-COMPONENTS ---

const StreakBadge = ({ jobs }) => {
  const streak = useMemo(() => calculateStreak(jobs), [jobs]);
  if (streak === 0) return null;
  return (
    <div className="streak-badge">
      <span className="fire-icon">🔥</span>
      <span className="streak-count">{streak} Day Streak</span>
    </div>
  );
};

const SkillAnalysis = ({ jobs }) => {
  const skillStats = useMemo(() => {
    const counts = {};
    jobs.forEach(job => {
      if (job.isArchived || !job.tags) return;
      job.tags.forEach(tag => {
        if (!counts[tag]) counts[tag] = { total: 0, success: 0 };
        counts[tag].total += 1;
        if (job.status === "Interviewing" || job.status === "Offered") counts[tag].success += 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1].total - a[1].total).slice(0, 5);
  }, [jobs]);

  return (
    <div className="card skill-card">
      <h3>🚀 Tech Success</h3>
      {skillStats.map(([skill, stat]) => (
        <div key={skill} className="skill-row">
          <div className="skill-info">
            <span className="skill-name">{skill}</span>
            <span className="skill-ratio">{Math.round((stat.success / stat.total) * 100)}% Win</span>
          </div>
          <div className="skill-bar-bg"><div className="skill-bar-fill" style={{ width: `${(stat.success / stat.total) * 100}%` }}></div></div>
        </div>
      ))}
    </div>
  );
};

const SalaryInsights = ({ jobs }) => {
  const activeJobs = useMemo(() => jobs.filter(j => !j.isArchived && j.maxSalary > 0), [jobs]);
  const avg = useMemo(() => {
    if (activeJobs.length === 0) return 0;
    return Math.round(activeJobs.reduce((acc, j) => acc + Number(j.maxSalary), 0) / activeJobs.length);
  }, [activeJobs]);
  return (
    <div className="card salary-card">
      <h3>💰 Pipeline Value</h3>
      <span className="salary-avg">${avg.toLocaleString()}</span>
      <p className="salary-subtitle">Avg potential salary</p>
    </div>
  );
};

const LocationDensity = ({ jobs }) => {
  const density = useMemo(() => {
    const counts = {};
    jobs.forEach(j => { if(!j.isArchived) counts[j.location] = (counts[j.location] || 0) + 1; });
    return Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 3);
  }, [jobs]);
  return (
    <div className="card density-card">
      <h3>📍 Top Locations</h3>
      {density.map(([loc, count]) => (
        <div key={loc} className="density-item">
          <div className="density-label"><span>{loc}</span><span>{count}</span></div>
          <div className="density-bar-bg"><div className="density-bar-fill" style={{width: `${(count/(jobs.length || 1))*100}%`}}></div></div>
        </div>
      ))}
    </div>
  );
};

const JobCard = ({ job, index, onNoteUpdate }) => {
  const countdown = getInterviewCountdown(job.date);
  const isUrgent = countdown && !countdown.includes('d') && countdown !== "Started/Passed";

  return (
    <Draggable draggableId={job.id.toString()} index={index}>
      {(provided) => (
        <div 
          className={`job-card-mini ${isUrgent ? 'imminent' : ''}`}
          ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
        >
          <div className="card-header">
            {job.status === "Interviewing" && countdown && (
              <span className={`countdown-badge ${isUrgent ? 'urgent' : ''}`}>⏳ {countdown}</span>
            )}
            <h4>{job.title}</h4>
          </div>
          <p className="job-loc">📍 {job.location}</p>
          <div className="prep-notes-area">
            <textarea 
              placeholder="Prep notes (LeetCode/Questions)..." 
              defaultValue={job.notes || ""} 
              onBlur={(e) => onNoteUpdate(job.id, e.target.value)}
            />
          </div>
          <div className="card-footer">
            <span className="salary-tag">${Number(job.maxSalary).toLocaleString()}</span>
            <div className="card-tags-mini">
              {job.tags?.map(t => <span key={t} className="job-tag">{t}</span>)}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

// --- MAIN APP ---

function App() {
  const [jobs, setJobs] = useState(() => JSON.parse(localStorage.getItem("tsegaw-jobs")) || []);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [input, setInput] = useState("");
  const [inputLocation, setInputLocation] = useState("");
  const [inputSalary, setInputSalary] = useState("");
  const [inputDate, setInputDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    localStorage.setItem("tsegaw-jobs", JSON.stringify(jobs));
    document.body.className = isDarkMode ? "dark-mode" : "";
  }, [jobs, isDarkMode]);

  const handleAddJob = () => {
    if (!input.trim()) return toast.error("Company name required!");
    const newJob = { 
      id: Date.now(), title: input, location: inputLocation || "Remote", 
      maxSalary: inputSalary || 0, status: "Applied", date: inputDate, 
      tags: [], notes: "", isArchived: false 
    };
    setJobs([newJob, ...jobs]);
    setInput(""); setInputLocation(""); setInputSalary("");
    toast.success(`Added ${input}`);
  };

  const updateJobNote = (id, notes) => {
    setJobs(jobs.map(j => j.id === id ? { ...j, notes } : j));
  };

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const updatedJobs = Array.from(jobs);
    const jobIndex = updatedJobs.findIndex(j => j.id.toString() === draggableId);
    updatedJobs[jobIndex].status = destination.droppableId;
    setJobs(updatedJobs);
    if (destination.droppableId === "Offered") confetti();
  };

  return (
    <div className="App">
      <Toaster position="bottom-right" />
      <header className="header-nav">
        <div className="header-left">
          <h1>💼 Career Tracker</h1>
          <StreakBadge jobs={jobs} />
        </div>
        <button className="pill" onClick={() => setIsDarkMode(!isDarkMode)}>{isDarkMode ? '🌙' : '☀️'}</button>
      </header>

      <div className="insights-grid-layout">
        <LocationDensity jobs={jobs} />
        <SalaryInsights jobs={jobs} />
        <SkillAnalysis jobs={jobs} />
      </div>

      <div className="card add-job-box">
        <div className="input-group-row">
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="Company..." />
          <input value={inputLocation} onChange={e => setInputLocation(e.target.value)} placeholder="Location..." />
          <input type="number" value={inputSalary} onChange={e => setInputSalary(e.target.value)} placeholder="Salary..." />
          <input type="date" value={inputDate} onChange={e => setInputDate(e.target.value)} />
          <button className="add-btn" onClick={handleAddJob}>Add Job</button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-board">
          {columnOrder.map(col => (
            <Droppable droppableId={col} key={col}>
              {(provided) => (
                <div className="kanban-column" {...provided.droppableProps} ref={provided.innerRef}>
                  <h3>{col}</h3>
                  {jobs.filter(j => j.status === col).map((job, index) => (
                    <JobCard key={job.id} job={job} index={index} onNoteUpdate={updateJobNote} />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}

export default App;