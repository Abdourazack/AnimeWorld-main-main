// Déclaration de la variable globale pour la base de données
let db;

// Ouvrir ou créer la base de données IndexedDB
const request = indexedDB.open("mangaDB", 1);

// Gestion des erreurs lors de l'ouverture de la base de données
request.onerror = function (event) {
  console.log("Erreur d’ouverture de la base de données");
};

// Succès de l'ouverture de la base de données
request.onsuccess = function (event) {
  db = event.target.result; // Assignation de l'objet base de données à la variable globale
  loadLibrary(); // Charger les mangas depuis la base de données
};

// Événement déclenché lors de la création ou de la mise à jour de la base de données
request.onupgradeneeded = function (event) {
  db = event.target.result; // Récupérer la base de données

  // Vérifier si l'object store "mangas" n'existe pas déjà
  if (!db.objectStoreNames.contains("mangas")) {
    // Créer l'object store "mangas" avec une clé primaire "id"
    const mangaStore = db.createObjectStore("mangas", { keyPath: "id" });

    // Ajouter un index sur le champ "title" pour des recherches rapides
    mangaStore.createIndex("title", "title", { unique: false });
  }
};

// Fonction pour charger les mangas depuis IndexedDB
function loadLibrary() {
  // Ouvrir une transaction en lecture seule sur l'object store "mangas"
  const transaction = db.transaction(["mangas"], "readonly");
  const store = transaction.objectStore("mangas");

  // Récupérer tous les enregistrements de l'object store
  const getRequest = store.getAll();

  // Succès de la récupération des mangas
  getRequest.onsuccess = function (event) {
    const mangas = event.target.result; // Liste des mangas récupérés
    displayLibrary(mangas); // Afficher les mangas dans l'interface utilisateur
  };

  // Gestion des erreurs lors de la récupération des mangas
  getRequest.onerror = function (event) {
    console.error(
      "Erreur lors de la récupération des mangas : ",
      event.target.error
    );
  };
}

// Fonction pour afficher les mangas dans l'interface utilisateur
function displayLibrary(mangas) {
  const libraryCards = document.getElementById("library-cards"); // Conteneur des cartes
  libraryCards.innerHTML = ""; // Réinitialiser le contenu du conteneur

  // Parcourir la liste des mangas
  mangas.forEach((manga) => {
    const card = document.createElement("div"); // Créer une carte pour chaque manga
    card.classList.add("anime-card"); // Ajouter une classe CSS à la carte

    // Contenu HTML de la carte
    card.innerHTML = `
      <img src="${manga.images.jpg.image_url}" alt="${manga.title}">
      <h3>${manga.title}</h3>
      <button class="delete-from-db">Supprimer</button>
      <button class="desc-button" data-synopsis="${manga.synopsis}">Voir Description</button>
    `;

    // Ajouter un gestionnaire d'événement pour le bouton de suppression
    card.querySelector(".delete-from-db").addEventListener("click", () => {
      deleteFromIndexedDB(manga.id); // Supprimer le manga de la base de données
    });

    // Ajouter un gestionnaire d'événement pour le bouton de description
    setTimeout(() => {
      document.querySelectorAll(".desc-button").forEach(button => {
        button.addEventListener("click", function() {
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

    libraryCards.appendChild(card); // Ajouter la carte au conteneur
  });
}

// Fonction pour supprimer un manga de IndexedDB
function deleteFromIndexedDB(id) {
  // Ouvrir une transaction en lecture-écriture sur l'object store "mangas"
  const transaction = db.transaction(["mangas"], "readwrite");
  const store = transaction.objectStore("mangas");

  // Supprimer l'enregistrement avec l'identifiant fourni
  const deleteRequest = store.delete(id);

  // Succès de la suppression
  deleteRequest.onsuccess = function () {
    Swal.fire({
      // Afficher une alerte de succès
      icon: "success",
      title: "Supprimé",
      text: "L'anime a été supprimé de votre bibliothèque.",
    });
    loadLibrary(); // Recharger la bibliothèque
  };

  // Gestion des erreurs lors de la suppression
  deleteRequest.onerror = function (event) {
    console.error("Erreur lors de la suppression : ", event.target.error);
  };
}
