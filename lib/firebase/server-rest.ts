type FirestoreValue = { stringValue?: string; integerValue?: string; doubleValue?: number; booleanValue?: boolean; timestampValue?: string; nullValue?: null };

export type FirestoreDocument = { name?: string; fields?: Record<string, FirestoreValue>; updateTime?: string };

export const firestoreField = (document: FirestoreDocument, name: string) => {
  const value = document.fields?.[name];
  if (!value) return undefined;
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.integerValue !== undefined) return Number(value.integerValue);
  if (value.doubleValue !== undefined) return value.doubleValue;
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.timestampValue !== undefined) return value.timestampValue;
  return undefined;
};

export type FirebaseServerContext = { base: string; projectId: string; uid: string; organizationId: string };

export async function getFirebaseServerContext(idToken: string): Promise<FirebaseServerContext> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!apiKey || !projectId) throw new Error("firebase_not_configured");
  const identityResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }), cache: "no-store",
  });
  const identity = (await identityResponse.json()) as { users?: Array<{ localId?: string }> };
  const uid = identity.users?.[0]?.localId;
  if (!identityResponse.ok || !uid) throw new Error("invalid_firebase_session");
  const base = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents`;
  const userResponse = await fetch(`${base}/users/${encodeURIComponent(uid)}`, { headers: { Authorization: `Bearer ${idToken}` }, cache: "no-store" });
  if (!userResponse.ok) throw new Error("workspace_not_found");
  const userDocument = (await userResponse.json()) as FirestoreDocument;
  const organizationId = firestoreField(userDocument, "organizationId");
  const status = firestoreField(userDocument, "status");
  if (typeof organizationId !== "string" || !organizationId || status === "disabled") throw new Error("workspace_not_found");
  return { base, projectId, uid, organizationId };
}

type RateLimitInput = FirebaseServerContext & { idToken: string; scope: "ai-quote" | "client-error"; limit: number; windowMs: number };
export type DistributedRateLimitResult = { allowed: boolean; remaining: number; retryAfterSeconds: number };

const rateLimitFields = (input: RateLimitInput, count: number, windowStart: number) => ({
  uid: { stringValue: input.uid }, organizationId: { stringValue: input.organizationId }, scope: { stringValue: input.scope },
  count: { integerValue: String(count) }, windowStart: { timestampValue: new Date(windowStart).toISOString() },
  expiresAt: { timestampValue: new Date(windowStart + input.windowMs * 2).toISOString() },
});

export async function consumeDistributedRateLimit(input: RateLimitInput): Promise<DistributedRateLimitResult> {
  const now = Date.now();
  const windowStart = Math.floor(now / input.windowMs) * input.windowMs;
  const bucketId = `${input.uid}_${input.scope}_${windowStart}`;
  const url = `${input.base}/apiRateLimits/${encodeURIComponent(bucketId)}`;
  const headers = { Authorization: `Bearer ${input.idToken}`, "Content-Type": "application/json" };
  const retryAfterSeconds = Math.max(1, Math.ceil((windowStart + input.windowMs - now) / 1000));
  const expiredBucketId = `${input.uid}_${input.scope}_${windowStart - input.windowMs * 2}`;
  void fetch(`${input.base}/apiRateLimits/${encodeURIComponent(expiredBucketId)}`, {
    method: "DELETE", headers, cache: "no-store",
  }).catch(() => undefined);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const read = await fetch(url, { headers, cache: "no-store" });
    if (read.status === 404) {
      const create = await fetch(`${input.base}/apiRateLimits?documentId=${encodeURIComponent(bucketId)}`, {
        method: "POST", headers, body: JSON.stringify({ fields: rateLimitFields(input, 1, windowStart) }), cache: "no-store",
      });
      if (create.ok) return { allowed: true, remaining: input.limit - 1, retryAfterSeconds };
      if (create.status === 409 || create.status === 412) continue;
      throw new Error("rate_limit_store_unavailable");
    }
    if (!read.ok) throw new Error("rate_limit_store_unavailable");
    const document = (await read.json()) as FirestoreDocument;
    const count = Number(firestoreField(document, "count") ?? 0);
    if (count >= input.limit) return { allowed: false, remaining: 0, retryAfterSeconds };
    if (!document.updateTime) throw new Error("rate_limit_store_unavailable");
    const update = await fetch(`${url}?currentDocument.updateTime=${encodeURIComponent(document.updateTime)}`, {
      method: "PATCH", headers, body: JSON.stringify({ fields: rateLimitFields(input, count + 1, windowStart) }), cache: "no-store",
    });
    if (update.ok) return { allowed: true, remaining: input.limit - count - 1, retryAfterSeconds };
    if (update.status === 409 || update.status === 412) continue;
    throw new Error("rate_limit_store_unavailable");
  }
  throw new Error("rate_limit_contention");
}
