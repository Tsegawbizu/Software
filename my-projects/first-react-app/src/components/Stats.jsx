export default function Stats({ 
  totalJobs, interviewingCount, offersCount, successRate, 
  jobsThisWeek, weeklyGoal, setWeeklyGoal, goalProgress 
}) {
  return (
    <div className="stats-section">
      {/* Top Cards Section */}
      <div className="stats-container">
        <div className="stat-card">
          <span>Total</span>
          <strong>{totalJobs}</strong>
        </div>
        <div className="stat-card">
          <span>Interviews</span>
          <strong>{interviewingCount}</strong>
        </div>
        <div className="stat-card">
          <span>Offers</span>
          <strong className="offer-highlight">{offersCount}</strong>
        </div>
      </div>

      {/* Goal Tracker Section */}
      <div className="goal-tracker card">
        <div className="goal-header">
          <span>Weekly Goal: <strong>{jobsThisWeek} / {weeklyGoal}</strong></span>
          <input 
            type="number" 
            min="1"
            value={weeklyGoal} 
            onChange={(e) => setWeeklyGoal(parseInt(e.target.value) || 1)}
            title="Set Weekly Goal"
          />
        </div>
        
        <div className="progress-bar-bg">
          <div 
            className={`progress-bar-fill goal-fill ${goalProgress >= 100 ? 'completed' : ''}`} 
            style={{ 
              width: `${goalProgress}%`, 
              // Inline override if you haven't added the .completed CSS yet
              background: goalProgress >= 100 ? '#4caf50' : '#3498db' 
            }}
          ></div>
        </div>
        
        <p className="goal-hint">
          {goalProgress >= 100 
            ? "🎉 Weekly goal reached! Keep it up!" 
            : `${weeklyGoal - jobsThisWeek} more to go this week.`}
        </p>
      </div>
    </div>
  );
}