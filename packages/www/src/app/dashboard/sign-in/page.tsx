import { AuthForm } from "@/components/auth/auth-form";
import { auth } from "@/server/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { saveReferral } from "../actions/auth";

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
    <div className="container mx-auto py-10">
      <AuthForm referral={searchParams.referral} />
    </div>
  );
}
