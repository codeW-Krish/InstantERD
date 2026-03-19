import { Client, Databases, Teams, Storage, Users, Functions } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config({ path: ['.env.local', '.env'] });

export function getServerAppwrite() {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');

  return {
    databases: new Databases(client),
    teams:     new Teams(client),
    storage:   new Storage(client),
    users:     new Users(client),
    functions: new Functions(client),
  };
}
