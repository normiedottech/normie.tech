import { Resource } from "sst";
import { Handler } from "aws-lambda";
import { API_VERSION,SDK_VERSION } from "@normietech/core/constants";


export const get: Handler = async (_event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
        apiVersion: API_VERSION,
        sdkVersion: SDK_VERSION,
    }),
  };
};
