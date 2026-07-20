import { createPrivateKey, createPublicKey, sign, verify } from "node:crypto";

const encode = (value: object | string) => Buffer.from(typeof value === "string" ? value : JSON.stringify(value)).toString("base64url");

export function appleClientSecret() {
  const clientId = process.env.APPLE_CLIENT_ID;
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const privateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!clientId || !teamId || !keyId || !privateKey) return null;
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: "ES256", kid: keyId, typ: "JWT" });
  const payload = encode({ iss: teamId, iat: now, exp: now + 300, aud: "https://appleid.apple.com", sub: clientId });
  const input = `${header}.${payload}`;
  const signature = sign("sha256", Buffer.from(input), { key: createPrivateKey(privateKey), dsaEncoding: "ieee-p1363" });
  return `${input}.${signature.toString("base64url")}`;
}

type AppleClaims = { iss?: string; aud?: string; exp?: number; sub?: string; nonce?: string; email?: string; email_verified?: boolean | string };

export async function verifyAppleIdToken(token: string, expectedNonce: string): Promise<AppleClaims | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")) as { kid?: string; alg?: string };
    const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as AppleClaims;
    const response = await fetch("https://appleid.apple.com/auth/keys", { cache: "no-store" });
    if (!response.ok) return null;
    const { keys } = await response.json() as { keys: (JsonWebKey & { kid?: string })[] };
    const jwk = keys.find((key) => key.kid === header.kid);
    if (!jwk || header.alg !== "RS256") return null;
    const valid = verify("RSA-SHA256", Buffer.from(`${parts[0]}.${parts[1]}`), createPublicKey({ key: jwk as any, format: "jwk" }), Buffer.from(parts[2], "base64url"));
    const now = Math.floor(Date.now() / 1000);
    if (!valid || claims.iss !== "https://appleid.apple.com" || claims.aud !== process.env.APPLE_CLIENT_ID || claims.nonce !== expectedNonce || !claims.exp || claims.exp <= now || !claims.sub) return null;
    return claims;
  } catch {
    return null;
  }
}
