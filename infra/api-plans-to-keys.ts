import { apiPlans } from "./api-plans";
import { apiKeys } from "./api-keys";
type ApiPlansToKeys = {
  [key in keyof typeof apiPlans]:aws.apigateway.ApiKey[]
}
export const apiPlansToKeys = {
  "Basic-Plan-V1":[
    apiKeys.voiceDeck,
  ]
} as ApiPlansToKeys