import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const TRUST_SWIFTLY_API_KEY = process.env.NEXT_PUBLIC_TRUST_SWIFTLY_API_KEY!;
const TEMPLATE_ID = process.env.NEXT_PUBLIC_TRUST_SWIFTLY_TEMPLATE_ID!;
const TRUST_SWIFTLY_BASE_URL = "https://verification.trustswiftly.com/api/users";

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email } = await req.json();

    const response = await axios.post(
      TRUST_SWIFTLY_BASE_URL,
      {
        first_name: firstName,
        last_name: lastName,
        email,
        template_id: TEMPLATE_ID,
      },
      {
        headers: {
          Authorization: `Bearer ${TRUST_SWIFTLY_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "Next.js-App",
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.response?.data || "Something went wrong" },
      { status: error.response?.status || 500 }
    );
  }
}
