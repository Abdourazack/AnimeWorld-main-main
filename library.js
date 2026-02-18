import axios from "axios";
import Swal from "sweetalert2";
import anime from "animejs/lib/anime.es.js";

let db;

// Cache des détails full
const detailsCache = new Map();

// Open IndexedDB
const request = indexedDB.open("mangaDB", 1);

request.onerror = function () {
  console.log("Erreur d’ouverture de la base de données");
};

request.onsuccess = function (event) {
  db = event.target.result;
  loadLibrary();
};

request.onupgradeneeded = function (event) {
  db = event.target.result;
  if (!db.objectStoreNames.contains("mangas")) {
    db.createObjectStore("mangas", { keyPath: "id" });
  }
};

function loadLibrary() {
  const transaction = db.transaction(["mangas"], "readonly");
  const store = transaction.objectStore("mangas");
  const getRequest = store.getAll();

  getRequest.onsuccess = function (event) {
    const mangas = event.target.result || [];
    displayLibrary(mangas);
  };

  getRequest.onerror = function (event) {
    console.error("Erreur getAll:", event.target.error);
  };
}

function displayLibrary(mangas) {
  const libraryCards = document.getElementById("library-cards");
  const empty = document.getElementById("library-empty");

  libraryCards.innerHTML = "";

  if (!mangas.length) {
    if (empty) empty.style.display = "block";
    return;
  }
  if (empty) empty.style.display = "none";

  const newCards = [];

  mangas.forEach((manga) => {
    const card = document.createElement("div");
    card.classList.add("anime-card");

    // fallback anciens enregistrements
    const synopsisText =
      manga.synopsisText
        ? String(manga.synopsisText).replace(/\s+/g, " ").trim()
        : manga.synopsis
          ? String(manga.synopsis).replace(/\s+/g, " ").trim()
          : "Synopsis indisponible";

    card.innerHTML = `
      <img src="${manga.images?.jpg?.image_url || ""}" alt="${escapeAttr(manga.title)}">
      <h3>${escapeHtml(manga.title)}</h3>

      <div class="actions">
        <button class="delete-from-db">Supprimer</button>

        <button class="details-button"
          data-id="${manga.id}"
          data-title="${escapeAttr(manga.title)}"
          data-synopsis="${escapeAttr(synopsisText)}"
        >Détails</button>

        <button class="desc-button"
          data-title="${escapeAttr(manga.title)}"
          data-synopsis="${escapeAttr(synopsisText)}"
        >Voir Description</button>
      </div>
    `;

    card.querySelector(".delete-from-db").addEventListener("click", async () => {
      const res = await Swal.fire({
        icon: "warning",
        title: "Supprimer ?",
        text: `Retirer "${manga.title}" de ta bibliothèque ?`,
        showCancelButton: true,
        confirmButtonText: "Oui",
        cancelButtonText: "Non",
      });

      if (res.isConfirmed) deleteFromIndexedDB(manga.id);
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

    libraryCards.appendChild(card);
    newCards.push(card);
  });

  anime({
    targets: newCards,
    opacity: [0, 1],
    translateY: [-20, 0],
    duration: 400,
    delay: anime.stagger(35),
  });
}

function deleteFromIndexedDB(id) {
  const transaction = db.transaction(["mangas"], "readwrite");
  const store = transaction.objectStore("mangas");
  const deleteRequest = store.delete(id);

  deleteRequest.onsuccess = function () {
    Swal.fire({
      icon: "success",
      title: "Supprimé",
      text: "Retiré de ta bibliothèque.",
    });
    loadLibrary();
  };

  deleteRequest.onerror = function (event) {
    console.error("Erreur delete:", event.target.error);
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
