/* ============================================================
   VERPLAY + SUPABASE
   Subida solo registrados | likes | visitas | comentarios | CAPTCHA
============================================================ */

const SUPABASE_URL = "https://bgkpsfcnljbzgnfqogbh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_XOQLuBwco2_YRTowEZR-KQ_vijirj3M";

const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];
const BLOCKED_WORDS = ["porn","xxx","nsfw","gore","nude","nudes","onlyfans","explicit","hentai","violencia extrema","snuff","torture","+18","xxx18"];
const DEFAULT_BG = "#0b0d12";
const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;
const EMOJIS = ["😀","😂","😍","🔥","👍","👎","❤️","👏","😮","😢","🎉","🎮","🎵","💻","⭐","🚀"];

const DEMO_VIDEOS = [
    { id: "demo-1", title: "Gameplay de ejemplo", description: "Demo de VerPlay.", category: "Gaming", icon: "🎮", isDemo: true, uploader: "VerPlay", views: 0, likes: 0, dislikes: 0 },
    { id: "demo-2", title: "Música relajante", description: "Música para relajarse.", category: "Música", icon: "🎵", isDemo: true, uploader: "VerPlay", views: 0, likes: 0, dislikes: 0 },
    { id: "demo-3", title: "Animación de ejemplo", description: "Una pequeña animación.", category: "Animación", icon: "🎨", isDemo: true, uploader: "VerPlay", views: 0, likes: 0, dislikes: 0 },
    { id: "demo-4", title: "Tecnología", description: "Vídeo sobre tecnología.", category: "Tecnología", icon: "💻", isDemo: true, uploader: "VerPlay", views: 0, likes: 0, dislikes: 0 },
    { id: "demo-5", title: "Vídeo de la comunidad", description: "Contenido de usuarios.", category: "Otros", icon: "🎬", isDemo: true, uploader: "VerPlay", views: 0, likes: 0, dislikes: 0 },
    { id: "demo-6", title: "Gaming retro", description: "Videojuegos clásicos.", category: "Gaming", icon: "🕹️", isDemo: true, uploader: "VerPlay", views: 0, likes: 0, dislikes: 0 }
];

let supabaseClient = null;
let allVideos = [...DEMO_VIDEOS];
let currentUser = null;
let currentPlayingVideo = null;
let captchaA = 0, captchaB = 0;

try {
    if (window.supabase && typeof window.supabase.createClient === "function") {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("[VerPlay] Supabase OK");
    } else {
        console.warn("[VerPlay] supabase-js no cargó");
    }
} catch (e) {
    console.warn("[VerPlay] Error Supabase:", e);
}

/* ---------- utils ---------- */
function safeGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function safeSet(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } }
function safeRemove(k) { try { localStorage.removeItem(k); } catch {} }
function saveUser(u) { safeSet("verplay_user", JSON.stringify(u)); safeSet("verplay_current_user", JSON.stringify(u)); }
function getUser() { try { return JSON.parse(safeGet("verplay_user")) || null; } catch { return null; } }
function getCurrentUserFromStorage() { try { return JSON.parse(safeGet("verplay_current_user")) || null; } catch { return null; } }
function escapeHtml(s) { const d = document.createElement("div"); d.textContent = s || ""; return d.innerHTML; }
function formatBytes(n) { if (n < 1024) return n + " B"; if (n < 1048576) return (n/1024).toFixed(1)+" KB"; return (n/1048576).toFixed(2)+" MB"; }
function containsBlockedWords(t) { const x = (t||"").toLowerCase(); return BLOCKED_WORDS.some(w => x.includes(w)); }
function openModal(el) { if (el) el.classList.remove("hidden"); }
function closeModal(el) { if (el) el.classList.add("hidden"); }

function getVoteKey(videoId) { return "verplay_vote_" + videoId; }
function getUserVote(videoId) { return safeGet(getVoteKey(videoId)); }
function setUserVote(videoId, vote) { if (vote) safeSet(getVoteKey(videoId), vote); else safeRemove(getVoteKey(videoId)); }

/* ---------- background ---------- */
function colorToRgba(hex, a) {
    const h = (hex||"").replace("#","");
    if (h.length !== 6) return `rgba(11,13,18,${a})`;
    return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`;
}
function applyBackgroundColor(c) {
    document.documentElement.style.setProperty("--bg", c);
    document.body.style.backgroundColor = c;
    document.documentElement.style.setProperty("--topbar-bg", colorToRgba(c, 0.92));
}
function applyBackgroundImage(url) {
    if (url) {
        document.body.style.backgroundImage = `url("${url}")`;
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundAttachment = "fixed";
        document.body.style.backgroundPosition = "center";
    } else document.body.style.backgroundImage = "none";
}
function loadBackground() {
    const c = safeGet("verplay_background_color") || DEFAULT_BG;
    applyBackgroundColor(c);
    const inp = document.getElementById("backgroundColor");
    if (inp) inp.value = c;
    const img = safeGet("verplay_background_image");
    if (img) applyBackgroundImage(img);
}
function setupBackgroundControls() {
    const bgColor = document.getElementById("backgroundColor");
    const bgImage = document.getElementById("backgroundImage");
    const resetBg = document.getElementById("resetBackground");
    const removeBg = document.getElementById("removeBackgroundImage");
    const status = document.getElementById("bgImageStatus");

    if (bgColor) bgColor.addEventListener("input", function () {
        applyBackgroundColor(this.value);
        safeSet("verplay_background_color", this.value);
    });
    document.querySelectorAll(".preset-swatch").forEach(btn => {
        btn.addEventListener("click", function () {
            const c = this.dataset.color;
            if (bgColor) bgColor.value = c;
            applyBackgroundColor(c);
            safeSet("verplay_background_color", c);
        });
    });
    if (bgImage) bgImage.addEventListener("change", function () {
        const f = this.files && this.files[0];
        if (!f) return;
        if (f.size > MAX_IMAGE_BYTES) {
            if (status) { status.textContent = "Imagen demasiado grande (~1,5 MB máx)."; status.style.color = "#ff6b8a"; }
            return;
        }
        const r = new FileReader();
        r.onload = e => {
            applyBackgroundImage(e.target.result);
            safeSet("verplay_background_image", e.target.result);
            if (status) { status.textContent = "Imagen guardada."; status.style.color = ""; }
        };
        r.readAsDataURL(f);
    });
    if (resetBg) resetBg.addEventListener("click", () => {
        applyBackgroundColor(DEFAULT_BG);
        if (bgColor) bgColor.value = DEFAULT_BG;
        safeSet("verplay_background_color", DEFAULT_BG);
    });
    if (removeBg) removeBg.addEventListener("click", () => {
        applyBackgroundImage(null);
        safeRemove("verplay_background_image");
        if (bgImage) bgImage.value = "";
        if (status) status.textContent = "";
    });
}

/* ---------- settings ---------- */
function setupSettings() {
    const btn = document.getElementById("settingsButton");
    const modal = document.getElementById("settingsModal");
    const close1 = document.getElementById("closeSettings");
    const close2 = document.getElementById("closeSettingsButton");
    if (btn) btn.addEventListener("click", () => openModal(modal));
    if (close1) close1.addEventListener("click", () => closeModal(modal));
    if (close2) close2.addEventListener("click", () => closeModal(modal));
}

/* ---------- supabase videos ---------- */
async function fetchRemoteVideos() {
    if (!supabaseClient) return [];
    try {
        const { data, error } = await supabaseClient
            .from("videos")
            .select("*")
            .eq("is_approved", true)
            .order("created_at", { ascending: false });
        if (error) { console.warn("fetch videos:", error.message); return []; }
        return (data || []).map(row => {
            const storagePath = row.storage_path || "";
            let url = row.public_url || "";
            // Normalizar URL pública si falta o está incompleta
            if (storagePath) {
                const built = buildPublicVideoUrl(storagePath);
                if (!url || !url.includes("/storage/v1/object/")) url = built;
            }
            return {
                id: row.id,
                title: row.title,
                description: row.description || "",
                category: row.category || "Otros",
                icon: "🎬",
                url,
                storagePath,
                isDemo: false,
                uploader: row.uploader_name || "Anónimo",
                views: row.views || 0,
                likes: row.likes || 0,
                dislikes: row.dislikes || 0
            };
        });
    } catch (e) { console.warn(e); return []; }
}

async function refreshVideos() {
    const remote = await fetchRemoteVideos();
    allVideos = [...remote, ...DEMO_VIDEOS];
    renderVideos(getCurrentFilteredList());
}

function guessVideoMime(file) {
    if (file.type && file.type.startsWith("video/")) return file.type;
    const n = (file.name || "").toLowerCase();
    if (n.endsWith(".webm")) return "video/webm";
    if (n.endsWith(".mov")) return "video/quicktime";
    if (n.endsWith(".avi")) return "video/x-msvideo";
    return "video/mp4";
}

function buildPublicVideoUrl(storagePath) {
    // URL pública estándar de Supabase Storage
    const base = SUPABASE_URL.replace(/\/$/, "");
    const clean = String(storagePath || "").replace(/^\/+/, "");
    return base + "/storage/v1/object/public/videos/" + clean.split("/").map(encodeURIComponent).join("/");
}

async function uploadVideoToSupabase(file, meta) {
    if (!supabaseClient) throw new Error("Supabase no disponible");
    const mime = guessVideoMime(file);
    const ext = (file.name.split(".").pop() || "mp4").toLowerCase().replace(/[^a-z0-9]/g, "") || "mp4";
    const safeBase = (meta.title || "video").toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40) || "video";
    const path = Date.now() + "-" + safeBase + "." + ext;

    const { error: upErr } = await supabaseClient.storage.from("videos").upload(path, file, {
        contentType: mime,
        upsert: false,
        cacheControl: "3600"
    });
    if (upErr) throw upErr;

    // Preferir URL construida manualmente (más fiable)
    let publicUrl = buildPublicVideoUrl(path);
    try {
        const { data: urlData } = supabaseClient.storage.from("videos").getPublicUrl(path);
        if (urlData && urlData.publicUrl) publicUrl = urlData.publicUrl;
    } catch (e) { console.warn(e); }

    console.log("[VerPlay] Vídeo subido:", publicUrl);

    const { error: dbErr } = await supabaseClient.from("videos").insert({
        title: meta.title,
        description: meta.description,
        category: meta.category,
        storage_path: path,
        public_url: publicUrl,
        file_size: file.size,
        mime_type: mime,
        uploader_name: meta.uploader,
        is_approved: true,
        views: 0,
        likes: 0,
        dislikes: 0
    });
    if (dbErr) throw dbErr;
    return publicUrl;
}

async function incrementViews(video) {
    if (!video || video.isDemo || !supabaseClient) return;
    video.views = (video.views || 0) + 1;
    updateModalStats(video);
    try {
        await supabaseClient.from("videos").update({ views: video.views }).eq("id", video.id);
    } catch (e) { console.warn(e); }
}

async function applyVote(video, type) {
    if (!video || video.isDemo || !supabaseClient) {
        alert(video && video.isDemo ? "Los demos no admiten votos." : "No disponible.");
        return;
    }
    if (!currentUser) {
        alert("Inicia sesión para votar.");
        openAuth("login");
        return;
    }
    const prev = getUserVote(video.id);
    let likes = video.likes || 0;
    let dislikes = video.dislikes || 0;

    if (prev === "like") likes = Math.max(0, likes - 1);
    if (prev === "dislike") dislikes = Math.max(0, dislikes - 1);

    if (prev === type) {
        setUserVote(video.id, null);
    } else {
        if (type === "like") likes++;
        if (type === "dislike") dislikes++;
        setUserVote(video.id, type);
    }

    video.likes = likes;
    video.dislikes = dislikes;
    updateModalStats(video);
    highlightVoteButtons(video.id);

    try {
        await supabaseClient.from("videos").update({ likes, dislikes }).eq("id", video.id);
    } catch (e) { console.warn(e); }
}

function updateModalStats(video) {
    const v = document.getElementById("modalViews");
    const l = document.getElementById("likeCount");
    const d = document.getElementById("dislikeCount");
    if (v) v.textContent = "👁 " + (video.views || 0) + " visitas";
    if (l) l.textContent = String(video.likes || 0);
    if (d) d.textContent = String(video.dislikes || 0);
}

function highlightVoteButtons(videoId) {
    const vote = getUserVote(videoId);
    const likeBtn = document.getElementById("likeBtn");
    const dislikeBtn = document.getElementById("dislikeBtn");
    if (likeBtn) likeBtn.classList.toggle("active-vote", vote === "like");
    if (dislikeBtn) dislikeBtn.classList.toggle("active-vote", vote === "dislike");
}

/* ---------- comments ---------- */
async function loadComments(videoId) {
    const list = document.getElementById("commentsList");
    if (!list) return;
    list.innerHTML = "<p class='hint'>Cargando...</p>";
    if (!supabaseClient || String(videoId).startsWith("demo-")) {
        list.innerHTML = "<p class='hint'>Sin comentarios en demos.</p>";
        return;
    }
    try {
        const { data, error } = await supabaseClient
            .from("comments")
            .select("*")
            .eq("video_id", videoId)
            .order("created_at", { ascending: false });
        if (error) throw error;
        if (!data || data.length === 0) {
            list.innerHTML = "<p class='hint'>Sé el primero en comentar.</p>";
            return;
        }
        list.innerHTML = data.map(c => `
            <div class="comment-item">
                <div class="comment-meta"><strong>${escapeHtml(c.username)}</strong>
                <span>${c.created_at ? new Date(c.created_at).toLocaleString() : ""}</span></div>
                <p>${escapeHtml(c.content)}</p>
                ${c.gif_url ? `<img class="comment-gif" src="${escapeHtml(c.gif_url)}" alt="GIF" loading="lazy">` : ""}
            </div>`).join("");
    } catch (e) {
        console.warn(e);
        list.innerHTML = "<p class='hint'>No se pudieron cargar comentarios.</p>";
    }
}

async function sendComment() {
    if (!currentUser) {
        alert("Inicia sesión para comentar.");
        openAuth("login");
        return;
    }
    if (!currentPlayingVideo || currentPlayingVideo.isDemo) {
        alert("No se puede comentar en demos.");
        return;
    }
    const textEl = document.getElementById("commentText");
    const gifEl = document.getElementById("commentGif");
    const text = textEl ? textEl.value.trim() : "";
    const gif = gifEl ? gifEl.value.trim() : "";
    if (!text && !gif) {
        alert("Escribe un comentario o pon un GIF.");
        return;
    }
    if (containsBlockedWords(text)) {
        alert("El comentario contiene términos no permitidos.");
        return;
    }
    if (gif && !/^https?:\/\/.+\.(gif|webp)(\?.*)?$/i.test(gif) && !/giphy\.com|tenor\.com|media\./i.test(gif)) {
        alert("La URL del GIF no parece válida.");
        return;
    }
    try {
        const { error } = await supabaseClient.from("comments").insert({
            video_id: currentPlayingVideo.id,
            username: currentUser.username,
            content: text || " ",
            gif_url: gif || null
        });
        if (error) throw error;
        if (textEl) textEl.value = "";
        if (gifEl) gifEl.value = "";
        await loadComments(currentPlayingVideo.id);
    } catch (e) {
        alert("Error al comentar: " + (e.message || e));
    }
}

function setupCommentsUI() {
    const row = document.getElementById("emojiRow");
    if (row) {
        row.innerHTML = EMOJIS.map(e => `<button type="button" class="emoji-btn">${e}</button>`).join("");
        row.querySelectorAll(".emoji-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const ta = document.getElementById("commentText");
                if (ta) {
                    ta.value += btn.textContent;
                    ta.focus();
                }
            });
        });
    }
    const sendBtn = document.getElementById("sendCommentBtn");
    if (sendBtn) sendBtn.addEventListener("click", sendComment);
}

/* ---------- render grid ---------- */
function getCurrentFilteredList() {
    const active = document.querySelector(".categories button.active");
    const cat = active ? active.dataset.cat : "Todos";
    const searchEl = document.getElementById("search");
    const text = searchEl ? searchEl.value.trim().toLowerCase() : "";
    let list = allVideos;
    if (cat && cat !== "Todos") list = list.filter(v => v.category === cat);
    if (text) {
        list = list.filter(v =>
            (v.title||"").toLowerCase().includes(text) ||
            (v.description||"").toLowerCase().includes(text) ||
            (v.category||"").toLowerCase().includes(text) ||
            (v.uploader||"").toLowerCase().includes(text)
        );
    }
    return list;
}

function renderVideos(list) {
    const grid = document.getElementById("grid");
    const count = document.getElementById("count");
    if (!grid || !count) return;
    grid.innerHTML = "";
    count.textContent = list.length + (list.length === 1 ? " vídeo" : " vídeos");
    if (list.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:#9299a8;">No se encontraron vídeos.</div>';
        return;
    }
    const user = getUser();
    const favorites = (user && user.favorites) || [];
    list.forEach(video => {
        const isFav = favorites.includes(video.id);
        const card = document.createElement("article");
        card.className = "video-card";
        card.innerHTML = `
            <div class="thumbnail">${video.icon || "🎬"}</div>
            <div class="video-info">
                <h3>${escapeHtml(video.title)}</h3>
                <p class="card-uploader">@${escapeHtml(video.uploader || "Anónimo")}</p>
                <p>${escapeHtml(video.description)}</p>
                <div class="video-bottom">
                    <span>${escapeHtml(video.category)} · 👁 ${video.views || 0}</span>
                    <button type="button" class="favorite ${isFav ? "active" : ""}" title="Favorito">${isFav ? "♥" : "♡"}</button>
                </div>
            </div>`;
        card.addEventListener("click", e => {
            if (e.target.closest(".favorite")) return;
            openVideo(video);
        });
        const fav = card.querySelector(".favorite");
        if (fav) fav.addEventListener("click", e => { e.stopPropagation(); toggleFavorite(video.id); });
        grid.appendChild(card);
    });
}

function toggleFavorite(videoId) {
    if (!currentUser) { alert("Regístrate para guardar favoritos."); openAuth("register"); return; }
    const user = getUser();
    if (!user) return;
    if (!user.favorites) user.favorites = [];
    const i = user.favorites.indexOf(videoId);
    if (i === -1) user.favorites.push(videoId); else user.favorites.splice(i, 1);
    currentUser = user;
    saveUser(user);
    checkAchievements(user);
    saveUser(user);
    renderVideos(getCurrentFilteredList());
}

/* ---------- player ---------- */
async function resolvePlayableUrl(video) {
    if (!video) return null;
    if (video.isDemo) return null;

    let url = video.url || null;
    // Reconstruir por si la guardada está mal
    if (video.storagePath) {
        url = buildPublicVideoUrl(video.storagePath);
    }

    // Si el bucket no es público, intentar URL firmada (1 hora)
    if (supabaseClient && video.storagePath) {
        try {
            const { data, error } = await supabaseClient.storage
                .from("videos")
                .createSignedUrl(video.storagePath, 3600);
            if (!error && data && data.signedUrl) {
                // Probar si la pública falla más abajo; de momento preferimos pública
                video._signedUrl = data.signedUrl;
            }
        } catch (e) { console.warn(e); }
    }
    return url;
}

function openVideo(video) {
    currentPlayingVideo = video;
    const modal = document.getElementById("modal");
    const title = document.getElementById("modalTitle");
    const desc = document.getElementById("modalDesc");
    const uploader = document.getElementById("modalUploader");
    const player = document.getElementById("player");
    const commentForm = document.getElementById("commentForm");
    const commentHint = document.getElementById("commentLoginHint");

    if (title) title.textContent = video.title;
    if (desc) desc.textContent = video.description || "Sin descripción.";
    if (uploader) uploader.textContent = "Subido por @" + (video.uploader || "Anónimo");
    updateModalStats(video);
    highlightVoteButtons(video.id);

    if (currentUser) {
        if (commentForm) commentForm.classList.remove("hidden");
        if (commentHint) commentHint.classList.add("hidden");
    } else {
        if (commentForm) commentForm.classList.add("hidden");
        if (commentHint) commentHint.classList.remove("hidden");
    }

    openModal(modal);
    incrementViews(video);
    loadComments(video.id);

    // Cargar vídeo de forma asíncrona con fallback a URL firmada
    (async function () {
        if (!player) return;
        player.removeAttribute("src");
        player.load();

        if (video.isDemo || !video.url && !video.storagePath) {
            console.warn("[VerPlay] Demo sin archivo real");
            return;
        }

        let url = await resolvePlayableUrl(video);
        console.log("[VerPlay] Reproduciendo:", url);

        const tryPlay = (src) => new Promise((resolve) => {
            const onErr = () => {
                player.removeEventListener("error", onErr);
                player.removeEventListener("loadeddata", onOk);
                resolve(false);
            };
            const onOk = () => {
                player.removeEventListener("error", onErr);
                player.removeEventListener("loadeddata", onOk);
                resolve(true);
            };
            player.addEventListener("error", onErr);
            player.addEventListener("loadeddata", onOk);
            player.src = src;
            player.load();
        });

        let ok = url ? await tryPlay(url) : false;
        if (!ok && video._signedUrl) {
            console.warn("[VerPlay] Pública falló, probando URL firmada");
            ok = await tryPlay(video._signedUrl);
            if (ok) url = video._signedUrl;
        }

        if (!ok) {
            console.error("[VerPlay] No se pudo cargar el vídeo. URL:", url);
            if (desc) {
                desc.innerHTML = (video.description || "") +
                    '<br><br><span style="color:#ff6b8a">No se pudo reproducir el archivo. ' +
                    'Abre esta URL en una pestaña nueva para comprobarla:<br>' +
                    '<a href="' + (url || "#") + '" target="_blank" rel="noopener" style="color:#9a82ff;word-break:break-all">' +
                    (url || "(sin URL)") + "</a></span>";
            }
        }
    })();
}

function setupPlayer() {
    const closeBtn = document.getElementById("closeModal");
    const modal = document.getElementById("modal");
    const player = document.getElementById("player");
    if (closeBtn) closeBtn.addEventListener("click", () => {
        closeModal(modal);
        if (player) { player.pause(); player.removeAttribute("src"); }
        currentPlayingVideo = null;
    });
    const likeBtn = document.getElementById("likeBtn");
    const dislikeBtn = document.getElementById("dislikeBtn");
    if (likeBtn) likeBtn.addEventListener("click", () => { if (currentPlayingVideo) applyVote(currentPlayingVideo, "like"); });
    if (dislikeBtn) dislikeBtn.addEventListener("click", () => { if (currentPlayingVideo) applyVote(currentPlayingVideo, "dislike"); });
}

/* ---------- categories / search ---------- */
function setupCategoriesAndSearch() {
    document.querySelectorAll(".categories button").forEach(btn => {
        btn.addEventListener("click", function () {
            document.querySelectorAll(".categories button").forEach(b => b.classList.remove("active"));
            this.classList.add("active");
            renderVideos(getCurrentFilteredList());
        });
    });
    const search = document.getElementById("search");
    const searchBtn = document.getElementById("searchButton");
    if (search) search.addEventListener("input", () => renderVideos(getCurrentFilteredList()));
    if (searchBtn) searchBtn.addEventListener("click", () => renderVideos(getCurrentFilteredList()));
}

/* ---------- upload (solo registrados) ---------- */
function setupUpload() {
    const uploadButton = document.getElementById("uploadButton");
    const uploadModal = document.getElementById("uploadModal");
    const closeUpload = document.getElementById("closeUpload");
    const uploadFile = document.getElementById("uploadFile");
    const uploadFileInfo = document.getElementById("uploadFileInfo");
    const submit = document.getElementById("uploadSubmitButton");

    if (uploadButton) {
        uploadButton.addEventListener("click", () => {
            if (!currentUser) {
                alert("Debes registrarte e iniciar sesión para subir vídeos.");
                openAuth("register");
                return;
            }
            resetUploadForm();
            openModal(uploadModal);
        });
    }
    if (closeUpload) closeUpload.addEventListener("click", () => closeModal(uploadModal));
    if (uploadFile) uploadFile.addEventListener("change", function () {
        const f = this.files && this.files[0];
        if (!f) { if (uploadFileInfo) uploadFileInfo.textContent = ""; return; }
        let msg = f.name + " — " + formatBytes(f.size);
        if (f.size > MAX_VIDEO_BYTES) msg += " ⚠️ > 50 MB";
        if (uploadFileInfo) uploadFileInfo.textContent = msg;
    });
    if (submit) submit.addEventListener("click", handleUpload);
}

function resetUploadForm() {
    ["uploadTitle","uploadDescription","uploadFile"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
    const agree = document.getElementById("uploadAgree");
    if (agree) agree.checked = false;
    const msg = document.getElementById("uploadMessage");
    if (msg) msg.textContent = "";
    const info = document.getElementById("uploadFileInfo");
    if (info) info.textContent = "";
    const pw = document.getElementById("uploadProgressWrap");
    if (pw) pw.classList.add("hidden");
}

async function handleUpload() {
    if (!currentUser) {
        alert("Solo usuarios registrados pueden subir.");
        openAuth("login");
        return;
    }
    const title = (document.getElementById("uploadTitle") || {}).value.trim();
    const description = (document.getElementById("uploadDescription") || {}).value.trim();
    const category = (document.getElementById("uploadCategory") || {}).value || "Otros";
    const fileEl = document.getElementById("uploadFile");
    const file = fileEl && fileEl.files ? fileEl.files[0] : null;
    const agreed = document.getElementById("uploadAgree") && document.getElementById("uploadAgree").checked;
    const msgEl = document.getElementById("uploadMessage");
    const submitBtn = document.getElementById("uploadSubmitButton");
    const progressWrap = document.getElementById("uploadProgressWrap");
    const progressBar = document.getElementById("uploadProgressBar");
    const progressText = document.getElementById("uploadProgressText");

    function setMsg(t, err) {
        if (msgEl) { msgEl.textContent = t; msgEl.style.color = err ? "#ff6b8a" : ""; }
    }

    if (!title || title.length < 3) { setMsg("Título mínimo 3 caracteres.", true); return; }
    if (!file) { setMsg("Selecciona un vídeo.", true); return; }
    if (file.size > MAX_VIDEO_BYTES) { setMsg("Máximo 50 MB.", true); return; }
    if (!ALLOWED_VIDEO_TYPES.includes(file.type) && !/\.(mp4|webm|mov|avi)$/i.test(file.name)) {
        setMsg("Solo MP4, WebM, MOV o AVI.", true); return;
    }
    if (!agreed) { setMsg("Debes aceptar las normas de contenido.", true); return; }
    if (containsBlockedWords(title) || containsBlockedWords(description)) {
        setMsg("Título o descripción no permitidos.", true); return;
    }
    if (!supabaseClient) { setMsg("Supabase no disponible.", true); return; }

    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Subiendo..."; }
    if (progressWrap) progressWrap.classList.remove("hidden");
    if (progressBar) progressBar.style.width = "20%";
    if (progressText) progressText.textContent = "Subiendo...";

    try {
        await uploadVideoToSupabase(file, {
            title, description, category,
            uploader: currentUser.username
        });
        if (progressBar) progressBar.style.width = "100%";
        if (progressText) progressText.textContent = "100%";
        setMsg("¡Vídeo subido!", false);
        setTimeout(async () => {
            closeModal(document.getElementById("uploadModal"));
            await refreshVideos();
        }, 700);
    } catch (err) {
        console.error(err);
        setMsg("Error: " + (err.message || err), true);
        if (progressWrap) progressWrap.classList.add("hidden");
    } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Subir vídeo"; }
    }
}

/* ---------- CAPTCHA + auth ---------- */
function refreshCaptcha() {
    captchaA = Math.floor(Math.random() * 9) + 1;
    captchaB = Math.floor(Math.random() * 9) + 1;
    const q = document.getElementById("captchaQuestion");
    if (q) q.textContent = captchaA + " + " + captchaB;
    const a = document.getElementById("captchaAnswer");
    if (a) a.value = "";
}

function openAuth(tab) {
    const modal = document.getElementById("authModal");
    const msg = document.getElementById("authMessage");
    if (msg) msg.textContent = "";
    refreshCaptcha();
    switchAuthTab(tab || "register");
    openModal(modal);
}

function switchAuthTab(tab) {
    document.querySelectorAll(".auth-tab").forEach(t => t.classList.toggle("active", t.dataset.tab === tab));
    const reg = document.getElementById("registerPanel");
    const log = document.getElementById("loginPanel");
    if (tab === "login") {
        if (reg) reg.classList.add("hidden");
        if (log) log.classList.remove("hidden");
    } else {
        if (log) log.classList.add("hidden");
        if (reg) reg.classList.remove("hidden");
        refreshCaptcha();
    }
}

function setupAuth() {
    const profileButton = document.getElementById("profileButton");
    const closeAuth = document.getElementById("closeAuth");
    const authModal = document.getElementById("authModal");
    const registerButton = document.getElementById("registerButton");
    const loginButton = document.getElementById("loginButton");

    document.querySelectorAll(".auth-tab").forEach(t => {
        t.addEventListener("click", function () {
            switchAuthTab(this.dataset.tab);
            const m = document.getElementById("authMessage");
            if (m) m.textContent = "";
        });
    });
    if (profileButton) profileButton.addEventListener("click", () => {
        if (currentUser) openProfile(); else openAuth("register");
    });
    if (closeAuth) closeAuth.addEventListener("click", () => closeModal(authModal));
    if (registerButton) registerButton.addEventListener("click", register);
    if (loginButton) loginButton.addEventListener("click", login);
}

function register() {
    const username = (document.getElementById("registerUsername") || {}).value.trim();
    const password = (document.getElementById("registerPassword") || {}).value;
    const answer = parseInt((document.getElementById("captchaAnswer") || {}).value, 10);
    const msg = document.getElementById("authMessage");

    if (username.length < 3) { if (msg) msg.textContent = "Nombre mínimo 3 caracteres."; return; }
    if (password.length < 4) { if (msg) msg.textContent = "Contraseña mínimo 4 caracteres."; return; }
    if (answer !== captchaA + captchaB) {
        if (msg) msg.textContent = "CAPTCHA incorrecto. Inténtalo de nuevo.";
        refreshCaptcha();
        return;
    }
    if (getUser()) {
        if (msg) msg.textContent = "Ya hay cuenta. Usa Iniciar sesión.";
        return;
    }

    const user = {
        username, password,
        bio: "¡Bienvenido a VerPlay!",
        interests: "Todavía no has añadido intereses.",
        avatar: "", cover: "",
        favorites: [], achievements: [],
        createdAt: Date.now(), connectedSince: Date.now(), totalOnlineTime: 0
    };
    saveUser(user);
    currentUser = user;
    if (msg) msg.textContent = "¡Cuenta creada!";
    setTimeout(() => {
        closeModal(document.getElementById("authModal"));
        updateUserButton();
        openProfile();
    }, 500);
}

function login() {
    const username = (document.getElementById("loginUsername") || {}).value.trim();
    const password = (document.getElementById("loginPassword") || {}).value;
    const msg = document.getElementById("authMessage");
    const user = getUser();
    if (!user) { if (msg) msg.textContent = "No hay cuenta. Regístrate."; return; }
    if (user.username !== username || user.password !== password) {
        if (msg) msg.textContent = "Usuario o contraseña incorrectos.";
        return;
    }
    user.connectedSince = Date.now();
    currentUser = user;
    saveUser(user);
    if (msg) msg.textContent = "¡Bienvenido!";
    setTimeout(() => {
        closeModal(document.getElementById("authModal"));
        updateUserButton();
        openProfile();
    }, 400);
}

/* ---------- profile ---------- */
function getDefaultAvatar(u) {
    return "https://ui-avatars.com/api/?name=" + encodeURIComponent(u) + "&background=7c5cff&color=fff&size=256";
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
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set("profileName", user.username);
    set("profileBio", user.bio || "Sin descripción.");
    set("profileInterests", user.interests || "No especificados.");
    const av = document.getElementById("profileAvatar");
    if (av) av.src = user.avatar || getDefaultAvatar(user.username);
    const cover = document.getElementById("profileCover");
    if (cover) cover.style.backgroundImage = user.cover ? `url("${user.cover}")` : "linear-gradient(135deg,#302060,#11141b)";
    set("profileHours", Math.floor((user.totalOnlineTime || 0) / 3600000));
    set("profileAchievements", (user.achievements && user.achievements.length) || 0);
    set("profileFavorites", (user.favorites && user.favorites.length) || 0);
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
    const c = document.getElementById("achievements");
    if (!c) return;
    const list = [
        { id: "one_hour", icon: "⏱️", name: "1 hora conectado" },
        { id: "first_favorite", icon: "❤️", name: "Primer favorito" },
        { id: "first_video", icon: "🎬", name: "Primer vídeo" },
        { id: "creator", icon: "⭐", name: "Creador VerPlay" }
    ];
    c.innerHTML = list.map(a => {
        const unlocked = user.achievements && user.achievements.includes(a.id);
        return `<div class="achievement${unlocked ? "" : " locked"}"><div class="achievement-icon">${a.icon}</div><div class="achievement-name">${a.name}</div></div>`;
    }).join("");
}
function renderFavorites(user) {
    const c = document.getElementById("favoriteVideos");
    if (!c) return;
    if (!user.favorites || !user.favorites.length) {
        c.innerHTML = "<p>Todavía no tienes favoritos.</p>";
        return;
    }
    c.innerHTML = user.favorites.map(id => {
        const v = allVideos.find(x => x.id === id);
        return v ? `<div class="favorite-item">${v.icon || "🎬"} ${escapeHtml(v.title)}</div>` : "";
    }).join("");
}
function setupProfile() {
    const closeProfile = document.getElementById("closeProfile");
    const logoutButton = document.getElementById("logoutButton");
    const editBtn = document.getElementById("editProfileButton");
    const editModal = document.getElementById("editProfileModal");
    const closeEdit = document.getElementById("closeEditProfile");
    const saveBtn = document.getElementById("saveProfileButton");

    if (closeProfile) closeProfile.addEventListener("click", () => closeModal(document.getElementById("profileModal")));
    if (logoutButton) logoutButton.addEventListener("click", () => {
        updateOnlineTime();
        safeRemove("verplay_current_user");
        currentUser = null;
        closeModal(document.getElementById("profileModal"));
        updateUserButton();
        renderVideos(getCurrentFilteredList());
    });
    if (editBtn) editBtn.addEventListener("click", () => {
        const user = getUser();
        if (!user) return;
        const ii = document.getElementById("interestsInput");
        const bi = document.getElementById("bioInput");
        if (ii) ii.value = user.interests || "";
        if (bi) bi.value = user.bio || "";
        openModal(editModal);
    });
    if (closeEdit) closeEdit.addEventListener("click", () => closeModal(editModal));
    if (saveBtn) saveBtn.addEventListener("click", async () => {
        const user = getUser();
        if (!user) return;
        const ii = document.getElementById("interestsInput");
        const bi = document.getElementById("bioInput");
        const av = document.getElementById("avatarInput");
        const bg = document.getElementById("profileBackgroundInput");
        user.interests = ii ? ii.value.trim() : user.interests;
        user.bio = bi ? bi.value.trim() : user.bio;
        try {
            if (av && av.files && av.files[0] && av.files[0].size <= MAX_IMAGE_BYTES)
                user.avatar = await readFile(av.files[0]);
            if (bg && bg.files && bg.files[0] && bg.files[0].size <= MAX_IMAGE_BYTES)
                user.cover = await readFile(bg.files[0]);
        } catch (e) { console.warn(e); }
        saveUser(user);
        currentUser = user;
        closeModal(editModal);
        renderProfile();
    });
}
function readFile(file) {
    return new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = rej;
        r.readAsDataURL(file);
    });
}
function updateUserButton() {
    const el = document.getElementById("profileButtonText");
    if (el) el.textContent = currentUser ? currentUser.username : "Registrarse";
}

/* ---------- modals outside click ---------- */
function setupModalOutsideClick() {
    document.querySelectorAll(".modal").forEach(m => {
        m.addEventListener("click", e => {
            if (e.target === m) {
                m.classList.add("hidden");
                if (m.id === "modal") {
                    const p = document.getElementById("player");
                    if (p) { p.pause(); p.removeAttribute("src"); }
                    currentPlayingVideo = null;
                }
            }
        });
    });
}

/* ---------- init ---------- */
function init() {
    console.log("[VerPlay] init");
    currentUser = getCurrentUserFromStorage();
    loadBackground();
    setupBackgroundControls();
    setupSettings();
    setupPlayer();
    setupCategoriesAndSearch();
    setupAuth();
    setupProfile();
    setupUpload();
    setupCommentsUI();
    setupModalOutsideClick();
    updateUserButton();
    renderVideos(allVideos);
    refreshVideos();
    refreshCaptcha();

    setInterval(() => {
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
