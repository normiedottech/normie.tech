import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { getProjectById } from "../actions/dashboard";
import { getWebhooks } from "../actions/webhooks";
import DevSettings from "./dev-settings";

export default async function DevSettingsPage() {
	const session = await auth();
	if (!session) {
		redirect("/dashboard/sign-in");
	}

	if (!session.user.projectId) {
		redirect("/dashboard/onboard");
	}

	const project = await getProjectById(session.user.projectId);
	if (!project) {
		return <div>Project not found</div>;
	}

	return (
		<div className="mt-20 min-h-[80vh]">
			<DevSettings />
		</div>
	);
}
