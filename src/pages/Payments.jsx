import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Search } from 'lucide-react'

function Payments() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const paymentsResult = useQuery(api.payments.getPayments, {
    paginationOpts: { numItems: 100 }
  })

  const loading = paymentsResult === undefined
  const payments = paymentsResult?.page || []

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

  const filteredPayments = payments.filter(payment => {
    const matchesSearch =
      payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.client_id?.toString().includes(searchTerm)

    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="payments-page">
      <div className="page-header">
        <h1 className="page-title">All Payments</h1>
        <p className="page-description">Complete payment history</p>
      </div>

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
                placeholder="Search by transaction ID or client ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '40px', width: '100%' }}
              />
            </div>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '12px 16px',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '20px' }}>
          Payments ({filteredPayments.length})
        </h2>

        {filteredPayments.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
            No payments found
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Client ID</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Payment Type</th>
                  <th>Status</th>
                  <th>Retries</th>
                  <th>Created</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment._id}>
                    <td>
                      <code style={{ fontSize: '12px' }}>{payment.transaction_id}</code>
                    </td>
                    <td>
                      <Link
                        to={`/clients/${payment.client_id}`}
                        style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '500' }}
                      >
                        {payment.client_id}
                      </Link>
                    </td>
                    <td style={{ fontWeight: '600' }}>{formatCurrency(payment.amount)}</td>
                    <td>{payment.currency_code}</td>
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
                    <td>{formatDate(payment.received_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Payments
