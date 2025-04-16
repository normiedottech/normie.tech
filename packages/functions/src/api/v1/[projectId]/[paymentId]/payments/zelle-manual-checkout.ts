import { checkoutBodySchema, ProjectRegistryKey } from "@normietech/core/config/project-registry/index";
import { payoutSettings, products, projects, projectSettings, transactions, zellePaymentsMetadata } from "@normietech/core/database/schema/index";
import { validateCheckout } from ".";
import { getPayoutSettings } from "@normietech/core/config/project-registry/utils";
import { nanoid } from "nanoid";
import { getDecimalsOfToken } from "@normietech/core/blockchain-client/index";
import { blockchainNamesSchema, USD_TOKEN_ADDRESSES } from "@normietech/core/wallet/types";
import { z } from "zod";

export const zelleManualCheckout = async (
    body: z.infer<typeof checkoutBodySchema>,
    projectId: ProjectRegistryKey | string,
    transaction: typeof transactions.$inferInsert | undefined,
    projectSetting: typeof projectSettings.$inferSelect | undefined,
    project: typeof projects.$inferSelect | undefined,
    metadataId: string,
    productId: string | undefined
  ) => {
    let newTransaction = await validateCheckout(
        body,
        projectId,
        transaction,
        projectSetting,
        project
    );
   
    const payoutSetting = await getPayoutSettings(projectId);
    switch (projectId) {
      default:
        if (payoutSetting.settlementType === "smart-contract") {
          throw new Error("Smart contract settlement not supported");
        }
        const token =
          USD_TOKEN_ADDRESSES[
            blockchainNamesSchema.parse(payoutSetting.blockchain)
          ];
  
        
        const decimals = await getDecimalsOfToken(
          payoutSetting.blockchain,
          token,
          payoutSetting.chainId
        );
  
        const finalAmountInToken =
          (newTransaction.amountInFiat ?? body.amount / 100) * 10 ** decimals;
        console.log(body.metadata,"metadata")
        newTransaction = {
          ...newTransaction,
          metadataJson: JSON.stringify(body.metadata),
          token: token,
          amountInToken: finalAmountInToken,
          decimals: decimals,
        };
        break;
    }
    const finalProducts = {
      id: nanoid(14),
      name: body.name,
      description: body.description,
      priceInFiat: newTransaction.amountInFiat ?? body.amount / 100,
      projectId: projectId,
    } as typeof products.$inferSelect;

    const zelleMetadata = {
      id: nanoid(14),
      transactionId: newTransaction.id,
      amount: newTransaction.amountInFiat ?? body.amount / 100,
      confirmationStatus:"not-started-by-sender",
      currency:"USD",
      errorMessage: null,
      successMessage: null,
    } as typeof zellePaymentsMetadata.$inferInsert;
  
    newTransaction = {
      ...newTransaction,
      productId: productId || finalProducts.id,
    };
    return {
      transaction: newTransaction,
      finalProducts: finalProducts,
      zelleMetadata: zelleMetadata,
    }
}