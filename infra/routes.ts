import { transform } from "../.sst/platform/src/components/component";
import { Input } from "../.sst/platform/src/components/input";
import { secrets } from "./secrets";

type Route = {
  url: string;
  handler: Input<string | sst.aws.FunctionArgs | sst.aws.FunctionArn>;
  args?: sst.aws.ApiGatewayV1RouteArgs;
  documentation?:aws.apigateway.DocumentationPart
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
const openApiRoute : Route = {
  url: "GET /open-api",
  handler: {
    handler: "packages/functions/src/api/open-api.get",
    description: "This endpoint returns the documentation open api spec for the API",
  },
}
const projectsStatusRoute: Route = {
  url: "GET /v1/{projectId}/info",
  handler: {
    handler: "packages/functions/src/api/v1/[projectId]/info.get",
    
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
  url: "POST /v1/{projectId}/{paymentId}/checkout",
  handler: {
    handler: "packages/functions/src/api/v1/[projectId]/[paymentId]/checkout.post",
    link: [secrets.STRIPE_API_KEY, secrets.DATABASE_URL,secrets.OP_RPC_URL,secrets.ARBITRUM_RPC_URL,secrets.BASE_RPC_URL
    ],
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

const docsRoute: Route = {
  url: "GET /docs",
  handler: {
    handler: "packages/functions/src/api/docs.get",
  },
}

const projectDocsRoute :Route = {
  url: "GET /v1/{projectId}/docs",
  handler:{
    handler:"packages/functions/src/api/v1/[projectId]/docs.get",
    link:[secrets.DATABASE_URL]
  },
  
}
const projectOpenApiRoute : Route = {
  url: "GET /v1/{projectId}/open-api",
  handler: {
    handler: "packages/functions/src/api/v1/[projectId]/open-api.get",
    link: [secrets.DATABASE_URL],
  },
}

export const routes = [versionRoute, pingRoute, projectsStatusRoute, checkoutRoute,docsRoute,openApiRoute,projectOpenApiRoute,projectDocsRoute];