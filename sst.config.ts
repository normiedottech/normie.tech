/// <reference path="./.sst/platform/config.d.ts" />
import { readdirSync } from "node:fs";
export default $config({
  app(input) {
    return {
      name: "normie-tech-payment",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: {
          profile: "normie-tech-dev",
          region: "us-east-2",
        },
        "pulumi-stripe": "0.0.24",
        "aws-apigateway": "2.6.1",
      },
    };
  },
  async run() {
    const api = await import("./infra/api")
    
   
    return api.outputs;
  },
});
