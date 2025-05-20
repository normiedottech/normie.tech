import { Hono } from 'hono';
import { PHOENIX_DEFAULT_USDC_ADDRESS, PHOENIX_DEFAULT_CHAIN_ID, PhoenixClient } from '@normietech/core/phoenix/index';
import { db } from '@normietech/core/database/index';
import { transactions, zellePaymentsMetadata } from '@normietech/core/database/schema/index';
import { eq } from 'drizzle-orm';
import { getAddress } from '@normietech/core/wallet/index';
import { formatUnits, parseUnits } from 'viem';
import { Order } from '@normietech/core/phoenix/index';
import { PhoenixError } from '@normietech/core/phoenix/index';


const phoenixClient = new PhoenixClient();

const phoenixDetailsOrderApp = new Hono();

// GET endpoint to fetch Zelle payment metadata
phoenixDetailsOrderApp.get('/:transactionId', async (c) => {
  try {
    const transactionId = c.req.param('transactionId');
    if (!transactionId) {
      return c.json(
        { error: 'Transaction ID is required' },
        400
      );
    }

    const zelleMetadata = await db.query.zellePaymentsMetadata.findFirst({
      where: eq(zellePaymentsMetadata.transactionId, transactionId)
    });

    if (!zelleMetadata) {
      return c.json({
        success: false,
        error: "Zelle payment metadata not found"
      }, 404);
    }

    return c.json({
      success: true,
      data: zelleMetadata
    });
  } catch (error) {
    console.error('Error fetching Zelle payment metadata:', error);
    return c.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch Zelle payment metadata' 
      },
      500
    );
  }
});

phoenixDetailsOrderApp.post('/', async (c) => {
  try {
    console.log("zelle-pheonix-payment-details-update")
    const  {transactionId} = await c.req.json<{transactionId:string}>()
    if (!transactionId) {
      return c.json(
        { error: 'Transaction ID is required' },
        400
      );
    }
    const transaction = await db.query.transactions.findFirst({ 
      where:eq(transactions.id,transactionId)
    })
    if(!transaction){
      return c.json({
        success:false,
        error:"Transaction not found"
      },404)
    }
    if(!transaction.amountInFiat){
      return c.json({
        success:false,
        error:"Transaction amount not found"
      },404)
    }
    if(transaction.status === "fiat-confirmed" || transaction.status === "confirmed-onchain"){
      return c.json({
        success:false,
        error:"Transaction already confirmed"
      },400)
    }
    const zelleMetadata = await db.query.zellePaymentsMetadata.findFirst({
      where:eq(zellePaymentsMetadata.transactionId,transactionId)
    })
    if(transaction.externalPaymentProviderId){
      return c.json({
        success:false,
        error:"Transaction already has an external payment provider id"
      },400)
    }
    if(!zelleMetadata){
      return c.json({
        success:false,
        error:"Zelle payment metadata not found"
      },404)
    }
    if(zelleMetadata.confirmationStatus === "payment-confirmed-by-admin" || zelleMetadata.confirmationStatus === "payment-confirmed-by-sender"){
      return c.json({
        success:false,
        error:"Zelle payment metadata is not in wait-for-payment-details status"
      },400)
    }
    // Get order details from Phoenix
    let referralId: string | undefined;
     
    const createOrderWithAdjustedAmount = async (amount: string, attempt: number = 0): Promise<{ order: Order | null; randomAmount: number }> => {
      try {
        const order = await phoenixClient.createOrder({
          minimumAmountOut: amount,
          outputToken:{
            address:PHOENIX_DEFAULT_USDC_ADDRESS,
            chain:{
              id:PHOENIX_DEFAULT_CHAIN_ID
            }
          },
          recipient:{
            wallet:{
              address:getAddress("reserve")
            }
          },
          verificationMethod:"teller-zelle-payment-verified-by-seller"
        });
        return { order, randomAmount: 0 };
      } catch (error) {
        if (error instanceof PhoenixError && 
            error.apiError?.code === 'out_of_range' && 
            attempt < 3) {
          // Add random amount between 0-30 cents
          console.log("out_of_range",attempt,"vgbjhnjlkm")
          const randomCents = Math.floor(Math.random() * 31) / 100; // Random number between 0-0.30
          const adjustedAmount = parseUnits(
            (parseFloat(formatUnits(BigInt(amount), transaction.decimals)) + randomCents).toString(),
            transaction.decimals
          ).toString();
          
          const result = await createOrderWithAdjustedAmount(adjustedAmount, attempt + 1);
          return { 
            order: result.order, 
            randomAmount: result.randomAmount + randomCents 
          };
        }
        console.log("error", error);
        return { order: null, randomAmount: 0 };
      }
    };

    const { order, randomAmount } = await createOrderWithAdjustedAmount(
      parseUnits(transaction.amountInFiat.toString(), transaction.decimals).toString()
    );
    
    console.log("order", order);
    
    if(!order){
        return c.json({
            success:false,
            error:"Order not found"
        },404)
    }
    if(order.orderStatus.status !=="pending"){
        return c.json({
            success:false,
            error:"Order is not pending"
        },400)
    }
    
    await db.batch([
        db.update(zellePaymentsMetadata).set({
            confirmationStatus:"wait-for-payment-details",
            payoutDetails:order.seller.zelleDetails.zelleAddress,
            amount:parseFloat(order.inputAmount),
            uniquenessAmount: randomAmount
        }).where(eq(zellePaymentsMetadata.transactionId,transactionId)),
        db.update(transactions).set({
        amountInFiat:parseFloat(order.inputAmount),
        externalPaymentProviderId:order.id,
        }).where(eq(transactions.id,transactionId))
    ])
    
    return c.json({
      success: true,
      data: {
        orderId: order.id,
        status: order.orderStatus.status,
        amount: order.minimumAmountOut,
        recipientAddress: order.recipient.wallet.address,
        createdAt: order.createdAt,
        verificationMethod: order.verificationMethod,
        orderFulfillment: order.orderFulfillment,
        orderVerification: order.orderVerification
      }
    });
  } catch (error) {
    console.error('Error fetching Phoenix order details:', error);
    return c.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch order details' 
      },
      500
    );
  }
});

export default phoenixDetailsOrderApp;
