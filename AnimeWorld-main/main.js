let db;

// Ouvrir ou créer la base de données IndexedDB
const request = indexedDB.open("mangaDB", 1);

// Gestion des erreurs lors de l'ouverture de la base de données
request.onerror = function (event) {
  console.log("Erreur d’ouverture de la base de données");
};

// Succès de l'ouverture de la base de données
request.onsuccess = function (event) {
  db = event.target.result; // Récupération de l'instance de la base de données
};

// Mise à jour ou création de la structure de la base de données
request.onupgradeneeded = function (event) {
  db = event.target.result;
  // Création d'une table "mangas" avec une clé primaire "id"
  db.createObjectStore("mangas", { keyPath: "id" });
};

// Récupérer les données des animes à partir de l'API Jikan
axios
  .get("https://api.jikan.moe/v4/anime")
  .then((response) => {
    const animes = response.data.data; // Extraction des données des animes
    displayAnimes(animes); // Afficher les cartes des animes
  })
  .catch((error) => {
    console.error("Erreur lors de la récupération des animes", error);
  });

function displayAnimes(animes) {
  console.log(animes);
  const animeCards = document.getElementById("anime-cards");
  animeCards.innerHTML = ""; // Vider les cartes existantes
  document.getElementById("loader").style.display = "none"; // Cacher le loader une fois les données chargées

  animes.forEach((anime) => {
    const card = document.createElement("div");
    card.classList.add("anime-card"); // Ajout de la classe pour le style

    // Vérification du synopsis
    const synopsisText = anime.synopsis
      ? anime.synopsis.replace(/"/g, "'")
      : "Synopsis indisponible";

    // Contenu HTML de la carte de l'anime avec un bouton pour voir la description
    card.innerHTML = `
        <img src="${anime.images.jpg.image_url}" alt="${anime.title}">
        <h3>${anime.title}</h3>
        <button class="add-to-db">Ajouter à mes mangas</button>
        
        <button class="desc-button" data-synopsis="${synopsisText}">Voir Description</button>
        
      `;

    // Ajouter l'anime à IndexedDB au clic du bouton
    card.querySelector(".add-to-db").addEventListener("click", () => {
      addToIndexedDB(anime);
    });

    animeCards.appendChild(card); // Ajouter la carte au conteneur principal
  });

  // S'assurer que les événements sont bien attachés après le rendu des cartes
  setTimeout(() => {
    document.querySelectorAll(".desc-button").forEach((button) => {
      button.addEventListener("click", function () {
        Swal.fire({
          title: this.getAttribute("data-title"),
          text: this.getAttribute("data-synopsis"),
          icon: "info",
          confirmButtonText: "Fermer",
        });
      });
    });
    console.log("Boutons description ajoutés !");
  }, 100);

  // Animation pour afficher les cartes des animes
  anime({
    targets: ".anime-card",
    opacity: [0, 1],
    translateY: [-50, 0],
    duration: 1000,
    delay: anime.stagger(200), // Animation échelonnée pour chaque carte
  });
}

// Ajouter un anime à la base de données IndexedDB
function addToIndexedDB(anime) {
  const transaction = db.transaction(["mangas"], "readwrite");
  const store = transaction.objectStore("mangas");

  const animeId = anime.mal_id; // Utiliser mal_id comme clé primaire

  // Vérifier si l'anime est déjà dans la base de données
  const getRequest = store.get(animeId);

  getRequest.onsuccess = function () {
    if (getRequest.result) {
      // L'anime est déjà dans la base de données
      Swal.fire({
        icon: "info",
        title: "Déjà ajouté",
        text: `L'anime "${anime.title}" est déjà dans votre collection.`,
      });
    } else {
      // L'anime n'est pas dans la base de données, on l'ajoute
      const animeWithId = { ...anime, id: animeId }; // Ajouter une clé "id" basée sur mal_id
      const addRequest = store.add(animeWithId);

      addRequest.onsuccess = function () {
        Swal.fire({
          icon: "success",
          title: "Anime ajouté",
          text: `L'anime "${anime.title}" a été ajouté à votre collection !`,
        });
      };

      addRequest.onerror = function (event) {
        console.error(
          "Erreur lors de l'ajout à IndexedDB : ",
          event.target.error
        );
        Swal.fire({
          icon: "error",
          title: "Erreur",
          text: `Impossible d'ajouter "${anime.title}" à la collection.`,
        });
      };
    }
  };

  getRequest.onerror = function (event) {
    console.error(
      "Erreur lors de la vérification de l'anime dans IndexedDB : ",
      event.target.error
    );
    Swal.fire({
      icon: "error",
      title: "Erreur",
      text: "Une erreur s'est produite lors de l'accès à IndexedDB.",
    });
  };
}
