import { useState, useEffect } from 'react';
import Stats from './components/Stats';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import { Toaster, toast } from 'react-hot-toast'; 
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import './App.css';

// Day 18: Salary Benchmarks
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

  const weeklyHistory = [3, 2, 1, 0].map(weekOffset => {
    const end = new Date();
    end.setDate(end.getDate() - (weekOffset * 7));
    const start = new Date();
    start.setDate(start.setDate() - ((weekOffset + 1) * 7));
    const count = jobs.filter(job => {
      const d = new Date(job.date);
      return d > start && d <= end;
    }).length;
    return { label: weekOffset === 0 ? "Now" : `${weekOffset}w ago`, count };
  });

  const filteredJobs = jobs.filter(j => 
    (filterStatus === "All" || j.status === filterStatus) && 
    j.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    localStorage.setItem("tsegaw-goal", weeklyGoal);
  }, [weeklyGoal]);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    if (jobsThisWeek >= weeklyGoal && jobsThisWeek > 0) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      toast.success("Weekly Goal Reached! 🏆", { duration: 4000 });
    }
  }, [jobsThisWeek, weeklyGoal]);

  // --- 4. ACTIONS ---
  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    
    setJobs(prevJobs => prevJobs.map(job => {
      if (job.id.toString() === draggableId) {
        if (job.status !== newStatus) toast.success(`Moved to ${newStatus}`);
        return { ...job, status: newStatus };
      }
      return job;
    }));
  };

  const addJob = () => {
    if (!input.trim()) {
      toast.error("Please enter a company name!");
      return;
    }

    // Day 19: Notes Template
    const notesTemplate = `✅ PROS: \n- \n\n❌ CONS: \n- \n\n🏢 CULTURE: \n- `;

    const newJob = { 
      id: Date.now(), 
      title: input, 
      status: "Applied",
      date: inputDate, 
      salary: 0, 
      notes: notesTemplate, 
      interviewDate: "",
      tasks: [] 
    };
    setJobs([newJob, ...jobs]);
    setInput("");
    toast.success(`Added ${input}! 🚀`);
  };

  const toggleStatus = (id) => {
    const statuses = ["Applied", "Interviewing", "Offered", "Rejected"];
    setJobs(jobs.map(job => {
      if (job.id === id) {
        const currentIndex = statuses.indexOf(job.status);
        const nextStatus = statuses[(currentIndex + 1) % statuses.length];
        toast(`Moved to ${nextStatus}`, { icon: '🔄' });
        return { ...job, status: nextStatus };
      }
      return job;
    }));
  };

  const shareStats = async () => {
    const toastId = toast.loading("Generating Image...");
    try {
      const element = document.getElementById('stats-summary');
      const canvas = await html2canvas(element, {
        backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `career-progress.png`;
      link.href = canvas.toDataURL();
      link.click();
      toast.success("Ready to share!", { id: toastId });
    } catch (e) {
      toast.error("Export failed", { id: toastId });
    }
  };

  const isInterviewSoon = (dateString) => {
    if (!dateString) return false;
    const diff = new Date(dateString) - new Date();
    return diff > 0 && diff < 86400000; // 24 Hours
  };

  const backupData = () => {
    const blob = new Blob([JSON.stringify(jobs)], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = "tsegaw_backup.json";
    link.click();
    toast.success("Backup downloaded!");
  };

  const restoreData = (e) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        setJobs(data);
        toast.success("Data Restored!");
      } catch(err) { toast.error("Invalid backup file."); }
    };
    reader.readAsText(e.target.files[0]);
  };

  const getDaysSince = (dateString) => {
    const diff = Math.abs(new Date() - new Date(dateString));
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="App">
      <Toaster position="bottom-right" reverseOrder={false} />

      <header className="header-nav">
        <h1>💼 Tsegaw's Tracker</h1>
        <div className="header-right">
          <button className="view-toggle-btn" onClick={() => setViewMode(viewMode === "board" ? "list" : "board")}>
            {viewMode === "board" ? "📑 List View" : "📋 Board View"}
          </button>
          <div className="pipeline-mini">💰 ${pipelineValue.toLocaleString()}</div>
          <label className="theme-switch">
            <input type="checkbox" onChange={() => setIsDarkMode(!isDarkMode)} checked={isDarkMode} />
            <div className="slider round">
              <span className="icon">{isDarkMode ? '🌙' : '☀️'}</span>
            </div>
          </label>
        </div>
      </header>

      <div className="stats-grid">
        <Stats 
          totalJobs={totalJobs} interviewingCount={interviewingCount} 
          offersCount={offersCount} successRate={successRate} 
          jobsThisWeek={jobsThisWeek} weeklyGoal={weeklyGoal}
          setWeeklyGoal={setWeeklyGoal} goalProgress={goalProgress}
          pipelineValue={pipelineValue}
        />
        
        <div className="card chart-box">
          <h3>📊 Weekly Activity</h3>
          <div className="chart-container">
            {weeklyHistory.map((w, i) => (
              <div key={i} className="chart-column">
                <div className="chart-bar" style={{ height: `${(w.count * 15) + 5}px` }}>
                  <span className="bar-value">{w.count}</span>
                </div>
                <span className="bar-label">{w.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="main-actions">
        <button onClick={shareStats} className="share-btn">📤 Export Stats Image</button>
      </div>

      <div className="card add-job-box">
        <input 
          type="text" value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Company Name..." 
          onKeyDown={(e) => e.key === 'Enter' && addJob()}
        />
        <input 
          type="date" className="date-input" 
          value={inputDate} onChange={(e) => setInputDate(e.target.value)} 
        />
        <button onClick={addJob}>Add Job</button>
      </div>

      <div className="controls-container">
        <input 
          className="search-bar" placeholder="🔍 Search applications..." 
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
        />
        <div className="status-pills">
          {["All", "Applied", "Interviewing", "Offered", "Rejected"].map(status => (
            <button 
              key={status} className={`pill ${filterStatus === status ? 'active' : ''}`}
              onClick={() => setFilterStatus(status)}
            >
              {status} <span className="pill-count">
                {status === "All" ? jobs.length : jobs.filter(j => j.status === status).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {viewMode === "board" ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="kanban-board">
            {Object.entries(columns).map(([status, columnJobs]) => (
              <Droppable droppableId={status} key={status}>
                {(provided) => (
                  <div 
                    className="kanban-column" 
                    {...provided.droppableProps} 
                    ref={provided.innerRef}
                  >
                    <h3 className={`column-title ${status.toLowerCase()}`}>
                      {status} <span>{columnJobs.length}</span>
                    </h3>
                    <div className="column-content">
                      {columnJobs.map((job, index) => (
                        <Draggable key={job.id} draggableId={job.id.toString()} index={index}>
                          {(provided) => (
                            <div 
                              className={`job-card-mini ${isInterviewSoon(job.interviewDate) ? 'interview-alert' : ''}`}
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              {isInterviewSoon(job.interviewDate) && <div className="alert-badge">⏰ INTERVIEW SOON</div>}
                              <div className="card-header">
                                <strong>{job.title}</strong>
                                <button onClick={() => setEditingJob(job)}>📝</button>
                              </div>
                              <div className="card-meta">
                                <small className={getDaysSince(job.date) > 7 ? 'text-warn' : ''}>
                                  {getDaysSince(job.date)}d ago
                                </small>
                                {job.salary > 0 && <span className="money-pill">${(job.salary/1000).toFixed(0)}k</span>}
                              </div>
                              <div className="card-actions">
                                <button onClick={() => toggleStatus(job.id)} className="next-btn">↻</button>
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
            <div key={job.id} className="job-item">
              <div className="job-info">
                <strong>{job.title}</strong>
                <span className={`badge ${job.status.toLowerCase()}`}>{job.status}</span>
              </div>
              <div className="actions">
                <button onClick={() => setEditingJob(job)}>📝</button>
                <button onClick={() => toggleStatus(job.id)}>↻</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingJob && (
        <div className="modal-overlay" onClick={() => setEditingJob(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-title-group">
                <h3>Edit: {editingJob.title}</h3>
                <button 
                  className="research-btn"
                  onClick={() => window.open(`https://www.google.com/search?q=${editingJob.title}+interview+questions+glassdoor`, '_blank')}
                >
                  🔍 Research
                </button>
              </div>
              <button className="close-x" onClick={() => setEditingJob(null)}>×</button>
            </div>

            <div className="modal-grid">
              <div className="modal-section">
                <label>💰 Salary Expectation</label>
                <input 
                  type="number" value={editingJob.salary || ""}
                  onChange={(e) => {
                      const updated = {...editingJob, salary: Number(e.target.value)};
                      setEditingJob(updated);
                      setJobs(jobs.map(j => j.id === editingJob.id ? updated : j));
                  }}
                  className="modal-input"
                />

                {editingJob.salary > 0 && (
                  <div className="salary-meter-container">
                    <div className="meter-labels">
                      <span>Jr</span>
                      <span>Mid</span>
                      <span>Sr</span>
                    </div>
                    <div className="meter-bar">
                      <div 
                        className="meter-pointer" 
                        style={{ 
                          left: `${Math.min((editingJob.salary / SALARY_BENCHMARKS.senior) * 100, 100)}%`,
                          backgroundColor: editingJob.salary >= SALARY_BENCHMARKS.mid ? '#2ecc71' : '#f1c40f'
                        }}
                      ></div>
                    </div>
                    <small className="meter-caption">
                      {editingJob.salary < SALARY_BENCHMARKS.mid ? "Competitive for Junior" : 
                      editingJob.salary < SALARY_BENCHMARKS.senior ? "Mid-Level Range" : "Senior-Level Range"}
                    </small>
                  </div>
                )}
                
                <label style={{marginTop: '15px', display: 'block'}}>📅 Interview Date</label>
                <input 
                  type="date" value={editingJob.interviewDate || ""}
                  onChange={(e) => {
                      const updated = {...editingJob, interviewDate: e.target.value};
                      setEditingJob(updated);
                      setJobs(jobs.map(j => j.id === editingJob.id ? updated : j));
                  }}
                  className="modal-input"
                />
              </div>

              <div className="modal-section checklist-section">
                <label>✅ Application Checklist</label>
                <input 
                  type="text" 
                  placeholder="Add task & hit Enter" 
                  className="modal-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      const updated = {
                        ...editingJob, 
                        tasks: [...(editingJob.tasks || []), { id: Date.now(), text: e.target.value, completed: false }]
                      };
                      setEditingJob(updated);
                      setJobs(jobs.map(j => j.id === editingJob.id ? updated : j));
                      e.target.value = "";
                    }
                  }}
                />
                <div className="tasks-list">
                  {(editingJob.tasks || []).map(task => (
                    <div key={task.id} className={`task-item ${task.completed ? 'done' : ''}`}>
                      <input 
                        type="checkbox" 
                        checked={task.completed} 
                        onChange={() => {
                          const updatedTasks = editingJob.tasks.map(t => 
                            t.id === task.id ? { ...t, completed: !t.completed } : t
                          );
                          const updated = { ...editingJob, tasks: updatedTasks };
                          setEditingJob(updated);
                          setJobs(jobs.map(j => j.id === editingJob.id ? updated : j));
                        }}
                      />
                      <span>{task.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Day 19: Notes Section with Reset Template */}
            <div className="modal-notes-header">
              <label>📝 Interview & Role Notes</label>
              <button 
                className="reset-template-btn"
                onClick={() => {
                  if(window.confirm("Reset notes to template?")) {
                    const template = `✅ PROS: \n- \n\n❌ CONS: \n- \n\n🏢 CULTURE: \n- `;
                    const updated = {...editingJob, notes: template};
                    setEditingJob(updated);
                    setJobs(jobs.map(j => j.id === editingJob.id ? updated : j));
                  }
                }}
              >
                ♻️ Reset Template
              </button>
            </div>
            <textarea 
              value={editingJob.notes} 
              className="modal-notes"
              placeholder="Details about the role..."
              onChange={(e) => {
                const updated = {...editingJob, notes: e.target.value};
                setEditingJob(updated);
                setJobs(jobs.map(j => j.id === editingJob.id ? updated : j));
              }}
            />
            <button onClick={() => setEditingJob(null)} className="save-btn">Save & Close</button>
          </div>
        </div>
      )}

      <footer className="footer-actions card">
        <div className="data-btns">
          <button onClick={backupData} className="btn-secondary">JSON Backup</button>
          <label className="btn-secondary upload-label">
            Restore <input type="file" onChange={restoreData} hidden />
          </label>
        </div>
        <button onClick={() => {
          if(window.confirm("Clear all?")) {
            setJobs([]);
            toast.success("Cleared everything");
          }
        }} className="clear-btn">Clear All</button>
      </footer>

      <div style={{ position: 'absolute', left: '-9999px' }}>
        <div id="stats-summary" style={{ padding: '20px', width: '400px', textAlign: 'center', background: 'white', color: 'black' }}>
          <h2>My Career Progress 🚀</h2>
          <p>Applied: {totalJobs} | Offers: {offersCount}</p>
          <p>Success Rate: {successRate}%</p>
        </div>
      </div>
    </div>
  );
}

export default App;