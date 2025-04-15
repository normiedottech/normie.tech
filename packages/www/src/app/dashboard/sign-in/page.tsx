import BookNoahACall from "@/components/aryan-component/book-a-call";
import { AuthForm } from "@/components/auth/auth-form";
import { Button } from "@/components/ui/button";
import { auth } from "@/server/auth";
import { cookies } from "next/headers";
import Link from "next/link";
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
		<div className="container mx-auto min-h-[90vh] flex flex-col items-center justify-center p-4">
			<AuthForm referral={searchParams.referral} />

			<div className="mt-8 p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center max-w-md">
				<p className="text-lg mb-4">If you don't already have an account:</p>

				<div className="w-full mb-4 flex justify-center">
					<BookNoahACall />
				</div>

				<div className="flex items-center w-full my-3">
					<div className="flex-grow border-t border-gray-200"></div>
					<span className="px-3 text-gray-500">or test in sandbox here</span>
					<div className="flex-grow border-t border-gray-200"></div>
				</div>

				<div>
					<Link
						href="https://sandbox.normie.tech/dashboard/sign-in"
						className=""
					>
						<Button>Sandbox Login</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
