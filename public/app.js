(() => {
  const $ = id => document.getElementById(id);
  const input = $("urlInput"), results = $("results"), overview = $("overview");
  const redirects = $("redirects"), risks = $("risks"), actions = $("actions");
  let selectedUrl = "";

  const destinationKeys = new Set([
    "url","target","dest","destination","redirect","redirecturl","redirecturi",
    "return","returnto","returnurl","to","out","link","u","continue","next"
  ]);

  function parseWebUrl(value) {
    try {
      const u = new URL(value);
      if (!["http:", "https:"].includes(u.protocol) || u.username || u.password) return null;
      return u;
    } catch { return null; }
  }

  function decodeRepeated(value) {
    let v = value;
    for (let i = 0; i < 3; i++) {
      try { const next = decodeURIComponent(v.replace(/\+/g, "%20")); if (next === v) break; v = next; }
      catch { break; }
    }
    return v;
  }

  function el(tag, text, cls) {
    const n = document.createElement(tag);
    n.textContent = text;
    if (cls) n.className = cls;
    return n;
  }

  function stat(label, value) {
    const d = el("div", "", "stat");
    d.append(el("small", label), el("strong", value));
    overview.append(d);
  }

  function addUrl(title, url, note) {
    const d = el("div", "", "item");
    d.append(el("strong", title), el("div", url.href, "url"));
    if (note) d.append(el("p", note, "small"));
    redirects.append(d);
  }

  function inspect() {
    const raw = input.value.trim();
    results.hidden = false; overview.replaceChildren(); redirects.replaceChildren(); risks.replaceChildren();
    actions.hidden = true; selectedUrl = "";
    const source = parseWebUrl(raw);
    if (!source) {
      $("statusPill").textContent = "URL tidak valid";
      risks.append(el("p", "Masukkan URL lengkap yang diawali http:// atau https://.", "bad"));
      return;
    }

    $("statusPill").textContent = "Pemeriksaan selesai";
    stat("Domain", source.hostname);
    stat("Protokol", source.protocol.replace(":", "").toUpperCase());
    stat("Panjang URL", `${raw.length} karakter`);
    addUrl("URL asli", source, "Ini tautan yang dimasukkan.");

    const found = [];
    for (const [key, value] of source.searchParams.entries()) {
      const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, "");
      const decoded = decodeRepeated(value);
      const candidate = parseWebUrl(decoded);
      if (destinationKeys.has(normalized) && candidate && candidate.href !== source.href && !found.some(x => x.href === candidate.href)) found.push(candidate);
    }
    for (const [, value] of source.searchParams.entries()) {
      const decoded = decodeRepeated(value);
      const match = decoded.match(/https?:\/\/[^\s"'<>]+/i);
      if (!match) continue;
      const candidate = parseWebUrl(match[0]);
      if (candidate && candidate.href !== source.href && !found.some(x => x.href === candidate.href)) found.push(candidate);
    }

    if (found.length) {
      risks.append(el("p", `Ditemukan ${found.length} kemungkinan alamat tujuan yang tertulis di parameter. Tujuan ini belum diverifikasi sebagai tujuan akhir.`, "good"));
      found.forEach((url, i) => addUrl(`Kemungkinan tujuan ${i + 1}`, url, "Periksa ejaan domain dan apakah domain tersebut memang kamu harapkan."));
      selectedUrl = found[0].href; actions.hidden = false;
    } else {
      risks.append(el("p", "Tidak ditemukan alamat tujuan yang jelas di parameter URL.", "warn"));
      risks.append(el("p", "Situs mungkin memakai redirect sisi server, JavaScript, timer, CAPTCHA, atau token. Tool ini tidak mencoba melewati mekanisme tersebut."));
    }

    const flags = [];
    if (source.protocol !== "https:") flags.push(["URL memakai HTTP, bukan HTTPS. Koneksi dapat tidak terenkripsi.", "warn"]);
    if (source.hostname.includes("xn--")) flags.push(["Domain memakai format IDN/punycode. Periksa ejaan domain dengan teliti.", "warn"]);
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(source.hostname)) flags.push(["Tautan menggunakan alamat IPv4 langsung; pastikan alamat tersebut memang tepercaya.", "warn"]);
    if (source.hostname.split(".").length >= 5) flags.push(["Nama host memiliki banyak subdomain; baca domain dari kanan ke kiri untuk memastikan domain utamanya.", "warn"]);
    if (source.href.length > 1500) flags.push(["URL sangat panjang. Jangan menganggap panjang URL sebagai bukti bahaya, tetapi periksa sumbernya.", "warn"]);
    if (flags.length) {
      risks.append(el("h3", "Sinyal yang perlu diperiksa"));
      flags.forEach(([msg, cls]) => risks.append(el("p", "• " + msg, cls)));
    } else {
      risks.append(el("p", "Tidak ada sinyal sederhana yang cocok dengan pemeriksaan dasar ini. Ini bukan jaminan tautan aman.", "warn"));
    }
  }

  $("inspectBtn").addEventListener("click", inspect);
  $("clearBtn").addEventListener("click", () => {
    input.value = ""; results.hidden = true; overview.replaceChildren(); redirects.replaceChildren(); risks.replaceChildren(); input.focus();
  });
  $("pasteBtn").addEventListener("click", async () => {
    try { input.value = await navigator.clipboard.readText(); input.focus(); }
    catch { risks.replaceChildren(el("p", "Clipboard tidak bisa diakses. Tempel URL secara manual ke kolom.", "warn")); results.hidden = false; }
  });
  $("openBtn").addEventListener("click", () => {
    const u = parseWebUrl(selectedUrl);
    if (!u) return;
    window.open(u.href, "_blank", "noopener,noreferrer");
  });
  $("copyBtn").addEventListener("click", async () => {
    if (!selectedUrl) return;
    try { await navigator.clipboard.writeText(selectedUrl); $("copyBtn").textContent = "Tersalin"; }
    catch { $("copyBtn").textContent = "Gagal menyalin"; }
  });
})();
