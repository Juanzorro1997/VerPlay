/* =========================================================
   VERPLAY V2
   PROTOTIPO FRONTEND

   IMPORTANTE:

   - No existe backend.
   - No existe subida real de vídeos.
   - Las cuentas son simuladas.
   - Los datos se guardan en localStorage.
========================================================= */


/* =========================================================
   CONFIGURACIÓN
========================================================= */

const STORAGE_USERS = "verplay_users";
const STORAGE_CURRENT_USER = "verplay_current_user";
const STORAGE_APPEARANCE = "verplay_appearance";


/* =========================================================
   VÍDEOS DE DEMOSTRACIÓN
========================================================= */

const videos = [

    {
        id: "video-001",

        title: "Gameplay de prueba",

        description:
            "Un gameplay de demostración para probar el reproductor de VerPlay.",

        category: "Gaming",

        author:
            "VerPlay",

        duration:
            "12:45",

        thumbnail:
            "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",

        video:
            "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
    },


    {
        id: "video-002",

        title: "Mundo de videojuegos",

        description:
            "Explorando el mundo de los videojuegos y sus posibilidades.",

        category: "Gaming",

        author:
            "VerPlay",

        duration:
            "08:21",

        thumbnail:
            "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=800&q=80",

        video:
            "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
    },


    {
        id: "video-003",

        title: "Música y relajación",

        description:
            "Una pequeña experiencia musical para relajarse.",

        category: "Música",

        author:
            "MusicWorld",

        duration:
            "05:32",

        thumbnail:
            "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=80",

        video:
            "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
    },


    {
        id: "video-004",

        title: "Animación 3D",

        description:
            "Una demostración de animación y diseño 3D.",

        category: "Animación",

        author:
            "3DArtist",

        duration:
            "03:21",

        thumbnail:
            "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80",

        video:
            "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
    },


    {
        id: "video-005",

        title: "Tecnología del futuro",

        description:
            "Una mirada a las nuevas tecnologías.",

        category: "Tecnología",

        author:
            "TechLab",

        duration:
            "15:02",

        thumbnail:
            "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",

        video:
            "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
    },


    {
        id: "video-006",

        title: "Construyendo un ordenador",

        description:
            "Proceso de montaje de un ordenador desde cero.",

        category: "Tecnología",

        author:
            "TechLab",

        duration:
            "18:42",

        thumbnail:
            "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80",

        video:
            "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
    }


];


/* =========================================================
   LOGROS
========================================================= */

const achievements = [

    {
        id: "account",

        icon: "🟣",

        name:
            "Primer paso",

        description:
            "Crear una cuenta de VerPlay.",

        condition:
            user => true
    },


    {
        id: "first-video",

        icon: "🎬",

        name:
            "Primer vídeo",

        description:
            "Ver tu primer vídeo.",

        condition:
            user =>
                user.stats.videosWatched >= 1
    },


    {
        id: "explorer",

        icon: "🔵",

        name:
            "Explorador",

        description:
            "Ver 10 vídeos.",

        condition:
            user =>
                user.stats.videosWatched >= 10
    },


    {
        id: "hour",

        icon: "🟡",

        name:
            "Una hora",

        description:
            "Estar conectado durante una hora.",

        condition:
            user =>
                user.stats.timeOnline >= 3600
    },


    {
        id: "favorite",

        icon: "❤️",

        name:
            "Mi primer favorito",

        description:
            "Guardar un vídeo en favoritos.",

        condition:
            user =>
                user.favorites.length >= 1
    },


    {
        id: "favorites25",

        icon: "💎",

        name:
            "Coleccionista",

        description:
            "Guardar 25 vídeos favoritos.",

        condition:
            user.favorites.length >= 25
    },


    {
        id: "popular",

        icon: "👑",

        name:
            "Veterano",

        description:
            "Conseguir 30 horas conectado.",

        condition:
            user =>
                user.stats.timeOnline >= 108000
    }

];


/* =========================================================
   ESTADO GLOBAL
========================================================= */

let currentCategory = "Todos";

let currentSearch = "";

let currentVideo = null;

let profileTab = "videos";

let authMode = "login";


/* =========================================================
   DOM
========================================================= */

const videoGrid =
    document.getElementById("videoGrid");

const videoCount =
    document.getElementById("videoCount");

const searchInput =
    document.getElementById("searchInput");

const toolsPanel =
    document.getElementById("toolsPanel");

const authModal =
    document.getElementById("authModal");

const videoModal =
    document.getElementById("videoModal");

const editProfileModal =
    document.getElementById("editProfileModal");


/* =========================================================
   LOCAL STORAGE
========================================================= */

function getUsers() {

    try {

        return JSON.parse(
            localStorage.getItem(STORAGE_USERS)
        ) || [];

    } catch {

        return [];

    }

}


function saveUsers(users) {

    localStorage.setItem(
        STORAGE_USERS,
        JSON.stringify(users)
    );

}


function getCurrentUsername() {

    return localStorage.getItem(
        STORAGE_CURRENT_USER
    );

}


function getCurrentUser() {

    const username =
        getCurrentUsername();

    if (!username) {
        return null;
    }


    const users =
        getUsers();


    return users.find(
        user =>
            user.username === username
    ) || null;

}


function saveCurrentUser(user) {

    const users =
        getUsers();


    const index =
        users.findIndex(
            item =>
                item.username === user.username
        );


    if (index === -1) {

        users.push(user);

    } else {

        users[index] = user;

    }


    saveUsers(users);

}


/* =========================================================
   DEFAULT USER
========================================================= */

function createUserObject(
    name,
    username,
    email,
    password
) {

    return {

        name,

        username,

        email,

        password,

        bio:
            "¡Hola! Estoy usando VerPlay.",

        interests:
            [
                "Gaming",
                "Tecnología"
            ],

        avatar:
            "",

        profileBackground:
            "",

        profileColor:
            "#ff3d71",

        favorites:
            [],

        videos:
            [],

        unlockedAchievements:
            [],

        stats: {

            videosWatched:
                0,

            timeOnline:
                0,

            createdAt:
                Date.now(),

            lastSession:
                Date.now(),

            totalSessions:
                0

        }

    };

}


/* =========================================================
   SESSION / TIME
========================================================= */

function updateOnlineTime() {

    const user =
        getCurrentUser();

    if (!user) {
        return;
    }


    const now =
        Date.now();


    const difference =
        Math.floor(
            (now - user.stats.lastSession)
            / 1000
        );


    /*
       Evitamos que una pestaña cerrada durante días
       cuente como tiempo conectado.
    */

    const safeDifference =
        Math.min(
            difference,
            60
        );


    user.stats.timeOnline +=
        safeDifference;


    user.stats.lastSession =
        now;


    saveCurrentUser(user);


    checkAchievements();

    updateAccountUI();

}


setInterval(
    updateOnlineTime,
    1000
);


/* =========================================================
   ACHIEVEMENTS
========================================================= */

function checkAchievements() {

    const user =
        getCurrentUser();

    if (!user) {
        return;
    }


    let changed = false;


    achievements.forEach(
        achievement => {

            const unlocked =
                achievement.condition(user);


            if (
                unlocked &&
                !user.unlockedAchievements.includes(
                    achievement.id
                )
            ) {

                user.unlockedAchievements.push(
                    achievement.id
                );

                changed = true;

            }

        }
    );


    if (changed) {

        saveCurrentUser(user);

    }

}


/* =========================================================
   ACCOUNT UI
========================================================= */

function updateAccountUI() {

    const user =
        getCurrentUser();


    const accountName =
        document.getElementById(
            "accountName"
        );


    const accountAvatar =
        document.getElementById(
            "accountAvatar"
        );


    if (!user) {

        accountName.textContent =
            "Entrar";

        accountAvatar.innerHTML =
            "👤";

        return;

    }


    accountName.textContent =
        user.name;


    if (user.avatar) {

        accountAvatar.innerHTML =
            `<img src="${user.avatar}" alt="">`;

    } else {

        accountAvatar.textContent =
            "👤";

    }

}


/* =========================================================
   AUTH
========================================================= */

function openAuth(mode = "login") {

    authMode =
        mode;

    authModal.classList.remove(
        "hidden"
    );

    updateAuthModal();

}


function closeAuth() {

    authModal.classList.add(
        "hidden"
    );

}


function updateAuthModal() {

    const title =
        document.getElementById(
            "authTitle"
        );

    const description =
        document.getElementById(
            "authDescription"
        );

    const registerFields =
        document.getElementById(
            "registerFields"
        );

    const submit =
        document.getElementById(
            "authSubmit"
        );

    const switchButton =
        document.getElementById(
            "switchAuth"
        );


    clearAuthError();


    if (authMode === "login") {

        title.textContent =
            "Iniciar sesión";

        description.textContent =
            "Entra en tu cuenta de VerPlay.";

        registerFields.classList.add(
            "hidden"
        );

        submit.textContent =
            "Iniciar sesión";

        switchButton.textContent =
            "¿No tienes cuenta? Crear una";

    } else {

        title.textContent =
            "Crear cuenta";

        description.textContent =
            "Crea tu perfil de VerPlay.";

        registerFields.classList.remove(
            "hidden"
        );

        submit.textContent =
            "Crear cuenta";

        switchButton.textContent =
            "¿Ya tienes cuenta? Iniciar sesión";

    }

}


function clearAuthError() {

    const error =
        document.getElementById(
            "authError"
        );

    error.textContent =
        "";

    error.classList.add(
        "hidden"
    );

}


function showAuthError(message) {

    const error =
        document.getElementById(
            "authError"
        );

    error.textContent =
        message;

    error.classList.remove(
        "hidden"
    );

}


function handleAuth() {

    const email =
        document.getElementById(
            "authEmail"
        ).value.trim();


    const password =
        document.getElementById(
            "authPassword"
        ).value;


    if (!email || !password) {

        showAuthError(
            "Completa todos los campos."
        );

        return;

    }


    const users =
        getUsers();


    if (authMode === "login") {

        const user =
            users.find(
                item =>
                    item.email.toLowerCase() ===
                    email.toLowerCase() &&
                    item.password === password
            );


        if (!user) {

            showAuthError(
                "Email o contraseña incorrectos."
            );

            return;

        }


        localStorage.setItem(
            STORAGE_CURRENT_USER,
            user.username
        );


        user.stats.lastSession =
            Date.now();


        user.stats.totalSessions++;


        saveCurrentUser(user);


        closeAuth();

        updateAccountUI();

        checkAchievements();

        showPage("profile");

        renderProfile();

        return;

    }


    const name =
        document.getElementById(
            "registerName"
        ).value.trim();


    const username =
        document.getElementById(
            "registerUsername"
        ).value
            .trim()
            .toLowerCase();


    if (!name || !username) {

        showAuthError(
            "Introduce tu nombre y usuario."
        );

        return;

    }


    if (
        !/^[a-zA-Z0-9_]+$/.test(
            username
        )
    ) {

        showAuthError(
            "El usuario solo puede contener letras, números y _."
        );

        return;

    }


    if (
        users.some(
            user =>
                user.username === username
        )
    ) {

        showAuthError(
            "Ese nombre de usuario ya existe."
        );

        return;

    }


    if (
        users.some(
            user =>
                user.email.toLowerCase() ===
                email.toLowerCase()
        )
    ) {

        showAuthError(
            "Ese email ya está registrado."
        );

        return;

    }


    const user =
        createUserObject(
            name,
            username,
            email,
            password
        );


    user.unlockedAchievements =
        ["account"];


    users.push(user);


    saveUsers(users);


    localStorage.setItem(
        STORAGE_CURRENT_USER,
        username
    );


    closeAuth();

    updateAccountUI();

    showPage("profile");

    renderProfile();


    showMessage(
        "🎉",
        "¡Bienvenido a VerPlay!",
        "Tu cuenta ha sido creada correctamente."
    );

}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

    const user =
        getCurrentUser();


    if (user) {

        user.stats.lastSession =
            Date.now();

        saveCurrentUser(user);

    }


    localStorage.removeItem(
        STORAGE_CURRENT_USER
    );


    updateAccountUI();

    showPage("home");

    renderVideos();

}


/* =========================================================
   ACCOUNT BUTTON
========================================================= */

function openAccount() {

    const user =
        getCurrentUser();


    if (!user) {

        openAuth("login");

        return;

    }


    showPage("profile");

    renderProfile();

}


/* =========================================================
   PAGE NAVIGATION
========================================================= */

function showPage(page) {

    document
        .querySelectorAll(".page")
        .forEach(
            element =>
                element.classList.add("hidden")
        );


    if (page === "profile") {

        document
            .getElementById("page-profile")
            .classList.remove("hidden");

        renderProfile();

    } else {

        document
            .getElementById("page-home")
            .classList.remove("hidden");

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


window.showPage =
    showPage;


window.openAccount =
    openAccount;


/* =========================================================
   SEARCH
========================================================= */

searchInput.addEventListener(
    "input",
    () => {

        currentSearch =
            searchInput.value
                .trim()
                .toLowerCase();

        renderVideos();

    }
);


/* =========================================================
   CATEGORIES
========================================================= */

document
    .querySelectorAll(".category")
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(".category")
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );


                    button.classList.add(
                        "active"
                    );


                    currentCategory =
                        button.dataset.category;


                    renderVideos();

                }
            );

        }
    );


/* =========================================================
   RENDER VIDEOS
========================================================= */

function renderVideos() {

    const filtered =
        videos.filter(
            video => {

                const categoryMatch =
                    currentCategory === "Todos" ||
                    video.category === currentCategory;


                const searchMatch =
                    !currentSearch ||
                    video.title
                        .toLowerCase()
                        .includes(currentSearch) ||
                    video.description
                        .toLowerCase()
                        .includes(currentSearch) ||
                    video.author
                        .toLowerCase()
                        .includes(currentSearch);


                return (
                    categoryMatch &&
                    searchMatch
                );

            }
        );


    videoGrid.innerHTML =
        "";


    videoCount.textContent =
        `${filtered.length} ${
            filtered.length === 1
                ? "vídeo"
                : "vídeos"
        }`;


    if (!filtered.length) {

        videoGrid.innerHTML = `

            <div class="empty-state">

                <h3>
                    No encontramos vídeos
                </h3>

                <p>
                    Prueba otra búsqueda o categoría.
                </p>

            </div>

        `;

        return;

    }


    filtered.forEach(
        video => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "video-card";


            card.innerHTML = `

                <div class="thumbnail">

                    <img
                        src="${video.thumbnail}"
                        alt="${escapeHTML(video.title)}"
                    >

                    <span class="duration">
                        ${video.duration}
                    </span>

                </div>


                <div class="video-info">

                    <h3 class="video-title">
                        ${escapeHTML(video.title)}
                    </h3>

                    <div class="video-author">
                        ${escapeHTML(video.author)}
                    </div>

                    <span class="video-category">
                        ${escapeHTML(video.category)}
                    </span>

                </div>

            `;


            card.addEventListener(
                "click",
                () =>
                    openVideo(video)
            );


            videoGrid.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   VIDEO PLAYER
========================================================= */

function openVideo(video) {

    currentVideo =
        video;


    const player =
        document.getElementById(
            "videoPlayer"
        );


    document.getElementById(
        "modalVideoTitle"
    ).textContent =
        video.title;


    document.getElementById(
        "modalVideoDescription"
    ).textContent =
        video.description;


    player.src =
        video.video;


    updateFavoriteButton();


    videoModal.classList.remove(
        "hidden"
    );


    const user =
        getCurrentUser();


    if (user) {

        user.stats.videosWatched++;


        user.stats.lastSession =
            Date.now();


        saveCurrentUser(user);

        checkAchievements();

    }


    player.play().catch(
        () => {}
    );

}


function closeVideo() {

    const player =
        document.getElementById(
            "videoPlayer"
        );


    player.pause();

    player.removeAttribute(
        "src"
    );

    player.load();


    videoModal.classList.add(
        "hidden"
    );


    currentVideo =
        null;

}


document
    .getElementById("closeVideo")
    .addEventListener(
        "click",
        closeVideo
    );


videoModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            videoModal
        ) {

            closeVideo();

        }

    }
);


/* =========================================================
   FAVORITES
========================================================= */

function toggleFavorite() {

    const user =
        getCurrentUser();


    if (!user) {

        closeVideo();

        openAuth("login");

        return;

    }


    if (!currentVideo) {
        return;
    }


    const index =
        user.favorites.indexOf(
            currentVideo.id
        );


    if (index === -1) {

        user.favorites.push(
            currentVideo.id
        );

    } else {

        user.favorites.splice(
            index,
            1
        );

    }


    saveCurrentUser(user);

    checkAchievements();

    updateFavoriteButton();

}


function updateFavoriteButton() {

    const button =
        document.getElementById(
            "favoriteButton"
        );


    const user =
        getCurrentUser();


    if (
        !user ||
        !currentVideo
    ) {

        button.textContent =
            "♡ Favorito";

        return;

    }


    const favorite =
        user.favorites.includes(
            currentVideo.id
        );


    button.textContent =
        favorite
            ? "♥ En favoritos"
            : "♡ Favorito";

}


document
    .getElementById(
        "favoriteButton"
    )
    .addEventListener(
        "click",
        toggleFavorite
    );


/* =========================================================
   TOOLS
========================================================= */

document
    .getElementById("toolsButton")
    .addEventListener(
        "click",
        () => {

            toolsPanel.classList.toggle(
                "hidden"
            );

        }
    );


document
    .getElementById("closeTools")
    .addEventListener(
        "click",
        () => {

            toolsPanel.classList.add(
                "hidden"
            );

        }
    );


document
    .getElementById(
        "backgroundColor"
    )
    .addEventListener(
        "input",
        applyAppearance
    );


document
    .getElementById(
        "backgroundType"
    )
    .addEventListener(
        "change",
        applyAppearance
    );


document
    .getElementById(
        "backgroundImage"
    )
    .addEventListener(
        "change",
        event => {

            const file =
                event.target.files[0];


            if (!file) {
                return;
            }


            const reader =
                new FileReader();


            reader.onload =
                () => {

                    const appearance =
                        getAppearance();


                    appearance.image =
                        reader.result;


                    localStorage.setItem(
                        STORAGE_APPEARANCE,
                        JSON.stringify(
                            appearance
                        )
                    );


                    applyAppearance();

                };


            reader.readAsDataURL(
                file
            );

        }
    );


document
    .getElementById(
        "resetAppearance"
    )
    .addEventListener(
        "click",
        () => {

            localStorage.removeItem(
                STORAGE_APPEARANCE
            );

            applyAppearance();

            document.getElementById(
                "backgroundColor"
            ).value =
                "#0b0b0f";

            document.getElementById(
                "backgroundType"
            ).value =
                "solid";

            document.getElementById(
                "backgroundImage"
            ).value =
                "";

        }
    );


function getAppearance() {

    try {

        return JSON.parse(
            localStorage.getItem(
                STORAGE_APPEARANCE
            )
        ) || {

            color:
                "#0b0b0f",

            type:
                "solid",

            image:
                ""

        };

    } catch {

        return {

            color:
                "#0b0b0f",

            type:
                "solid",

            image:
                ""

        };

    }

}


function applyAppearance() {

    const colorInput =
        document.getElementById(
            "backgroundColor"
        );


    const typeInput =
        document.getElementById(
            "backgroundType"
        );


    const appearance =
        getAppearance();


    appearance.color =
        colorInput.value;


    appearance.type =
        typeInput.value;


    if (
        appearance.type ===
        "gradient"
    ) {

        document.body.style.background =
            `linear-gradient(
                135deg,
                ${appearance.color},
                #050507
            ) fixed`;

    } else {

        document.body.style.background =
            `${appearance.color}`;

    }


    if (appearance.image) {

        document.body.style.backgroundImage =
            `linear-gradient(
                rgba(0,0,0,.45),
                rgba(0,0,0,.45)
            ),
            url("${appearance.image}")`;

        document.body.style.backgroundSize =
            "cover";

        document.body.style.backgroundAttachment =
            "fixed";

        document.body.style.backgroundPosition =
            "center";

    }


    localStorage.setItem(
        STORAGE_APPEARANCE,
        JSON.stringify(
            appearance
        )
    );

}


function loadAppearance() {

    const appearance =
        getAppearance();


    document.getElementById(
        "backgroundColor"
    ).value =
        appearance.color;


    document.getElementById(
        "backgroundType"
    ).value =
        appearance.type;


    applyAppearance();

}


/* =========================================================
   UPLOAD BUTTON
========================================================= */

document
    .getElementById("uploadButton")
    .addEventListener(
        "click",
        () => {

            const user =
                getCurrentUser();


            if (!user) {

                showMessage(
                    "🔒",
                    "Necesitas una cuenta",
                    "Para subir vídeos necesitas registrarte o iniciar sesión en VerPlay."
                );

                return;

            }


            showMessage(
                "🚧",
                "Función en desarrollo",
                "La subida de vídeos estará disponible cuando VerPlay tenga un sistema de almacenamiento. Esta versión es solamente un prototipo."
            );

        }
    );


/* =========================================================
   PROFILE
========================================================= */

function renderProfile() {

    const user =
        getCurrentUser();


    if (!user) {

        showPage("home");

        return;

    }


    const avatar =
        document.getElementById(
            "profileAvatar"
        );


    if (user.avatar) {

        avatar.src =
            user.avatar;

    } else {

        avatar.src =
            createDefaultAvatar(
                user.name,
                user.profileColor
            );

    }


    document.getElementById(
        "profileName"
    ).textContent =
        user.name;


    document.getElementById(
        "profileUsername"
    ).textContent =
        "@" + user.username;


    document.getElementById(
        "profileBio"
    ).textContent =
        user.bio || "Sin biografía.";


    const interests =
        document.getElementById(
            "profileInterests"
        );


    interests.innerHTML =
        user.interests
            .map(
                interest =>
                    `<span class="interest">
                        ${escapeHTML(interest)}
                    </span>`
            )
            .join("");


    const cover =
        document.getElementById(
            "profileCover"
        );


    if (user.profileBackground) {

        cover.style.backgroundImage =
            `url("${user.profileBackground}")`;

    } else {

        cover.style.backgroundImage =
            `linear-gradient(
                135deg,
                ${user.profileColor},
                #101016
            )`;

    }


    document.documentElement.style
        .setProperty(
            "--accent",
            user.profileColor
        );


    renderProfileContent();

}


function renderProfileContent() {

    const content =
        document.getElementById(
            "profileContent"
        );


    if (profileTab === "achievements") {

        renderAchievements(
            content
        );

        return;

    }


    const user =
        getCurrentUser();


    let list = [];


    if (profileTab === "favorites") {

        list =
            videos.filter(
                video =>
                    user.favorites.includes(
                        video.id
                    )
            );

    } else {

        list =
            user.videos.map(
                id =>
                    videos.find(
                        video =>
                            video.id === id
                    )
            ).filter(Boolean);

    }


    if (!list.length) {

        content.innerHTML = `

            <div class="empty-state">

                <h3>
                    ${
                        profileTab === "favorites"
                            ? "Todavía no tienes favoritos"
                            : "Todavía no tienes vídeos"
                    }
                </h3>

                <p>
                    Esta sección se irá llenando
                    cuando utilices VerPlay.
                </p>

            </div>

        `;

        return;

    }


    content.innerHTML = "";


    const grid =
        document.createElement(
            "div"
        );


    grid.className =
        "video-grid";


    list.forEach(
        video => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "video-card";


            card.innerHTML = `

                <div class="thumbnail">

                    <img
                        src="${video.thumbnail}"
                        alt=""
                    >

                    <span class="duration">
                        ${video.duration}
                    </span>

                </div>

                <div class="video-info">

                    <h3 class="video-title">
                        ${escapeHTML(video.title)}
                    </h3>

                    <div class="video-author">
                        ${escapeHTML(video.author)}
                    </div>

                </div>

            `;


            card.addEventListener(
                "click",
                () =>
                    openVideo(video)
            );


            grid.appendChild(
                card
            );

        }
    );


    content.appendChild(
        grid
    );

}


/* =========================================================
   PROFILE TABS
========================================================= */

document
    .querySelectorAll(".profile-tab")
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(".profile-tab")
                        .forEach(
                            tab =>
                                tab.classList.remove(
                                    "active"
                                )
                        );


                    button.classList.add(
                        "active"
                    );


                    profileTab =
                        button.dataset.profileTab;


                    renderProfileContent();

                }
            );

        }
    );


/* =========================================================
   ACHIEVEMENTS RENDER
========================================================= */

function renderAchievements(container) {

    const user =
        getCurrentUser();


    container.innerHTML = `

        <div class="achievement-grid">

            ${achievements
                .map(
                    achievement => {

                        const unlocked =
                            user.unlockedAchievements
                                .includes(
                                    achievement.id
                                );


                        return `

                            <div
                                class="
                                    achievement
                                    ${
                                        unlocked
                                            ? ""
                                            : "locked"
                                    }
                                "
                            >

                                <div
                                    class="achievement-icon"
                                >
                                    ${achievement.icon}
                                </div>

                                <h3>
                                    ${achievement.name}
                                </h3>

                                <p>
                                    ${achievement.description}
                                </p>

                                <p style="
                                    margin-top:10px;
                                    color:${
                                        unlocked
                                            ? "var(--success)"
                                            : "var(--muted)"
                                    };
                                ">

                                    ${
                                        unlocked
                                            ? "✓ Desbloqueado"
                                            : "🔒 Bloqueado"
                                    }

                                </p>

                            </div>

                        `;

                    }
                )
                .join("")}

        </div>

    `;

}


/* =========================================================
   EDIT PROFILE
========================================================= */

document
    .getElementById(
        "editProfileButton"
    )
    .addEventListener(
        "click",
        openEditProfile
    );


function openEditProfile() {

    const user =
        getCurrentUser();


    if (!user) {
        return;
    }


    document.getElementById(
        "editName"
    ).value =
        user.name;


    document.getElementById(
        "editUsername"
    ).value =
        user.username;


    document.getElementById(
        "editBio"
    ).value =
        user.bio;


    document.getElementById(
        "editInterests"
    ).value =
        user.interests.join(", ");


    document.getElementById(
        "profileColor"
    ).value =
        user.profileColor;


    editProfileModal.classList.remove(
        "hidden"
    );

}


function closeEditProfile() {

    editProfileModal.classList.add(
        "hidden"
    );

}


window.closeEditProfile =
    closeEditProfile;


/* =========================================================
   SAVE PROFILE
========================================================= */

document
    .getElementById(
        "saveProfileButton"
    )
    .addEventListener(
        "click",
        saveProfile
    );


function saveProfile() {

    const user =
        getCurrentUser();


    if (!user) {
        return;
    }


    const name =
        document.getElementById(
            "editName"
        ).value.trim();


    const username =
        document.getElementById(
            "editUsername"
        ).value
            .trim()
            .toLowerCase();


    const bio =
        document.getElementById(
            "editBio"
        ).value.trim();


    const interests =
        document.getElementById(
            "editInterests"
        ).value
            .split(",")
            .map(
                item =>
                    item.trim()
            )
            .filter(Boolean);


    const color =
        document.getElementById(
            "profileColor"
        ).value;


    if (!name || !username) {

        showMessage(
            "⚠️",
            "Datos incompletos",
            "El nombre y el usuario son obligatorios."
        );

        return;

    }


    const users =
        getUsers();


    const usernameExists =
        users.some(
            other =>
                other.username === username &&
                other.username !== user.username
        );


    if (usernameExists) {

        showMessage(
            "⚠️",
            "Usuario ocupado",
            "Ese nombre de usuario ya está siendo utilizado."
        );

        return;

    }


    user.name =
        name;


    user.username =
        username;


    user.bio =
        bio;


    user.interests =
        interests;


    user.profileColor =
        color;


    const backgroundInput =
        document.getElementById(
            "profileBackgroundInput"
        );


    const file =
        backgroundInput.files[0];


    if (file) {

        const reader =
            new FileReader();


        reader.onload =
            () => {

                user.profileBackground =
                    reader.result;

                finishProfileSave(
                    user
                );

            };


        reader.readAsDataURL(
            file
        );

    } else {

        finishProfileSave(
            user
        );

    }

}


function finishProfileSave(user) {

    /*
       Si el usuario cambia su username,
       actualizamos la sesión.
    */

    localStorage.setItem(
        STORAGE_CURRENT_USER,
        user.username
    );


    saveCurrentUser(
        user
    );


    closeEditProfile();

    updateAccountUI();

    renderProfile();

}


/* =========================================================
   AVATAR
========================================================= */

document
    .getElementById(
        "avatarInput"
    )
    .addEventListener(
        "change",
        event => {

            const file =
                event.target.files[0];


            if (!file) {
                return;
            }


            const user =
                getCurrentUser();


            if (!user) {
                return;
            }


            const reader =
                new FileReader();


            reader.onload =
                () => {

                    user.avatar =
                        reader.result;


                    saveCurrentUser(
                        user
                    );


                    updateAccountUI();

                    renderProfile();

                };


            reader.readAsDataURL(
                file
            );

        }
    );


/* =========================================================
   AUTH BUTTONS
========================================================= */

document
    .getElementById(
        "accountButton"
    )
    .addEventListener(
        "click",
        () => {

            const user =
                getCurrentUser();


            if (!user) {

                openAuth(
                    "login"
                );

            } else {

                showPage(
                    "profile"
                );

            }

        }
    );


document
    .getElementById(
        "authSubmit"
    )
    .addEventListener(
        "click",
        handleAuth
    );


document
    .getElementById(
        "switchAuth"
    )
    .addEventListener(
        "click",
        () => {

            authMode =
                authMode === "login"
                    ? "register"
                    : "login";

            updateAuthModal();

        }
    );


/* =========================================================
   ESC
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            closeAuth();

            closeVideo();

            closeEditProfile();

            closeMessage();

            toolsPanel.classList.add(
                "hidden"
            );

        }

    }
);


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
    icon,
    title,
    text
) {

    document.getElementById(
        "messageIcon"
    ).textContent =
        icon;


    document.getElementById(
        "messageTitle"
    ).textContent =
        title;


    document.getElementById(
        "messageText"
    ).textContent =
        text;


    document
        .getElementById(
            "messageModal"
        )
        .classList.remove(
            "hidden"
        );

}


function closeMessage() {

    document
        .getElementById(
            "messageModal"
        )
        .classList.add(
            "hidden"
        );

}


window.closeMessage =
    closeMessage;


/* =========================================================
   SCROLL
========================================================= */

function scrollToVideos() {

    document
        .getElementById(
            "videosSection"
        )
        .scrollIntoView({
            behavior:
                "smooth"
        });

}


window.scrollToVideos =
    scrollToVideos;


/* =========================================================
   DEFAULT AVATAR
========================================================= */

function createDefaultAvatar(
    name,
    color
) {

    const letter =
        (name || "U")
            .charAt(0)
            .toUpperCase();


    const svg = `

        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="300"
            height="300"
        >

            <rect
                width="300"
                height="300"
                fill="${color}"
            />

            <text
                x="50%"
                y="54%"
                dominant-baseline="middle"
                text-anchor="middle"
                font-size="130"
                font-family="Arial"
                font-weight="bold"
                fill="white"
            >
                ${letter}
            </text>

        </svg>

    `;


    return (
        "data:image/svg+xml;charset=utf-8," +
        encodeURIComponent(svg)
    );

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(
    value
) {

    const element =
        document.createElement(
            "div"
        );


    element.textContent =
        value;


    return element.innerHTML;

}


/* =========================================================
   INITIALIZATION
========================================================= */

function initialize() {

    loadAppearance();

    updateAccountUI();

    renderVideos();


    const user =
        getCurrentUser();


    if (user) {

        user.stats.lastSession =
            Date.now();


        saveCurrentUser(
            user
        );


        checkAchievements();

    }

}


initialize();
