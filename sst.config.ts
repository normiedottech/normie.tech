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
        if (input.type === "branch" && input.branch === "dev" && input.action === "pushed") {
          return {
            stage: "dev",
          };
        }
      },
    }
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
          version: "6.67.0"
        },
        "aws-apigateway": "2.6.1",
      },
    };
  },
  async run() {
    // Import all infrastructure modules
    const api = await import("./infra/api")
    const www = await import("./infra/www") // This already creates your Next.js app
    const cron = await import("./infra/cron")
    const storage = await import("./infra/storage") // Add storage infrastructure
    
    return {
      ...api.outputs,
      ...www.outputs, // This includes your Next.js app with the bucket linked
      ...cron.outputs,
      ...storage.outputs, // Include storage outputs
    }
  },
});