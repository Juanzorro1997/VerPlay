/* ============================================================
   VERPLAY + SUPABASE
   Vídeos en Storage, metadatos en tabla public.videos
============================================================ */

const SUPABASE_URL = "https://bgkpsfcnljbzgnfqogbh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_XOQLuBwco2_YRTowEZR-KQ_vijirj3M";

const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB
const ALLOWED_VIDEO_TYPES = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo"
];
const BLOCKED_WORDS = [
    "porn", "xxx", "nsfw", "gore", "nude", "nudes", "onlyfans",
    "explicit", "hentai", "violencia extrema", "snuff", "torture",
    "+18", "xxx18", "adult content"
];

const DEFAULT_BG = "#0b0d12";
const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;

const DEMO_VIDEOS = [
    { id: "demo-1", title: "Gameplay de ejemplo", description: "Un vídeo de demostración de VerPlay.", category: "Gaming", icon: "🎮", isDemo: true },
    { id: "demo-2", title: "Música relajante", description: "Música para relajarse.", category: "Música", icon: "🎵", isDemo: true },
    { id: "demo-3", title: "Animación de ejemplo", description: "Una pequeña animación.", category: "Animación", icon: "🎨", isDemo: true },
    { id: "demo-4", title: "Tecnología", description: "Vídeo sobre tecnología.", category: "Tecnología", icon: "💻", isDemo: true },
    { id: "demo-5", title: "Vídeo de la comunidad", description: "Contenido creado por usuarios.", category: "Otros", icon: "🎬", isDemo: true },
    { id: "demo-6", title: "Gaming retro", description: "Un viaje por los videojuegos clásicos.", category: "Gaming", icon: "🕹️", isDemo: true }
];

let supabase = null;
let allVideos = [...DEMO_VIDEOS];
let currentUser = null;

try {
    if (window.supabase && window.supabase.createClient) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
} catch (e) {
    console.warn("Supabase no disponible:", e);
}

/* ============================================================
   UTILIDADES
============================================================ */

function safeGet(key) {
    try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key, value) {
    try { localStorage.setItem(key, value); return true; } catch { return false; }
}
function safeRemove(key) {
    try { localStorage.removeItem(key); } catch {}
}
function saveUser(user) {
    safeSet("verplay_user", JSON.stringify(user));
    safeSet("verplay_current_user", JSON.stringify(user));
}
function getUser() {
    try { return JSON.parse(safeGet("verplay_user")) || null; } catch { return null; }
}
function getCurrentUserFromStorage() {
    try { return JSON.parse(safeGet("verplay_current_user")) || null; } catch { return null; }
}
function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str || "";
    return d.innerHTML;
}
function formatBytes(n) {
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
    return (n / (1024 * 1024)).toFixed(2) + " MB";
}
function containsBlockedWords(text) {
    const t = (text || "").toLowerCase();
    return BLOCKED_WORDS.some(w => t.includes(w));
}

/* ============================================================
   SUPABASE — CARGAR Y SUBIR
============================================================ */

async function fetchRemoteVideos() {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase
            .from("videos")
            .select("*")
            .eq("is_approved", true)
            .order("created_at", { ascending: false });

        if (error) {
            console.warn("Error cargando vídeos:", error.message);
            return [];
        }

        return (data || []).map(row => ({
            id: row.id,
            title: row.title,
            description: row.description || "",
            category: row.category || "Otros",
            icon: "🎬",
            url: row.public_url,
            storagePath: row.storage_path,
            isDemo: false,
            uploader: row.uploader_name || ""
        }));
    } catch (e) {
        console.warn(e);
        return [];
    }
}

async function refreshVideos() {
    const remote = await fetchRemoteVideos();
    allVideos = [...remote, ...DEMO_VIDEOS];
    renderVideos(getCurrentFilteredList());
}

async function uploadVideoToSupabase(file, meta) {
    if (!supabase) throw new Error("Supabase no está configurado.");

    const ext = (file.name.split(".").pop() || "mp4").toLowerCase().replace(/[^a-z0-9]/g, "");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    const path = `${Date.now()}-${safeName}`;

    const { error: upErr } = await supabase.storage
        .from("videos")
        .upload(path, file, {
            contentType: file.type || "video/mp4",
            upsert: false,
            cacheControl: "3600"
        });

    if (upErr) throw upErr;

    const { data: urlData } = supabase.storage.from("videos").getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    const { error: dbErr } = await supabase.from("videos").insert({
        title: meta.title,
        description: meta.description,
        category: meta.category,
        storage_path: path,
        public_url: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        uploader_name: meta.uploader || "Anónimo",
        is_approved: true
    });

    if (dbErr) throw dbErr;
    return publicUrl;
}

/* ============================================================
   FONDO
============================================================ */

function applyBackgroundColor(color) {
    document.documentElement.style.setProperty("--bg", color);
    document.body.style.backgroundColor = color;
    document.documentElement.style.setProperty("--topbar-bg", colorToRgba(color, 0.92));
}
function colorToRgba(hex, alpha) {
    const h = (hex || "").replace("#", "");
    if (h.length !== 6) return `rgba(11,13,18,${alpha})`;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}
function applyBackgroundImage(dataUrl) {
    if (dataUrl) {
        document.body.style.backgroundImage = `url("${dataUrl}")`;
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundAttachment = "fixed";
        document.body.style.backgroundPosition = "center";
        document.body.style.backgroundRepeat = "no-repeat";
    } else {
        document.body.style.backgroundImage = "none";
    }
}
function loadBackground() {
    const color = safeGet("verplay_background_color") || DEFAULT_BG;
    const image = safeGet("verplay_background_image");
    applyBackgroundColor(color);
    const colorInput = document.getElementById("backgroundColor");
    if (colorInput) colorInput.value = color;
    if (image) applyBackgroundImage(image);
}
function setupBackgroundControls() {
    const backgroundColor = document.getElementById("backgroundColor");
    const backgroundImage = document.getElementById("backgroundImage");
    const resetBackground = document.getElementById("resetBackground");
    const removeBackgroundImage = document.getElementById("removeBackgroundImage");
    const bgImageStatus = document.getElementById("bgImageStatus");

    if (backgroundColor) {
        backgroundColor.addEventListener("input", function () {
            applyBackgroundColor(this.value);
            safeSet("verplay_background_color", this.value);
        });
    }
    document.querySelectorAll(".preset-swatch").forEach(btn => {
        btn.addEventListener("click", function () {
            const color = this.dataset.color;
            if (backgroundColor) backgroundColor.value = color;
            applyBackgroundColor(color);
            safeSet("verplay_background_color", color);
        });
    });
    if (backgroundImage) {
        backgroundImage.addEventListener("change", function () {
            const file = this.files && this.files[0];
            if (!file) return;
            if (file.size > MAX_IMAGE_BYTES) {
                if (bgImageStatus) {
                    bgImageStatus.textContent = "Imagen demasiado grande (máx. ~1,5 MB).";
                    bgImageStatus.style.color = "#ff6b8a";
                }
                this.value = "";
                return;
            }
            const reader = new FileReader();
            reader.onload = function (e) {
                applyBackgroundImage(e.target.result);
                if (safeSet("verplay_background_image", e.target.result)) {
                    if (bgImageStatus) {
                        bgImageStatus.textContent = "Imagen aplicada y guardada.";
                        bgImageStatus.style.color = "";
                    }
                } else if (bgImageStatus) {
                    bgImageStatus.textContent = "No se pudo guardar (almacenamiento lleno).";
                    bgImageStatus.style.color = "#ff6b8a";
                }
            };
            reader.readAsDataURL(file);
        });
    }
    if (resetBackground) {
        resetBackground.addEventListener("click", function () {
            applyBackgroundColor(DEFAULT_BG);
            if (backgroundColor) backgroundColor.value = DEFAULT_BG;
            safeSet("verplay_background_color", DEFAULT_BG);
        });
    }
    if (removeBackgroundImage) {
        removeBackgroundImage.addEventListener("click", function () {
            applyBackgroundImage(null);
            safeRemove("verplay_background_image");
            if (backgroundImage) backgroundImage.value = "";
            if (bgImageStatus) bgImageStatus.textContent = "";
        });
    }
}

/* ============================================================
   MODALES
============================================================ */

function openModal(el) { if (el) el.classList.remove("hidden"); }
function closeModal(el) { if (el) el.classList.add("hidden"); }

function setupModalOutsideClick() {
    document.querySelectorAll(".modal").forEach(modalElement => {
        modalElement.addEventListener("click", function (event) {
            if (event.target === modalElement) {
                modalElement.classList.add("hidden");
                if (modalElement.id === "modal") {
                    const player = document.getElementById("player");
                    if (player) { player.pause(); player.removeAttribute("src"); }
                }
            }
        });
    });
}

/* ============================================================
   SETTINGS
============================================================ */

function setupSettings() {
    const settingsButton = document.getElementById("settingsButton");
    const settingsModal = document.getElementById("settingsModal");
    const closeSettings = document.getElementById("closeSettings");
    const closeSettingsButton = document.getElementById("closeSettingsButton");
    if (settingsButton) settingsButton.addEventListener("click", () => openModal(settingsModal));
    if (closeSettings) closeSettings.addEventListener("click", () => closeModal(settingsModal));
    if (closeSettingsButton) closeSettingsButton.addEventListener("click", () => closeModal(settingsModal));
}

/* ============================================================
   RENDER VÍDEOS
============================================================ */

function getCurrentFilteredList() {
    const active = document.querySelector(".categories button.active");
    const cat = active ? active.dataset.cat : "Todos";
    const searchEl = document.getElementById("search");
    const text = searchEl ? searchEl.value.trim().toLowerCase() : "";
    let list = allVideos;
    if (cat && cat !== "Todos") list = list.filter(v => v.category === cat);
    if (text) {
        list = list.filter(v =>
            (v.title || "").toLowerCase().includes(text) ||
            (v.description || "").toLowerCase().includes(text) ||
            (v.category || "").toLowerCase().includes(text)
        );
    }
    return list;
}

function renderVideos(list) {
    const grid = document.getElementById("grid");
    const count = document.getElementById("count");
    if (!grid || !count) return;

    grid.innerHTML = "";
    count.textContent = `${list.length} vídeo${list.length === 1 ? "" : "s"}`;

    if (list.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:#9299a8;">No se encontraron vídeos.</div>`;
        return;
    }

    const user = getUser();
    const favorites = (user && user.favorites) ? user.favorites : [];

    list.forEach(video => {
        const isFavorite = favorites.includes(video.id);
        const card = document.createElement("article");
        card.className = "video-card";
        card.innerHTML = `
            <div class="thumbnail">${video.icon || "🎬"}</div>
            <div class="video-info">
                <h3>${escapeHtml(video.title)}</h3>
                <p>${escapeHtml(video.description)}</p>
                <div class="video-bottom">
                    <span>${escapeHtml(video.category)}</span>
                    <button type="button" class="favorite ${isFavorite ? "active" : ""}" data-id="${escapeHtml(String(video.id))}" title="Favorito">
                        ${isFavorite ? "♥" : "♡"}
                    </button>
                </div>
            </div>`;

        card.addEventListener("click", function (event) {
            if (event.target.closest(".favorite")) return;
            openVideo(video);
        });
        const favBtn = card.querySelector(".favorite");
        if (favBtn) {
            favBtn.addEventListener("click", function (e) {
                e.stopPropagation();
                toggleFavorite(video.id);
            });
        }
        grid.appendChild(card);
    });
}

function toggleFavorite(videoId) {
    if (!currentUser) {
        alert("Necesitas registrarte o iniciar sesión para guardar favoritos.");
        openAuth("register");
        return;
    }
    const user = getUser();
    if (!user) return;
    if (!user.favorites) user.favorites = [];
    const index = user.favorites.indexOf(videoId);
    if (index === -1) user.favorites.push(videoId);
    else user.favorites.splice(index, 1);
    currentUser = user;
    saveUser(user);
    checkAchievements(user);
    saveUser(user);
    renderVideos(getCurrentFilteredList());
}

/* ============================================================
   REPRODUCTOR
============================================================ */

function openVideo(video) {
    const modal = document.getElementById("modal");
    const modalTitle = document.getElementById("modalTitle");
    const modalDesc = document.getElementById("modalDesc");
    const player = document.getElementById("player");

    if (modalTitle) modalTitle.textContent = video.title;
    if (modalDesc) modalDesc.textContent = video.description || "";

    if (player) {
        if (video.url) {
            player.src = video.url;
            player.load();
        } else {
            player.removeAttribute("src");
        }
    }
    openModal(modal);
}

function setupPlayer() {
    const closeModalBtn = document.getElementById("closeModal");
    const modal = document.getElementById("modal");
    const player = document.getElementById("player");
    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", function () {
            closeModal(modal);
            if (player) { player.pause(); player.removeAttribute("src"); }
        });
    }
}

/* ============================================================
   CATEGORÍAS Y BUSCADOR
============================================================ */

function setupCategoriesAndSearch() {
    document.querySelectorAll(".categories button").forEach(button => {
        button.addEventListener("click", function () {
            document.querySelectorAll(".categories button").forEach(btn => btn.classList.remove("active"));
            this.classList.add("active");
            renderVideos(getCurrentFilteredList());
        });
    });
    const search = document.getElementById("search");
    const searchButton = document.getElementById("searchButton");
    if (search) search.addEventListener("input", () => renderVideos(getCurrentFilteredList()));
    if (searchButton) searchButton.addEventListener("click", () => renderVideos(getCurrentFilteredList()));
}

/* ============================================================
   SUBIDA DE VÍDEOS
============================================================ */

function setupUpload() {
    const uploadButton = document.getElementById("uploadButton");
    const uploadModal = document.getElementById("uploadModal");
    const closeUpload = document.getElementById("closeUpload");
    const uploadFile = document.getElementById("uploadFile");
    const uploadFileInfo = document.getElementById("uploadFileInfo");
    const uploadSubmitButton = document.getElementById("uploadSubmitButton");

    if (uploadButton) {
        uploadButton.addEventListener("click", () => {
            resetUploadForm();
            openModal(uploadModal);
        });
    }
    if (closeUpload) closeUpload.addEventListener("click", () => closeModal(uploadModal));

    if (uploadFile) {
        uploadFile.addEventListener("change", function () {
            const file = this.files && this.files[0];
            if (!file) {
                if (uploadFileInfo) uploadFileInfo.textContent = "";
                return;
            }
            let msg = `${file.name} — ${formatBytes(file.size)}`;
            if (file.size > MAX_VIDEO_BYTES) {
                msg += " ⚠️ Supera 50 MB";
            } else if (!ALLOWED_VIDEO_TYPES.includes(file.type) && !/\.(mp4|webm|mov|avi)$/i.test(file.name)) {
                msg += " ⚠️ Tipo no permitido";
            }
            if (uploadFileInfo) uploadFileInfo.textContent = msg;
        });
    }

    if (uploadSubmitButton) {
        uploadSubmitButton.addEventListener("click", handleUpload);
    }
}

function resetUploadForm() {
    const title = document.getElementById("uploadTitle");
    const desc = document.getElementById("uploadDescription");
    const file = document.getElementById("uploadFile");
    const agree = document.getElementById("uploadAgree");
    const msg = document.getElementById("uploadMessage");
    const info = document.getElementById("uploadFileInfo");
    const progressWrap = document.getElementById("uploadProgressWrap");
    if (title) title.value = "";
    if (desc) desc.value = "";
    if (file) file.value = "";
    if (agree) agree.checked = false;
    if (msg) msg.textContent = "";
    if (info) info.textContent = "";
    if (progressWrap) progressWrap.classList.add("hidden");
}

async function handleUpload() {
    const titleEl = document.getElementById("uploadTitle");
    const descEl = document.getElementById("uploadDescription");
    const catEl = document.getElementById("uploadCategory");
    const fileEl = document.getElementById("uploadFile");
    const agreeEl = document.getElementById("uploadAgree");
    const msgEl = document.getElementById("uploadMessage");
    const submitBtn = document.getElementById("uploadSubmitButton");
    const progressWrap = document.getElementById("uploadProgressWrap");
    const progressBar = document.getElementById("uploadProgressBar");
    const progressText = document.getElementById("uploadProgressText");

    const title = titleEl ? titleEl.value.trim() : "";
    const description = descEl ? descEl.value.trim() : "";
    const category = catEl ? catEl.value : "Otros";
    const file = fileEl && fileEl.files ? fileEl.files[0] : null;
    const agreed = agreeEl ? agreeEl.checked : false;

    function setMsg(text, isError) {
        if (msgEl) {
            msgEl.textContent = text;
            msgEl.style.color = isError ? "#ff6b8a" : "";
        }
    }

    if (!title || title.length < 3) {
        setMsg("El título debe tener al menos 3 caracteres.", true);
        return;
    }
    if (!file) {
        setMsg("Selecciona un archivo de vídeo.", true);
        return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
        setMsg("El vídeo no puede superar 50 MB.", true);
        return;
    }
    if (!ALLOWED_VIDEO_TYPES.includes(file.type) && !/\.(mp4|webm|mov|avi)$/i.test(file.name)) {
        setMsg("Solo se permiten MP4, WebM, MOV o AVI.", true);
        return;
    }
    if (!agreed) {
        setMsg("Debes confirmar que el contenido no es +18, gore ni ilegal.", true);
        return;
    }
    if (containsBlockedWords(title) || containsBlockedWords(description)) {
        setMsg("El título o la descripción contienen términos no permitidos.", true);
        return;
    }
    if (!supabase) {
        setMsg("Supabase no está disponible. Revisa la conexión o las claves.", true);
        return;
    }

    const uploader = currentUser ? currentUser.username : "Anónimo";

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Subiendo...";
    }
    if (progressWrap) progressWrap.classList.remove("hidden");
    if (progressBar) progressBar.style.width = "15%";
    if (progressText) progressText.textContent = "Subiendo...";

    try {
        await uploadVideoToSupabase(file, { title, description, category, uploader });
        if (progressBar) progressBar.style.width = "100%";
        if (progressText) progressText.textContent = "100%";
        setMsg("¡Vídeo subido correctamente!", false);

        setTimeout(async () => {
            closeModal(document.getElementById("uploadModal"));
            await refreshVideos();
        }, 800);
    } catch (err) {
        console.error(err);
        const m = (err && err.message) ? err.message : String(err);
        setMsg("Error al subir: " + m, true);
        if (progressWrap) progressWrap.classList.add("hidden");
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Subir vídeo";
        }
    }
}

/* ============================================================
   AUTH
============================================================ */

function openAuth(tab) {
    const authModal = document.getElementById("authModal");
    const authMessage = document.getElementById("authMessage");
    if (authMessage) authMessage.textContent = "";
    switchAuthTab(tab || "register");
    openModal(authModal);
}
function switchAuthTab(tab) {
    const registerPanel = document.getElementById("registerPanel");
    const loginPanel = document.getElementById("loginPanel");
    document.querySelectorAll(".auth-tab").forEach(t => {
        t.classList.toggle("active", t.dataset.tab === tab);
    });
    if (tab === "login") {
        if (registerPanel) registerPanel.classList.add("hidden");
        if (loginPanel) loginPanel.classList.remove("hidden");
    } else {
        if (loginPanel) loginPanel.classList.add("hidden");
        if (registerPanel) registerPanel.classList.remove("hidden");
    }
}
function setupAuth() {
    const profileButton = document.getElementById("profileButton");
    const authModal = document.getElementById("authModal");
    const closeAuth = document.getElementById("closeAuth");
    const registerButton = document.getElementById("registerButton");
    const loginButton = document.getElementById("loginButton");

    document.querySelectorAll(".auth-tab").forEach(tab => {
        tab.addEventListener("click", function () {
            switchAuthTab(this.dataset.tab);
            const authMessage = document.getElementById("authMessage");
            if (authMessage) authMessage.textContent = "";
        });
    });
    if (profileButton) {
        profileButton.addEventListener("click", function () {
            if (currentUser) openProfile();
            else openAuth("register");
        });
    }
    if (closeAuth) closeAuth.addEventListener("click", () => closeModal(authModal));
    if (registerButton) registerButton.addEventListener("click", register);
    if (loginButton) loginButton.addEventListener("click", login);
}
function register() {
    const usernameEl = document.getElementById("registerUsername");
    const passwordEl = document.getElementById("registerPassword");
    const authMessage = document.getElementById("authMessage");
    const username = usernameEl ? usernameEl.value.trim() : "";
    const password = passwordEl ? passwordEl.value : "";

    if (username.length < 3) {
        if (authMessage) authMessage.textContent = "El nombre debe tener al menos 3 caracteres.";
        return;
    }
    if (password.length < 4) {
        if (authMessage) authMessage.textContent = "La contraseña debe tener al menos 4 caracteres.";
        return;
    }
    if (getUser()) {
        if (authMessage) authMessage.textContent = "Ya hay una cuenta. Usa «Iniciar sesión».";
        return;
    }

    const user = {
        username, password,
        bio: "¡Bienvenido a mi perfil de VerPlay!",
        interests: "Todavía no has añadido tus intereses.",
        avatar: "", cover: "",
        favorites: [], achievements: [],
        createdAt: Date.now(), connectedSince: Date.now(), totalOnlineTime: 0
    };
    saveUser(user);
    currentUser = user;
    if (authMessage) authMessage.textContent = "¡Cuenta creada correctamente!";
    setTimeout(() => {
        closeModal(document.getElementById("authModal"));
        updateUserButton();
        openProfile();
    }, 500);
}
function login() {
    const usernameEl = document.getElementById("loginUsername");
    const passwordEl = document.getElementById("loginPassword");
    const authMessage = document.getElementById("authMessage");
    const username = usernameEl ? usernameEl.value.trim() : "";
    const password = passwordEl ? passwordEl.value : "";
    const user = getUser();

    if (!user) {
        if (authMessage) authMessage.textContent = "No hay cuenta. Regístrate primero.";
        return;
    }
    if (user.username !== username || user.password !== password) {
        if (authMessage) authMessage.textContent = "Usuario o contraseña incorrectos.";
        return;
    }
    user.connectedSince = Date.now();
    currentUser = user;
    saveUser(user);
    if (authMessage) authMessage.textContent = "¡Bienvenido de nuevo!";
    setTimeout(() => {
        closeModal(document.getElementById("authModal"));
        updateUserButton();
        openProfile();
    }, 400);
}

/* ============================================================
   PERFIL
============================================================ */

function getDefaultAvatar(username) {
    return "https://ui-avatars.com/api/?name=" + encodeURIComponent(username) + "&background=7c5cff&color=fff&size=256";
}
function openProfile() {
    if (!currentUser) { openAuth("login"); return; }
    updateOnlineTime();
    renderProfile();
    openModal(document.getElementById("profileModal"));
}
function renderProfile() {
    const user = getUser();
    if (!user) return;
    const profileName = document.getElementById("profileName");
    const profileBio = document.getElementById("profileBio");
    const profileInterests = document.getElementById("profileInterests");
    const profileAvatar = document.getElementById("profileAvatar");
    const profileCover = document.getElementById("profileCover");
    const profileHours = document.getElementById("profileHours");
    const profileAchievements = document.getElementById("profileAchievements");
    const profileFavorites = document.getElementById("profileFavorites");

    if (profileName) profileName.textContent = user.username;
    if (profileBio) profileBio.textContent = user.bio || "Sin descripción.";
    if (profileInterests) profileInterests.textContent = user.interests || "No especificados.";
    if (profileAvatar) profileAvatar.src = user.avatar || getDefaultAvatar(user.username);
    if (profileCover) {
        profileCover.style.backgroundImage = user.cover
            ? `url("${user.cover}")`
            : "linear-gradient(135deg,#302060,#11141b)";
    }
    const hours = Math.floor((user.totalOnlineTime || 0) / 3600000);
    if (profileHours) profileHours.textContent = hours;
    if (profileAchievements) profileAchievements.textContent = (user.achievements && user.achievements.length) || 0;
    if (profileFavorites) profileFavorites.textContent = (user.favorites && user.favorites.length) || 0;
    renderAchievements(user);
    renderFavorites(user);
}
function updateOnlineTime() {
    if (!currentUser) return;
    const user = getUser();
    if (!user) return;
    if (!user.connectedSince) user.connectedSince = Date.now();
    const now = Date.now();
    user.totalOnlineTime = (user.totalOnlineTime || 0) + (now - user.connectedSince);
    user.connectedSince = now;
    checkAchievements(user);
    saveUser(user);
    currentUser = user;
}
function checkAchievements(user) {
    if (!user.achievements) user.achievements = [];
    if (user.totalOnlineTime >= 3600000 && !user.achievements.includes("one_hour")) user.achievements.push("one_hour");
    if (user.favorites && user.favorites.length >= 1 && !user.achievements.includes("first_favorite")) user.achievements.push("first_favorite");
}
function renderAchievements(user) {
    const container = document.getElementById("achievements");
    if (!container) return;
    const list = [
        { id: "one_hour", icon: "⏱️", name: "1 hora conectado" },
        { id: "first_favorite", icon: "❤️", name: "Primer favorito" },
        { id: "first_video", icon: "🎬", name: "Primer vídeo" },
        { id: "creator", icon: "⭐", name: "Creador VerPlay" }
    ];
    container.innerHTML = "";
    list.forEach(a => {
        const unlocked = user.achievements && user.achievements.includes(a.id);
        const div = document.createElement("div");
        div.className = "achievement" + (unlocked ? "" : " locked");
        div.innerHTML = `<div class="achievement-icon">${a.icon}</div><div class="achievement-name">${a.name}</div>`;
        container.appendChild(div);
    });
}
function renderFavorites(user) {
    const container = document.getElementById("favoriteVideos");
    if (!container) return;
    container.innerHTML = "";
    if (!user.favorites || user.favorites.length === 0) {
        container.innerHTML = "<p>Todavía no tienes vídeos favoritos.</p>";
        return;
    }
    user.favorites.forEach(id => {
        const video = allVideos.find(v => v.id === id);
        if (!video) return;
        const div = document.createElement("div");
        div.className = "favorite-item";
        div.textContent = `${video.icon || "🎬"} ${video.title}`;
        container.appendChild(div);
    });
}
function setupProfile() {
    const closeProfile = document.getElementById("closeProfile");
    const logoutButton = document.getElementById("logoutButton");
    const editProfileButton = document.getElementById("editProfileButton");
    const editProfileModal = document.getElementById("editProfileModal");
    const closeEditProfile = document.getElementById("closeEditProfile");
    const saveProfileButton = document.getElementById("saveProfileButton");

    if (closeProfile) closeProfile.addEventListener("click", () => closeModal(document.getElementById("profileModal")));
    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            updateOnlineTime();
            safeRemove("verplay_current_user");
            currentUser = null;
            closeModal(document.getElementById("profileModal"));
            updateUserButton();
            renderVideos(getCurrentFilteredList());
        });
    }
    if (editProfileButton) {
        editProfileButton.addEventListener("click", function () {
            const user = getUser();
            if (!user) return;
            const interestsInput = document.getElementById("interestsInput");
            const bioInput = document.getElementById("bioInput");
            if (interestsInput) interestsInput.value = user.interests || "";
            if (bioInput) bioInput.value = user.bio || "";
            openModal(editProfileModal);
        });
    }
    if (closeEditProfile) closeEditProfile.addEventListener("click", () => closeModal(editProfileModal));
    if (saveProfileButton) {
        saveProfileButton.addEventListener("click", async function () {
            const user = getUser();
            if (!user) return;
            const interestsInput = document.getElementById("interestsInput");
            const bioInput = document.getElementById("bioInput");
            const avatarInput = document.getElementById("avatarInput");
            const profileBackgroundInput = document.getElementById("profileBackgroundInput");
            user.interests = interestsInput ? interestsInput.value.trim() : user.interests;
            user.bio = bioInput ? bioInput.value.trim() : user.bio;
            try {
                if (avatarInput && avatarInput.files && avatarInput.files[0]) {
                    if (avatarInput.files[0].size <= MAX_IMAGE_BYTES) {
                        user.avatar = await readFile(avatarInput.files[0]);
                    } else alert("Avatar demasiado grande (máx. ~1,5 MB).");
                }
                if (profileBackgroundInput && profileBackgroundInput.files && profileBackgroundInput.files[0]) {
                    if (profileBackgroundInput.files[0].size <= MAX_IMAGE_BYTES) {
                        user.cover = await readFile(profileBackgroundInput.files[0]);
                    } else alert("Fondo del perfil demasiado grande (máx. ~1,5 MB).");
                }
            } catch (e) { console.warn(e); }
            saveUser(user);
            currentUser = user;
            closeModal(editProfileModal);
            renderProfile();
        });
    }
}
function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
function updateUserButton() {
    const el = document.getElementById("profileButtonText");
    if (el) el.textContent = currentUser ? currentUser.username : "Registrarse";
}

/* ============================================================
   INIT
============================================================ */

function init() {
    currentUser = getCurrentUserFromStorage();
    loadBackground();
    setupBackgroundControls();
    setupSettings();
    setupPlayer();
    setupCategoriesAndSearch();
    setupAuth();
    setupProfile();
    setupUpload();
    setupModalOutsideClick();
    updateUserButton();
    renderVideos(allVideos);
    refreshVideos();

    setInterval(function () {
        if (!currentUser) return;
        const user = getUser();
        if (!user) return;
        user.totalOnlineTime = (user.totalOnlineTime || 0) + 60000;
        checkAchievements(user);
        saveUser(user);
        currentUser = user;
    }, 60000);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}
