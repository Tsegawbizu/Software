import React, { useState, useEffect } from 'react';
import Stats from './components/Stats';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import { Toaster, toast } from 'react-hot-toast'; 
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import './App.css';

// --- COMPONENT: Brand Intelligence (Preserved) ---
const CompanyLogo = ({ company, size = 30 }) => {
  const [error, setError] = useState(false);
  const domain = company.toLowerCase().trim().replace(/\s+/g, '') + ".com";

  if (error || !company) {
    return (
      <div className="logo-fallback" style={{ 
        width: size, height: size, backgroundColor: '#3498db', 
        color: 'white', display: 'flex', alignItems: 'center', 
        justifyContent: 'center', borderRadius: '4px',
        fontSize: '12px', fontWeight: 'bold'
      }}>
        {company ? company.charAt(0).toUpperCase() : '?'}
      </div>
    );
  }

  return (
    <img 
      src={`https://img.logo.dev/${domain}?token=pk_YOUR_FREE_TOKEN`} 
      alt={company}
      className="company-logo-img"
      onError={() => setError(true)}
      style={{ width: size, height: size, borderRadius: '4px', marginRight: '10px', objectFit: 'contain' }}
    />
  );
};

const SALARY_BENCHMARKS = {
  junior: 60000,
  mid: 95000,
  senior: 140000
};

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

  const [viewMode, setViewMode] = useState("board"); 
  const [input, setInput] = useState("");
  const [inputDate, setInputDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [noteSearchTerm, setNoteSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [editingJob, setEditingJob] = useState(null);

  // --- 2. CALCULATED DATA ---
  const totalJobs = jobs.length;
  const interviewingCount = jobs.filter(j => j.status === "Interviewing").length;
  const offersCount = jobs.filter(j => j.status === "Offered").length;
  const successRate = totalJobs > 0 ? Math.round(((interviewingCount + offersCount) / totalJobs) * 100) : 0;

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

  // --- UPGRADED FILTER LOGIC (Day 34 - Advanced Search) ---
  const filteredJobs = jobs
    .filter(j => {
      const matchesStatus = filterStatus === "All" || j.status === filterStatus;
      const searchLower = searchTerm.toLowerCase();
      const noteSearchLower = noteSearchTerm.toLowerCase();
      
      const matchesTitle = j.title.toLowerCase().includes(searchLower);
      const matchesNotes = (j.notes || "").toLowerCase().includes(noteSearchLower);
      
      return matchesStatus && matchesTitle && matchesNotes;
    })
    .sort((a, b) => (b.isPriority === a.isPriority ? 0 : b.isPriority ? -1 : 1));

  const columns = {
    Applied: filteredJobs.filter(j => j.status === "Applied"),
    Interviewing: filteredJobs.filter(j => j.status === "Interviewing"),
    Offered: filteredJobs.filter(j => j.status === "Offered"),
    Rejected: filteredJobs.filter(j => j.status === "Rejected")
  };

  // --- 3. EFFECTS ---
  useEffect(() => {
    localStorage.setItem("tsegaw-jobs", JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    if (jobsThisWeek >= weeklyGoal && jobsThisWeek > 0) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      toast.success("Weekly Goal Reached! 🏆");
    }
  }, [jobsThisWeek, weeklyGoal]);

  // --- 4. ACTIONS & HELPERS ---
  
  // Day 35: Export JSON
  const exportData = () => {
    const dataStr = JSON.stringify(jobs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `career-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Backup downloaded! 💾");
  };

  // Day 35: Import JSON
  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedJobs = JSON.parse(e.target.result);
        if (Array.isArray(importedJobs)) {
          setJobs(importedJobs);
          toast.success("Data imported successfully! 🚀");
        } else {
          toast.error("Invalid file format.");
        }
      } catch (err) {
        toast.error("Error reading file.");
      }
    };
    reader.readAsText(file);
  };

  const getDaysSinceUpdate = (lastModified) => {
    if (!lastModified) return 0;
    const diff = Math.abs(Date.now() - lastModified);
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const isInterviewSoon = (dateString) => {
    if (!dateString) return false;
    const diff = new Date(dateString) - new Date();
    return diff > 0 && diff < 86400000; // Less than 24 hours
  };

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    setJobs(prevJobs => prevJobs.map(job => {
      if (job.id.toString() === draggableId) {
        if (job.status !== destination.droppableId) toast.success(`Moved to ${destination.droppableId}`);
        return { ...job, status: destination.droppableId, lastModified: Date.now() }; 
      }
      return job;
    }));
  };

  const addJob = () => {
    if (!input.trim()) return toast.error("Enter a company name!");
    const newJob = { 
      id: Date.now(), title: input, status: "Applied",
      date: inputDate, salary: 0, notes: "✅ PROS: \n- \n\n❌ CONS: \n- ", 
      tasks: [], isPriority: false, lastModified: Date.now(),
      interviewDate: "" 
    };
    setJobs([newJob, ...jobs]);
    setInput("");
    toast.success(`Added ${input}! 🚀`);
  };

  const updateEditingJobState = (updated) => {
    const finalJob = { ...updated, lastModified: Date.now() };
    setEditingJob(finalJob);
    setJobs(jobs.map(j => j.id === finalJob.id ? finalJob : j));
  };

  return (
    <div className="App">
      <Toaster position="bottom-right" />

      <header className="header-nav">
        <h1>💼 Career Tracker</h1>
        <div className="header-right">
          {/* Day 35 Controls */}
          <button className="pill" onClick={exportData} title="Export Data">📤 Export</button>
          <label className="pill" style={{ cursor: 'pointer' }} title="Import Data">
            📥 Import
            <input type="file" accept=".json" onChange={importData} style={{ display: 'none' }} />
          </label>
          <hr style={{width: '1px', height: '20px', margin: '0 10px', opacity: 0.3}} />
          
          <button className="pill" onClick={() => setViewMode(viewMode === "board" ? "list" : "board")}>
            {viewMode === "board" ? "📑 List" : "📋 Board"}
          </button>
          <div className="pipeline-mini">💰 ${pipelineValue.toLocaleString()}</div>
          <button className="pill" onClick={() => setIsDarkMode(!isDarkMode)}>
            {isDarkMode ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      <Stats 
        totalJobs={totalJobs} interviewingCount={interviewingCount} 
        offersCount={offersCount} successRate={successRate} 
        jobsThisWeek={jobsThisWeek} weeklyGoal={weeklyGoal}
        setWeeklyGoal={setWeeklyGoal} goalProgress={goalProgress}
      />

      <div className="card add-job-box">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Company Name..." />
        <input type="date" value={inputDate} onChange={(e) => setInputDate(e.target.value)} />
        <button onClick={addJob}>Add Job</button>
      </div>

      <div className="controls-container">
        <input className="search-bar" placeholder="🔍 Search company..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <input className="search-bar notes-search" placeholder="📝 Search in notes..." value={noteSearchTerm} onChange={(e) => setNoteSearchTerm(e.target.value)} />
      </div>

      {viewMode === "board" ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="kanban-board">
            {Object.entries(columns).map(([status, columnJobs]) => (
              <Droppable droppableId={status} key={status}>
                {(provided) => (
                  <div className="kanban-column" {...provided.droppableProps} ref={provided.innerRef}>
                    <h3 className="column-title">{status} <span>{columnJobs.length}</span></h3>
                    <div className="column-content">
                      {columnJobs.map((job, index) => (
                        <Draggable key={job.id} draggableId={job.id.toString()} index={index}>
                          {(provided) => (
                            <div 
                              className={`job-card-mini ${job.isPriority ? 'priority-border' : ''} ${isInterviewSoon(job.interviewDate) ? 'interview-alert' : ''}`}
                              ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                            >
                              {getDaysSinceUpdate(job.lastModified) >= 7 && job.status !== "Rejected" && (
                                <div className="stale-badge">👻 {getDaysSinceUpdate(job.lastModified)}d idle</div>
                              )}
                              <div className="card-header">
                                <CompanyLogo company={job.title} />
                                <strong>{job.title}</strong>
                                <button onClick={() => setEditingJob(job)}>📝</button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      ) : (
        <div className="job-list">
          {filteredJobs.map(job => (
            <div key={job.id} className={`job-item card ${job.isPriority ? 'priority-border' : ''}`}>
              <CompanyLogo company={job.title} />
              <strong>{job.title}</strong>
              <span className={`badge ${job.status.toLowerCase()}`}>{job.status}</span>
              <button onClick={() => setEditingJob(job)}>📝</button>
            </div>
          ))}
        </div>
      )}

      {editingJob && (
        <div className="modal-overlay" onClick={() => setEditingJob(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
               <h3>Edit {editingJob.title}</h3>
               <button className="close-x" onClick={() => setEditingJob(null)}>×</button>
            </div>
            
            <label>Salary Expectation</label>
            <input 
              type="number" value={editingJob.salary || ""} 
              onChange={(e) => updateEditingJobState({...editingJob, salary: Number(e.target.value)})}
              className="modal-input"
            />
            
            {editingJob.salary > 0 && (
              <div className="salary-meter-container">
                <div className="meter-bar">
                  <div className="meter-pointer" style={{ left: `${Math.min((editingJob.salary / 150000) * 100, 100)}%`, backgroundColor: '#2ecc71' }}></div>
                </div>
              </div>
            )}

            <label style={{marginTop: '15px', display: 'block'}}>📅 Interview Date</label>
            <input 
              type="date" value={editingJob.interviewDate || ""}
              onChange={(e) => updateEditingJobState({...editingJob, interviewDate: e.target.value})}
              className="modal-input"
            />

            <label style={{marginTop: '15px', display: 'block'}}>📝 Notes</label>
            <textarea 
              value={editingJob.notes} 
              className="modal-notes"
              onChange={(e) => updateEditingJobState({...editingJob, notes: e.target.value})}
            />
            <button onClick={() => setEditingJob(null)} className="save-btn">Save & Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;