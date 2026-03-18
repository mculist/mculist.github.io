const STORAGE_KEY = "mculist-state-v2";
const PIN_KEY = "mculist-pin-v2";
const THEME_KEY = "mculist-theme-v2";

// Timeline data from your provided list
const timelineTitles = [
"Eyes of Wakanda",
"Captain America: The First Avenger",
"Agent Carter",
"Captain Marvel",
"Iron Man",
"Iron Man 2",
"The Incredible Hulk",
"A Funny Thing Happened on the Way to Thor's Hammer",
"Thor",
"The Consultant",
"The Avengers",
"Item 47",
"Thor: The Dark World",
"Iron Man 3",
"All Hail the King",
"Captain America: The Winter Soldier",
"Guardians of the Galaxy",
"Guardians of the Galaxy Vol. 2",
"I Am Groot season 1",
"I Am Groot season 2",
"Daredevil season 1",
"Jessica Jones season 1",
"Avengers: Age of Ultron",
"Ant-Man",
"Daredevil season 2",
"Luke Cage season 1",
"Iron Fist season 1",
"The Defenders",
"Captain America: Civil War",
"Black Widow",
"Black Panther",
"Spider-Man: Homecoming",
"The Punisher season 1",
"Doctor Strange",
"Jessica Jones season 2",
"Luke Cage season 2",
"Iron Fist season 2",
"Daredevil season 3",
"Thor: Ragnarok",
"The Punisher season 2",
"Jessica Jones season 3",
"Ant-Man and the Wasp",
"Avengers: Infinity War",
"Avengers: Endgame",
"Loki season 1",
"What If...? season 1",
"Marvel Zombies",
"WandaVision",
"Shang-Chi and the Legend of the Ten Rings",
"The Falcon and the Winter Soldier",
"Spider-Man: Far From Home",
"Eternals",
"Doctor Strange in the Multiverse of Madness",
"Hawkeye",
"Moon Knight",
"Black Panther: Wakanda Forever",
"Echo",
"She-Hulk: Attorney at Law",
"Ms. Marvel",
"Thor: Love and Thunder",
"Ironheart",
"Werewolf by Night",
"The Guardians of the Galaxy Holiday Special",
"Ant-Man and the Wasp: Quantumania",
"Guardians of the Galaxy Vol. 3",
"Secret Invasion",
"The Marvels",
"Loki season 2",
"What If...? season 2",
"Deadpool & Wolverine",
"Agatha All Along",
"What If...? season 3",
"Daredevil: Born Again",
"Captain America: Brave New World",
"Thunderbolts*",
"The Fantastic Four: First Steps",
"Wonder Man"
];

function makeDefaultState() {
return {
movies: timelineTitles.map((title, i) => ({
id: `mcu-${i + 1}`,
title,
want: false,
rating: 0
}))
};
}

let state = makeDefaultState();

const app = document.getElementById("app");
const movieList = document.getElementById("movieList");
const clearAllBtn = document.getElementById("clearAllBtn");
const themeBtn = document.getElementById("themeBtn");
const lockScreen = document.getElementById("lockScreen");
const lockText = document.getElementById("lockText");
const pinInput = document.getElementById("pinInput");
const pinBtn = document.getElementById("pinBtn");

function hashPin(pin) {
// Simple hash (not high security, but okay for basic family PIN gate)
let h = 0;
for (let i = 0; i < pin.length; i++) {
h = (h * 31 + pin.charCodeAt(i)) | 0;
}
return String(h);
}
function loadState() {
const raw = localStorage.getItem(STORAGE_KEY);
if (!raw) return;
try {
const parsed = JSON.parse(raw);
if (parsed?.movies?.length) state = parsed;
} catch {
// ignore corrupt local data
}
}

function saveState() {
localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function setTheme(theme) {
document.body.classList.toggle("dark", theme === "dark");
localStorage.setItem(THEME_KEY, theme);
}

function initTheme() {
const saved = localStorage.getItem(THEME_KEY);
if (saved === "dark" || saved === "light") {
setTheme(saved);
return;
}
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
setTheme(prefersDark ? "dark" : "light");
}
function ratingBar(value) {
return `[${"✪".repeat(value)}${"O".repeat(5 - value)}]`;
}

function render() {
movieList.innerHTML = "";

state.movies.forEach((movie, idx) => {
const li = document.createElement("li");
li.className = "movie";

const leftStar = document.createElement("div");
leftStar.className = `star ${movie.want ? "gold" : ""}`;
leftStar.textContent = "✪";
const info = document.createElement("div");
info.innerHTML = `
<div class="title">${movie.title}</div>
<div class="subtitle">MCU Timeline #${idx + 1}</div>
`;

const menu = document.createElement("select");
menu.innerHTML = `
<option value="">Action...</option>
<option value="want">Want to watch</option>
<option value="rate">Rate</option>
<option value="clear">Clear</option>
`;

menu.addEventListener("change", () => {
const action = menu.value;

if (action === "want") {
movie.want = !movie.want;
} else if (action === "rate") {
const input = prompt("Rate 0 to 5");
const n = Number(input);
if (!Number.isNaN(n)) {
movie.rating = Math.max(0, Math.min(5, Math.round(n)));
}
} else if (action === "clear") {
movie.want = false;
movie.rating = 0;
}
saveState();
render();
});

const rating = document.createElement("div");
rating.className = "rating";
rating.textContent = ratingBar(movie.rating);

li.append(leftStar, info, menu, rating);
movieList.appendChild(li);
});
}

function unlock() {
lockScreen.classList.add("hidden");
app.classList.remove("hidden");
loadState();
render();
}

function initPinFlow() {
const savedPinHash = localStorage.getItem(PIN_KEY);

if (!savedPinHash) {
lockText.textContent = "First time setup: create a family PIN (4-12 digits).";
pinBtn.onclick = () => {
const pin = pinInput.value.trim();
if (!/^[0-9]{4,12}$/.test(pin)) {
alert("PIN must be 4-12 digits.");
return;
}
localStorage.setItem(PIN_KEY, hashPin(pin));
unlock();
};
} else {
lockText.textContent = "Enter PIN to open MCUlist.";
pinBtn.onclick = () => {
const pin = pinInput.value.trim();
if (hashPin(pin) === savedPinHash) {
unlock();
} else {
alert("Wrong PIN.");
}
};
}
}

clearAllBtn.addEventListener("click", () => {
const ok = confirm("Clear ALL watch/rating data?");
if (!ok) return;

state.movies.forEach(m => {
m.want = false;
m.rating = 0;
});
saveState();
render();
});

themeBtn.addEventListener("click", () => {
const isDark = document.body.classList.contains("dark");
setTheme(isDark ? "light" : "dark");
});

initTheme();
initPinFlow();
