import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import {
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign
} from 'lucide-react'

function Dashboard() {
  const stats = useQuery(api.payments.getPaymentStats)
  const recentPaymentsResult = useQuery(api.payments.getPayments, {
    paginationOpts: { numItems: 10 }
  })

  const loading = stats === undefined || recentPaymentsResult === undefined
  const recentPayments = recentPaymentsResult?.page || []

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
          <div className="stat-value">{stats?.totalPayments || 0}</div>
          <div className="stat-label">{formatCurrency(stats?.totalAmount)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Successful</span>
            <div className="stat-icon success">
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="stat-value">{stats?.successfulPayments || 0}</div>
          <div className="stat-label">{formatCurrency(stats?.successfulAmount)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Failed</span>
            <div className="stat-icon error">
              <XCircle size={20} />
            </div>
          </div>
          <div className="stat-value">{stats?.failedPayments || 0}</div>
          <div className="stat-label">Requires attention</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Pending</span>
            <div className="stat-icon warning">
              <Clock size={20} />
            </div>
          </div>
          <div className="stat-value">{stats?.pendingPayments || 0}</div>
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
                <tr key={payment._id}>
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
