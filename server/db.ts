import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import 'dotenv/config';

neonConfig.webSocketConstructor = ws;

// Use a development database URL if not provided
const databaseUrl = process.env.DATABASE_URL || 'postgresql://dev:dev@localhost:5432/dev';

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });
