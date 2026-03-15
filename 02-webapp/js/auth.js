// -----------------------------------------------------------------------------
// Cognito configuration
// -----------------------------------------------------------------------------

import { CONFIG } from "./config.js";

const COGNITO_DOMAIN = CONFIG.COGNITO_DOMAIN;
const CLIENT_ID = CONFIG.COGNITO_CLIENT_ID;

const REDIRECT_URI = `${window.location.origin}/callback.html`;

// -----------------------------------------------------------------------------
// Build Cognito Hosted UI login URL
// -----------------------------------------------------------------------------

export function getLoginUrl() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    scope: "openid email profile",
    redirect_uri: REDIRECT_URI
  });

  return `${COGNITO_DOMAIN}/oauth2/authorize?${params.toString()}`;
}

// -----------------------------------------------------------------------------
// Exchange authorization code for tokens
// -----------------------------------------------------------------------------

export async function exchangeCodeForTokens(code) {
  const tokenUrl = `${COGNITO_DOMAIN}/oauth2/token`;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: CLIENT_ID,
    code,
    redirect_uri: REDIRECT_URI
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: body.toString()
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Token exchange failed: ${response.status} ${errorText}`
    );
  }

  return response.json();
}

// -----------------------------------------------------------------------------
// Token storage
// -----------------------------------------------------------------------------

export function storeTokens(tokens) {
  localStorage.setItem("id_token", tokens.id_token || "");
  localStorage.setItem("access_token", tokens.access_token || "");
  localStorage.setItem("refresh_token", tokens.refresh_token || "");
}

// -----------------------------------------------------------------------------
// Token retrieval
// -----------------------------------------------------------------------------

export function getIdToken() {
  return localStorage.getItem("id_token") || "";
}

export function getAccessToken() {
  return localStorage.getItem("access_token") || "";
}

export function getRefreshToken() {
  return localStorage.getItem("refresh_token") || "";
}

// -----------------------------------------------------------------------------
// Session helpers
// -----------------------------------------------------------------------------

export function isLoggedIn() {
  return Boolean(getIdToken());
}

export function clearTokens() {
  localStorage.removeItem("id_token");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export function getPostLoginRedirectUrl() {
  return `${window.location.origin}/index.html`;
}

export function getLogoutUrl() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    logout_uri: `${window.location.origin}/index.html`
  });

  return `${COGNITO_DOMAIN}/logout?${params.toString()}`;
}
