import { NavLink, Route, Routes } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Intake from './pages/Intake';
import Household from './pages/Household';
import Documents from './pages/Documents';
import Eligibility from './pages/Eligibility';
import RiskFlags from './pages/RiskFlags';
import Summary from './pages/Summary';
import Queue from './pages/Queue';
import PilotBrief from './pages/PilotBrief';

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        SNAP AI
        <small>Benefits Processing Support</small>
      </div>
      <NavLink to="/" end>Landing</NavLink>
      <NavLink to="/dashboard">Caseworker Dashboard</NavLink>
      <NavLink to="/intake">Applicant Intake</NavLink>
      <NavLink to="/household">Household Members</NavLink>
      <NavLink to="/documents">Document Review</NavLink>
      <NavLink to="/eligibility">Eligibility Pre-Screen</NavLink>
      <NavLink to="/risk">Risk / Integrity Flags</NavLink>
      <NavLink to="/summary">AI Case Summary</NavLink>
      <NavLink to="/queue">Human Review Queue</NavLink>
      <NavLink to="/pilot">Pilot Brief</NavLink>
      <div className="footer">
        Decision support only.<br />
        Final decisions: agency staff.<br />
        <span className="kbd">v0.1 demo</span>
      </div>
    </aside>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/intake" element={<Intake />} />
          <Route path="/household" element={<Household />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/eligibility" element={<Eligibility />} />
          <Route path="/risk" element={<RiskFlags />} />
          <Route path="/summary" element={<Summary />} />
          <Route path="/queue" element={<Queue />} />
          <Route path="/pilot" element={<PilotBrief />} />
        </Routes>
      </main>
    </div>
  );
}
