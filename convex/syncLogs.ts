import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Query: Get recent sync logs with pagination
export const getSyncLogs = query({
  args: {
    paginationOpts: v.optional(v.object({
      numItems: v.number(),
      cursor: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("sync_logs")
      .withIndex("by_sync_time")
      .order("desc")
      .paginate(args.paginationOpts || { numItems: 50 });

    return results;
  },
});

// Query: Get sync logs by status
export const getSyncLogsByStatus = query({
  args: {
    status: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("sync_logs")
      .withIndex("by_sync_time")
      .order("desc")
      .collect();

    const filtered = logs.filter(log => log.status === args.status);

    if (args.limit) {
      return filtered.slice(0, args.limit);
    }

    return filtered;
  },
});

// Query: Get sync statistics
export const getSyncStats = query({
  args: {},
  handler: async (ctx) => {
    const allLogs = await ctx.db.query("sync_logs").collect();

    const totalSyncs = allLogs.length;
    const successfulSyncs = allLogs.filter(log => log.status === 'success').length;
    const failedSyncs = allLogs.filter(log => log.status === 'failed').length;

    // Get last sync time
    const sortedByTime = allLogs.sort((a, b) => b.sync_time - a.sync_time);
    const lastSyncTime = sortedByTime.length > 0 ? sortedByTime[0].sync_time : null;
    const lastSyncStatus = sortedByTime.length > 0 ? sortedByTime[0].status : null;

    // Calculate total records synced
    const totalRecordsSynced = allLogs.reduce((sum, log) => {
      return sum + (log.records_synced || 0);
    }, 0);

    return {
      totalSyncs,
      successfulSyncs,
      failedSyncs,
      lastSyncTime,
      lastSyncStatus,
      totalRecordsSynced,
    };
  },
});

// Query: Get last sync log
export const getLastSyncLog = query({
  args: {},
  handler: async (ctx) => {
    const lastLog = await ctx.db
      .query("sync_logs")
      .withIndex("by_sync_time")
      .order("desc")
      .first();

    return lastLog;
  },
});

// Mutation: Create sync log entry
export const createSyncLog = mutation({
  args: {
    sync_type: v.string(),
    status: v.string(),
    records_synced: v.optional(v.number()),
    error_message: v.optional(v.string()),
    sync_time: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("sync_logs", {
      sync_type: args.sync_type,
      status: args.status,
      records_synced: args.records_synced || 0,
      error_message: args.error_message,
      sync_time: args.sync_time || Date.now(),
    });

    return { id, success: true };
  },
});

// Mutation: Update sync log status
export const updateSyncLogStatus = mutation({
  args: {
    logId: v.id("sync_logs"),
    status: v.string(),
    records_synced: v.optional(v.number()),
    error_message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.logId, {
      status: args.status,
      records_synced: args.records_synced,
      error_message: args.error_message,
    });

    return { success: true };
  },
});

// Mutation: Delete old sync logs (keep last N days)
export const cleanupOldSyncLogs = mutation({
  args: {
    daysToKeep: v.number(),
  },
  handler: async (ctx, args) => {
    const cutoffTime = Date.now() - (args.daysToKeep * 24 * 60 * 60 * 1000);

    const oldLogs = await ctx.db
      .query("sync_logs")
      .withIndex("by_sync_time")
      .filter((q) => q.lt(q.field("sync_time"), cutoffTime))
      .collect();

    let deletedCount = 0;
    for (const log of oldLogs) {
      await ctx.db.delete(log._id);
      deletedCount++;
    }

    return {
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} sync logs older than ${args.daysToKeep} days`,
    };
  },
});
