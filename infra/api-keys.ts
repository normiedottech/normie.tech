import {PROJECT_REGISTRY, ProjectRegistryKey} from "../packages/core/src/config/project-registry/index"

const projectIds = Object.keys(PROJECT_REGISTRY)
type ApiKeys = {
    [key in ProjectRegistryKey]: aws.apigateway.ApiKey
}
const _apiKeys  = {} as ApiKeys

for(let projectId of projectIds){
    _apiKeys[projectId] = new aws.apigateway.ApiKey(`ApiKey-${projectId}`,{
        name:projectId,
    })
}
export const apiKeys:ApiKeys = _apiKeys