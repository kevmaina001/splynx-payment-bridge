import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { paymentAPI } from '../services/api'
import {
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign
} from 'lucide-react'

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recentPayments, setRecentPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [statsData, paymentsData] = await Promise.all([
        paymentAPI.getStats(),
        paymentAPI.getPayments(10, 0)
      ])

      setStats(statsData.data)
      setRecentPayments(paymentsData.data)
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Error loading dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusBadge = (status) => {
    const statusClasses = {
      success: 'badge badge-success',
      failed: 'badge badge-error',
      pending: 'badge badge-pending'
    }
    return <span className={statusClasses[status] || 'badge'}>{status}</span>
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-message">
        Error loading dashboard: {error}
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">Overview of payment processing</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Total Payments</span>
            <div className="stat-icon primary">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="stat-value">{stats?.total_payments || 0}</div>
          <div className="stat-label">{formatCurrency(stats?.total_amount)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Successful</span>
            <div className="stat-icon success">
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="stat-value">{stats?.successful_payments || 0}</div>
          <div className="stat-label">{formatCurrency(stats?.successful_amount)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Failed</span>
            <div className="stat-icon error">
              <XCircle size={20} />
            </div>
          </div>
          <div className="stat-value">{stats?.failed_payments || 0}</div>
          <div className="stat-label">Requires attention</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Pending</span>
            <div className="stat-icon warning">
              <Clock size={20} />
            </div>
          </div>
          <div className="stat-value">{stats?.pending_payments || 0}</div>
          <div className="stat-label">In progress</div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Recent Payments</h2>
          <Link to="/payments" className="button button-primary">View All</Link>
        </div>

        {recentPayments.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
            No payments yet
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Client ID</th>
                <th>Amount</th>
                <th>Payment Type</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.map((payment) => (
                <tr key={payment.id}>
                  <td>
                    <code>{payment.transaction_id}</code>
                  </td>
                  <td>
                    <Link
                      to={`/clients/${payment.client_id}`}
                      style={{ color: 'var(--primary-color)', textDecoration: 'none' }}
                    >
                      {payment.client_id}
                    </Link>
                  </td>
                  <td>{formatCurrency(payment.amount)}</td>
                  <td>{payment.payment_type || 'N/A'}</td>
                  <td>{getStatusBadge(payment.status)}</td>
                  <td>{formatDate(payment.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default Dashboard
