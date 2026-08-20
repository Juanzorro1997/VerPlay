/* =========================
   DATOS DE VÍDEOS
========================= */

const videos = [
  {
    title: "Gameplay de ejemplo",
    description: "Un vídeo de gaming para probar VerPlay.",
    category: "Gaming",
    thumbnail: "assets/thumb-gaming.jpg",
    video: "assets/video-gaming.mp4",
    duration: "12:45"
  },

  {
    title: "Música para relajarse",
    description: "Una selección musical para escuchar tranquilamente.",
    category: "Música",
    thumbnail: "assets/thumb-music.jpg",
    video: "assets/video-music.mp4",
    duration: "08:32"
  },

  {
    title: "Animación 3D",
    description: "Una pequeña animación creada en 3D.",
    category: "Animación",
    thumbnail: "assets/thumb-animation.jpg",
    video: "assets/video-animation.mp4",
    duration: "03:21"
  },

  {
    title: "Tecnología del futuro",
    description: "Noticias y curiosidades sobre tecnología.",
    category: "Tecnología",
    thumbnail: "assets/thumb-tech.jpg",
    video: "assets/video-tech.mp4",
    duration: "15:02"
  }
];


/* =========================
   ELEMENTOS
========================= */

const grid = document.getElementById("grid");
const count = document.getElementById("count");
const search = document.getElementById("search");

const modal = document.getElementById("modal");
const player = document.getElementById("player");

const modalTitle = document.getElementById("modalTitle");
const modalDesc = document.getElementById("modalDesc");

const closeButton = document.querySelector(".close");

const categoryButtons =
  document.querySelectorAll(".categories button");

const videoFile =
  document.getElementById("videoFile");


/* =========================
   ESTADO
========================= */

let currentCategory = "Todos";


/* =========================
   RENDERIZAR VÍDEOS
========================= */

function renderVideos() {

  const searchText =
    search.value
      .trim()
      .toLowerCase();


  const filteredVideos =
    videos.filter(video => {

      const matchesCategory =
        currentCategory === "Todos" ||
        video.category === currentCategory;

      const matchesSearch =
        video.title
          .toLowerCase()
          .includes(searchText) ||

        video.description
          .toLowerCase()
          .includes(searchText);

      return matchesCategory && matchesSearch;
    });


  grid.innerHTML = "";


  count.textContent =
    `${filteredVideos.length} ${
      filteredVideos.length === 1
        ? "vídeo"
        : "vídeos"
    }`;


  if (filteredVideos.length === 0) {

    grid.innerHTML = `
      <div class="empty">

        <h3>
          No se encontraron vídeos
        </h3>

        <p>
          Prueba con otra búsqueda o categoría.
        </p>

      </div>
    `;

    return;
  }


  filteredVideos.forEach(video => {

    const card =
      document.createElement("article");

    card.className = "video-card";


    card.innerHTML = `

      <div class="thumbnail">

        <img
          src="${video.thumbnail}"
          alt="${escapeHTML(video.title)}"
          onerror="this.style.display='none'"
        >

        <span class="duration">
          ${video.duration}
        </span>

      </div>


      <div class="video-info">

        <h3 class="video-title">
          ${escapeHTML(video.title)}
        </h3>

        <p class="video-description">
          ${escapeHTML(video.description)}
        </p>

      </div>

    `;


    card.addEventListener("click", () => {

      openVideo(video);

    });


    grid.appendChild(card);

  });

}


/* =========================
   ABRIR VÍDEO
========================= */

function openVideo(video) {

  player.src = video.video;

  modalTitle.textContent =
    video.title;

  modalDesc.textContent =
    video.description;

  modal.classList.remove("hidden");

  player.play().catch(() => {});

}


/* =========================
   CERRAR VÍDEO
========================= */

function closeModal() {

  player.pause();

  player.removeAttribute("src");

  player.load();

  modal.classList.add("hidden");

}


closeButton.addEventListener(
  "click",
  closeModal
);


modal.addEventListener(
  "click",
  event => {

    if (event.target === modal) {

      closeModal();

    }

  }
);


/* =========================
   ESC PARA CERRAR
========================= */

document.addEventListener(
  "keydown",
  event => {

    if (event.key === "Escape") {

      closeModal();

    }

  }
);


/* =========================
   BÚSQUEDA
========================= */

search.addEventListener(
  "input",
  renderVideos
);


/* =========================
   CATEGORÍAS
========================= */

categoryButtons.forEach(button => {

  button.addEventListener(
    "click",
    () => {

      categoryButtons.forEach(btn => {

        btn.classList.remove("active");

      });


      button.classList.add("active");


      currentCategory =
        button.dataset.cat;


      renderVideos();

    }
  );

});


/* =========================
   SUBIR VÍDEO LOCAL
========================= */

videoFile.addEventListener(
  "change",
  event => {

    const file =
      event.target.files[0];

    if (!file) {
      return;
    }


    const videoURL =
      URL.createObjectURL(file);


    const uploadedVideo = {

      title: file.name,

      description:
        "Vídeo subido desde tu dispositivo.",

      category: "Otros",

      thumbnail: "",

      video: videoURL,

      duration: "LOCAL"

    };


    videos.unshift(
      uploadedVideo
    );


    currentCategory = "Todos";


    categoryButtons.forEach(btn => {

      btn.classList.remove("active");

    });


    document
      .querySelector('[data-cat="Todos"]')
      .classList.add("active");


    search.value = "";


    renderVideos();

  }
);


/* =========================
   SEGURIDAD HTML
========================= */

function escapeHTML(text) {

  const div =
    document.createElement("div");

  div.textContent = text;

  return div.innerHTML;

}


/* =========================
   INICIO
========================= */

renderVideos();