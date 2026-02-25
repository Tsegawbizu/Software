export default function Stats({ 
  totalJobs, interviewingCount, offersCount, successRate, 
  jobsThisWeek, weeklyGoal, setWeeklyGoal, goalProgress, pipelineValue 
}) {
  return (
    <div className="stats-section" id="stats-summary">
      {/* 1. Main Stats Cards */}
      <div className="stats-container">
        <div className="stat-card">
          <span>Total Apps</span>
          <strong>{totalJobs}</strong>
        </div>
        <div className="stat-card">
          <span>Interviews</span>
          <strong>{interviewingCount}</strong>
        </div>
        <div className="stat-card highlight">
          <span>Potential Salary</span>
          <strong className="salary-text">${pipelineValue.toLocaleString()}</strong>
        </div>
        <div className="stat-card success">
          <span>Offers</span>
          <strong className="offer-highlight">{offersCount}</strong>
        </div>
      </div>

      {/* 2. Goal Tracker Section */}
      <div className="goal-tracker card">
        <div className="goal-header">
          <span>Weekly Goal: <strong>{jobsThisWeek} / {weeklyGoal}</strong></span>
          <input 
            type="number" 
            min="1"
            value={weeklyGoal} 
            onChange={(e) => setWeeklyGoal(parseInt(e.target.value) || 1)}
            title="Set Weekly Goal"
            className="goal-input"
          />
        </div>
        
        <div className="progress-bar-bg">
          <div 
            className={`progress-bar-fill goal-fill ${goalProgress >= 100 ? 'completed' : ''}`} 
            style={{ 
              width: `${goalProgress}%`, 
              background: goalProgress >= 100 ? '#4caf50' : '#3498db' 
            }}
          ></div>
        </div>
        
        <p className="goal-hint">
          {goalProgress >= 100 
            ? "🎉 Weekly goal reached! Keep it up!" 
            : `${Math.max(0, weeklyGoal - jobsThisWeek)} more to go this week.`}
        </p>
      </div>
    </div>
  );
}