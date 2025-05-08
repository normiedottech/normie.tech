"use server"

import { API_URL } from "@/lib/constants"
import { auth } from "@/server/auth"
import { z } from "zod"

export async function getAllSubscriptions(apiKey: string) {
  try {
    const session = await auth();

    if (!session) {
      return { success: false, error: "User not authenticated" };
    }
    if (!session?.user.projectId) {
      return { success: false, error: "User does not have a project" };
    }

    const response = await fetch(`${API_URL}/v1/${session.user.projectId}/0/subscription`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to fetch subscriptions' };
    }

    const result = await response.json();
    return { success: true, response: result.subscriptions };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' };
  }
}

export async function getSubscription(subscriptionId: string, apiKey: string) {
  try {
    const session = await auth();

    if (!session) {
      return { success: false, error: "User not authenticated" };
    }
    if (!session?.user.projectId) {
      return { success: false, error: "User does not have a project" };
    }

    const response = await fetch(`${API_URL}/v1/${session.user.projectId}/0/subscription/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to fetch subscription' };
    }

    const result = await response.json();
    return { success: true, response: result.subscription };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' };
  }
}

export async function cancelSubscription(subscriptionId: string, apiKey: string) {
  try {
    const session = await auth();

    if (!session) {
      return { success: false, error: "User not authenticated" };
    }
    if (!session?.user.projectId) {
      return { success: false, error: "User does not have a project" };
    }

    const response = await fetch(`${API_URL}/v1/${session.user.projectId}/0/subscription/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const result = await response.json();
      console.error(result);
      return { success: false, error: result.error || 'Failed to cancel subscription' };
    }

    const result = await response.json();
    return { success: true, response: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' };
  }
} 