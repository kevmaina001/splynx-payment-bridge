import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Payments from './pages/Payments'
import Clients from './pages/Clients'
import ClientDetails from './pages/ClientDetails'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <header className="header">
          <div className="container">
            <div className="header-content">
              <h1 className="logo">Payment Bridge</h1>
              <nav className="nav">
                <Link to="/" className="nav-link">Dashboard</Link>
                <Link to="/payments" className="nav-link">Payments</Link>
                <Link to="/clients" className="nav-link">Clients</Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="main">
          <div className="container">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/clients/:clientId" element={<ClientDetails />} />
            </Routes>
          </div>
        </main>

        <footer className="footer">
          <div className="container">
            <p>Splynx-UISP Payment Bridge &copy; 2024</p>
          </div>
        </footer>
      </div>
    </Router>
  )
}

export default App
