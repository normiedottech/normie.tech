import { AuthForm } from "@/components/auth/auth-form";
import { auth } from "@/server/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { saveReferral } from "../actions/auth";
import Link from "next/link";
import BookNoahACall from "@/components/aryan-component/book-a-call";
import { Button } from "@/components/ui/button";

export default async function Page({
  searchParams,
}: {
  searchParams: { referral?: string };
}) {
  const session = await auth();
  if (session && !session?.user.projectId) {
    redirect("/dashboard/onboard");
  }
  if (session && session.user.onBoardStage === "project-created") {
    redirect("/dashboard");
  }
  return (
    <div className="container mx-auto min-h-[90vh] flex flex-col items-center justify-center p-4">
      <AuthForm referral={searchParams.referral} />
      

    </div>
  );
}