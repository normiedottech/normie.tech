import { router } from "./router";
type ApiPlanNames = "Basic-Plan-V1";
type ApiPlan = {
    [key in ApiPlanNames]: {
        args?: aws.apigateway.UsagePlanArgs;
    };
};
export const apiPlans  = {
    
    "Basic-Plan-V1":{
        args:{
            apiStages:[{
                apiId:router.nodes.api.id,
                stage:$app.stage
              }],
              description:"initial paid plan for V1",
              name:"Basic Normie Tech Plan V1",
              throttleSettings:{
                burstLimit:1000,
                rateLimit:1000
              }
        }
    }
} as ApiPlan;
