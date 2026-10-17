const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const MAX_URL_LENGTH = 2048;

function validateUrl(value) {
  if (
    typeof value !== "string" ||
    value.length > MAX_URL_LENGTH
  ) {
    throw new Error("URL tidak valid.");
  }

  const url = new URL(value);

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new Error("Hanya URL HTTP dan HTTPS yang diizinkan.");
  }

  if (url.username || url.password) {
    throw new Error("URL dengan kredensial tidak diizinkan.");
  }

  return url;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      ok: false,
      error: "Metode tidak didukung."
    });
  }

  const startedAt = Date.now();

  try {
    const input = req.body?.url;
    const url = validateUrl(input);

    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
      headers: {
        Accept: "text/html,application/xhtml+xml"
      }
    });

    const location = response.headers.get("location");

    if (
      response.status >= 300 &&
      response.status < 400 &&
      location
    ) {
      const destination = validateUrl(
        new URL(location, url).href
      );

      return res.status(200).json({
        ok: true,
        status: "redirect_detected",
        source: url.href,
        destination: destination.href,
        httpStatus: response.status,
        elapsedMs: Date.now() - startedAt
      });
    }

    return res.status(200).json({
      ok: true,
      status: "no_standard_redirect",
      source: url.href,
      httpStatus: response.status,
      elapsedMs: Date.now() - startedAt,
      message:
        "Tidak ditemukan redirect HTTP standar pada respons ini."
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error:
        error.name === "TimeoutError"
          ? "Server tujuan terlalu lama merespons."
          : error.message || "Pemeriksaan gagal.",
      elapsedMs: Date.now() - startedAt
    });
  }
};
