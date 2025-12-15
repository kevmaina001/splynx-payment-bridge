import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Query: Get webhook logs with pagination
export const getWebhookLogs = query({
  args: {
    paginationOpts: v.optional(v.object({
      numItems: v.number(),
      cursor: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("webhook_logs")
      .withIndex("by_received_at")
      .order("desc")
      .paginate(args.paginationOpts || { numItems: 100 });

    return results;
  },
});

// Query: Get webhook logs by event type
export const getWebhookLogsByEvent = query({
  args: {
    eventType: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("webhook_logs")
      .withIndex("by_received_at")
      .order("desc")
      .collect();

    const filtered = logs.filter(log => log.event_type === args.eventType);

    if (args.limit) {
      return filtered.slice(0, args.limit);
    }

    return filtered;
  },
});

// Query: Get webhook statistics
export const getWebhookStats = query({
  args: {},
  handler: async (ctx) => {
    const allLogs = await ctx.db.query("webhook_logs").collect();

    const totalWebhooks = allLogs.length;
    const successfulWebhooks = allLogs.filter(log => log.status === 'success').length;
    const failedWebhooks = allLogs.filter(log => log.status === 'failed').length;
    const processingWebhooks = allLogs.filter(log => log.status === 'processing').length;

    // Get last webhook time
    const sortedByTime = allLogs.sort((a, b) => b.received_at - a.received_at);
    const lastWebhookTime = sortedByTime.length > 0 ? sortedByTime[0].received_at : null;
    const lastWebhookStatus = sortedByTime.length > 0 ? sortedByTime[0].status : null;

    // Count by event type
    const eventTypeCounts: Record<string, number> = {};
    allLogs.forEach(log => {
      const type = log.event_type || 'unknown';
      eventTypeCounts[type] = (eventTypeCounts[type] || 0) + 1;
    });

    return {
      totalWebhooks,
      successfulWebhooks,
      failedWebhooks,
      processingWebhooks,
      lastWebhookTime,
      lastWebhookStatus,
      eventTypeCounts,
    };
  },
});

// Query: Get recent failed webhooks
export const getFailedWebhooks = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("webhook_logs")
      .withIndex("by_received_at")
      .order("desc")
      .collect();

    const failed = logs.filter(log => log.status === 'failed');

    if (args.limit) {
      return failed.slice(0, args.limit);
    }

    return failed;
  },
});

// Mutation: Create webhook log entry
export const createWebhookLog = mutation({
  args: {
    event_type: v.string(),
    payload: v.string(),
    status: v.string(),
    response_code: v.optional(v.number()),
    response_body: v.optional(v.string()),
    error_message: v.optional(v.string()),
    processing_time_ms: v.optional(v.number()),
    received_at: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("webhook_logs", {
      event_type: args.event_type,
      payload: args.payload,
      status: args.status,
      response_code: args.response_code,
      response_body: args.response_body,
      error_message: args.error_message,
      processing_time_ms: args.processing_time_ms,
      received_at: args.received_at || Date.now(),
    });

    return { id, success: true };
  },
});

// Mutation: Update webhook log status
export const updateWebhookLogStatus = mutation({
  args: {
    logId: v.id("webhook_logs"),
    status: v.string(),
    response_code: v.optional(v.number()),
    response_body: v.optional(v.string()),
    error_message: v.optional(v.string()),
    processing_time_ms: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.logId, {
      status: args.status,
      response_code: args.response_code,
      response_body: args.response_body,
      error_message: args.error_message,
      processing_time_ms: args.processing_time_ms,
    });

    return { success: true };
  },
});

// Mutation: Delete old webhook logs (keep last N days)
export const cleanupOldWebhookLogs = mutation({
  args: {
    daysToKeep: v.number(),
  },
  handler: async (ctx, args) => {
    const cutoffTime = Date.now() - (args.daysToKeep * 24 * 60 * 60 * 1000);

    const oldLogs = await ctx.db
      .query("webhook_logs")
      .withIndex("by_received_at")
      .filter((q) => q.lt(q.field("received_at"), cutoffTime))
      .collect();

    let deletedCount = 0;
    for (const log of oldLogs) {
      await ctx.db.delete(log._id);
      deletedCount++;
    }

    return {
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} webhook logs older than ${args.daysToKeep} days`,
    };
  },
});

// Query: Search webhook logs by transaction ID or client ID
export const searchWebhookLogs = query({
  args: {
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    const allLogs = await ctx.db
      .query("webhook_logs")
      .withIndex("by_received_at")
      .order("desc")
      .collect();

    const searchLower = args.searchTerm.toLowerCase();
    const filtered = allLogs.filter(log => {
      const payload = (log.payload || '').toLowerCase();
      const eventType = (log.event_type || '').toLowerCase();
      const errorMessage = (log.error_message || '').toLowerCase();

      return payload.includes(searchLower) ||
             eventType.includes(searchLower) ||
             errorMessage.includes(searchLower);
    });

    return filtered;
  },
});
