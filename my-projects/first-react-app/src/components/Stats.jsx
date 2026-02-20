export default function Stats({ totalJobs, interviewingCount, offersCount, successRate }) {
  return (
    <div className="stats-section">
      <div className="stats-container">
        <div className="stat-card"><span>Total</span><strong>{totalJobs}</strong></div>
        <div className="stat-card"><span>Interviews</span><strong>{interviewingCount}</strong></div>
        <div className="stat-card"><span>Offers</span><strong style={{color: '#4caf50'}}>{offersCount}</strong></div>
      </div>

      <div className="progress-container">
        <div className="progress-label">
          <span>Hunt Progress</span>
          <span>{successRate}% Success Rate</span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${successRate}%` }}></div>
        </div>
      </div>
    </div>
  );
}