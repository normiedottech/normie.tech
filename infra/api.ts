

export const myApi = new sst.aws.Function("MyApi", {
  url: true,
  link: [],
  handler: "packages/functions/src/api.handler"
});
