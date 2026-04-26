import { Account, Client, Teams } from "appwrite";

let clientInstance: Client | null = null;
let accountInstance: Account | null = null;
let teamsInstance: Teams | null = null;

const GENERIC_CONFIG_ERROR_MESSAGE =
  "Ocurrio un error al iniciar sesion. Intenta mas tarde.";

function getAppwriteConfig() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

  if (!endpoint || !projectId) {
    throw new Error(GENERIC_CONFIG_ERROR_MESSAGE);
  }

  return { endpoint, projectId };
}

function getAppwriteClient() {
  if (clientInstance) {
    return clientInstance;
  }

  const { endpoint, projectId } = getAppwriteConfig();
  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId);

  clientInstance = client;
  return clientInstance;
}

export function getAppwriteAccount() {
  if (accountInstance) {
    return accountInstance;
  }

  accountInstance = new Account(getAppwriteClient());
  return accountInstance;
}

export function getAppwriteTeams() {
  if (teamsInstance) {
    return teamsInstance;
  }

  teamsInstance = new Teams(getAppwriteClient());
  return teamsInstance;
}
