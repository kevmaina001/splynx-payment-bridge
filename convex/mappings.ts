import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Query: Get all customer mappings
export const getAllMappings = query({
  args: {},
  handler: async (ctx) => {
    const mappings = await ctx.db
      .query("customer_mappings")
      .order("desc")
      .collect();

    return mappings;
  },
});

// Query: Get UISP client ID by Splynx customer ID
export const getUispClientId = query({
  args: { splynxCustomerId: v.string() },
  handler: async (ctx, args) => {
    const mapping = await ctx.db
      .query("customer_mappings")
      .withIndex("by_splynx_customer_id", (q) => q.eq("splynx_customer_id", args.splynxCustomerId))
      .first();

    return mapping ? mapping.uisp_client_id : null;
  },
});

// Query: Get mapping by Splynx customer ID (full object)
export const getMappingBySpynxId = query({
  args: { splynxCustomerId: v.string() },
  handler: async (ctx, args) => {
    const mapping = await ctx.db
      .query("customer_mappings")
      .withIndex("by_splynx_customer_id", (q) => q.eq("splynx_customer_id", args.splynxCustomerId))
      .first();

    return mapping;
  },
});

// Query: Get mapping by UISP client ID
export const getMappingByUispId = query({
  args: { uispClientId: v.string() },
  handler: async (ctx, args) => {
    const mapping = await ctx.db
      .query("customer_mappings")
      .withIndex("by_uisp_client_id", (q) => q.eq("uisp_client_id", args.uispClientId))
      .first();

    return mapping;
  },
});

// Mutation: Create or update customer mapping
export const upsertCustomerMapping = mutation({
  args: {
    splynx_customer_id: v.string(),
    uisp_client_id: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if mapping exists
    const existing = await ctx.db
      .query("customer_mappings")
      .withIndex("by_splynx_customer_id", (q) => q.eq("splynx_customer_id", args.splynx_customer_id))
      .first();

    if (existing) {
      // Update existing mapping
      await ctx.db.patch(existing._id, {
        uisp_client_id: args.uisp_client_id,
        notes: args.notes,
        updated_at: Date.now(),
      });

      return {
        id: existing._id,
        action: "updated",
        splynx_customer_id: args.splynx_customer_id,
        uisp_client_id: args.uisp_client_id,
      };
    } else {
      // Insert new mapping
      const id = await ctx.db.insert("customer_mappings", {
        splynx_customer_id: args.splynx_customer_id,
        uisp_client_id: args.uisp_client_id,
        notes: args.notes,
        created_at: Date.now(),
        updated_at: Date.now(),
      });

      return {
        id,
        action: "inserted",
        splynx_customer_id: args.splynx_customer_id,
        uisp_client_id: args.uisp_client_id,
      };
    }
  },
});

// Mutation: Delete customer mapping
export const deleteCustomerMapping = mutation({
  args: { splynxCustomerId: v.string() },
  handler: async (ctx, args) => {
    const mapping = await ctx.db
      .query("customer_mappings")
      .withIndex("by_splynx_customer_id", (q) => q.eq("splynx_customer_id", args.splynxCustomerId))
      .first();

    if (mapping) {
      await ctx.db.delete(mapping._id);
      return { success: true, message: "Mapping deleted" };
    }

    return { success: false, message: "Mapping not found" };
  },
});

// Mutation: Bulk create mappings
export const bulkCreateMappings = mutation({
  args: {
    mappings: v.array(v.object({
      splynx_customer_id: v.string(),
      uisp_client_id: v.string(),
      notes: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const mappingData of args.mappings) {
      const existing = await ctx.db
        .query("customer_mappings")
        .withIndex("by_splynx_customer_id", (q) => q.eq("splynx_customer_id", mappingData.splynx_customer_id))
        .first();

      if (existing) {
        // Update if different
        if (existing.uisp_client_id !== mappingData.uisp_client_id) {
          await ctx.db.patch(existing._id, {
            uisp_client_id: mappingData.uisp_client_id,
            notes: mappingData.notes,
            updated_at: Date.now(),
          });
          updatedCount++;
        } else {
          skippedCount++;
        }
      } else {
        // Insert new
        await ctx.db.insert("customer_mappings", {
          splynx_customer_id: mappingData.splynx_customer_id,
          uisp_client_id: mappingData.uisp_client_id,
          notes: mappingData.notes,
          created_at: Date.now(),
          updated_at: Date.now(),
        });
        insertedCount++;
      }
    }

    return {
      success: true,
      inserted: insertedCount,
      updated: updatedCount,
      skipped: skippedCount,
      total: args.mappings.length,
    };
  },
});

// Mutation: Insert default mappings (Splynx 838 -> UISP 1211)
export const insertDefaultMappings = mutation({
  args: {},
  handler: async (ctx) => {
    const defaultMapping = {
      splynx_customer_id: "838",
      uisp_client_id: "1211",
      notes: "Default mapping - configured during setup",
    };

    // Check if it exists
    const existing = await ctx.db
      .query("customer_mappings")
      .withIndex("by_splynx_customer_id", (q) => q.eq("splynx_customer_id", defaultMapping.splynx_customer_id))
      .first();

    if (!existing) {
      const id = await ctx.db.insert("customer_mappings", {
        ...defaultMapping,
        created_at: Date.now(),
        updated_at: Date.now(),
      });

      return {
        success: true,
        action: "inserted",
        id,
        message: "Default mapping created"
      };
    }

    return {
      success: true,
      action: "exists",
      id: existing._id,
      message: "Default mapping already exists"
    };
  },
});
