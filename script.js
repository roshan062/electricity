// ---------- App state ----------
let currentSection = 1;
const totalSections = 9;
let audioPlaying = false;
let correctAnswers = 0;
const totalQuestions = 5;

// DOM refs filled on DOMContentLoaded
let nextBtnEl = null;
let prevBtnEl = null;
let pageInfoEl = null;
let progressFillEl = null;

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
    // cache elements that might not exist (pager is commented out in HTML)
    // nextBtnEl = document.getElementById("nextBtn");
    // prevBtnEl = document.getElementById("prevBtn");
    // pageInfoEl = document.getElementById("pageInfo");
    // progressFillEl = document.getElementById("progressFill");

    // wire pager if present
    if (nextBtnEl) {
        nextBtnEl.addEventListener("click", () => {
            if (currentSection < totalSections) {
                currentSection++;
                showSection(currentSection);
            }
        });
    }
    if (prevBtnEl) {
        prevBtnEl.addEventListener("click", () => {
            if (currentSection > 1) {
                currentSection--;
                showSection(currentSection);
            }
        });
    }

    // start animations/progress
    updateProgressBar();
    observeSections();

    // keyboard + touch
    wireGlobalNav();

    // poster-first video init for section 2 (and any .video-wrapper)
    initPosterVideos();
});

// ---------- Paging ----------
function showSection(n) {
    document.querySelectorAll(".page").forEach((s) => s.classList.remove("visible"));

    setTimeout(() => {
        const target = document.getElementById(`section${n}`);
        if (target) {
            target.classList.add("visible");
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, 100);

    // guard each optional element
    if (prevBtnEl) prevBtnEl.disabled = n === 1;
    if (nextBtnEl) nextBtnEl.disabled = n === totalSections;
    if (pageInfoEl) pageInfoEl.textContent = `Page ${n} of ${totalSections}`;

    updateProgressBar();
}

function updateProgressBar() {
    const pct = (currentSection / totalSections) * 100;
    if (progressFillEl) progressFillEl.style.width = pct + "%";
}

function observeSections() {
    const io = new IntersectionObserver(
        (entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) e.target.classList.add("fade-in");
            });
        },
        { threshold: 0.2, rootMargin: "0px 0px -50px 0px" }
    );
    document.querySelectorAll(".page").forEach((el) => io.observe(el));
}

// ---------- Audio helpers ----------
function playAudio(id) {
    const clip = document.getElementById(id);
    if (!clip) return;
    if (clip.paused) {
        clip.currentTime = 0;
        clip.play();
        toast("🎵 Playing narration…");
    } else {
        clip.pause();
        toast("⏸️ Paused");
    }
}

function toggleAudio() {
    audioPlaying = !audioPlaying;
    const btn = document.getElementById("audioControl"); // may not exist
    if (btn) {
        btn.textContent = audioPlaying ? "⏸️" : "🎵";
        btn.style.transform = "scale(1.05)";
        setTimeout(() => (btn.style.transform = ""), 150);
    }
    toast(audioPlaying ? "🎵 Background audio enabled" : "🔇 Background audio disabled");
}

// ---------- Quiz ----------
function selectAnswer(el, isCorrect) {
    const group = el.parentNode;
    const feedback = group.nextElementSibling;
    group.querySelectorAll("li").forEach((li) => {
        li.className = "";
        li.style.pointerEvents = "none";
    });
    el.classList.add(isCorrect ? "correct" : "incorrect");
    if (feedback) feedback.textContent = isCorrect ? "✅ Correct!" : "❌ Incorrect!";
    if (isCorrect) correctAnswers++;
}

function showResults() {
    const pct = Math.round((correctAnswers / totalQuestions) * 100);
    let msg = `🎯 ${correctAnswers}/${totalQuestions} (${pct}%)\n`;
    msg += pct >= 80 ? "🌟 Ace!" : pct >= 60 ? "👍 Nice — revise a bit." : "📚 Review the chapter.";
    toast(msg);
}

// ---------- Toast ----------
function toast(message) {
    const n = document.createElement("div");
    n.style.cssText = `
    position:fixed;inset:auto 0 30px 0;margin:auto;max-width:360px;
    background:linear-gradient(45deg,#6e56cf,#6246ea);color:#fff;
    font-weight:800;padding:14px 16px;border-radius:14px;text-align:center;
    box-shadow:0 12px 30px rgba(0,0,0,.25);z-index:9999;opacity:0;transform:translateY(12px);
    transition:.3s`;
    n.innerHTML = message.replace(/\n/g, "<br>");
    document.body.appendChild(n);
    requestAnimationFrame(() => {
        n.style.opacity = "1";
        n.style.transform = "translateY(0)";
    });
    setTimeout(() => {
        n.style.opacity = "0";
        n.style.transform = "translateY(12px)";
        setTimeout(() => n.remove(), 300);
    }, 2500);
}

// ---------- Global keyboard & touch nav ----------
function wireGlobalNav() {
    document.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight" && currentSection < totalSections) {
            currentSection++;
            showSection(currentSection);
        }
        if (e.key === "ArrowLeft" && currentSection > 1) {
            currentSection--;
            showSection(currentSection);
        }
        if (e.key === " ") {
            e.preventDefault();
            toggleAudio();
        }
    });

    let startX = 0,
        endX = 0;
    document.addEventListener("touchstart", (e) => {
        startX = e.changedTouches[0].screenX;
    });
    document.addEventListener("touchend", (e) => {
        endX = e.changedTouches[0].screenX;
        const diff = startX - endX;
        if (Math.abs(diff) > 50) {
            if (diff > 0 && currentSection < totalSections) {
                currentSection++;
                showSection(currentSection);
            } else if (diff < 0 && currentSection > 1) {
                currentSection--;
                showSection(currentSection);
            }
        }
    });
}

// ---------- Poster-first video for .video-wrapper ----------
function initPosterVideos() {
    document.querySelectorAll(".video-wrapper").forEach((wrapper) => {
        const video = wrapper.querySelector("video");
        if (!video) return;

        // ensure clean starting state
        video.removeAttribute("autoplay");
        video.removeAttribute("controls");

        // ensure overlay exists
        let overlay = wrapper.querySelector(".play-overlay");
        if (!overlay) {
            overlay = document.createElement("button");
            overlay.type = "button";
            overlay.className = "play-overlay";
            overlay.setAttribute("aria-label", "Play video");
            wrapper.appendChild(overlay);
        }

        const showOverlay = (show) => {
            wrapper.classList.toggle("playing", !show);
            if (show) video.removeAttribute("controls");
        };

        const enableControls = () => {
            if (!video.hasAttribute("controls")) video.setAttribute("controls", "");
        };

        const tryPlay = () => {
            enableControls();
            const p = video.play();
            if (p && typeof p.catch === "function") {
                p.catch(() => {
                    // iOS/Safari fallback: play muted first
                    video.muted = true;
                    video.play()
                        .then(() => setTimeout(() => (video.muted = false), 0))
                        .catch(() => showOverlay(true));
                });
            }
        };

        overlay.addEventListener("click", () => {
            showOverlay(false);
            if (video.readyState < 2) {
                const onReady = () => {
                    video.removeEventListener("loadeddata", onReady);
                    tryPlay();
                };
                video.addEventListener("loadeddata", onReady);
                try {
                    video.load();
                } catch { }
            } else {
                tryPlay();
            }
        });

        video.addEventListener("play", () => showOverlay(false));
        video.addEventListener("ended", () => {
            video.pause();
            video.currentTime = 0;
            try {
                video.load(); // restores poster reliably
            } catch { }
            showOverlay(true);
        });
        video.addEventListener("pause", () => {
            if (video.currentTime === 0) showOverlay(true);
        });

        // start with overlay visible
        showOverlay(true);
    });
}
