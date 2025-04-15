import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import PayoutSettingsForm from "./payout-settings-form";

export default async function PayoutSettingsPage() {
	const session = await auth();
	if (!session) {
		redirect("/dashboard/sign-in");
	}
	if (session.user.onBoardStage === "payout-created") {
		redirect("/dashboard");
	}
	return (
		<div className="container mx-auto py-10">
			<PayoutSettingsForm />
		</div>
	);
}
