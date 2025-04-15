/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
	console: {
		autodeploy: {
			target(input) {
				if (
					input.type === "branch" &&
					input.branch === "main" &&
					input.action === "pushed"
				) {
					return {
						stage: "production",
					};
				}
				if (
					input.type === "branch" &&
					input.branch === "dev" &&
					input.action === "pushed"
				) {
					return {
						stage: "dev",
					};
				}
				if (
					input.type === "branch" &&
					input.branch === "sandbox" &&
					input.action === "pushed"
				) {
					return {
						stage: "sandbox",
					};
				}
			},
		},
	},
	app(input) {
		return {
			name: "normie-tech-api",
			removal: input?.stage === "production" ? "retain" : "remove",
			home: "aws",
			protect: ["production", "sandbox", "dev"].includes(input?.stage ?? ""),
			providers: {
				aws: {
					profile: "normie-tech-dev",
					region: "us-east-1",
					version: "6.67.0",
				},
				"aws-apigateway": "2.6.1",
			},
		};
	},
	async run() {
		const api = await import("./infra/api");

		const www = await import("./infra/www");
		const cron = await import("./infra/cron");
		return {
			...api.outputs,
			...www.outputs,
			...cron.outputs,
		};
	},
});
