import { useParams, Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { ArrowLeft, User, DollarSign, Calendar } from 'lucide-react'

function ClientDetails() {
  const { clientId } = useParams()

  const clientPayments = useQuery(api.payments.getPaymentsByClientId, {
    clientId: clientId
  })

  const loading = clientPayments === undefined

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

  const calculateStats = () => {
    if (!clientPayments || clientPayments.length === 0) {
      return {
        totalPayments: 0,
        totalAmount: 0,
        successfulPayments: 0,
        successfulAmount: 0,
        failedPayments: 0,
        pendingPayments: 0
      }
    }

    const total = clientPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
    const successful = clientPayments.filter(p => p.status === 'success')
    const successfulAmount = successful.reduce((sum, p) => sum + parseFloat(p.amount), 0)

    return {
      totalPayments: clientPayments.length,
      totalAmount: total,
      successfulPayments: successful.length,
      successfulAmount: successfulAmount,
      failedPayments: clientPayments.filter(p => p.status === 'failed').length,
      pendingPayments: clientPayments.filter(p => p.status === 'pending').length
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  const stats = calculateStats()
  const payments = clientPayments || []

  return (
    <div className="client-details">
      <div style={{ marginBottom: '24px' }}>
        <Link
          to="/payments"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--primary-color)',
            textDecoration: 'none',
            marginBottom: '16px'
          }}
        >
          <ArrowLeft size={16} />
          Back to Payments
        </Link>

        <div className="page-header">
          <h1 className="page-title">Client {clientId}</h1>
          <p className="page-description">Payment history and details</p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Total Payments</span>
            <div className="stat-icon primary">
              <Calendar size={20} />
            </div>
          </div>
          <div className="stat-value">{stats.totalPayments}</div>
          <div className="stat-label">{formatCurrency(stats.totalAmount)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Successful</span>
            <div className="stat-icon success">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="stat-value">{stats.successfulPayments}</div>
          <div className="stat-label">{formatCurrency(stats.successfulAmount)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Failed</span>
            <div className="stat-icon error">
              <User size={20} />
            </div>
          </div>
          <div className="stat-value">{stats.failedPayments}</div>
          <div className="stat-label">Requires attention</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Pending</span>
            <div className="stat-icon warning">
              <Calendar size={20} />
            </div>
          </div>
          <div className="stat-value">{stats.pendingPayments}</div>
          <div className="stat-label">In progress</div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '20px' }}>Payment History</h2>

        {payments.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
            No payments found for this client
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Amount</th>
                <th>Payment Type</th>
                <th>Status</th>
                <th>Retries</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment._id}>
                  <td>
                    <code style={{ fontSize: '12px' }}>{payment.transaction_id}</code>
                  </td>
                  <td style={{ fontWeight: '600' }}>{formatCurrency(payment.amount)}</td>
                  <td>{payment.payment_type || 'N/A'}</td>
                  <td>{getStatusBadge(payment.status)}</td>
                  <td>
                    {payment.retry_count > 0 ? (
                      <span style={{ color: 'var(--warning-color)', fontWeight: '600' }}>
                        {payment.retry_count}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)' }}>0</span>
                    )}
                  </td>
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

export default ClientDetails
