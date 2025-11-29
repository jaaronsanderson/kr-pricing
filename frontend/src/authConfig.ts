import { PublicClientApplication, type Configuration } from "@azure/msal-browser";

const clientId = import.meta.env.VITE_AZURE_CLIENT_ID as string | undefined;
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID as string | undefined;

// Debug logging – helps confirm env is loading
console.log("MSAL env:", {
  VITE_AZURE_CLIENT_ID: clientId,
  VITE_AZURE_TENANT_ID: tenantId,
});

if (!clientId) {
  console.warn(
    "MSAL: VITE_AZURE_CLIENT_ID is not set. Microsoft login will fail."
  );
}

const authorityTenant = tenantId && tenantId.trim().length > 0
  ? tenantId
  : "common";

if (!tenantId) {
  console.warn(
    "MSAL: VITE_AZURE_TENANT_ID is not set. Falling back to 'common' authority."
  );
}

const msalConfig: Configuration = {
  auth: {
    clientId: clientId || "00000000-0000-0000-0000-000000000000",
    authority: `https://login.microsoftonline.com/${authorityTenant}`,
    redirectUri: "http://localhost:5173/",
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

export const loginRequest = {
  scopes: ["User.Read"],
};
