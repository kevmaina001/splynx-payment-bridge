import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Insert a new payment
export const insertPayment = mutation({
  args: {
    transaction_id: v.string(),
    client_id: v.string(),
    splynx_customer_id: v.optional(v.string()),
    amount: v.number(),
    currency_code: v.string(),
    payment_type: v.optional(v.string()),
    payment_method: v.optional(v.string()),
    created_at: v.string(),
  },
  handler: async (ctx, args) => {
    const paymentId = await ctx.db.insert("payments", {
      transaction_id: args.transaction_id,
      client_id: args.client_id,
      splynx_customer_id: args.splynx_customer_id,
      amount: args.amount,
      currency_code: args.currency_code,
      payment_type: args.payment_type,
      payment_method: args.payment_method,
      created_at: args.created_at,
      received_at: Date.now(),
      status: "pending",
      retry_count: 0,
    });
    return paymentId;
  },
});

// Update payment status
export const updatePaymentStatus = mutation({
  args: {
    transaction_id: v.string(),
    status: v.string(),
    uisp_response: v.optional(v.string()),
    error_message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_transaction_id", (q) =>
        q.eq("transaction_id", args.transaction_id)
      )
      .first();

    if (!payment) {
      throw new Error(`Payment not found: ${args.transaction_id}`);
    }

    await ctx.db.patch(payment._id, {
      status: args.status,
      uisp_response: args.uisp_response,
      error_message: args.error_message,
    });
  },
});

// Update retry count
export const updateRetryCount = mutation({
  args: {
    transaction_id: v.string(),
    retry_count: v.number(),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_transaction_id", (q) =>
        q.eq("transaction_id", args.transaction_id)
      )
      .first();

    if (!payment) {
      throw new Error(`Payment not found: ${args.transaction_id}`);
    }

    await ctx.db.patch(payment._id, {
      retry_count: args.retry_count,
      last_retry_at: Date.now(),
    });
  },
});

// Get all payments with pagination
export const getPayments = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const offset = args.offset ?? 0;

    const payments = await ctx.db
      .query("payments")
      .withIndex("by_received_at")
      .order("desc")
      .collect();

    return payments.slice(offset, offset + limit);
  },
});

// Get payment by transaction ID
export const getPaymentByTransactionId = query({
  args: {
    transaction_id: v.string(),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_transaction_id", (q) =>
        q.eq("transaction_id", args.transaction_id)
      )
      .first();

    return payment;
  },
});

// Get payments by client ID
export const getPaymentsByClientId = query({
  args: {
    client_id: v.string(),
  },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_client_id", (q) => q.eq("client_id", args.client_id))
      .order("desc")
      .collect();

    return payments;
  },
});

// Get payment statistics
export const getPaymentStats = query({
  handler: async (ctx) => {
    const payments = await ctx.db.query("payments").collect();

    const stats = {
      total_payments: payments.length,
      successful_payments: payments.filter((p) => p.status === "success").length,
      failed_payments: payments.filter((p) => p.status === "failed").length,
      pending_payments: payments.filter((p) => p.status === "pending").length,
      total_amount: payments.reduce((sum, p) => sum + p.amount, 0),
      successful_amount: payments
        .filter((p) => p.status === "success")
        .reduce((sum, p) => sum + p.amount, 0),
    };

    return stats;
  },
});
