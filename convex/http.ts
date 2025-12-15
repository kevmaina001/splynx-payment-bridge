import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

const http = httpRouter();

// HTTP action to receive payment data from the backend
http.route({
  path: "/webhooks/payment",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const paymentData = await request.json();

      // Insert payment into Convex
      const paymentId = await ctx.runMutation(api.payments.insertPayment, {
        transaction_id: paymentData.transaction_id,
        client_id: paymentData.client_id,
        splynx_customer_id: paymentData.splynx_customer_id,
        amount: parseFloat(paymentData.amount),
        currency_code: paymentData.currency_code || 'KES',
        payment_type: paymentData.payment_type,
        payment_method: paymentData.payment_method,
        created_at: paymentData.created_at,
        received_at: Date.now(),
        status: paymentData.status || 'pending',
        uisp_response: paymentData.uisp_response,
        error_message: paymentData.error_message,
        retry_count: paymentData.retry_count || 0,
        last_retry_at: paymentData.last_retry_at,
      });

      return new Response(JSON.stringify({
        success: true,
        paymentId,
        message: "Payment recorded in Convex"
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error: any) {
      console.error("Error in payment webhook:", error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  }),
});

// HTTP action to receive client sync data from the backend
http.route({
  path: "/webhooks/clients/bulk",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const { clients } = await request.json();

      // Bulk upsert clients
      const result = await ctx.runMutation(api.clients.bulkUpsertClients, {
        clients: clients.map((client: any) => ({
          uisp_client_id: client.uisp_client_id || client.id?.toString(),
          first_name: client.first_name || client.firstName,
          last_name: client.last_name || client.lastName,
          email: client.email,
          phone: client.phone,
          status: client.status || (client.isActive ? 'active' : 'inactive'),
          account_balance: client.account_balance || client.accountBalance || 0,
          invoice_balance: client.invoice_balance || client.invoiceBalance || 0,
        }))
      });

      return new Response(JSON.stringify({
        success: true,
        result,
        message: "Clients synced to Convex"
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error: any) {
      console.error("Error in clients bulk sync:", error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  }),
});

// HTTP action to log webhook events
http.route({
  path: "/webhooks/log",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const logData = await request.json();

      const logId = await ctx.runMutation(api.webhookLogs.createWebhookLog, {
        event_type: logData.event_type,
        payload: JSON.stringify(logData.payload),
        status: logData.status,
        response_code: logData.response_code,
        response_body: logData.response_body,
        error_message: logData.error_message,
        processing_time_ms: logData.processing_time_ms,
        received_at: Date.now(),
      });

      return new Response(JSON.stringify({
        success: true,
        logId,
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error: any) {
      console.error("Error logging webhook:", error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  }),
});

// HTTP action to update payment status
http.route({
  path: "/webhooks/payment/status",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const { transaction_id, status, uisp_response, error_message } = await request.json();

      // Find payment by transaction ID
      const payment = await ctx.runQuery(api.payments.getPaymentByTransactionId, {
        transactionId: transaction_id
      });

      if (!payment) {
        return new Response(JSON.stringify({
          success: false,
          error: "Payment not found"
        }), {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }

      // Update payment status
      await ctx.runMutation(api.payments.updatePaymentStatus, {
        paymentId: payment._id,
        status,
        uisp_response,
        error_message,
      });

      return new Response(JSON.stringify({
        success: true,
        message: "Payment status updated"
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error: any) {
      console.error("Error updating payment status:", error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  }),
});

export default http;
