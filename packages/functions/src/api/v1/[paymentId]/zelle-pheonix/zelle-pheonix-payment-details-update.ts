import { Hono } from 'hono';
import { PHOENIX_DEFAULT_USDC_ADDRESS, PHOENIX_DEFAULT_CHAIN_ID, PhoenixClient } from '@normietech/core/phoenix/index';
import { db } from '@normietech/core/database/index';
import { transactions, zellePaymentsMetadata } from '@normietech/core/database/schema/index';
import { eq } from 'drizzle-orm';
import { getAddress } from '@normietech/core/wallet/index';
import { formatUnits, parseUnits } from 'viem';


const phoenixClient = new PhoenixClient();

const phoenixDetailsOrderApp = new Hono();
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
    // Get order details from Phoenix
    console.log("transaction",transaction)

    let referralId: string | undefined;
     
   
    const order = await phoenixClient.createOrder({
      minimumAmountOut: parseUnits(transaction.amountInFiat.toString(),transaction.decimals).toString(),
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
    })
    

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
