type ApiPlanNames = "Basic-Plan-Normie-Tech-V1";
type ApiPlan = {
    [key in ApiPlanNames]: {
        args?: aws.apigateway.UsagePlanArgs;
    };
};
export const apiPlans  = {
    
    "Basic-Plan-Normie-Tech-V1":{
        args:{
          
              description:"initial paid plan for V1",
              name:"Basic Normie Tech Plan V1",
              throttleSettings:{
                burstLimit:1000,
                rateLimit:1000
              }
        }
    }
} as ApiPlan;
