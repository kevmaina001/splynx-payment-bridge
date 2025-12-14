import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { clientAPI } from '../services/api'
import { RefreshCw, Search, Download, Users, CheckCircle, XCircle, Filter } from 'lucide-react'

function Clients() {
  const [clients, setClients] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all, active, suspended, inactive

  useEffect(() => {
    loadData()
  }, [statusFilter])

  const loadData = async () => {
    try {
      setLoading(true)

      // Build filters based on status filter
      const filters = {};
      if (statusFilter === 'active') {
        // Active clients (regardless of suspension status)
        filters.is_active = true;
      } else if (statusFilter === 'suspended') {
        // Suspended clients (can be active or inactive)
        filters.is_suspended = true;
      } else if (statusFilter === 'inactive') {
        // Archived/inactive clients
        filters.is_active = false;
      }
      // 'all' = no filters, fetch everything

      const [clientsData, statsData] = await Promise.all([
        clientAPI.getClients(500, 0, '', filters),
        clientAPI.getClientStats()
      ])

      setClients(clientsData.data)
      setStats(statsData.data)
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Error loading clients:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    try {
      setSyncing(true)
      await clientAPI.syncClients(false)

      alert('Client sync started in background! Check back in a few moments.')

      // Reload data after a delay
      setTimeout(loadData, 5000)
    } catch (err) {
      alert('Failed to start sync: ' + err.message)
    } finally {
      setSyncing(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const filteredClients = clients.filter(client => {
    if (!searchTerm) return true

    const term = searchTerm.toLowerCase()
    return (
      client.first_name?.toLowerCase().includes(term) ||
      client.last_name?.toLowerCase().includes(term) ||
      client.email?.toLowerCase().includes(term) ||
      client.company_name?.toLowerCase().includes(term) ||
      client.phone?.includes(term) ||
      client.uisp_id?.toString().includes(term)
    )
  })

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="clients-page">
      <div className="page-header">
        <h1 className="page-title">Clients</h1>
        <p className="page-description">Manage and view client information from UISP</p>
      </div>

      {stats && (
        <div className="stats-grid" style={{ marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Total Clients</span>
              <div className="stat-icon primary">
                <Users size={20} />
              </div>
            </div>
            <div className="stat-value">{stats.total_clients || 0}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Active</span>
              <div className="stat-icon success">
                <CheckCircle size={20} />
              </div>
            </div>
            <div className="stat-value">{stats.active_clients || 0}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Suspended</span>
              <div className="stat-icon error">
                <XCircle size={20} />
              </div>
            </div>
            <div className="stat-value">{stats.suspended_clients || 0}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Outstanding</span>
              <div className="stat-icon warning">
                <Download size={20} />
              </div>
            </div>
            <div className="stat-value" style={{ fontSize: '24px' }}>
              {formatCurrency(stats.total_outstanding)}
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '250px' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-secondary)'
                }}
              />
              <input
                type="text"
                className="search-input"
                placeholder="Search by name, email, phone, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '40px', width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select-input"
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Clients</option>
              <option value="active">Active Clients</option>
              <option value="suspended">Suspended Services</option>
              <option value="inactive">Archived/Inactive</option>
            </select>
          </div>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="button button-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={16} className={syncing ? 'spinning' : ''} />
            {syncing ? 'Syncing...' : 'Sync from UISP'}
          </button>

          <button
            onClick={loadData}
            className="button button-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          Error loading clients: {error}
        </div>
      )}

      <div className="card">
        <h2 style={{ marginBottom: '20px' }}>
          Clients ({filteredClients.length})
        </h2>

        {filteredClients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              {clients.length === 0
                ? 'No clients synced yet. Click "Sync from UISP" to fetch clients.'
                : 'No clients match your search.'
              }
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>Balance</th>
                  <th>Outstanding</th>
                  <th>Status</th>
                  <th>Last Synced</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <Link
                        to={`/clients/${client.uisp_id}`}
                        style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600' }}
                      >
                        {client.uisp_id}
                      </Link>
                    </td>
                    <td>
                      {client.company_name ||
                       (client.first_name && client.last_name
                         ? `${client.first_name} ${client.last_name}`
                         : client.first_name || client.last_name || 'N/A'
                       )}
                    </td>
                    <td>{client.email || 'N/A'}</td>
                    <td>{client.phone || 'N/A'}</td>
                    <td>{client.city || 'N/A'}</td>
                    <td>{formatCurrency(client.account_balance)}</td>
                    <td style={{
                      color: client.account_outstanding > 0 ? 'var(--error-color)' : 'inherit',
                      fontWeight: client.account_outstanding > 0 ? '600' : 'normal'
                    }}>
                      {formatCurrency(client.account_outstanding)}
                    </td>
                    <td>
                      {client.is_suspended ? (
                        <span className="badge badge-error">Suspended</span>
                      ) : client.is_active ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <span className="badge">Inactive</span>
                      )}
                    </td>
                    <td>{formatDate(client.synced_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinning {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  )
}

export default Clients
