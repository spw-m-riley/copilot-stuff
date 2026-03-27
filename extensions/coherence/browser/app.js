const state = {
  tab: "overview",
  memoriesFilters: {
    type: "",
    scope: "",
    repository: "",
    canonicalKey: "",
    state: "active",
    page: 1,
    pageSize: 25,
  },
};

const views = {
  overview: document.getElementById("view-overview"),
  memories: document.getElementById("view-memories"),
  maintenance: document.getElementById("view-maintenance"),
  episodes: document.getElementById("view-episodes"),
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatTime(value) {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return `${date.toLocaleString()}`;
}

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${path}`);
  }
  return response.json();
}

function setStatus(text, ok = true) {
  const pill = document.getElementById("status-pill");
  pill.textContent = text;
  pill.style.color = ok ? "var(--ok)" : "var(--warn)";
}

function renderOverview(data) {
  const stats = data?.stats ?? {};
  const trend = data?.latencyTrend ?? {};
  const activityRows = Array.isArray(data?.activity) ? data.activity : [];
  const workstreams = Array.isArray(data?.activeWorkstreams) ? data.activeWorkstreams : [];
  const dueTasks = data?.maintenance?.dueTasks ?? [];

  views.overview.innerHTML = `
    <div class="grid">
      ${[
    ["Semantic memories", stats.semanticCount],
    ["Episode digests", stats.episodeCount],
    ["Day summaries", stats.daySummaryCount],
    ["Active workstreams", workstreams.length],
    ["Due maintenance tasks", dueTasks.length],
    ["Trace samples", stats.retrievalTraceSampleCount],
    ["Recent latency avg", `${trend.recentAverageMs ?? 0}ms`],
    ["Latency trend", trend.trend ?? "no_samples"],
  ].map(([label, value]) => `
        <article class="card">
          <h3>${escapeHtml(label)}</h3>
          <div class="metric">${escapeHtml(value)}</div>
        </article>
      `).join("")}
    </div>

    <h2>Last successful Coherence activity</h2>
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Scope</th>
            <th>Context injection</th>
            <th>Extraction</th>
            <th>Maintenance</th>
            <th>Trace</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          ${activityRows.map((row) => `
            <tr>
              <td>${escapeHtml(row.scopeKey)}</td>
              <td>${escapeHtml(formatTime(row.lastContextInjectionAt))}</td>
              <td>${escapeHtml(formatTime(row.lastExtractionCompletionAt))}</td>
              <td>${escapeHtml(formatTime(row.lastMaintenanceCompletionAt))}</td>
              <td>${escapeHtml(formatTime(row.lastTraceRecordedAt))}</td>
              <td>${escapeHtml(formatTime(row.updatedAt))}</td>
            </tr>
          `).join("") || '<tr><td colspan="6" class="row-muted">No activity rows</td></tr>'}
        </tbody>
      </table>
    </div>

    <h2>Active workstreams</h2>
    <div class="list">
      ${workstreams.map((ws) => `
        <article class="list-item">
          <div><strong>${escapeHtml(ws.title)}</strong> <span class="tag">${escapeHtml(ws.status)}</span></div>
          <div class="small">repo=${escapeHtml(ws.repository ?? "global")} · scope=${escapeHtml(ws.scope ?? "repo")} · updated=${escapeHtml(formatTime(ws.updatedAt))}</div>
          ${ws.mission ? `<div class="small">mission: ${escapeHtml(ws.mission)}</div>` : ""}
          ${ws.objective ? `<div class="small">objective: ${escapeHtml(ws.objective)}</div>` : ""}
          ${Array.isArray(ws.blockers) && ws.blockers.length > 0 ? `<div class="small">blockers: ${escapeHtml(ws.blockers.join(" | "))}</div>` : ""}
          ${Array.isArray(ws.nextActions) && ws.nextActions.length > 0 ? `<div class="small">next: ${escapeHtml(ws.nextActions.join(" | "))}</div>` : ""}
        </article>
      `).join("") || '<div class="row-muted">No active workstreams.</div>'}
    </div>
  `;
}

function renderMemoriesFilters(filterData) {
  const types = filterData?.types ?? [];
  const scopes = filterData?.scopes ?? [];
  const repos = filterData?.repositories ?? [];
  const canonicalKeys = filterData?.canonicalKeys ?? [];

  return `
    <div class="controls">
      <select id="mem-filter-type">
        <option value="">type: any</option>
        ${types.map((row) => `<option value="${escapeHtml(row.type)}">${escapeHtml(row.type)} (${row.count})</option>`).join("")}
      </select>

      <select id="mem-filter-scope">
        <option value="">scope: any</option>
        ${scopes.map((row) => `<option value="${escapeHtml(row.scope)}">${escapeHtml(row.scope)} (${row.count})</option>`).join("")}
      </select>

      <select id="mem-filter-repo">
        <option value="">repo: any</option>
        ${repos.map((row) => `<option value="${escapeHtml(row.repository)}">${escapeHtml(row.repository)} (${row.count})</option>`).join("")}
      </select>

      <select id="mem-filter-canonical">
        <option value="">canonical: any</option>
        ${canonicalKeys.map((row) => `<option value="${escapeHtml(row.canonicalKey)}">${escapeHtml(row.canonicalKey)} (${row.count})</option>`).join("")}
      </select>

      <select id="mem-filter-state">
        <option value="active">active only</option>
        <option value="superseded">superseded only</option>
        <option value="all">all</option>
      </select>

      <button id="mem-apply">Apply</button>
    </div>
  `;
}

function renderMemoriesTable(data) {
  const rows = data?.rows ?? [];
  return `
    <div class="small">total=${data?.total ?? 0} · page=${data?.page ?? 1} · pageSize=${data?.pageSize ?? 25}</div>
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>updated</th>
            <th>type</th>
            <th>scope</th>
            <th>repository</th>
            <th>canonical key</th>
            <th>state</th>
            <th>content</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td>${escapeHtml(formatTime(row.updatedAt))}</td>
              <td>${escapeHtml(row.type)}</td>
              <td>${escapeHtml(row.scope)}</td>
              <td>${escapeHtml(row.repository ?? "")}</td>
              <td>${escapeHtml(row.canonicalKey ?? "")}</td>
              <td>${row.supersededBy ? '<span class="tag warn">superseded</span>' : '<span class="tag ok">active</span>'}</td>
              <td>${escapeHtml(row.content)}</td>
            </tr>
          `).join("") || '<tr><td colspan="7" class="row-muted">No memories match filters.</td></tr>'}
        </tbody>
      </table>
    </div>
  `;
}

function applyMemoriesFilterControls() {
  const bind = (id, key) => {
    const element = document.getElementById(id);
    if (!element) {
      return;
    }
    if (state.memoriesFilters[key] !== undefined) {
      element.value = state.memoriesFilters[key] || "";
    }
  };
  bind("mem-filter-type", "type");
  bind("mem-filter-scope", "scope");
  bind("mem-filter-repo", "repository");
  bind("mem-filter-canonical", "canonicalKey");
  bind("mem-filter-state", "state");

  const button = document.getElementById("mem-apply");
  if (button) {
    button.onclick = async () => {
      state.memoriesFilters.type = document.getElementById("mem-filter-type")?.value || "";
      state.memoriesFilters.scope = document.getElementById("mem-filter-scope")?.value || "";
      state.memoriesFilters.repository = document.getElementById("mem-filter-repo")?.value || "";
      state.memoriesFilters.canonicalKey = document.getElementById("mem-filter-canonical")?.value || "";
      state.memoriesFilters.state = document.getElementById("mem-filter-state")?.value || "active";
      state.memoriesFilters.page = 1;
      await loadMemories();
    };
  }
}

async function loadMemories() {
  const [filtersResponse, memoriesResponse] = await Promise.all([
    fetchJson("/api/memories/filters"),
    fetchJson(`/api/memories?${new URLSearchParams(state.memoriesFilters).toString()}`),
  ]);
  views.memories.innerHTML = `${renderMemoriesFilters(filtersResponse.data)}${renderMemoriesTable(memoriesResponse.data)}`;
  applyMemoriesFilterControls();
}

function renderMaintenance(data) {
  const runs = data?.runs ?? [];
  const taskStates = data?.taskStates ?? [];
  const deferred = data?.deferred ?? [];
  const doctorReports = data?.doctorReports ?? [];
  const dueTasks = data?.maintenancePlan?.dueTasks ?? [];

  views.maintenance.innerHTML = `
    <h2>Due maintenance tasks</h2>
    <div class="list">
      ${dueTasks.map((task) => `
        <article class="list-item">
          <div><strong>${escapeHtml(task.label)}</strong> <span class="tag">${escapeHtml(task.dueReason)}</span></div>
          <div class="small">lastRunMinutesAgo=${escapeHtml(task.lastRunMinutesAgo ?? "n/a")} cadenceMinutes=${escapeHtml(task.cadenceMinutes)}</div>
        </article>
      `).join("") || '<div class="row-muted">No due tasks right now.</div>'}
    </div>

    <h2>Maintenance task state</h2>
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr><th>task</th><th>status</th><th>runs</th><th>failures</th><th>needs attention</th><th>completed</th></tr>
        </thead>
        <tbody>
          ${taskStates.map((row) => `
            <tr>
              <td>${escapeHtml(row.task_name)}</td>
              <td>${escapeHtml(row.last_status)}</td>
              <td>${escapeHtml(row.total_runs)}</td>
              <td>${escapeHtml(row.total_failures)}</td>
              <td>${escapeHtml(row.total_needs_attention)}</td>
              <td>${escapeHtml(formatTime(row.last_completed_at))}</td>
            </tr>
          `).join("") || '<tr><td colspan="6" class="row-muted">No task states.</td></tr>'}
        </tbody>
      </table>
    </div>

    <h2>Recent maintenance runs</h2>
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr><th>started</th><th>status</th><th>trigger</th><th>repository</th><th>completed</th><th>failed</th><th>needs attention</th></tr>
        </thead>
        <tbody>
          ${runs.map((run) => `
            <tr>
              <td>${escapeHtml(formatTime(run.started_at))}</td>
              <td>${escapeHtml(run.status)}</td>
              <td>${escapeHtml(run.trigger)}</td>
              <td>${escapeHtml(run.repository ?? "")}</td>
              <td>${escapeHtml(run.completed_count ?? 0)}</td>
              <td>${escapeHtml(run.failed_count ?? 0)}</td>
              <td>${escapeHtml(run.needs_attention_count ?? 0)}</td>
            </tr>
          `).join("") || '<tr><td colspan="7" class="row-muted">No maintenance runs.</td></tr>'}
        </tbody>
      </table>
    </div>

    <h2>Deferred extraction queue</h2>
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr><th>session</th><th>repo</th><th>status</th><th>priority</th><th>available</th><th>attempts</th><th>error</th></tr>
        </thead>
        <tbody>
          ${deferred.map((row) => `
            <tr>
              <td>${escapeHtml(row.sessionId)}</td>
              <td>${escapeHtml(row.repository ?? "")}</td>
              <td>${escapeHtml(row.status)}</td>
              <td>${escapeHtml(row.priority)}</td>
              <td>${escapeHtml(formatTime(row.availableAt))}</td>
              <td>${escapeHtml(row.attempts)}</td>
              <td>${escapeHtml(row.lastError ?? "")}</td>
            </tr>
          `).join("") || '<tr><td colspan="7" class="row-muted">No deferred items.</td></tr>'}
        </tbody>
      </table>
    </div>

    <h2>Doctor reports</h2>
    <div class="list">
      ${doctorReports.map((row) => `
        <article class="list-item">
          <div><strong>${escapeHtml(row.summary)}</strong></div>
          <div class="small">severity=${escapeHtml(row.severity)} · outcome=${escapeHtml(row.outcome)} · created=${escapeHtml(formatTime(row.created_at))}</div>
        </article>
      `).join("") || '<div class="row-muted">No doctor reports found.</div>'}
    </div>
  `;
}

function renderEpisodes(data) {
  const episodes = data?.episodes ?? [];
  const summaries = data?.daySummaries ?? [];

  views.episodes.innerHTML = `
    <h2>Recent episodes</h2>
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr><th>updated</th><th>date</th><th>repo</th><th>scope</th><th>summary</th><th>significance</th></tr>
        </thead>
        <tbody>
          ${episodes.map((row) => `
            <tr>
              <td>${escapeHtml(formatTime(row.updatedAt))}</td>
              <td>${escapeHtml(row.dateKey)}</td>
              <td>${escapeHtml(row.repository ?? "")}</td>
              <td>${escapeHtml(row.scope)}</td>
              <td>${escapeHtml(row.summary)}</td>
              <td>${escapeHtml(row.significance)}</td>
            </tr>
          `).join("") || '<tr><td colspan="6" class="row-muted">No episodes found.</td></tr>'}
        </tbody>
      </table>
    </div>

    <h2>Day summaries</h2>
    <div class="list">
      ${summaries.map((row) => `
        <article class="list-item">
          <div><strong>${escapeHtml(row.dateKey)}</strong> <span class="small">repo=${escapeHtml(row.repository || "global")}</span></div>
          <div>${escapeHtml(row.summary)}</div>
          <div class="small">computed=${escapeHtml(formatTime(row.computedAt))} · episodes=${escapeHtml(row.episodeIds.length)}</div>
        </article>
      `).join("") || '<div class="row-muted">No day summaries found.</div>'}
    </div>
  `;
}

async function refreshAll() {
  setStatus("loading…", true);
  try {
    const [overviewResponse, maintenanceResponse, episodesResponse] = await Promise.all([
      fetchJson("/api/overview"),
      fetchJson("/api/maintenance"),
      fetchJson("/api/episodes"),
    ]);
    renderOverview(overviewResponse.data);
    renderMaintenance(maintenanceResponse.data);
    renderEpisodes(episodesResponse.data);
    await loadMemories();
    setStatus("read-only local mode", true);
  } catch (error) {
    setStatus(`error: ${error.message}`, false);
    const message = `<p class="row-muted">${escapeHtml(error.message)}</p>`;
    Object.values(views).forEach((view) => {
      view.innerHTML = message;
    });
  }
}

function activateTab(tabName) {
  state.tab = tabName;
  document.querySelectorAll(".tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabName);
  });
  Object.entries(views).forEach(([name, element]) => {
    element.classList.toggle("active", name === tabName);
  });
}

document.getElementById("tabs").addEventListener("click", (event) => {
  const button = event.target.closest(".tab");
  if (!button) {
    return;
  }
  activateTab(button.dataset.tab);
});

refreshAll();
setInterval(() => {
  if (state.tab === "overview" || state.tab === "maintenance") {
    refreshAll();
  }
}, 15000);
