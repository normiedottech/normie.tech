import { Resource } from "sst";
import { Handler } from "aws-lambda";


export const get: Handler = async (_event) => {
  return {
    statusCode: 200,
    body: "pong",
  };
};
