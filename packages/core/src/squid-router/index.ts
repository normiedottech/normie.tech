import { Resource } from "sst";
import type { SquidRouteParams, SquidRouteResponse, SquidStatusParams, SquidStatusResponse } from "./types";

export class SquidRouter {
  private apiUrl: string;
  private integratorId: string;

  constructor() {
    this.apiUrl = "https://v2.api.squidrouter.com/v2";
    this.integratorId = Resource.SQUID_INTEGRATOR_ID.value;
  }

  async getRoute(params: SquidRouteParams): Promise<SquidRouteResponse> {
    const response = await fetch(`${this.apiUrl}/route`, {
      method: "POST",
      headers: {
        "x-integrator-id": this.integratorId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });
    console.log("params", params);
    console.log("response", response);

    if (!response.ok) {
      throw new Error(`Squid API error: ${response}`);
    }

    console.log("response thik hai")

    const data = await response.json();
    console.log("data", data);
    const requestId = response.headers.get("x-request-id") || "";
    console.log("requestId", requestId);
    return data;
  }

  async getStatus(params: SquidStatusParams): Promise<SquidStatusResponse> {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      searchParams.append(key, value);
    }

    const response = await fetch(`${this.apiUrl}/status?${searchParams.toString()}`, {
      method: "GET",
      headers: {
        "x-integrator-id": this.integratorId,
      },
    });

    if (!response.ok) {
      throw new Error(`Squid API error: ${response.statusText}`);
    }

    return response.json() as Promise<SquidStatusResponse>;
  }
}