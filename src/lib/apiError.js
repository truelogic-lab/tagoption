// Normalises different failure shapes from fetch, the API client, and the
// browser so trade screens can show one consistent message.
export function getApiError(error, fallback = "Something went wrong. Try again.") {
  if (!error) return fallback;

  if (typeof error === "string") return error;

  const candidates = [
    error.response?.data?.message,
    error.response?.data?.error,
    error.data?.message,
    error.data?.error,
    error.message,
  ];

  const message = candidates.find((value) => typeof value === "string" && value.trim());
  return message ? message.trim() : fallback;
}
