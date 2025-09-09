// Paging
let currentSection = 1;
const totalSections = 9;
let audioPlaying = false;
let correctAnswers = 0;
const totalQuestions = 5;

// Start
updateProgressBar();
observeSections();

document.getElementById("nextBtn").addEventListener("click", () => {
    if (currentSection < totalSections) { currentSection++; showSection(currentSection); }
});
document.getElementById("prevBtn").addEventListener("click", () => {
    if (currentSection > 1) { currentSection--; showSection(currentSection); }
});

function showSection(n) {
    document.querySelectorAll(".page").forEach(s => s.classList.remove("visible"));
    setTimeout(() => {
        const t = document.getElementById(`section${n}`);
        if (t) { t.classList.add("visible"); t.scrollIntoView({ behavior: "smooth", block: "start" }); }
    }, 100);
    document.getElementById("prevBtn").disabled = n === 1;
    document.getElementById("nextBtn").disabled = n === totalSections;
    document.getElementById("pageInfo").textContent = `Page ${n} of ${totalSections}`;
    updateProgressBar();
}
function updateProgressBar() {
    const pct = (currentSection / totalSections) * 100;
    document.getElementById("progressFill").style.width = pct + "%";
}
function observeSections() {
    const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("fade-in"); });
    }, { threshold: .2, rootMargin: "0px 0px -50px 0px" });
    document.querySelectorAll(".page").forEach(el => io.observe(el));
}

// Audio: play a specific clip from its <audio id="">
function playAudio(id) {
    const clip = document.getElementById(id);
    if (!clip) return;
    if (clip.paused) { clip.currentTime = 0; clip.play(); toast("🎵 Playing narration…"); }
    else { clip.pause(); toast("⏸️ Paused"); }
}

// Global background audio toggle (demo visual only)
function toggleAudio() {
    audioPlaying = !audioPlaying;
    const btn = document.getElementById("audioControl");
    btn.textContent = audioPlaying ? "⏸️" : "🎵";
    btn.style.transform = "scale(1.05)";
    setTimeout(() => btn.style.transform = "", 150);
    toast(audioPlaying ? "🎵 Background audio enabled" : "🔇 Background audio disabled");
}

// Quiz
function selectAnswer(el, isCorrect) {
    const group = el.parentNode;
    const feedback = group.nextElementSibling;
    group.querySelectorAll("li").forEach(li => { li.className = ""; li.style.pointerEvents = "none"; });
    el.classList.add(isCorrect ? "correct" : "incorrect");
    feedback.textContent = isCorrect ? "✅ Correct!" : "❌ Incorrect!";
    if (isCorrect) correctAnswers++;
}
function showResults() {
    const pct = Math.round((correctAnswers / totalQuestions) * 100);
    let msg = `🎯 ${correctAnswers}/${totalQuestions} (${pct}%)\n`;
    msg += pct >= 80 ? "🌟 Ace!" : pct >= 60 ? "👍 Nice — revise a bit." : "📚 Review the chapter.";
    toast(msg);
}

// Toast
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
    requestAnimationFrame(() => { n.style.opacity = "1"; n.style.transform = "translateY(0)"; });
    setTimeout(() => { n.style.opacity = "0"; n.style.transform = "translateY(12px)"; setTimeout(() => n.remove(), 300); }, 2500);
}

// Keyboard + touch nav
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" && currentSection < totalSections) { currentSection++; showSection(currentSection); }
    if (e.key === "ArrowLeft" && currentSection > 1) { currentSection--; showSection(currentSection); }
    if (e.key === " ") { e.preventDefault(); toggleAudio(); }
});
let startX = 0, endX = 0;
document.addEventListener("touchstart", (e) => { startX = e.changedTouches[0].screenX; });
document.addEventListener("touchend", (e) => { endX = e.changedTouches[0].screenX; handleSwipe(); });
function handleSwipe() {
    const diff = startX - endX;
    if (Math.abs(diff) > 50) {
        if (diff > 0 && currentSection < totalSections) { currentSection++; showSection(currentSection); }
        else if (diff < 0 && currentSection > 1) { currentSection--; showSection(currentSection); }
    }
}
