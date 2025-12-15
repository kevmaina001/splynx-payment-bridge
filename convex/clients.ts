import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Query: Get all clients with pagination
export const getClients = query({
  args: {
    paginationOpts: v.optional(v.object({
      numItems: v.number(),
      cursor: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("clients")
      .order("desc")
      .paginate(args.paginationOpts || { numItems: 50 });

    return results;
  },
});

// Query: Get client by UISP client ID
export const getClientById = query({
  args: { uispClientId: v.string() },
  handler: async (ctx, args) => {
    const client = await ctx.db
      .query("clients")
      .withIndex("by_uisp_client_id", (q) => q.eq("uisp_client_id", args.uispClientId))
      .first();

    return client;
  },
});

// Query: Get client statistics
export const getClientStats = query({
  args: {},
  handler: async (ctx) => {
    const allClients = await ctx.db.query("clients").collect();

    const totalClients = allClients.length;
    const activeClients = allClients.filter(c => c.status === 'active').length;
    const suspendedClients = allClients.filter(c => c.status === 'suspended').length;

    // Calculate total balance
    const totalBalance = allClients.reduce((sum, client) => {
      return sum + (client.account_balance || 0);
    }, 0);

    return {
      totalClients,
      activeClients,
      suspendedClients,
      totalBalance,
    };
  },
});

// Query: Search clients by name or email
export const searchClients = query({
  args: {
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    const allClients = await ctx.db.query("clients").collect();

    const searchLower = args.searchTerm.toLowerCase();
    const filtered = allClients.filter(client => {
      const firstName = (client.first_name || '').toLowerCase();
      const lastName = (client.last_name || '').toLowerCase();
      const email = (client.email || '').toLowerCase();
      const uispId = (client.uisp_client_id || '').toLowerCase();

      return firstName.includes(searchLower) ||
             lastName.includes(searchLower) ||
             email.includes(searchLower) ||
             uispId.includes(searchLower);
    });

    return filtered;
  },
});

// Mutation: Upsert client (insert or update)
export const upsertClient = mutation({
  args: {
    uisp_client_id: v.string(),
    first_name: v.optional(v.string()),
    last_name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    status: v.optional(v.string()),
    account_balance: v.optional(v.number()),
    invoice_balance: v.optional(v.number()),
    last_sync: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if client exists
    const existing = await ctx.db
      .query("clients")
      .withIndex("by_uisp_client_id", (q) => q.eq("uisp_client_id", args.uisp_client_id))
      .first();

    if (existing) {
      // Update existing client
      await ctx.db.patch(existing._id, {
        first_name: args.first_name,
        last_name: args.last_name,
        email: args.email,
        phone: args.phone,
        status: args.status,
        account_balance: args.account_balance,
        invoice_balance: args.invoice_balance,
        last_sync: args.last_sync || Date.now(),
        updated_at: Date.now(),
      });

      return { id: existing._id, action: "updated" };
    } else {
      // Insert new client
      const id = await ctx.db.insert("clients", {
        uisp_client_id: args.uisp_client_id,
        first_name: args.first_name || "",
        last_name: args.last_name || "",
        email: args.email,
        phone: args.phone,
        status: args.status || "active",
        account_balance: args.account_balance || 0,
        invoice_balance: args.invoice_balance || 0,
        created_at: Date.now(),
        updated_at: Date.now(),
        last_sync: args.last_sync || Date.now(),
      });

      return { id, action: "inserted" };
    }
  },
});

// Mutation: Delete client
export const deleteClient = mutation({
  args: { uispClientId: v.string() },
  handler: async (ctx, args) => {
    const client = await ctx.db
      .query("clients")
      .withIndex("by_uisp_client_id", (q) => q.eq("uisp_client_id", args.uispClientId))
      .first();

    if (client) {
      await ctx.db.delete(client._id);
      return { success: true, message: "Client deleted" };
    }

    return { success: false, message: "Client not found" };
  },
});

// Mutation: Bulk upsert clients (for syncing from UISP)
export const bulkUpsertClients = mutation({
  args: {
    clients: v.array(v.object({
      uisp_client_id: v.string(),
      first_name: v.optional(v.string()),
      last_name: v.optional(v.string()),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      status: v.optional(v.string()),
      account_balance: v.optional(v.number()),
      invoice_balance: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    let insertedCount = 0;
    let updatedCount = 0;

    for (const clientData of args.clients) {
      const existing = await ctx.db
        .query("clients")
        .withIndex("by_uisp_client_id", (q) => q.eq("uisp_client_id", clientData.uisp_client_id))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          first_name: clientData.first_name,
          last_name: clientData.last_name,
          email: clientData.email,
          phone: clientData.phone,
          status: clientData.status,
          account_balance: clientData.account_balance,
          invoice_balance: clientData.invoice_balance,
          last_sync: Date.now(),
          updated_at: Date.now(),
        });
        updatedCount++;
      } else {
        await ctx.db.insert("clients", {
          uisp_client_id: clientData.uisp_client_id,
          first_name: clientData.first_name || "",
          last_name: clientData.last_name || "",
          email: clientData.email,
          phone: clientData.phone,
          status: clientData.status || "active",
          account_balance: clientData.account_balance || 0,
          invoice_balance: clientData.invoice_balance || 0,
          created_at: Date.now(),
          updated_at: Date.now(),
          last_sync: Date.now(),
        });
        insertedCount++;
      }
    }

    return {
      success: true,
      inserted: insertedCount,
      updated: updatedCount,
      total: args.clients.length,
    };
  },
});
