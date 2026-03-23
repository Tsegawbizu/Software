import React, { useState, useEffect, useMemo } from 'react';
import Stats from './components/Stats';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import { Toaster, toast } from 'react-hot-toast'; 
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import './App.css';

// --- DAY 37: KEYWORD LIST ---
const TECH_KEYWORDS = ["React", "Vite", "Tailwind", "JavaScript", "TypeScript", "Node.js", "CSS", "HTML", "Git", "API", "Firebase"];

const findMatches = (text) => {
  if (!text) return [];
  return TECH_KEYWORDS.filter(skill => text.toLowerCase().includes(skill.toLowerCase()));
};

// --- COMPONENT: Brand Intelligence ---
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

function App() {
  // --- 1. STATE & STORAGE ---
  const [jobs, setJobs] = useState(() => {
    const savedJobs = localStorage.getItem("tsegaw-jobs");
    return savedJobs ? JSON.parse(savedJobs) : [];
  });

  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const [weeklyGoal, setWeeklyGoal] = useState(() => parseInt(localStorage.getItem("tsegaw-goal")) || 5);
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

  const pipelineValue = jobs.filter(j => j.status !== "Rejected").reduce((sum, job) => sum + (Number(job.salary) || 0), 0);

  const jobsThisWeek = jobs.filter(job => {
    const jobDate = new Date(job.date);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return jobDate >= sevenDaysAgo;
  }).length;

  const goalProgress = Math.min(Math.round((jobsThisWeek / weeklyGoal) * 100), 100);

  // --- DAY 36: ANALYTICS LOGIC (Optimized) ---
  const activityData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(dateString => ({
      date: new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
      count: jobs.filter(j => j.date === dateString).length
    }));
  }, [jobs]);

  const maxActivity = Math.max(...activityData.map(d => d.count), 1);

  const filteredJobs = jobs.filter(j => {
    const matchesStatus = filterStatus === "All" || j.status === filterStatus;
    const matchesTitle = j.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesNotes = (j.notes || "").toLowerCase().includes(noteSearchTerm.toLowerCase());
    return matchesStatus && matchesTitle && matchesNotes;
  }).sort((a, b) => (b.isPriority === a.isPriority ? 0 : b.isPriority ? -1 : 1));

  const columns = {
    Applied: filteredJobs.filter(j => j.status === "Applied"),
    Interviewing: filteredJobs.filter(j => j.status === "Interviewing"),
    Offered: filteredJobs.filter(j => j.status === "Offered"),
    Rejected: filteredJobs.filter(j => j.status === "Rejected")
  };

  // --- 3. EFFECTS ---
  useEffect(() => localStorage.setItem("tsegaw-jobs", JSON.stringify(jobs)), [jobs]);
  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // --- 4. ACTIONS ---
  const exportData = () => {
    const dataBlob = new Blob([JSON.stringify(jobs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    toast.success("Backup downloaded!");
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (Array.isArray(imported)) { setJobs(imported); toast.success("Imported!"); }
      } catch (err) { toast.error("Error reading file."); }
    };
    reader.readAsText(file);
  };

  const onDragEnd = (result) => {
    const { destination, draggableId } = result;
    if (!destination) return;
    setJobs(prev => prev.map(job => 
      job.id.toString() === draggableId ? { ...job, status: destination.droppableId, lastModified: Date.now() } : job
    ));
  };

  const addJob = () => {
    if (!input.trim()) return toast.error("Enter a company!");
    const newJob = { id: Date.now(), title: input, status: "Applied", date: inputDate, salary: 0, notes: "", description: "", lastModified: Date.now() };
    setJobs([newJob, ...jobs]);
    setInput("");
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
          <button className="pill" onClick={exportData}>📤 Export</button>
          <label className="pill" style={{ cursor: 'pointer' }}>📥 Import
            <input type="file" accept=".json" onChange={importData} style={{ display: 'none' }} />
          </label>
          <button className="pill" onClick={() => setViewMode(viewMode === "board" ? "list" : "board")}>{viewMode === "board" ? "📑 List" : "📋 Board"}</button>
          <button className="pill" onClick={() => setIsDarkMode(!isDarkMode)}>{isDarkMode ? '🌙' : '☀️'}</button>
        </div>
      </header>

      <Stats totalJobs={totalJobs} interviewingCount={interviewingCount} offersCount={offersCount} successRate={successRate} jobsThisWeek={jobsThisWeek} weeklyGoal={weeklyGoal} goalProgress={goalProgress} />

      {/* DAY 36: VELOCITY CHART */}
      <div className="card velocity-chart">
        <h3>📈 Weekly Velocity</h3>
        <div className="chart-container">
          {activityData.map((day, i) => (
            <div key={i} className="chart-column">
              <div className="chart-bar" style={{ height: `${(day.count / maxActivity) * 80}px`, backgroundColor: day.count > 0 ? '#3498db' : '#eee' }}></div>
              <span className="day-name">{day.date}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card add-job-box">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Company..." />
        <input type="date" value={inputDate} onChange={(e) => setInputDate(e.target.value)} />
        <button onClick={addJob}>Add Job</button>
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
                            <div className="job-card-mini" ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
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
            <div key={job.id} className="job-item card">
              <CompanyLogo company={job.title} />
              <strong>{job.title}</strong>
              <button onClick={() => setEditingJob(job)}>📝</button>
            </div>
          ))}
        </div>
      )}

      {editingJob && (
        <div className="modal-overlay" onClick={() => setEditingJob(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Edit {editingJob.title}</h3>
            
            <label>📄 Job Description</label>
            <textarea 
              placeholder="Paste description..." 
              value={editingJob.description || ""} 
              className="modal-notes"
              onChange={(e) => updateEditingJobState({...editingJob, description: e.target.value})}
            />

            {/* DAY 37: KEYWORD MATCHES */}
            <div className="keyword-matches">
              <h4>🎯 Skill Match:</h4>
              <div className="badge-container">
                {findMatches(editingJob.description).map(skill => (
                  <span key={skill} className="skill-badge">{skill}</span>
                ))}
              </div>
            </div>

            <label>📝 Notes</label>
            <textarea value={editingJob.notes} className="modal-notes" onChange={(e) => updateEditingJobState({...editingJob, notes: e.target.value})} />
            <button onClick={() => setEditingJob(null)} className="save-btn">Save</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;