export const router = new sst.aws.ApiGatewayV1("Payment-Infra-Api-V1",{
  accessLog:{
    retention:"3 months"
  },
  domain:$app.stage === "production" ? "api.normie.tech" : undefined,
});
