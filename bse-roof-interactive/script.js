const lights = {
  L01: { position: "North-west roof edge", type: "Concept / TBD" },
  L02: { position: "North-east upper corner", type: "Concept / TBD" },
  L03: { position: "East roof projection", type: "Concept / TBD" },
  L04: { position: "West mid roof edge", type: "Concept / TBD" },
  L05: { position: "South-west roof corner", type: "Concept / TBD" },
  L06: { position: "South-east roof edge", type: "Concept / TBD" }
};

const state = Object.fromEntries(
  Object.keys(lights).map(key => [key, { failed: false }])
);

let selected = "L01";

const hotspots = [...document.querySelectorAll(".hotspot")];
const lightName = document.getElementById("lightName");
const lightStatus = document.getElementById("lightStatus");
const positionText = document.getElementById("positionText");
const typeText = document.getElementById("typeText");
const powerText = document.getElementById("powerText");
const statusText = document.getElementById("statusText");
const beacon = document.getElementById("beacon");
const toggleBtn = document.getElementById("toggleBtn");

function render() {
  const info = lights[selected];
  const current = state[selected];
  const selectedHotspot = hotspots.find(h => h.dataset.light === selected);

  hotspots.forEach(h => {
    h.classList.toggle("active", h.dataset.light === selected);
    h.classList.toggle("failed", state[h.dataset.light].failed);
  });

  lightName.textContent = `Light ${selected}`;
  positionText.textContent = info.position;
  typeText.textContent = info.type;

  if (current.failed) {
    lightStatus.textContent = "FAULT";
    lightStatus.classList.add("fault");
    powerText.textContent = "OFF";
    statusText.textContent = "Failure detected";
    beacon.classList.add("off");
    toggleBtn.textContent = "Restore Light";
  } else {
    lightStatus.textContent = "NORMAL";
    lightStatus.classList.remove("fault");
    powerText.textContent = "ON";
    statusText.textContent = "Operational";
    beacon.classList.remove("off");
    toggleBtn.textContent = "Simulate Failure";
  }
}

hotspots.forEach(hotspot => {
  hotspot.addEventListener("click", () => {
    selected = hotspot.dataset.light;
    render();
  });
});

toggleBtn.addEventListener("click", () => {
  state[selected].failed = !state[selected].failed;
  render();
});

document.getElementById("nextBtn").addEventListener("click", () => {
  const keys = Object.keys(lights);
  const index = keys.indexOf(selected);
  selected = keys[(index + 1) % keys.length];
  render();
});

document.getElementById("resetBtn").addEventListener("click", () => {
  Object.values(state).forEach(item => item.failed = false);
  selected = "L01";
  render();
});

render();
