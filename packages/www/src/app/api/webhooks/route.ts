import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log("Webhook Event Received:", payload);

    return NextResponse.json({ status: "Received" });
  } catch (error) {
    return NextResponse.json({ error: "Invalid Webhook Data" }, { status: 400 });
  }
}
