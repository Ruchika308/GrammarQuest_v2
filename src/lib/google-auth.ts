export interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  sub: string; // unique google ID
}

export function decodeJwt(token: string): GoogleUser | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to decode JWT:", e);
    return null;
  }
}

export function loadGoogleGsiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return resolve();
    if (document.getElementById("google-gsi-script")) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.id = "google-gsi-script";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Sign-In SDK"));
    document.head.appendChild(script);
  });
}

export function getGoogleAuthUrl(): string {
  const clientId = "922144060379-1fdhm3lhfhnjqaih59fcfkh39b2ebc43.apps.googleusercontent.com";
  
  // Dynamically resolve redirect_uri based on current location (localhost vs vercel production)
  const redirectUri = typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.host}/auth/callback/google`
    : "http://localhost:8080/auth/callback/google";
    
  const scope = encodeURIComponent("openid email profile");
  const nonce = Math.random().toString(36).substring(2);
  
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=id_token&scope=${scope}&nonce=${nonce}`;
}
