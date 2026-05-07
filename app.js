const storeKey = "lineready-state-v1";

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const starterState = {
  tasks: [
    {
      id: makeId(),
      title: "Confirm PPE stock at North gate",
      zone: "North gate",
      priority: "High",
      done: false,
      createdAt: Date.now() - 1000 * 60 * 45,
    },
    {
      id: makeId(),
      title: "Temperature check for cold store",
      zone: "Cold store",
      priority: "Medium",
      done: false,
      createdAt: Date.now() - 1000 * 60 * 25,
    },
    {
      id: makeId(),
      title: "Replace radio battery kit",
      zone: "Loading bay",
      priority: "Low",
      done: true,
      createdAt: Date.now() - 1000 * 60 * 90,
    },
  ],
  incidents: [
    {
      id: makeId(),
      title: "Dock 2 ramp needs cone barrier",
      severity: "Moderate",
      owner: "M. Torres",
      createdAt: Date.now() - 1000 * 60 * 18,
    },
  ],
  handoff: {
    lead: "",
    notes: "",
    updatedAt: null,
  },
};

let state = loadState();

const views = document.querySelectorAll(".view");
const navTabs = document.querySelectorAll(".nav-tab");
const todayLabel = document.querySelector("#todayLabel");
const shiftWindow = document.querySelector("#shiftWindow");
const syncState = document.querySelector("#syncState");

const openCount = document.querySelector("#openCount");
const doneCount = document.querySelector("#doneCount");
const incidentCount = document.querySelector("#incidentCount");
const pendingChecks = document.querySelector("#pendingChecks");
const escalations = document.querySelector("#escalations");

const priorityList = document.querySelector("#priorityList");
const openTasks = document.querySelector("#openTasks");
const doneTasks = document.querySelector("#doneTasks");
const incidentList = document.querySelector("#incidentList");
const timeline = document.querySelector("#timeline");
const taskTemplate = document.querySelector("#taskTemplate");

const taskForm = document.querySelector("#taskForm");
const incidentForm = document.querySelector("#incidentForm");
const handoffForm = document.querySelector("#handoffForm");
const handoffLead = document.querySelector("#handoffLead");
const handoffText = document.querySelector("#handoffText");

function loadState() {
  const saved = localStorage.getItem(storeKey);
  if (!saved) return starterState;

  try {
    return JSON.parse(saved);
  } catch {
    return starterState;
  }
}

function saveState() {
  localStorage.setItem(storeKey, JSON.stringify(state));
  syncState.textContent = `Saved ${new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getShiftWindow() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 14) return "06:00-14:00";
  if (hour >= 14 && hour < 22) return "14:00-22:00";
  return "22:00-06:00";
}

function setActiveView(id) {
  views.forEach((view) => view.classList.toggle("active", view.id === id));
  navTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === id));
}

function priorityRank(priority) {
  return { High: 0, Medium: 1, Low: 2 }[priority] ?? 3;
}

function renderTask(task) {
  const card = taskTemplate.content.firstElementChild.cloneNode(true);
  card.classList.add(`priority-${task.priority.toLowerCase()}`);
  card.classList.toggle("done", task.done);
  card.querySelector(".task-meta").textContent =
    `${task.priority} - ${task.zone} - ${formatTime(task.createdAt)}`;
  card.querySelector("h3").textContent = task.title;
  card.querySelector(".task-toggle").addEventListener("click", () => {
    task.done = !task.done;
    saveState();
    render();
  });
  return card;
}

function renderTasks() {
  const open = state.tasks
    .filter((task) => !task.done)
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
  const done = state.tasks
    .filter((task) => task.done)
    .sort((a, b) => b.createdAt - a.createdAt);

  priorityList.replaceChildren(...open.slice(0, 4).map(renderTask));
  openTasks.replaceChildren(...open.map(renderTask));
  doneTasks.replaceChildren(...done.map(renderTask));

  if (!open.length) {
    priorityList.append(emptyMessage("All priority work is clear."));
    openTasks.append(emptyMessage("No open tasks."));
  }

  if (!done.length) {
    doneTasks.append(emptyMessage("Completed tasks will appear here."));
  }
}

function renderIncidents() {
  const cards = state.incidents
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((incident) => {
      const card = document.createElement("article");
      card.className = "incident-card";
      card.innerHTML = `
        <div>
          <p>${incident.owner} - ${formatTime(incident.createdAt)}</p>
          <h3></h3>
        </div>
        <strong>${incident.severity}</strong>
      `;
      card.querySelector("h3").textContent = incident.title;
      return card;
    });

  incidentList.replaceChildren(...cards);
  if (!cards.length) incidentList.append(emptyMessage("No incidents logged."));
}

function renderTimeline() {
  const entries = [
    ...state.incidents.map((item) => ({
      type: "Incident",
      text: `${item.title} assigned to ${item.owner}`,
      time: item.createdAt,
    })),
    ...state.tasks.map((item) => ({
      type: item.done ? "Done" : "Task",
      text: item.title,
      time: item.createdAt,
    })),
  ]
    .sort((a, b) => b.time - a.time)
    .slice(0, 8);

  const cards = entries.map((entry) => {
    const card = document.createElement("article");
    card.className = "note-card";
    card.innerHTML = `
      <div>
        <p>${entry.type} - ${formatTime(entry.time)}</p>
        <h3></h3>
      </div>
      <svg><use href="#icon-clock"></use></svg>
    `;
    card.querySelector("h3").textContent = entry.text;
    return card;
  });

  timeline.replaceChildren(...cards);
}

function renderHandoff() {
  handoffLead.textContent = state.handoff.lead || "No lead saved";
  handoffText.textContent = state.handoff.notes || "No notes yet.";
  handoffForm.elements.lead.value = state.handoff.lead || "";
  handoffForm.elements.notes.value = state.handoff.notes || "";
}

function renderCounts() {
  const open = state.tasks.filter((task) => !task.done).length;
  const done = state.tasks.filter((task) => task.done).length;
  const highIncidents = state.incidents.filter(
    (incident) => incident.severity === "Critical" || incident.severity === "Moderate",
  ).length;

  openCount.textContent = open;
  doneCount.textContent = done;
  incidentCount.textContent = state.incidents.length;
  pendingChecks.textContent = open;
  escalations.textContent = highIncidents;
}

function emptyMessage(text) {
  const message = document.createElement("article");
  message.className = "note-card";
  message.innerHTML = `<div><p>Clear</p><h3></h3></div>`;
  message.querySelector("h3").textContent = text;
  return message;
}

function render() {
  todayLabel.textContent = new Date().toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  shiftWindow.textContent = getShiftWindow();
  renderCounts();
  renderTasks();
  renderIncidents();
  renderTimeline();
  renderHandoff();
}

navTabs.forEach((tab) => {
  tab.addEventListener("click", () => setActiveView(tab.dataset.view));
});

document.querySelector("#quickTaskButton").addEventListener("click", () => {
  setActiveView("tasks");
  taskForm.elements.title.focus();
});

document.querySelector("#exportButton").addEventListener("click", () => {
  const report = {
    exportedAt: new Date().toISOString(),
    shift: getShiftWindow(),
    ...state,
  };
  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `lineready-shift-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
});

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(taskForm);
  state.tasks.unshift({
    id: makeId(),
    title: data.get("title").trim(),
    zone: data.get("zone"),
    priority: data.get("priority"),
    done: false,
    createdAt: Date.now(),
  });
  taskForm.reset();
  saveState();
  render();
});

incidentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(incidentForm);
  state.incidents.unshift({
    id: makeId(),
    title: data.get("title").trim(),
    severity: data.get("severity"),
    owner: data.get("owner").trim(),
    createdAt: Date.now(),
  });
  incidentForm.reset();
  saveState();
  render();
});

handoffForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(handoffForm);
  state.handoff = {
    lead: data.get("lead").trim(),
    notes: data.get("notes").trim(),
    updatedAt: Date.now(),
  };
  saveState();
  render();
});

document.querySelectorAll(".zone").forEach((zone) => {
  zone.addEventListener("click", () => {
    setActiveView("tasks");
    taskForm.elements.zone.value = zone.dataset.zone;
    taskForm.elements.title.focus();
  });
});

render();
saveState();
