import { Input } from "../.sst/platform/src/components/input";
import { secrets } from "./secrets";

type Route = {
  url: string;
  handler: Input<string | sst.aws.FunctionArgs | sst.aws.FunctionArn>;
  args?: sst.aws.ApiGatewayV1RouteArgs;
};

const versionRoute: Route = {
  url: "GET /version",
  handler: {
    handler: "packages/functions/src/api/version.get",
    description:
      "This endpoint returns the current version of the API and the SDK",
  },
};
const pingRoute: Route = {
  url: "GET /ping",
  handler: {
    handler: "packages/functions/src/api/ping.get",
    description: "This endpoint plays  ping pong",
  },
};
const projectsStatusRoute: Route = {
  url: "GET /{projectId}/info",
  handler: {
    handler: "packages/functions/src/api/[projectId]/info.get",
  },
  args: {
    transform: {
      method: {
        apiKeyRequired: true,
      },
    },
  },
};
const checkoutRoute: Route = {
  url: "POST /{projectId}/{paymentId}/checkout",
  handler: {
    handler: "packages/functions/src/api/[projectId]/[paymentId]/create.post",
    link: [secrets.STRIPE_API_KEY, secrets.DATABASE_URL],
    timeout: "100 seconds",
  },
  args:{
    transform:{
      method:{
        apiKeyRequired:true
      }
    }
  }
};

export const routes = [versionRoute, pingRoute, projectsStatusRoute, checkoutRoute];