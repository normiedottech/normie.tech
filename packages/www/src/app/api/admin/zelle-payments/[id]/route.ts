import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { zellePaymentsMetadata } from "@normie-tech/core";
import { eq } from "drizzle-orm";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { id } = params;

    const updatedPayment = await db
      .update(zellePaymentsMetadata)
      .set({
        amount: body.amount,
        payoutDetails: body.payoutDetails,
        errorMessage: body.errorMessage,
        successMessage: body.successMessage,
      })
      .where(eq(zellePaymentsMetadata.id, id))
      .returning();

    return NextResponse.json(updatedPayment[0]);
  } catch (error) {
    console.error("Error updating Zelle payment:", error);
    return NextResponse.json(
      { error: "Failed to update Zelle payment" },
      { status: 500 }
    );
  }
} 