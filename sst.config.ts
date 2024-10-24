/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "normie-tech-payment",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    };
  },
  async run() {
   
    const api = await import("./infra/api");

    return {
      api: api.myApi.url,
    };
  },
});
