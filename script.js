/* ============================================================
   VERPLAY V2
   Prototipo sin servidor

   Todo se almacena en localStorage.
============================================================ */


/* ============================================================
   VÍDEOS DE DEMOSTRACIÓN
============================================================ */

const videos = [
    {
        id: 1,
        title: "Gameplay de ejemplo",
        description: "Un vídeo de demostración de VerPlay.",
        category: "Gaming",
        icon: "🎮"
    },

    {
        id: 2,
        title: "Música relajante",
        description: "Música para relajarse.",
        category: "Música",
        icon: "🎵"
    },

    {
        id: 3,
        title: "Animación de ejemplo",
        description: "Una pequeña animación.",
        category: "Animación",
        icon: "🎨"
    },

    {
        id: 4,
        title: "Tecnología",
        description: "Vídeo sobre tecnología.",
        category: "Tecnología",
        icon: "💻"
    },

    {
        id: 5,
        title: "Vídeo de la comunidad",
        description: "Contenido creado por usuarios.",
        category: "Otros",
        icon: "🎬"
    },

    {
        id: 6,
        title: "Gaming retro",
        description: "Un viaje por los videojuegos clásicos.",
        category: "Gaming",
        icon: "🕹️"
    }
];


/* ============================================================
   ELEMENTOS
============================================================ */

const grid = document.getElementById("grid");
const count = document.getElementById("count");

const search = document.getElementById("search");
const searchButton = document.getElementById("searchButton");

const settingsButton =
    document.getElementById("settingsButton");

const settingsModal =
    document.getElementById("settingsModal");

const closeSettings =
    document.getElementById("closeSettings");

const closeSettingsButton =
    document.getElementById("closeSettingsButton");

const backgroundColor =
    document.getElementById("backgroundColor");

const backgroundImage =
    document.getElementById("backgroundImage");

const resetBackground =
    document.getElementById("resetBackground");

const removeBackgroundImage =
    document.getElementById("removeBackgroundImage");


/* ============================================================
   USUARIO
============================================================ */

let currentUser =
    JSON.parse(
        localStorage.getItem("verplay_current_user")
    ) || null;


/* ============================================================
   FUNCIONES LOCALSTORAGE
============================================================ */

function saveUser(user) {

    localStorage.setItem(
        "verplay_user",
        JSON.stringify(user)
    );

    localStorage.setItem(
        "verplay_current_user",
        JSON.stringify(user)
    );
}


function getUser() {

    return JSON.parse(
        localStorage.getItem("verplay_user")
    ) || null;
}


/* ============================================================
   CONFIGURACIÓN DE FONDO
============================================================ */

function loadBackground() {

    const color =
        localStorage.getItem(
            "verplay_background_color"
        );

    const image =
        localStorage.getItem(
            "verplay_background_image"
        );


    if (color) {

        document.documentElement.style.setProperty(
            "--bg",
            color
        );

        backgroundColor.value = color;
    }


    if (image) {

        document.body.style.backgroundImage =
            `url("${image}")`;

        document.body.style.backgroundSize =
            "cover";

        document.body.style.backgroundAttachment =
            "fixed";

        document.body.style.backgroundPosition =
            "center";
    }
}


backgroundColor.addEventListener(
    "input",
    function () {

        const color = this.value;

        document.documentElement.style.setProperty(
            "--bg",
            color
        );

        localStorage.setItem(
            "verplay_background_color",
            color
        );
    }
);


backgroundImage.addEventListener(
    "change",
    function () {

        const file = this.files[0];

        if (!file) return;


        const reader = new FileReader();

        reader.onload = function (event) {

            const image =
                event.target.result;

            document.body.style.backgroundImage =
                `url("${image}")`;

            document.body.style.backgroundSize =
                "cover";

            document.body.style.backgroundAttachment =
                "fixed";

            document.body.style.backgroundPosition =
                "center";

            localStorage.setItem(
                "verplay_background_image",
                image
            );
        };

        reader.readAsDataURL(file);
    }
);


resetBackground.addEventListener(
    "click",
    function () {

        const defaultColor = "#0b0d12";

        document.documentElement.style.setProperty(
            "--bg",
            defaultColor
        );

        backgroundColor.value =
            defaultColor;

        localStorage.setItem(
            "verplay_background_color",
            defaultColor
        );
    }
);


removeBackgroundImage.addEventListener(
    "click",
    function () {

        document.body.style.backgroundImage =
            "none";

        localStorage.removeItem(
            "verplay_background_image"
        );

        backgroundImage.value = "";
    }
);


/* ============================================================
   CONFIGURACIÓN MODAL
============================================================ */

function openSettings() {

    settingsModal.classList.remove("hidden");
}


function closeSettingsModal() {

    settingsModal.classList.add("hidden");
}


settingsButton.addEventListener(
    "click",
    openSettings
);


closeSettings.addEventListener(
    "click",
    closeSettingsModal
);


closeSettingsButton.addEventListener(
    "click",
    closeSettingsModal
);


/* ============================================================
   RENDER VIDEOS
============================================================ */

function renderVideos(list = videos) {

    grid.innerHTML = "";

    count.textContent =
        `${list.length} vídeo${list.length === 1 ? "" : "s"}`;


    if (list.length === 0) {

        grid.innerHTML = `
            <div style="
                grid-column:1/-1;
                text-align:center;
                padding:60px;
                color:#9299a8;
            ">
                No se encontraron vídeos.
            </div>
        `;

        return;
    }


    const user = getUser();

    const favorites =
        user?.favorites || [];


    list.forEach(video => {

        const isFavorite =
            favorites.includes(video.id);


        const card =
            document.createElement("article");

        card.className =
            "video-card";


        card.innerHTML = `

            <div class="thumbnail">

                ${video.icon}

            </div>

            <div class="video-info">

                <h3>
                    ${video.title}
                </h3>

                <p>
                    ${video.description}
                </p>

                <div class="video-bottom">

                    <span>
                        ${video.category}
                    </span>

                    <button
                        class="favorite ${isFavorite ? "active" : ""}"
                        data-id="${video.id}"
                        title="Favorito"
                    >
                        ${isFavorite ? "♥" : "♡"}
                    </button>

                </div>

            </div>
        `;


        card.addEventListener(
            "click",
            function (event) {

                if (
                    event.target.classList.contains(
                        "favorite"
                    )
                ) {
                    return;
                }

                openVideo(video);
            }
        );


        const favoriteButton =
            card.querySelector(".favorite");


        favoriteButton.addEventListener(
            "click",
            function () {

                toggleFavorite(video.id);
            }
        );


        grid.appendChild(card);
    });
}


/* ============================================================
   FAVORITOS
============================================================ */

function toggleFavorite(videoId) {

    if (!currentUser) {

        alert(
            "Necesitas registrarte para guardar vídeos favoritos."
        );

        openRegister();

        return;
    }


    const user = getUser();

    if (!user.favorites) {
        user.favorites = [];
    }


    const index =
        user.favorites.indexOf(videoId);


    if (index === -1) {

        user.favorites.push(videoId);

    } else {

        user.favorites.splice(index, 1);
    }


    currentUser = user;

    saveUser(user);

    renderVideos();
}


/* ============================================================
   REPRODUCTOR
============================================================ */

const modal =
    document.getElementById("modal");

const player =
    document.getElementById("player");

const modalTitle =
    document.getElementById("modalTitle");

const modalDesc =
    document.getElementById("modalDesc");

const closeModal =
    document.getElementById("closeModal");


function openVideo(video) {

    modalTitle.textContent =
        video.title;

    modalDesc.textContent =
        video.description;

    /*
        Estos vídeos todavía son prototipos,
        así que no hay archivo real.
    */

    player.removeAttribute("src");

    modal.classList.remove("hidden");
}


closeModal.addEventListener(
    "click",
    function () {

        modal.classList.add("hidden");

        player.pause();

    }
);


/* ============================================================
   CATEGORÍAS
============================================================ */

document
    .querySelectorAll(".categories button")
    .forEach(button => {

        button.addEventListener(
            "click",
            function () {

                document
                    .querySelectorAll(
                        ".categories button"
                    )
                    .forEach(btn =>
                        btn.classList.remove("active")
                    );


                this.classList.add("active");


                const category =
                    this.dataset.cat;


                if (category === "Todos") {

                    renderVideos();

                } else {

                    renderVideos(
                        videos.filter(
                            video =>
                                video.category === category
                        )
                    );
                }
            }
        );
    });


/* ============================================================
   BUSCADOR
============================================================ */

function performSearch() {

    const text =
        search.value
            .trim()
            .toLowerCase();


    if (!text) {

        renderVideos();

        return;
    }


    const results =
        videos.filter(video =>

            video.title
                .toLowerCase()
                .includes(text)

            ||

            video.description
                .toLowerCase()
                .includes(text)

            ||

            video.category
                .toLowerCase()
                .includes(text)
        );


    renderVideos(results);
}


search.addEventListener(
    "input",
    performSearch
);


searchButton.addEventListener(
    "click",
    performSearch
);


/* ============================================================
   REGISTRO
============================================================ */

const profileButton =
    document.getElementById("profileButton");

const profileButtonText =
    document.getElementById("profileButtonText");

const registerModal =
    document.getElementById("registerModal");

const closeRegister =
    document.getElementById("closeRegister");

const registerButton =
    document.getElementById("registerButton");

const registerUsername =
    document.getElementById("registerUsername");

const registerPassword =
    document.getElementById("registerPassword");

const registerMessage =
    document.getElementById("registerMessage");


function openRegister() {

    registerModal.classList.remove("hidden");

    registerMessage.textContent = "";
}


function closeRegisterModal() {

    registerModal.classList.add("hidden");
}


profileButton.addEventListener(
    "click",
    function () {

        if (currentUser) {

            openProfile();

        } else {

            openRegister();
        }
    }
);


closeRegister.addEventListener(
    "click",
    closeRegisterModal
);


registerButton.addEventListener(
    "click",
    register
);


function register() {

    const username =
        registerUsername.value.trim();

    const password =
        registerPassword.value;


    if (username.length < 3) {

        registerMessage.textContent =
            "El nombre debe tener al menos 3 caracteres.";

        return;
    }


    if (password.length < 4) {

        registerMessage.textContent =
            "La contraseña debe tener al menos 4 caracteres.";

        return;
    }


    const existing =
        localStorage.getItem(
            "verplay_user"
        );


    if (existing) {

        registerMessage.textContent =
            "Ya existe una cuenta en este navegador.";

        return;
    }


    const user = {

        username: username,

        password: password,

        bio: "¡Bienvenido a mi perfil de VerPlay!",

        interests:
            "Todavía no has añadido tus intereses.",

        avatar: "",

        cover: "",

        favorites: [],

        achievements: [],

        createdAt: Date.now(),

        connectedSince: Date.now(),

        totalOnlineTime: 0
    };


    saveUser(user);

    currentUser = user;


    registerMessage.textContent =
        "¡Cuenta creada correctamente!";


    setTimeout(
        function () {

            registerModal.classList.add(
                "hidden"
            );

            updateUserButton();

            openProfile();

        },
        600
    );
}


/* ============================================================
   PERFIL
============================================================ */

const profileModal =
    document.getElementById("profileModal");

const closeProfile =
    document.getElementById("closeProfile");

const profileName =
    document.getElementById("profileName");

const profileAvatar =
    document.getElementById("profileAvatar");

const profileCover =
    document.getElementById("profileCover");

const profileBio =
    document.getElementById("profileBio");

const profileInterests =
    document.getElementById("profileInterests");

const profileHours =
    document.getElementById("profileHours");

const profileAchievements =
    document.getElementById(
        "profileAchievements"
    );

const profileFavorites =
    document.getElementById(
        "profileFavorites"
    );

const achievements =
    document.getElementById(
        "achievements"
    );

const favoriteVideos =
    document.getElementById(
        "favoriteVideos"
    );


function openProfile() {

    if (!currentUser) {

        openRegister();

        return;
    }


    updateOnlineTime();

    renderProfile();

    profileModal.classList.remove(
        "hidden"
    );
}


closeProfile.addEventListener(
    "click",
    function () {

        profileModal.classList.add(
            "hidden"
        );
    }
);


/* ============================================================
   AVATAR DEFAULT
============================================================ */

function getDefaultAvatar(username) {

    return (
        "https://ui-avatars.com/api/?" +
        "name=" +
        encodeURIComponent(username) +
        "&background=7c5cff&color=fff&size=256"
    );
}


/* ============================================================
   PERFIL
============================================================ */

function renderProfile() {

    const user = getUser();

    if (!user) return;


    profileName.textContent =
        user.username;


    profileBio.textContent =
        user.bio ||
        "Sin descripción.";


    profileInterests.textContent =
        user.interests ||
        "No especificados.";


    profileAvatar.src =
        user.avatar ||
        getDefaultAvatar(
            user.username
        );


    if (user.cover) {

        profileCover.style.backgroundImage =
            `url("${user.cover}")`;

    } else {

        profileCover.style.backgroundImage =
            "linear-gradient(135deg,#302060,#11141b)";
    }


    const hours =
        Math.floor(
            (user.totalOnlineTime || 0)
            / 3600000
        );


    profileHours.textContent =
        hours;


    profileAchievements.textContent =
        user.achievements?.length || 0;


    profileFavorites.textContent =
        user.favorites?.length || 0;


    renderAchievements(user);

    renderFavorites(user);
}


/* ============================================================
   TIEMPO CONECTADO
============================================================ */

function updateOnlineTime() {

    if (!currentUser) return;


    const user = getUser();

    if (!user) return;


    if (!user.connectedSince) {

        user.connectedSince =
            Date.now();
    }


    const now =
        Date.now();


    const session =
        now - user.connectedSince;


    user.totalOnlineTime =
        (user.totalOnlineTime || 0)
        + session;


    user.connectedSince =
        now;


    checkAchievements(user);


    saveUser(user);

    currentUser = user;
}


/* ============================================================
   LOGROS
============================================================ */

function checkAchievements(user) {

    if (!user.achievements) {

        user.achievements = [];
    }


    /*
        1 hora conectado
    */

    if (
        user.totalOnlineTime >=
        3600000
    ) {

        if (
            !user.achievements.includes(
                "one_hour"
            )
        ) {

            user.achievements.push(
                "one_hour"
            );
        }
    }


    /*
        Primer favorito
    */

    if (
        user.favorites &&
        user.favorites.length >= 1
    ) {

        if (
            !user.achievements.includes(
                "first_favorite"
            )
        ) {

            user.achievements.push(
                "first_favorite"
            );
        }
    }
}


function renderAchievements(user) {

    const achievementList = [

        {
            id: "one_hour",
            icon: "⏱️",
            name: "1 hora conectado"
        },

        {
            id: "first_favorite",
            icon: "❤️",
            name: "Primer favorito"
        },

        {
            id: "first_video",
            icon: "🎬",
            name: "Primer vídeo"
        },

        {
            id: "creator",
            icon: "⭐",
            name: "Creador VerPlay"
        }

    ];


    achievements.innerHTML = "";


    achievementList.forEach(
        achievement => {

            const unlocked =
                user.achievements?.includes(
                    achievement.id
                );


            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "achievement" +
                (
                    unlocked
                        ? ""
                        : " locked"
                );


            div.innerHTML = `

                <div class="achievement-icon">
                    ${achievement.icon}
                </div>

                <div class="achievement-name">
                    ${achievement.name}
                </div>

            `;


            achievements.appendChild(div);
        }
    );
}


/* ============================================================
   FAVORITOS DEL PERFIL
============================================================ */

function renderFavorites(user) {

    favoriteVideos.innerHTML = "";


    if (
        !user.favorites ||
        user.favorites.length === 0
    ) {

        favoriteVideos.innerHTML = `
            <p>
                Todavía no tienes vídeos favoritos.
            </p>
        `;

        return;
    }


    user.favorites.forEach(id => {

        const video =
            videos.find(
                video =>
                    video.id === id
            );


        if (!video) return;


        const div =
            document.createElement(
                "div"
            );


        div.className =
            "favorite-item";


        div.textContent =
            `${video.icon} ${video.title}`;


        favoriteVideos.appendChild(div);
    });
}


/* ============================================================
   EDITAR PERFIL
============================================================ */

const editProfileButton =
    document.getElementById(
        "editProfileButton"
    );

const editProfileModal =
    document.getElementById(
        "editProfileModal"
    );

const closeEditProfile =
    document.getElementById(
        "closeEditProfile"
    );

const avatarInput =
    document.getElementById(
        "avatarInput"
    );

const profileBackgroundInput =
    document.getElementById(
        "profileBackgroundInput"
    );

const interestsInput =
    document.getElementById(
        "interestsInput"
    );

const bioInput =
    document.getElementById(
        "bioInput"
    );

const saveProfileButton =
    document.getElementById(
        "saveProfileButton"
    );


editProfileButton.addEventListener(
    "click",
    function () {

        const user = getUser();

        if (!user) return;


        interestsInput.value =
            user.interests || "";


        bioInput.value =
            user.bio || "";


        editProfileModal.classList.remove(
            "hidden"
        );
    }
);


closeEditProfile.addEventListener(
    "click",
    function () {

        editProfileModal.classList.add(
            "hidden"
        );
    }
);


/* ============================================================
   GUARDAR PERFIL
============================================================ */

saveProfileButton.addEventListener(
    "click",
    async function () {

        const user = getUser();

        if (!user) return;


        user.interests =
            interestsInput.value.trim();


        user.bio =
            bioInput.value.trim();


        /* Avatar */

        if (
            avatarInput.files &&
            avatarInput.files[0]
        ) {

            user.avatar =
                await readFile(
                    avatarInput.files[0]
                );
        }


        /* Fondo del perfil */

        if (
            profileBackgroundInput.files &&
            profileBackgroundInput.files[0]
        ) {

            user.cover =
                await readFile(
                    profileBackgroundInput.files[0]
                );
        }


        saveUser(user);

        currentUser = user;


        editProfileModal.classList.add(
            "hidden"
        );


        renderProfile();
    }
);


/* ============================================================
   FILE READER
============================================================ */

function readFile(file) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();


            reader.onload =
                () => resolve(
                    reader.result
                );


            reader.onerror =
                reject;


            reader.readAsDataURL(file);
        }
    );
}


/* ============================================================
   LOGOUT
============================================================ */

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


logoutButton.addEventListener(
    "click",
    function () {

        localStorage.removeItem(
            "verplay_current_user"
        );

        currentUser = null;

        profileModal.classList.add(
            "hidden"
        );

        updateUserButton();
    }
);


/* ============================================================
   BOTÓN DE USUARIO
============================================================ */

function updateUserButton() {

    if (currentUser) {

        profileButtonText.textContent =
            currentUser.username;

    } else {

        profileButtonText.textContent =
            "Registrarse";
    }
}


/* ============================================================
   CERRAR MODALES AL HACER CLICK FUERA
============================================================ */

document
    .querySelectorAll(".modal")
    .forEach(modalElement => {

        modalElement.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    modalElement
                ) {

                    modalElement.classList.add(
                        "hidden"
                    );
                }
            }
        );
    });


/* ============================================================
   INICIALIZACIÓN
============================================================ */

loadBackground();

updateUserButton();

renderVideos();


/*
    Actualizamos el tiempo periódicamente.
*/

setInterval(
    function () {

        if (!currentUser) return;

        const user = getUser();

        if (!user) return;


        user.totalOnlineTime =
            (
                user.totalOnlineTime || 0
            ) + 60000;


        checkAchievements(user);

        saveUser(user);

        currentUser = user;

    },
    60000
);
