import axios from "axios";
import Swal from "sweetalert2";
import anime from "animejs/lib/anime.es.js";

let db;
let dbReadyResolve;
const dbReady = new Promise((resolve) => (dbReadyResolve = resolve));

// IndexedDB
const request = indexedDB.open("mangaDB", 1);
request.onerror = () => console.log("Erreur d’ouverture de la base de données");
request.onsuccess = (event) => {
  db = event.target.result;
  dbReadyResolve(true);
};
request.onupgradeneeded = (event) => {
  db = event.target.result;
  if (!db.objectStoreNames.contains("mangas")) {
    db.createObjectStore("mangas", { keyPath: "id" });
  }
};

// Elements (Catalogue)
const animeCards = document.getElementById("anime-cards");
const loader = document.getElementById("loader");

const prevBtn = document.getElementById("prev-page");
const nextBtn = document.getElementById("next-page");
const pageCurrentEl = document.getElementById("page-current");
const pageTotalEl = document.getElementById("page-total");
const pageInput = document.getElementById("page-input");
const goBtn = document.getElementById("go-page");

let currentPage = 1;
let totalPages = null;
let isLoading = false;

// Cache des détails "full" pour éviter de spam l’API
const detailsCache = new Map();

if (animeCards && loader) {
  loadPage(1);

  prevBtn?.addEventListener("click", () => {
    if (currentPage > 1) loadPage(currentPage - 1);
  });

  nextBtn?.addEventListener("click", () => {
    if (totalPages && currentPage < totalPages) loadPage(currentPage + 1);
  });

  goBtn?.addEventListener("click", () => {
    const n = Number(pageInput.value);
    if (!Number.isFinite(n) || n < 1) return;

    if (totalPages && n > totalPages) {
      Swal.fire({
        icon: "info",
        title: "Page invalide",
        text: `La dernière page est ${totalPages}.`,
      });
      return;
    }
    loadPage(n);
  });

  pageInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") goBtn?.click();
  });
}

async function loadPage(page) {
  if (isLoading) return;
  isLoading = true;

  loader.style.display = "block";
  loader.textContent = "Chargement...";
  animeCards.innerHTML = "";
  setPagerDisabled(true);

  try {
    const response = await axios.get("https://api.jikan.moe/v4/anime", {
      params: { page, limit: 25 },
    });

    const animes = response.data.data;
    const pagination = response.data.pagination;

    currentPage = pagination?.current_page ?? page;
    totalPages = pagination?.last_visible_page ?? totalPages;

    loader.style.display = "none";
    if (pageCurrentEl) pageCurrentEl.textContent = String(currentPage);
    if (pageTotalEl)
      pageTotalEl.textContent = totalPages ? String(totalPages) : "?";
    if (pageInput) pageInput.value = "";

    appendAnimes(animes);

    setPagerDisabled(false);
    updatePagerState();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    console.error(err);
    loader.style.display = "none";
    setPagerDisabled(false);

    Swal.fire({
      icon: "error",
      title: "Erreur API",
      text: "Impossible de charger cette page pour le moment.",
    });
  } finally {
    isLoading = false;
  }
}

function setPagerDisabled(disabled) {
  [prevBtn, nextBtn, goBtn].forEach((b) => {
    if (b) b.disabled = disabled;
  });
  if (pageInput) pageInput.disabled = disabled;
}

function updatePagerState() {
  if (prevBtn) prevBtn.disabled = currentPage <= 1;
  if (nextBtn && totalPages) nextBtn.disabled = currentPage >= totalPages;
}

function appendAnimes(animes) {
  const newCards = [];

  animes.forEach((animeItem) => {
    const card = document.createElement("div");
    card.classList.add("anime-card");

    const synopsisText = animeItem.synopsis
      ? String(animeItem.synopsis).replace(/\s+/g, " ").trim()
      : "Synopsis indisponible";

    card.innerHTML = `
      <img src="${animeItem.images?.jpg?.image_url || ""}" alt="${escapeAttr(
      animeItem.title
    )}">
      <h3>${escapeHtml(animeItem.title)}</h3>

      <div class="actions">
        <button class="add-to-db">Ajouter à ma bibliothèque</button>

        <button class="details-button"
          data-id="${animeItem.mal_id}"
          data-title="${escapeAttr(animeItem.title)}"
          data-synopsis="${escapeAttr(synopsisText)}"
        >Détails</button>

        <button class="desc-button"
          data-title="${escapeAttr(animeItem.title)}"
          data-synopsis="${escapeAttr(synopsisText)}"
        >Voir Description</button>
      </div>
    `;

    card.querySelector(".add-to-db").addEventListener("click", async () => {
      await addToIndexedDB(animeItem);
    });

    card.querySelector(".desc-button").addEventListener("click", function () {
      Swal.fire({
        title: this.getAttribute("data-title"),
        text: this.getAttribute("data-synopsis"),
        icon: "info",
        confirmButtonText: "Fermer",
      });
    });

    card.querySelector(".details-button").addEventListener("click", async function () {
      const id = Number(this.getAttribute("data-id"));
      const title = this.getAttribute("data-title");
      const synopsis = this.getAttribute("data-synopsis");
      await openDetailsModal({ id, title, synopsis });
    });

    animeCards.appendChild(card);
    newCards.push(card);
  });

  anime({
    targets: newCards,
    opacity: [0, 1],
    translateY: [-20, 0],
    duration: 450,
    delay: anime.stagger(40),
  });
}

// ✅ Stockage propre
async function addToIndexedDB(animeItem) {
  await dbReady;

  const transaction = db.transaction(["mangas"], "readwrite");
  const store = transaction.objectStore("mangas");

  const animeId = animeItem.mal_id;
  const getRequest = store.get(animeId);

  getRequest.onsuccess = function () {
    if (getRequest.result) {
      Swal.fire({
        icon: "info",
        title: "Déjà ajouté",
        text: ` "${animeItem.title}" est déjà dans ta bibliothèque.`,
      });
      return;
    }

    const synopsisText = animeItem.synopsis
      ? String(animeItem.synopsis).replace(/\s+/g, " ").trim()
      : "Synopsis indisponible";

    const animeWithId = {
      id: animeId,
      title: animeItem.title,
      images: animeItem.images,
      synopsisText,
    };

    store.add(animeWithId);

    Swal.fire({
      icon: "success",
      title: "Ajouté",
      text: ` "${animeItem.title}" a été ajouté !`,
    });
  };
}

/* =========================
   DETAILS MODAL
========================= */

async function openDetailsModal({ id, title, synopsis }) {
  Swal.fire({
    title: title,
    html: `
      <div class="details">
        <p class="details__synopsis">${escapeHtml(synopsis || "Synopsis indisponible")}</p>
        <div class="details__loading">Chargement des détails...</div>
      </div>
    `,
    width: 760,
    confirmButtonText: "Fermer",
    didOpen: async () => {
      try {
        const full = await getAnimeFull(id);
        const html = buildDetailsHtml(full, synopsis);
        const container = Swal.getHtmlContainer();
        if (container) container.querySelector(".details").innerHTML = html;
      } catch (e) {
        const container = Swal.getHtmlContainer();
        if (container) {
          const box = container.querySelector(".details");
          if (box) {
            box.innerHTML = `
              <p class="details__synopsis">${escapeHtml(synopsis || "Synopsis indisponible")}</p>
              <p class="details__error">Impossible de charger les détails (API). Réessaye.</p>
            `;
          }
        }
      }
    },
  });
}

async function getAnimeFull(id) {
  if (detailsCache.has(id)) return detailsCache.get(id);

  const res = await axios.get(`https://api.jikan.moe/v4/anime/${id}/full`);
  const data = res.data?.data;
  detailsCache.set(id, data);
  return data;
}

function buildDetailsHtml(full, synopsisFallback) {
  const title = full?.title || "Détails";
  const score = full?.score ?? "—";
  const episodes = full?.episodes ?? "—";
  const status = full?.status ?? "—";
  const year = full?.year ?? full?.aired?.prop?.from?.year ?? "—";

  const studios = (full?.studios || []).map((s) => s.name).filter(Boolean);
  const genres = (full?.genres || []).map((g) => g.name).filter(Boolean);

  const synopsis =
    full?.synopsis
      ? String(full.synopsis).replace(/\s+/g, " ").trim()
      : synopsisFallback || "Synopsis indisponible";

  const openings = full?.theme?.openings || [];
  const endings = full?.theme?.endings || [];

  const trailerUrl = full?.trailer?.url || "";

  return `
    <div class="details">
      <p class="details__synopsis">${escapeHtml(synopsis)}</p>

      <div class="details__grid">
        <div class="details__item"><span>⭐ Score</span><strong>${escapeHtml(score)}</strong></div>
        <div class="details__item"><span>📺 Episodes</span><strong>${escapeHtml(episodes)}</strong></div>
        <div class="details__item"><span>📌 Statut</span><strong>${escapeHtml(status)}</strong></div>
        <div class="details__item"><span>🗓️ Année</span><strong>${escapeHtml(year)}</strong></div>
      </div>

      ${studios.length ? `<p class="details__line"><strong>Studios :</strong> ${escapeHtml(studios.join(", "))}</p>` : ""}
      ${genres.length ? `<p class="details__line"><strong>Genres :</strong> ${escapeHtml(genres.join(", "))}</p>` : ""}

      <div class="details__themes">
        <div class="details__theme">
          <h3>Openings</h3>
          ${openings.length ? `<ul>${openings.slice(0, 8).map((o) => `<li>${escapeHtml(o)}</li>`).join("")}</ul>` : `<p class="details__muted">Non disponible</p>`}
        </div>
        <div class="details__theme">
          <h3>Endings</h3>
          ${endings.length ? `<ul>${endings.slice(0, 8).map((e) => `<li>${escapeHtml(e)}</li>`).join("")}</ul>` : `<p class="details__muted">Non disponible</p>`}
        </div>
      </div>

      ${
        trailerUrl
          ? `<p class="details__line"><a class="details__link" href="${escapeAttr(
              trailerUrl
            )}" target="_blank" rel="noopener">▶️ Voir le trailer</a></p>`
          : ""
      }

      <p class="details__muted">⚠️ L’API donne les titres des openings/endings, pas les fichiers audio.</p>
    </div>
  `;
}

/* =========================
   Utils
========================= */

function escapeAttr(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
