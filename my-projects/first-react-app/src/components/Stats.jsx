import React from 'react';

/**
 * Stats Component
 * Displays the job search dashboard metrics and weekly goal progress.
 */
export default function Stats({ 
  totalJobs, 
  interviewingCount, 
  offersCount, 
  successRate, 
  jobsThisWeek, 
  weeklyGoal, 
  setWeeklyGoal, 
  goalProgress, 
  pipelineValue 
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
          <strong className="salary-text">
            ${pipelineValue ? pipelineValue.toLocaleString() : '0'}
          </strong>
        </div>
        
        <div className="stat-card success">
          <span>Offers</span>
          <strong className="offer-highlight">{offersCount}</strong>
        </div>
      </div>

      {/* 2. Goal Tracker Section */}
      <div className="goal-tracker card">
        <div className="goal-header">
          <span>
            Weekly Goal: <strong>{jobsThisWeek} / {weeklyGoal}</strong>
          </span>
          <input 
            type="number" 
            min="1"
            value={weeklyGoal} 
            onChange={(e) => setWeeklyGoal(parseInt(e.target.value) || 1)}
            title="Set Weekly Goal"
            className="goal-input"
          />
        </div>
        
        {/* Progress Bar Container */}
        <div className="progress-bar-bg">
          <div 
            className={`progress-bar-fill goal-fill ${goalProgress >= 100 ? 'completed' : ''}`} 
            style={{ 
              width: `${goalProgress}%`, 
              background: goalProgress >= 100 ? '#4caf50' : '#3498db' 
            }}
          ></div>
        </div>
        
        {/* Dynamic Hint Message */}
        <p className="goal-hint">
          {goalProgress >= 100 
            ? "🎉 Weekly goal reached! Keep it up!" 
            : `${Math.max(0, weeklyGoal - jobsThisWeek)} more to go this week.`}
        </p>
      </div>
    </div>
    
  );
}
<div className="card velocity-chart">
  <h3>📈 Application Velocity (Last 7 Days)</h3>
  <div className="chart-container">
    {activityData.map((day, index) => (
      <div key={index} className="chart-column">
        <div 
          className="chart-bar" 
          style={{ 
            height: `${(day.count / maxActivity) * 80}px`,
            backgroundColor: day.count > 0 ? '#3498db' : '#ecf0f1'
          }}
          title={`${day.count} applications`}
        >
          {day.count > 0 && <span className="bar-label">{day.count}</span>}
        </div>
        <span className="day-name">{day.date}</span>
      </div>
    ))}
  </div>
</div>