import { useState } from 'react'
import './App.css'

function App() {
  const [jobs, setJobs] = useState([]);
  const [input, setInput] = useState("");

  const addJob = () => {
    if (input) {
      setJobs([...jobs, { id: Date.now(), title: input, status: "Applied" }]);
      setInput("");
    }
  };

  return (
    <div className="App">
      <h1>🚀 My Job Tracker</h1>
      <div className="card">
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Enter Job Title (e.g. React Developer)" 
        />
        <button onClick={addJob}>Add Job</button>
      </div>
      
      <ul>
        {jobs.map(job => (
          <li key={job.id}>
            <strong>{job.title}</strong> - {job.status} ✅
          </li>
        ))}
      </ul>
      {jobs.length === 0 && <p>No applications yet. Start hunting!</p>}
    </div>
  )
}

export default App