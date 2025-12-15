import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Payments table
  payments: defineTable({
    transaction_id: v.string(),
    client_id: v.string(),
    splynx_customer_id: v.optional(v.string()),
    amount: v.number(),
    currency_code: v.string(),
    payment_type: v.optional(v.string()),
    payment_method: v.optional(v.string()),
    created_at: v.string(),
    received_at: v.number(), // timestamp
    status: v.string(), // "pending", "success", "failed"
    uisp_response: v.optional(v.string()),
    error_message: v.optional(v.string()),
    retry_count: v.number(),
    last_retry_at: v.optional(v.number()),
  })
    .index("by_transaction_id", ["transaction_id"])
    .index("by_client_id", ["client_id"])
    .index("by_status", ["status"])
    .index("by_received_at", ["received_at"]),

  // Clients table
  clients: defineTable({
    uisp_id: v.number(),
    first_name: v.optional(v.string()),
    last_name: v.optional(v.string()),
    company_name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    street1: v.optional(v.string()),
    street2: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    state: v.optional(v.string()),
    zip_code: v.optional(v.string()),
    balance: v.number(),
    account_balance: v.number(),
    account_outstanding: v.number(),
    currency_code: v.string(),
    is_active: v.boolean(),
    is_suspended: v.boolean(),
    registration_date: v.optional(v.string()),
    previous_isp: v.optional(v.string()),
    tax_id: v.optional(v.string()),
    company_tax_id: v.optional(v.string()),
    note: v.optional(v.string()),
    synced_at: v.number(), // timestamp
    last_payment_at: v.optional(v.number()),
    uisp_data: v.optional(v.string()), // JSON string
  })
    .index("by_uisp_id", ["uisp_id"])
    .index("by_email", ["email"])
    .index("by_is_active", ["is_active"])
    .index("by_is_suspended", ["is_suspended"])
    .index("by_synced_at", ["synced_at"]),

  // Customer mappings (Splynx ID -> UISP ID)
  customer_mappings: defineTable({
    splynx_customer_id: v.string(),
    uisp_client_id: v.number(),
    notes: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_splynx_customer_id", ["splynx_customer_id"])
    .index("by_uisp_client_id", ["uisp_client_id"]),

  // Sync logs
  sync_logs: defineTable({
    sync_type: v.string(),
    started_at: v.number(),
    completed_at: v.optional(v.number()),
    status: v.string(), // "in_progress", "completed", "failed"
    total_records: v.number(),
    synced_records: v.number(),
    failed_records: v.number(),
    error_message: v.optional(v.string()),
  }).index("by_started_at", ["started_at"]),

  // Webhook logs
  webhook_logs: defineTable({
    received_at: v.number(),
    payload: v.string(), // JSON string
    headers: v.string(), // JSON string
    ip_address: v.optional(v.string()),
    validated: v.boolean(),
    processed: v.boolean(),
    error_message: v.optional(v.string()),
  }).index("by_received_at", ["received_at"]),
});
