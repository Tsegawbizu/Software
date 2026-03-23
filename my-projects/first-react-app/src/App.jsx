import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Stats from './components/Stats';
import confetti from 'canvas-confetti';
import { Toaster, toast } from 'react-hot-toast'; 
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import './App.css';

// --- HELPERS (Days 37 & 39) ---
const TECH_KEYWORDS = ["React", "Vite", "Tailwind", "JavaScript", "TypeScript", "Node.js", "CSS", "HTML", "Git", "API", "Firebase"];

const findMatches = (text) => {
  if (!text) return [];
  return TECH_KEYWORDS.filter(skill => text.toLowerCase().includes(skill.toLowerCase()));
};

const parseTags = (input) => {
  return input.split(',').map(tag => tag.trim()).filter(tag => tag !== "");
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

// --- DAY 38: OPTIMIZED JOB CARD ---
const JobCard = React.memo(({ job, index, setEditingJob }) => {
  return (
    <Draggable key={job.id} draggableId={job.id.toString()} index={index}>
      {(provided) => (
        <div 
          className="job-card-mini" 
          ref={provided.innerRef} 
          {...provided.draggableProps} 
          {...provided.dragHandleProps}
        >
          <div className="card-header">
            <CompanyLogo company={job.title} />
            <div style={{ flex: 1 }}>
              <strong>{job.title}</strong>
              <div className="card-tags-mini">
                {(job.tags || []).slice(0, 2).map(tag => (
                  <span key={tag} className="job-tag">#{tag}</span>
                ))}
              </div>
            </div>
            <button onClick={() => setEditingJob(job)}>📝</button>
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

  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const [weeklyGoal, setWeeklyGoal] = useState(() => parseInt(localStorage.getItem("tsegaw-goal")) || 5);
  const [viewMode, setViewMode] = useState("board"); 
  const [input, setInput] = useState("");
  const [inputDate, setInputDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [noteSearchTerm, setNoteSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [editingJob, setEditingJob] = useState(null);

  // --- CALCULATED DATA ---
  const totalJobs = jobs.length;
  const interviewingCount = jobs.filter(j => j.status === "Interviewing").length;
  const offersCount = jobs.filter(j => j.status === "Offered").length;
  const successRate = totalJobs > 0 ? Math.round(((interviewingCount + offersCount) / totalJobs) * 100) : 0;

  const jobsThisWeek = useMemo(() => {
    return jobs.filter(job => {
      const jobDate = new Date(job.date);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return jobDate >= sevenDaysAgo;
    }).length;
  }, [jobs]);

  const goalProgress = Math.min(Math.round((jobsThisWeek / weeklyGoal) * 100), 100);

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

  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      const matchesStatus = filterStatus === "All" || j.status === filterStatus;
      const matchesTitle = j.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesNotes = (j.notes || "").toLowerCase().includes(noteSearchTerm.toLowerCase());
      return matchesStatus && matchesTitle && matchesNotes;
    });
  }, [jobs, filterStatus, searchTerm, noteSearchTerm]);

  const columns = useMemo(() => ({
    Applied: filteredJobs.filter(j => j.status === "Applied"),
    Interviewing: filteredJobs.filter(j => j.status === "Interviewing"),
    Offered: filteredJobs.filter(j => j.status === "Offered"),
    Rejected: filteredJobs.filter(j => j.status === "Rejected")
  }), [filteredJobs]);

  // --- ACTIONS ---
  useEffect(() => localStorage.setItem("tsegaw-jobs", JSON.stringify(jobs)), [jobs]);
  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // DAY 40: Timeline tracking on drag
  const onDragEnd = (result) => {
    const { destination, draggableId } = result;
    if (!destination) return;

    setJobs(prev => prev.map(job => {
      if (job.id.toString() === draggableId) {
        const newStatus = destination.droppableId;
        const newHistory = job.status !== newStatus 
          ? [...(job.history || []), { status: newStatus, date: new Date().toISOString() }]
          : (job.history || []);

        return { ...job, status: newStatus, history: newHistory, lastModified: Date.now() };
      }
      return job;
    }));
  };

  const updateEditingJobState = useCallback((updated) => {
    setEditingJob(updated);
    setJobs(prevJobs => prevJobs.map(j => j.id === updated.id ? updated : j));
  }, []);

  return (
    <div className="App">
      <Toaster position="bottom-right" />
      <header className="header-nav">
        <h1>💼 Career Tracker</h1>
        <div className="header-right">
          <button className="pill" onClick={() => setViewMode(viewMode === "board" ? "list" : "board")}>
            {viewMode === "board" ? "📑 List" : "📋 Board"}
          </button>
          <button className="pill" onClick={() => setIsDarkMode(!isDarkMode)}>{isDarkMode ? '🌙' : '☀️'}</button>
        </div>
      </header>

      <Stats totalJobs={totalJobs} interviewingCount={interviewingCount} offersCount={offersCount} successRate={successRate} jobsThisWeek={jobsThisWeek} weeklyGoal={weeklyGoal} goalProgress={goalProgress} />

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
        <button onClick={() => {
           if (!input.trim()) return toast.error("Enter a company!");
           setJobs([{ id: Date.now(), title: input, status: "Applied", date: inputDate, tags: [], history: [], lastModified: Date.now() }, ...jobs]);
           setInput("");
        }}>Add Job</button>
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
                        <JobCard key={job.id} job={job} index={index} setEditingJob={setEditingJob} />
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
            
            <label>🏷️ Tags (comma separated)</label>
            <input 
              type="text" 
              value={(editingJob.tags || []).join(', ')} 
              className="modal-input"
              onChange={(e) => updateEditingJobState({...editingJob, tags: parseTags(e.target.value)})}
            />

            <label>📄 Job Description</label>
            <textarea 
              value={editingJob.description || ""} 
              className="modal-notes"
              onChange={(e) => updateEditingJobState({...editingJob, description: e.target.value})}
            />

            {/* DAY 40: JOURNEY TRACKER */}
            <div className="timeline-section">
              <h4>🛤️ Application Journey</h4>
              <div className="vertical-timeline">
                <div className="timeline-item">
                  <span className="timeline-date">{new Date(editingJob.date).toLocaleDateString()}</span>
                  <span className="timeline-status">Applied</span>
                </div>
                {(editingJob.history || []).map((event, i) => (
                  <div key={i} className="timeline-item">
                    <span className="timeline-date">{new Date(event.date).toLocaleDateString()}</span>
                    <span className="timeline-status">{event.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setEditingJob(null)} className="save-btn">Save</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;