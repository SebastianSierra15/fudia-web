import { Account, Client } from "appwrite";

let accountInstance: Account | null = null;

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

export function getAppwriteAccount() {
  if (accountInstance) {
    return accountInstance;
  }

  const { endpoint, projectId } = getAppwriteConfig();

  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId);

  accountInstance = new Account(client);
  return accountInstance;
}
