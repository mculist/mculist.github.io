const STORAGE_KEY = "mculist-local-fallback-v1";

const timelineTitles = [
  "Eyes of Wakanda","Captain America: The First Avenger","Agent Carter","Captain Marvel","Iron Man","Iron Man 2",
  "The Incredible Hulk","A Funny Thing Happened on the Way to Thor's Hammer","Thor","The Consultant","The Avengers","Item 47",
  "Thor: The Dark World","Iron Man 3","All Hail the King","Captain America: The Winter Soldier","Guardians of the Galaxy",
  "Guardians of the Galaxy Vol. 2","I Am Groot season 1","I Am Groot season 2","Daredevil season 1","Jessica Jones season 1",
  "Avengers: Age of Ultron","Ant-Man","Daredevil season 2","Luke Cage season 1","Iron Fist season 1","The Defenders",
  "Captain America: Civil War","Black Widow","Black Panther","Spider-Man: Homecoming","The Punisher season 1","Doctor Strange",
  "Jessica Jones season 2","Luke Cage season 2","Iron Fist season 2","Daredevil season 3","Thor: Ragnarok","The Punisher season 2",
  "Jessica Jones season 3","Ant-Man and the Wasp","Avengers: Infinity War","Avengers: Endgame","Loki season 1","What If...? season 1",
  "Marvel Zombies","WandaVision","Shang-Chi and the Legend of the Ten Rings","The Falcon and the Winter Soldier","Spider-Man: Far From Home",
  "Eternals","Doctor Strange in the Multiverse of Madness","Hawkeye","Moon Knight","Black Panther: Wakanda Forever","Echo",
  "She-Hulk: Attorney at Law","Ms. Marvel","Thor: Love and Thunder","Ironheart","Werewolf by Night",
  "The Guardians of the Galaxy Holiday Special","Ant-Man and the Wasp: Quantumania","Guardians of the Galaxy Vol. 3",
  "Secret Invasion","The Marvels","Loki season 2","What If...? season 2","Deadpool & Wolverine","Agatha All Along",
  "What If...? season 3","Daredevil: Born Again","Captain America: Brave New World","Thunderbolts*","The Fantastic Four: First Steps","Wonder Man"
];

function defaultState() {
  return {
    movies: timelineTitles.map((title, i) => ({ id: `mcu-${i + 1}`, title, want: false, rating: 0 }))
  };
}

let state = defaultState();
let cloudRow = null;

const app = document.getElementById("app");
const lockScreen = document.getElementById("lockScreen");
const lockText = document.getElementById("lockText");
const pinInput = document.getElementById("pinInput");
const pinBtn = document.getElementById("pinBtn");
const movieList = document.getElementById("movieList");
const clearAllBtn = document.getElementById("clearAllBtn");
const statusEl = document.getElementById("status");

const cfg = window.MCULIST_CONFIG || {};
const hasCloud = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_URL.includes("YOUR_PROJECT");

const headers = hasCloud ? {
  apikey: cfg.SUPABASE_ANON_KEY,
  Authorization: `Bearer ${cfg.SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json"
} : null;

function hashPin(pin) {
  let h = 0;
  for (let i = 0; i < pin.length; i++) h = (h * 31 + pin.charCodeAt(i)) | 0;
  return String(h);
}

function setStatus(msg) { statusEl.textContent = msg || ""; }

function ratingBar(v) { return `[${"✪".repeat(v)}${"O".repeat(5 - v)}]`; }

function saveLocal() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function loadLocal() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try { const parsed = JSON.parse(raw); if (parsed?.movies?.length) state = parsed; } catch {}
}

async function cloudFetchRow() {
  const family = encodeURIComponent(cfg.FAMILY_ID || "default-family");
  const url = `${cfg.SUPABASE_URL}/rest/v1/mculist_state?family_id=eq.${family}&select=family_id,pin_hash,data,updated_at`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Cloud read failed: ${res.status}`);
  const rows = await res.json();
  return rows[0] || null;
}

async function cloudUpsert(pinHash, data) {
  const url = `${cfg.SUPABASE_URL}/rest/v1/mculist_state`;
  const body = [{ family_id: cfg.FAMILY_ID || "default-family", pin_hash: pinHash, data, updated_at: new Date().toISOString() }];
  const res = await fetch(url, {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Cloud write failed: ${res.status}`);
  const rows = await res.json();
  cloudRow = rows[0] || null;
}

async function loadState() {
  if (!hasCloud) {
    loadLocal();
    setStatus("Local mode (cloud not configured)");
    return;
  }
  cloudRow = await cloudFetchRow();
  if (cloudRow?.data?.movies?.length) state = cloudRow.data;
  setStatus("Cloud sync on");
}

async function persist() {
  if (!hasCloud) { saveLocal(); return; }
  if (!cloudRow?.pin_hash) return;
  await cloudUpsert(cloudRow.pin_hash, state);
}

function render() {
  movieList.innerHTML = "";
  state.movies.forEach((movie, idx) => {
    const li = document.createElement("li");
    li.className = "movie glass";

    const star = document.createElement("div");
    star.className = `star ${movie.want ? "gold" : ""}`;
    star.textContent = "✪";

    const info = document.createElement("div");
    info.innerHTML = `<div class="title">${movie.title}</div><div class="subtitle">MCU Timeline #${idx + 1}</div>`;

    const menu = document.createElement("select");
    menu.innerHTML = `
      <option value="">Action...</option>
      <option value="want">Want to watch</option>
      <option value="rate">Rate</option>
      <option value="clear">Clear</option>
    `;

    const rating = document.createElement("div");
    rating.className = "rating";
    rating.textContent = ratingBar(movie.rating);

    menu.addEventListener("change", async () => {
      const action = menu.value;
      if (action === "want") movie.want = !movie.want;
      if (action === "rate") {
        const val = Number(prompt("Rate 0 to 5"));
        if (!Number.isNaN(val)) movie.rating = Math.max(0, Math.min(5, Math.round(val)));
      }
      if (action === "clear") { movie.want = false; movie.rating = 0; }

      try {
        await persist();
        setStatus(hasCloud ? "Saved to cloud" : "Saved locally");
      } catch (e) {
        setStatus(`Save failed: ${e.message}`);
      }
      render();
    });

    li.append(star, info, menu, rating);
    movieList.appendChild(li);
  });
}

function unlock() {
  lockScreen.classList.add("hidden");
  app.classList.remove("hidden");
  render();
}

async function initPinFlow() {
  try {
    await loadState();
  } catch (e) {
    setStatus(`Cloud error, using local: ${e.message}`);
    loadLocal();
  }

  const existingHash = hasCloud ? cloudRow?.pin_hash : localStorage.getItem("mculist-pin-local");

  if (!existingHash) {
    lockText.textContent = "First-time setup: create your family PIN (4-12 digits).";
    pinBtn.onclick = async () => {
      const pin = pinInput.value.trim();
      if (!/^\d{4,12}$/.test(pin)) return alert("PIN must be 4-12 digits.");
      const pinHash = hashPin(pin);
      try {
        if (hasCloud) {
          await cloudUpsert(pinHash, state);
          setStatus("PIN created. Cloud sync on");
        } else {
          localStorage.setItem("mculist-pin-local", pinHash);
          saveLocal();
        }
        unlock();
      } catch (e) {
        alert(`Could not create PIN: ${e.message}`);
      }
    };
  } else {
    lockText.textContent = "Enter family PIN to open MCUlist.";
    pinBtn.onclick = () => {
      const pinHash = hashPin(pinInput.value.trim());
      if (pinHash === existingHash) unlock();
      else alert("Wrong PIN.");
    };
  }
}

clearAllBtn.addEventListener("click", async () => {
  if (!confirm("Clear ALL watch + rating data?")) return;
  state.movies.forEach(m => { m.want = false; m.rating = 0; });
  try {
    await persist();
    setStatus(hasCloud ? "All data cleared (cloud)" : "All data cleared (local)");
  } catch (e) {
    setStatus(`Clear failed: ${e.message}`);
  }
  render();
});

initPinFlow();
