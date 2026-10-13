/**
 * Pesapal API 3.0 adapter — deposits.
 *
 * Flow:
 *   1. requestToken()      → bearer token (cached ~4 min)
 *   2. registerIPN()       → one-time, returns ipn_id (cached in env or memory)
 *   3. submitOrder()       → returns { redirect_url, order_tracking_id }
 *   4. getTransactionStatus() → authoritative status
 *
 * Docs: https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json
 */

const BASE = process.env.PESAPAL_BASE_URL || "https://pay.pesapal.com/v3";
const CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;
const IPN_URL = process.env.PESAPAL_IPN_URL;
const CALLBACK_URL = process.env.PESAPAL_CALLBACK_URL;
const IPN_TYPE = process.env.PESAPAL_IPN_TYPE || "POST";

if (!CONSUMER_KEY || !CONSUMER_SECRET) {
  console.warn("[pesapal] credentials missing — set PESAPAL_CONSUMER_KEY and PESAPAL_CONSUMER_SECRET");
}
if (!IPN_URL) console.warn("[pesapal] PESAPAL_IPN_URL not set");
if (!CALLBACK_URL) console.warn("[pesapal] PESAPAL_CALLBACK_URL not set");

/* ---------------- auth token cache ---------------- */

let tokenCache = { value: null, expiresAt: 0 };
let ipnCache = { id: null, expiresAt: 0 };

async function requestToken() {
  const now = Date.now();
  if (tokenCache.value && tokenCache.expiresAt > now + 30_000) {
    return tokenCache.value;
  }

  const res = await fetch(`${BASE}/api/Auth/RequestToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.token) {
    throw new Error(data?.message || `Pesapal auth failed (${res.status})`);
  }

  // Tokens are valid ~5 min; refresh at 4 min
  tokenCache = { value: data.token, expiresAt: now + 4 * 60 * 1000 };
  return data.token;
}

async function authed(path, init = {}) {
  const token = await requestToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || data?.error?.message || `Pesapal ${path} failed (${res.status})`);
  }
  return data;
}

/* ---------------- IPN registration ---------------- */

/**
 * Registers the IPN URL with Pesapal. Idempotent within the process —
 * caches the resulting ipn_id for 24h. Pesapal itself is fine with re-registering,
 * but this avoids an extra round-trip on every startup.
 */
export async function ensureIPN() {
  if (ipnCache.id && ipnCache.expiresAt > Date.now()) return ipnCache.id;

  if (!IPN_URL) throw new Error("PESAPAL_IPN_URL is required");

  const data = await authed("/api/URLSetup/RegisterIPN", {
    method: "POST",
    body: JSON.stringify({
      url: IPN_URL,
      ipn_notification_type: IPN_TYPE,
    }),
  });

  if (!data?.ipn_id) throw new Error(data?.error?.message || "IPN registration failed");

  ipnCache = { id: data.ipn_id, expiresAt: Date.now() + 24 * 60 * 60 * 1000 };
  console.log("[pesapal] IPN registered:", data.ipn_id, "→", IPN_URL);
  return data.ipn_id;
}

/* ---------------- order submission ---------------- */

/**
 * Submit an order. Returns { redirect_url, order_tracking_id, merchant_reference }.
 *
 * merchant_reference = our internal reference (tx id). We use it to reconcile
 * the callback back to a deposit.
 */
export async function submitOrder({
  amount,
  currency = "KES",
  description = "TagOption deposit",
  reference,
  email,
  phone,
  firstName = "Customer",
  lastName = "TagOption",
}) {
  const ipnId = await ensureIPN();

  const [first, ...rest] = String(phone || "").replace(/\D/g, "").length > 0
    ? [firstName]
    : [firstName];

  const body = {
    id: reference,
    currency,
    amount: Number(amount),
    description,
    callback_url: CALLBACK_URL,
    notification_id: ipnId,
    billing_address: {
      email_address: email || "customer@tagoption.ke",
      phone_number: phone || "",
      country_code: "KE",
      first_name: firstName,
      middle_name: "",
      last_name: lastName,
      line_1: "",
      line_2: "",
      city: "",
      state: "",
      postal_code: "",
      zip_code: "",
    },
  };

  const data = await authed("/api/Transactions/SubmitOrderRequest", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return {
    redirect_url: data?.redirect_url,
    order_tracking_id: data?.order_tracking_id,
    merchant_reference: data?.merchant_reference || reference,
    raw: data,
  };
}

/* ---------------- status ---------------- */

/**
 * Authoritative status. Pesapal's webhook body cannot be trusted alone —
 * always call this before crediting the ledger.
 */
export async function getTransactionStatus(orderTrackingId) {
  const data = await authed(
    `/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`
  );
  return {
    status_code: data?.status_code,
    payment_status_description: data?.payment_status_description,
    amount: Number(data?.amount),
    currency: data?.currency,
    payment_method: data?.payment_method,
    merchant_reference: data?.merchant_reference,
    confirmation_code: data?.confirmation_code,
    raw: data,
  };
}

/* ---------------- helpers ---------------- */

/** Is this order in a final, credited state? */
export function isCompleted(statusDescription) {
  return String(statusDescription || "").toUpperCase() === "COMPLETED";
}

/** Is this order in a final, non-credited state? */
export function isFailed(statusDescription) {
  const s = String(statusDescription || "").toUpperCase();
  return s === "FAILED" || s === "INVALID" || s === "REVERSED";
}
