import { Context, Next } from 'hono';
import { eq } from 'drizzle-orm';
import {  db } from '@normietech/core/database/index'; // Adjust path accordingly
import { apiKeys, apiPlans } from '@normietech/core/database/schema/index';
import { Resource } from 'sst';

// Middleware function to validate x-api-key using Drizzle ORM
export async function apiKeyMiddleware(ctx: Context, next: Next) {
  // Retrieve the x-api-key header from the request
  const apiKey = ctx.req.header('x-api-key');

  
  // If no API key is present, respond with 401 Unauthorized
  if (!apiKey) {
    return ctx.json({ error: 'API key is required' }, 401);
  }

  try {
    // Query Drizzle to find the API key in the apiKeys table
    const [apiKeyRecord] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.apiKey, apiKey));

    // If API key is not found, respond with 401 Unauthorized
    if (!apiKeyRecord) {
      return ctx.json({ error: 'Invalid API key' }, 401);
    }  

    // Attach the API key and plan data to the context for further processing
    ctx.set('apiKeyRecord', apiKeyRecord);

    // Proceed to the next middleware or request handler
    await next();
  } catch (error) {
    console.error('Error validating API key:', error);
    return ctx.json({ error: 'Internal server error' }, 500);
  }
}
