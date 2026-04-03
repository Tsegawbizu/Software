import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Stats from './components/Stats';
import confetti from 'canvas-confetti';
import { Toaster, toast } from 'react-hot-toast'; 
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import html2canvas from 'html2canvas'; 
import './App.css';

// --- HELPERS ---
const TECH_KEYWORDS = ["React", "Vite", "Tailwind", "JavaScript", "TypeScript", "Node.js", "CSS", "HTML", "Git", "API", "Firebase"];

const parseTags = (input) => {
  return input.split(',').map(tag => tag.trim()).filter(tag => tag !== "");
};

// Day 47: Countdown Logic
const getCountdown = (dateString) => {
  if (!dateString) return null;
  const now = new Date();
  const diff = new Date(dateString) - now;
  if (diff < 0) return { text: "Interview Passed", class: "past" };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  if (days > 0) return { text: `${days}d ${hours}h until interview`, class: "upcoming" };
  return { text: `${hours}h left! ⚡`, class: "imminent" };
};

const highlightText = (text, highlight) => {
  if (!highlight.trim()) return text;
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={i} className="search-highlight">{part}</mark>
        ) : ( part )
      )}
    </span>
  );
};

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

// --- OPTIMIZED JOB CARD ---
const JobCard = React.memo(({ job, index, setEditingJob, searchTerm, toggleArchive }) => {
  const countdown = getCountdown(job.interviewDate);
  return (
    <Draggable key={job.id} draggableId={job.id.toString()} index={index}>
      {(provided) => (
        <div className="job-card-mini" ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
          <div className="card-header">
            <CompanyLogo company={job.title} />
            <div style={{ flex: 1 }}>
              <strong>{highlightText(job.title, searchTerm)}</strong>
              <div className="card-tags-mini">
                {(job.tags || []).slice(0, 2).map(tag => (
                  <span key={tag} className="job-tag">#{tag}</span>
                ))}
              </div>
              {countdown && (
                <div className={`interview-badge ${countdown.class}`}>
                  🗓️ {countdown.text}
                </div>
              )}
            </div>
            <div className="card-actions">
                <button title="Edit" onClick={() => setEditingJob(job)}>📝</button>
                <button title={job.isArchived ? "Unarchive" : "Archive"} onClick={() => toggleArchive(job.id)}>
                    {job.isArchived ? "📤" : "📥"}
                </button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
});

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
  const [searchTerm, setSearchTerm] = useState("");
  const [editingJob, setEditingJob] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);

  // --- SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isTyping = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
      if (e.key === 'n' && !isTyping) { e.preventDefault(); document.querySelector('.add-job-input')?.focus(); }
      if (e.key === '/' && !isTyping) { e.preventDefault(); document.querySelector('.search-input')?.focus(); }
      if (e.key === 'Escape') { setSearchTerm(""); setEditingJob(null); }
      if (e.key === 't' && !isTyping) { setIsDarkMode(prev => !prev); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- PERSISTENCE ---
  useEffect(() => localStorage.setItem("tsegaw-jobs", JSON.stringify(jobs)), [jobs]);
  useEffect(() => localStorage.setItem("tsegaw-columns", JSON.stringify(columnOrder)), [columnOrder]);
  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // --- CALCULATIONS ---
  const interviewingCount = jobs.filter(j => j.status === "Interviewing").length;
  const offersCount = jobs.filter(j => j.status === "Offered").length;
  const successRate = jobs.length > 0 ? Math.round(((interviewingCount + offersCount) / jobs.length) * 100) : 0;
  const allUniqueTags = useMemo(() => [...new Set(jobs.flatMap(job => job.tags || []))], [jobs]);
  const jobsThisWeek = useMemo(() => jobs.filter(job => new Date(job.date) >= new Date(new Date().setDate(new Date().getDate() - 7))).length, [jobs]);
  
  const activityData = useMemo(() => {
    const last7 = [...Array(7)].map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();
    return last7.map(ds => ({
      date: new Date(ds + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
      count: jobs.filter(j => j.date === ds).length
    }));
  }, [jobs]);

  const maxActivity = Math.max(...activityData.map(d => d.count), 1);

  const filteredJobs = useMemo(() => jobs.filter(j => {
    const matchesTitle = j.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => (j.tags || []).includes(tag));
    const matchesArchive = showArchived ? j.isArchived : !j.isArchived;
    return matchesTitle && matchesTags && matchesArchive;
  }), [jobs, searchTerm, selectedTags, showArchived]);

  const columns = useMemo(() => {
    const cols = {};
    columnOrder.forEach(status => cols[status] = filteredJobs.filter(j => j.status === status));
    return cols;
  }, [filteredJobs, columnOrder]);

  // --- ACTIONS ---
  const generateReport = async () => {
    const element = document.querySelector(".report-area");
    if (!element) return;
    const canvas = await html2canvas(element, { backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff", scale: 2 });
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `Career-Report-${new Date().toISOString().split('T')[0]}.png`;
    link.click();
    toast.success("Success Report Captured! 📸");
    confetti();
  };

  const toggleArchive = (id) => {
    setJobs(prev => prev.map(job => job.id === id ? { ...job, isArchived: !job.isArchived } : job));
    toast.success(showArchived ? "Restored" : "Archived");
  };

  const updateEditingJobState = useCallback((updated) => {
    setEditingJob(updated);
    setJobs(prev => prev.map(j => j.id === updated.id ? updated : j));
  }, []);

  return (
    <div className="App">
      <Toaster position="bottom-right" />
      <header className="header-nav">
        <h1>💼 Career Tracker</h1>
        <div className="header-right">
          <button className={`pill ${showArchived ? 'warning-btn' : ''}`} onClick={() => setShowArchived(!showArchived)}>
            {showArchived ? "🔙 Board" : "📦 Archive"}
          </button>
          <button className="pill success-btn" onClick={generateReport}>📸 Capture Report</button>
          <button className="pill" onClick={() => setViewMode(viewMode === "board" ? "list" : "board")}>
            {viewMode === "board" ? "📑 List" : "📋 Board"}
          </button>
          <button className="pill" onClick={() => setIsDarkMode(!isDarkMode)}>{isDarkMode ? '🌙' : '☀️'}</button>
        </div>
      </header>

      <div className="report-area">
        <Stats totalJobs={jobs.length} interviewingCount={interviewingCount} offersCount={offersCount} successRate={successRate} jobsThisWeek={jobsThisWeek} weeklyGoal={weeklyGoal} goalProgress={Math.min(Math.round((jobsThisWeek / weeklyGoal) * 100), 100)} />
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
      </div>

      {allUniqueTags.length > 0 && (
        <div className="tag-filter-bar card">
          <span style={{ fontSize: '12px', opacity: 0.7 }}>Filter: </span>
          {allUniqueTags.map(tag => (
            <button key={tag} className={`tag-pill ${selectedTags.includes(tag) ? 'active' : ''}`} onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}>
              #{tag}
            </button>
          ))}
          {selectedTags.length > 0 && <button className="clear-tags" onClick={() => setSelectedTags([])}>Clear</button>}
        </div>
      )}

      <div className="card column-manager">
        <input type="text" placeholder="+ Add custom status..." onKeyDown={(e) => { if (e.key === 'Enter' && e.target.value.trim()) { setColumnOrder([...columnOrder, e.target.value.trim()]); e.target.value = ""; toast.success("Column added!"); } }} />
      </div>

      <div className="card add-job-box">
        <input type="text" className="add-job-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="New company..." />
        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search..." className="search-input" />
        <input type="date" value={inputDate} onChange={(e) => setInputDate(e.target.value)} />
        <button onClick={() => { if (!input.trim()) return toast.error("Enter a company!"); setJobs([{ id: Date.now(), title: input, status: columnOrder[0], date: inputDate, tags: [], isArchived: false, lastModified: Date.now() }, ...jobs]); setInput(""); }}>Add Job</button>
      </div>

      {viewMode === "board" ? (
        <DragDropContext onDragEnd={(result) => { if (!result.destination) return; setJobs(prev => prev.map(job => job.id.toString() === result.draggableId ? { ...job, status: result.destination.droppableId, lastModified: Date.now() } : job)); }}>
          <div className="kanban-board">
            {Object.entries(columns).map(([status, columnJobs]) => (
              <Droppable droppableId={status} key={status}>
                {(provided) => (
                  <div className="kanban-column" {...provided.droppableProps} ref={provided.innerRef}>
                    <div className="column-header-row">
                        <h3 className="column-title">{status} <span>{columnJobs.length}</span></h3>
                        <button className="del-col-btn" onClick={() => { if (columnJobs.length > 0) return toast.error("Column is not empty!"); setColumnOrder(columnOrder.filter(c => c !== status)); }}>×</button>
                    </div>
                    <div className="column-content">
                      {columnJobs.map((job, index) => <JobCard key={job.id} job={job} index={index} setEditingJob={setEditingJob} searchTerm={searchTerm} toggleArchive={toggleArchive} />)}
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
              <strong>{highlightText(job.title, searchTerm)}</strong>
              <div className="card-actions">
                <button onClick={() => setEditingJob(job)}>📝</button>
                <button onClick={() => toggleArchive(job.id)}>{job.isArchived ? "📤" : "📥"}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingJob && (
        <div className="modal-overlay" onClick={() => setEditingJob(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Edit {editingJob.title}</h3>
            <label>📅 Interview Date</label>
            <input type="datetime-local" value={editingJob.interviewDate || ""} className="modal-input" onChange={(e) => updateEditingJobState({...editingJob, interviewDate: e.target.value})} />
            <label>🏷️ Tags</label>
            <input type="text" value={(editingJob.tags || []).join(', ')} className="modal-input" onChange={(e) => updateEditingJobState({...editingJob, tags: parseTags(e.target.value)})} />
            <label>📄 Notes</label>
            <textarea value={editingJob.description || ""} className="modal-notes" onChange={(e) => updateEditingJobState({...editingJob, description: e.target.value})} />
            <button onClick={() => setEditingJob(null)} className="save-btn">Save Changes</button>
          </div>
        </div>
      )}

      <footer className="shortcut-legend">
        <span>⌨️ <strong>N</strong>: New | 🔍 <strong>/</strong>: Search | 🌓 <strong>T</strong>: Theme | ❌ <strong>Esc</strong>: Close</span>
      </footer>
    </div>
  );
}

export default App;