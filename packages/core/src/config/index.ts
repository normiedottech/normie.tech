import { Resource } from "sst";


export const API_VERSION = "1.0.0";
export const SDK_VERSION = "1.0.0";

export const getFrontendDomain = () => {
    switch(Resource.App.stage){
        case "production":
            return "https://normie.tech"
        case "dev":
            return "https://dev.normie.tech"
        default:
            return "http://localhost:3000"
    }
}