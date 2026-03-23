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

// --- DAY 43: HIGHLIGHT ENGINE ---
const highlightText = (text, highlight) => {
  if (!highlight.trim()) return text;
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={i} className="search-highlight">{part}</mark>
        ) : (
          part
        )
      )}
    </span>
  );
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

// --- OPTIMIZED JOB CARD ---
const JobCard = React.memo(({ job, index, setEditingJob, searchTerm }) => {
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
              <strong>{highlightText(job.title, searchTerm)}</strong>
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
  // --- STATE ---
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
  const [input, setInput] = useState("");
  const [inputDate, setInputDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingJob, setEditingJob] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);

  // --- DAY 45: KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isTyping = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';

      if (e.key === 'n' && !isTyping) {
        e.preventDefault();
        document.querySelector('.add-job-input')?.focus();
        toast("Focusing New Job...", { icon: '⌨️' });
      }

      if (e.key === '/' && !isTyping) {
        e.preventDefault();
        document.querySelector('.search-input')?.focus();
        toast("Focusing Search...", { icon: '🔍' });
      }

      if (e.key === 'Escape') {
        setSearchTerm("");
        setEditingJob(null);
      }

      if (e.key === 't' && !isTyping) {
        setIsDarkMode(prev => !prev);
      }
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
  const totalJobs = jobs.length;
  const interviewingCount = jobs.filter(j => j.status === "Interviewing").length;
  const offersCount = jobs.filter(j => j.status === "Offered").length;
  const successRate = totalJobs > 0 ? Math.round(((interviewingCount + offersCount) / totalJobs) * 100) : 0;

  const allUniqueTags = useMemo(() => {
    const tags = jobs.flatMap(job => job.tags || []);
    return [...new Set(tags)];
  }, [jobs]);

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

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
      const matchesTitle = j.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.every(tag => (j.tags || []).includes(tag));
      return matchesTitle && matchesTags;
    });
  }, [jobs, searchTerm, selectedTags]);

  const columns = useMemo(() => {
    const cols = {};
    columnOrder.forEach(status => {
      cols[status] = filteredJobs.filter(j => j.status === status);
    });
    return cols;
  }, [filteredJobs, columnOrder]);

  // --- ACTIONS ---
  const generateReport = async () => {
    const element = document.querySelector(".report-area");
    if (!element) return;
    try {
      const canvas = await html2canvas(element, {
        backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
        scale: 2,
      });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `Career-Report-${new Date().toISOString().split('T')[0]}.png`;
      link.click();
      toast.success("Success Report Generated! 🚀");
      confetti();
    } catch (err) {
      toast.error("Failed to generate report.");
    }
  };

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
          <button className="pill success-btn" onClick={generateReport}>📸 Capture Report</button>
          <button className="pill" onClick={() => setViewMode(viewMode === "board" ? "list" : "board")}>
            {viewMode === "board" ? "📑 List" : "📋 Board"}
          </button>
          <button className="pill" onClick={() => setIsDarkMode(!isDarkMode)}>{isDarkMode ? '🌙' : '☀️'}</button>
        </div>
      </header>

      <div className="report-area">
        <Stats 
          totalJobs={totalJobs} 
          interviewingCount={interviewingCount} 
          offersCount={offersCount} 
          successRate={successRate} 
          jobsThisWeek={jobsThisWeek} 
          weeklyGoal={weeklyGoal} 
          goalProgress={goalProgress} 
        />

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
          <span style={{ fontSize: '12px', opacity: 0.7 }}>Filter by Tags: </span>
          {allUniqueTags.map(tag => (
            <button 
              key={tag} 
              className={`tag-pill ${selectedTags.includes(tag) ? 'active' : ''}`}
              onClick={() => toggleTag(tag)}
            >
              #{tag}
            </button>
          ))}
          {selectedTags.length > 0 && (
            <button className="clear-tags" onClick={() => setSelectedTags([])}>Clear</button>
          )}
        </div>
      )}

      <div className="card column-manager">
        <input 
          type="text" 
          placeholder="+ Add custom board status (e.g. Technical Test)..." 
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
              if (columnOrder.includes(e.target.value.trim())) return toast.error("Column already exists!");
              setColumnOrder([...columnOrder, e.target.value.trim()]);
              e.target.value = "";
              toast.success("New column added!");
            }
          }}
        />
      </div>

      <div className="card add-job-box">
        <input 
          type="text" 
          className="add-job-input"
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="New company..." 
        />
        <input 
          type="text" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          placeholder="Search on board..." 
          className="search-input"
        />
        <input type="date" value={inputDate} onChange={(e) => setInputDate(e.target.value)} />
        <button onClick={() => {
           if (!input.trim()) return toast.error("Enter a company!");
           setJobs([{ id: Date.now(), title: input, status: columnOrder[0], date: inputDate, tags: [], history: [], lastModified: Date.now() }, ...jobs]);
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
                    <div className="column-header-row">
                      <h3 className="column-title">{status} <span>{columnJobs.length}</span></h3>
                      <button className="del-col-btn" onClick={() => {
                        if (columnJobs.length > 0) return toast.error("Cannot delete non-empty column!");
                        setColumnOrder(columnOrder.filter(c => c !== status));
                      }}>×</button>
                    </div>
                    <div className="column-content">
                      {columnJobs.map((job, index) => (
                        <JobCard 
                          key={job.id} 
                          job={job} 
                          index={index} 
                          setEditingJob={setEditingJob} 
                          searchTerm={searchTerm} 
                        />
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
              <strong>{highlightText(job.title, searchTerm)}</strong>
              <button onClick={() => setEditingJob(job)}>📝</button>
            </div>
          ))}
        </div>
      )}

      {editingJob && (
        <div className="modal-overlay" onClick={() => setEditingJob(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Edit {editingJob.title}</h3>
            <label>🏷️ Tags</label>
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
            <button onClick={() => setEditingJob(null)} className="save-btn">Save</button>
          </div>
        </div>
      )}

      {/* Day 45: Shortcut Legend */}
      <footer className="shortcut-legend">
        <span>⌨️ <strong>N</strong>: New Job</span>
        <span>🔍 <strong>/</strong>: Search</span>
        <span>🌓 <strong>T</strong>: Toggle Theme</span>
        <span>❌ <strong>Esc</strong>: Clear/Close</span>
      </footer>
    </div>
  );
}

export default App;