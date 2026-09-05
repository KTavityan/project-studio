(() => {
  const STORE = "studio.v1";
  const JOB_ORDER = ["job1", "job2", "job3", "job4"];
  const VIBE = "make something cool for this";
  const KEYS = ["name", "exists", "audience", "mustNotInvent"];

  const JOBS = {
    job1: {
      index: "Job 1",
      title: "One artefact for {name}",
      moment:
        "Someone in {audience} has to judge {exists} for {name} in ten seconds. Produce one artefact they would actually look at.",
      ticks: [
        "Names who it is for",
        "States format (length, shape, what to return)",
        "Includes a hard constraint",
        "Forbids inventing {mustNotInvent}",
      ],
      kind: "card",
    },
    job2: {
      index: "Job 2",
      title: "Ten that do not clone, for {name}",
      moment:
        "They need ten variants for {exists} in {name} without looking like the same paragraph pasted ten times.",
      ticks: [
        "Asks for ten, not 'some'",
        "Demands variation along a named axis (tone, length, offer, objection)",
        "Forbids repeating the same opening",
        "Still forbids inventing {mustNotInvent}",
      ],
      kind: "list",
    },
    job3: {
      index: "Job 3",
      title: "Catch a lie in {name}",
      moment:
        "A draft for {name} invents {mustNotInvent}. Write a prompt that refuses when the fact is unknown.",
      lying: "A draft for {name} states, as fact, that {mustNotInvent}.",
      ticks: [
        "Says what source is allowed (only the prompt, or a pasted note)",
        "Says to refuse or mark unknown rather than guess",
        "Includes a test line that would tempt a lie",
        "Output labels invented vs grounded",
      ],
      kind: "card",
    },
    job4: {
      index: "Job 4",
      title: "Make it a machine for {name}",
      moment:
        "They will run this every week for {name}. Turn the winning prompt into a template with named slots written as {offer} and {constraint}. If a slot is empty, say what happens. Keep the refuse rule about {mustNotInvent}.",
      ticks: [
        "Uses placeholders, not one frozen example",
        "States default behaviour when a slot is empty",
        "Still includes the refuse rule",
        "Output stays in the same artefact shape as Job 1",
      ],
      kind: "card",
    },
  };

  const el = {
    intake: document.getElementById("intake"),
    studio: document.getElementById("studio"),
    form: document.getElementById("intake-form"),
    projectTitle: document.getElementById("project-title"),
    jobIndex: document.getElementById("job-index"),
    jobTitle: document.getElementById("job-title"),
    jobMoment: document.getElementById("job-moment"),
    lying: document.getElementById("lying-note"),
    ticks: document.getElementById("job-ticks"),
    prompt: document.getElementById("prompt"),
    versions: document.getElementById("versions"),
    run: document.getElementById("run-btn"),
    compare: document.getElementById("compare-btn"),
    status: document.getElementById("status"),
    miss: document.getElementById("miss"),
    artefacts: document.getElementById("artefacts"),
    pinPrompt: document.getElementById("pin-prompt"),
    pinPromptText: document.getElementById("pin-prompt-text"),
    badgeRow: document.getElementById("job3-badge"),
    ship: document.getElementById("ship-btn"),
    scrap: document.getElementById("scrap-btn"),
    scrapReason: document.getElementById("scrap-reason"),
    wallEmpty: document.getElementById("wall-empty"),
    wallList: document.getElementById("wall-list"),
    wallPane: document.getElementById("wall-pane"),
    wallToggle: document.getElementById("wall-toggle"),
    reset: document.getElementById("reset-btn"),
  };

  let state = emptyState();
  let viewingRunId = null;
  let compareOn = false;
  let viewingPinId = null;
  let inFlight = false;

  function emptyState() {
    return {
      project: null,
      currentJobId: "job1",
      drafts: { job1: "", job2: "", job3: "", job4: "" },
      runs: [],
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORE);
      if (!raw) return emptyState();
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return emptyState();
      return {
        project: parsed.project || null,
        currentJobId: JOB_ORDER.includes(parsed.currentJobId) ? parsed.currentJobId : "job1",
        drafts: {
          job1: parsed.drafts && typeof parsed.drafts.job1 === "string" ? parsed.drafts.job1 : "",
          job2: parsed.drafts && typeof parsed.drafts.job2 === "string" ? parsed.drafts.job2 : "",
          job3: parsed.drafts && typeof parsed.drafts.job3 === "string" ? parsed.drafts.job3 : "",
          job4: parsed.drafts && typeof parsed.drafts.job4 === "string" ? parsed.drafts.job4 : "",
        },
        runs: Array.isArray(parsed.runs) ? parsed.runs : [],
      };
    } catch (err) {
      return emptyState();
    }
  }

  function save() {
    localStorage.setItem(STORE, JSON.stringify(state));
  }

  function fill(template, project) {
    let out = template;
    KEYS.forEach((key) => {
      out = out.split("{" + key + "}").join(project[key] || "");
    });
    return out;
  }

  function jobN(id) {
    return Number(id.slice(3));
  }

  function isUnlocked(jobId) {
    const n = jobN(jobId);
    if (n === 1) return true;
    const prev = "job" + (n - 1);
    return state.runs.some((r) => r.jobId === prev && r.shipped);
  }

  function runsFor(jobId) {
    return state.runs
      .filter((r) => r.jobId === jobId)
      .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  }

  function shipped() {
    return state.runs
      .filter((r) => r.shipped)
      .sort((a, b) => String(b.shippedAt).localeCompare(String(a.shippedAt)));
  }

  function nextVersion(jobId) {
    const nums = runsFor(jobId).map((r) => r.version || 0);
    return (nums.length ? Math.max.apply(null, nums) : 0) + 1;
  }

  function setText(node, text) {
    node.textContent = text == null ? "" : String(text);
  }

  function show(node, on) {
    node.hidden = !on;
  }

  function latestRun(jobId) {
    const list = runsFor(jobId);
    return list.length ? list[list.length - 1] : null;
  }

  function previousRun(jobId) {
    const list = runsFor(jobId);
    return list.length >= 2 ? list[list.length - 2] : null;
  }

  function findRun(id) {
    return state.runs.find((r) => r.id === id) || null;
  }

  function missLine(prompt, project, jobId) {
    const p = prompt.toLowerCase();
    const audience = (project.audience || "").toLowerCase();
    if (audience && !p.includes(audience)) {
      return "You never named who this is for, so it wrote generic copy.";
    }
    if (!/\d/.test(prompt) && !/\breturn\b/i.test(prompt) && !/\bformat\b/i.test(prompt) && !/\bjson\b/i.test(prompt)) {
      return "You never said the format, so it guessed the shape.";
    }
    if (!/\bmust\b/i.test(prompt) && !/\bdo not\b/i.test(prompt) && !/\bnever\b/i.test(prompt) && !/\bonly\b/i.test(prompt)) {
      return "You never put a hard constraint, so it wandered.";
    }
    const sacred = project.mustNotInvent || "";
    if (sacred && !prompt.includes(sacred)) {
      return "You never forbade inventing " + sacred + ", so it was free to make it up.";
    }
    if (jobId) return "";
    return "";
  }

  function cardNode(item, label) {
    const wrap = document.createElement("article");
    wrap.className = "card";
    if (label) {
      const lab = document.createElement("div");
      lab.className = "label";
      lab.textContent = label;
      wrap.appendChild(lab);
    }
    const h = document.createElement("h3");
    h.textContent = item.title || "";
    const body = document.createElement("div");
    body.className = "body";
    body.textContent = item.body || "";
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = item.meta || "";
    wrap.appendChild(h);
    wrap.appendChild(body);
    wrap.appendChild(meta);
    return wrap;
  }

  function renderArtefact(run, label) {
    const kind = JOBS[run.jobId].kind;
    const parsed = run.json;
    if (kind === "list") {
      const list = document.createElement("div");
      list.className = "list";
      if (label) {
        const lab = document.createElement("div");
        lab.className = "label";
        lab.textContent = label;
        list.appendChild(lab);
      }
      const items = parsed && Array.isArray(parsed.items) ? parsed.items : fallbackList(run.output);
      items.forEach((item) => list.appendChild(cardNode(item)));
      return list;
    }
    const item = parsed && parsed.title != null ? parsed : { title: "", body: run.output || "", meta: "" };
    return cardNode(item, label);
  }

  function fallbackList(text) {
    const lines = String(text || "")
      .split("\n")
      .map((l) => l.replace(/^\s*\d+[\.)]\s*/, "").trim())
      .filter(Boolean);
    if (!lines.length) return [{ title: "", body: String(text || ""), meta: "" }];
    return lines.map((line, i) => ({ title: String(i + 1), body: line, meta: "" }));
  }

  function render() {
    if (!state.project) {
      el.intake.hidden = false;
      el.studio.hidden = true;
      return;
    }
    el.intake.hidden = true;
    el.studio.hidden = false;
    setText(el.projectTitle, state.project.name);

    document.querySelectorAll(".job-btn").forEach((btn) => {
      const id = btn.getAttribute("data-job");
      btn.disabled = !isUnlocked(id);
      btn.setAttribute("aria-current", id === state.currentJobId ? "true" : "false");
    });

    const job = JOBS[state.currentJobId];
    const project = state.project;
    setText(el.jobIndex, job.index);
    setText(el.jobTitle, fill(job.title, project));
    setText(el.jobMoment, fill(job.moment, project));
    if (job.lying) {
      show(el.lying, true);
      setText(el.lying, fill(job.lying, project));
    } else {
      show(el.lying, false);
    }
    el.ticks.replaceChildren();
    job.ticks.forEach((t) => {
      const li = document.createElement("li");
      li.textContent = fill(t, project);
      el.ticks.appendChild(li);
    });

    if (document.activeElement !== el.prompt) {
      el.prompt.value = state.drafts[state.currentJobId] || "";
    }

    const jobRuns = runsFor(state.currentJobId);
    el.versions.replaceChildren();
    jobRuns.forEach((run) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ver-btn";
      b.textContent = "v" + run.version;
      if (viewingRunId === run.id) b.setAttribute("aria-current", "true");
      b.addEventListener("click", () => {
        state.drafts[state.currentJobId] = run.prompt;
        save();
        el.prompt.value = run.prompt;
      });
      el.versions.appendChild(b);
    });

    const emptyEditor = !el.prompt.value.trim();
    el.run.disabled = inFlight || emptyEditor;

    const thisRun = viewingPinId ? findRun(viewingPinId) : latestRun(state.currentJobId);
    const lastRun = previousRun(state.currentJobId);
    el.compare.disabled = jobRuns.length < 2 || Boolean(viewingPinId);
    if (viewingPinId) compareOn = false;

    el.artefacts.replaceChildren();
    el.artefacts.classList.toggle("compare", compareOn && lastRun && thisRun && !viewingPinId);
    if ((thisRun && thisRun.jobId === state.currentJobId) || (viewingPinId && thisRun)) {
      if (compareOn && lastRun && !viewingPinId) {
        el.artefacts.appendChild(renderArtefact(lastRun, "Last"));
        el.artefacts.appendChild(renderArtefact(thisRun, "This"));
      } else if (thisRun) {
        el.artefacts.appendChild(renderArtefact(thisRun, viewingPinId ? "Shipped" : ""));
      }
    }

    if (viewingPinId && thisRun) {
      show(el.pinPrompt, true);
      setText(el.pinPromptText, thisRun.prompt);
    } else {
      show(el.pinPrompt, false);
    }

    const centreRun = !viewingPinId ? latestRun(state.currentJobId) : null;
    viewingRunId = centreRun ? centreRun.id : viewingRunId && viewingPinId ? viewingPinId : null;

    const isJob3 = state.currentJobId === "job3" && centreRun;
    show(el.badgeRow, Boolean(isJob3));
    if (isJob3) {
      document.querySelectorAll(".badge-btn").forEach((b) => {
        b.setAttribute("aria-pressed", centreRun.badge === b.getAttribute("data-badge") ? "true" : "false");
      });
    }

    const shippable = Boolean(centreRun) && canShipCentre(centreRun);
    el.ship.disabled = !shippable;
    el.scrap.disabled = !centreRun;
    el.scrapReason.disabled = !centreRun;

    const pins = shipped();
    el.wallToggle.textContent = "Wall (" + pins.length + ")";
    show(el.wallEmpty, pins.length === 0);
    el.wallList.replaceChildren();
    pins.forEach((run) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pin";
      const strong = document.createElement("strong");
      const title = run.json && run.json.title ? run.json.title : (run.json && run.json.items && run.json.items[0] && run.json.items[0].title) || jobLabel(run.jobId);
      strong.textContent = title;
      const span = document.createElement("span");
      span.textContent = jobLabel(run.jobId) + " · v" + run.version;
      btn.appendChild(strong);
      btn.appendChild(span);
      btn.addEventListener("click", () => {
        viewingPinId = run.id;
        compareOn = false;
        render();
      });
      li.appendChild(btn);
      el.wallList.appendChild(li);
    });
  }

  function canShipCentre(run) {
    if (!run || run.jobId !== state.currentJobId) return false;
    if (state.currentJobId === "job3" && !run.badge) return false;
    return true;
  }

  function jobLabel(id) {
    return JOBS[id] ? JOBS[id].index : id;
  }

  function setStatus(text) {
    if (!text) {
      show(el.status, false);
      return;
    }
    show(el.status, true);
    setText(el.status, text);
  }

  function setMiss(text) {
    if (!text) {
      show(el.miss, false);
      return;
    }
    show(el.miss, true);
    setText(el.miss, text);
  }

  el.form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const project = {
      name: document.getElementById("f-name").value.trim(),
      exists: document.getElementById("f-exists").value.trim(),
      audience: document.getElementById("f-audience").value.trim(),
      mustNotInvent: document.getElementById("f-must").value.trim(),
      createdAt: new Date().toISOString(),
    };
    if (!project.name || !project.exists || !project.audience || !project.mustNotInvent) return;
    state = emptyState();
    state.project = project;
    state.currentJobId = "job1";
    state.drafts.job1 = VIBE;
    save();
    viewingPinId = null;
    compareOn = false;
    render();
  });

  document.querySelectorAll(".job-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-job");
      if (!isUnlocked(id)) return;
      if (id === "job4" && !state.drafts.job4) {
        const shipped1 = state.runs.filter((r) => r.jobId === "job1" && r.shipped);
        if (shipped1.length) {
          const latest = shipped1.sort((a, b) => String(b.shippedAt).localeCompare(String(a.shippedAt)))[0];
          state.drafts.job4 = latest.prompt;
        }
      }
      state.currentJobId = id;
      viewingPinId = null;
      compareOn = false;
      save();
      render();
    });
  });

  el.prompt.addEventListener("input", () => {
    state.drafts[state.currentJobId] = el.prompt.value;
    save();
    el.run.disabled = inFlight || !el.prompt.value.trim();
  });

  el.compare.addEventListener("click", () => {
    compareOn = !compareOn;
    viewingPinId = null;
    render();
  });

  document.querySelectorAll(".badge-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const run = latestRun(state.currentJobId);
      if (!run || state.currentJobId !== "job3") return;
      run.badge = btn.getAttribute("data-badge");
      save();
      render();
    });
  });

  el.run.addEventListener("click", async () => {
    const prompt = el.prompt.value.trim();
    if (!prompt || inFlight) return;
    inFlight = true;
    viewingPinId = null;
    setStatus("Running…");
    setMiss("");
    el.run.disabled = true;
    try {
      const resp = await fetch("/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: state.currentJobId,
          prompt: prompt,
          project: state.project,
        }),
      });
      const data = await resp.json();
      if (!data || data.ok !== true) {
        const err = (data && data.error) || "upstream";
        const messages = {
          cap: "Session spend cap reached. No more runs until the proxy restarts.",
          upstream: "The model did not respond. Try Run again.",
          timeout: "That run timed out. Try Run again.",
          bad_request: "That run was rejected. Check the prompt and try again.",
        };
        setStatus(messages[err] || (data && data.message) || messages.upstream);
        return;
      }
      const version = nextVersion(state.currentJobId);
      const run = {
        id: state.currentJobId + "-v" + version + "-" + Date.now(),
        jobId: state.currentJobId,
        version: version,
        prompt: prompt,
        output: data.text || "",
        json: data.json || null,
        badge: data.json && data.json.badge ? data.json.badge : null,
        createdAt: new Date().toISOString(),
        shipped: false,
        shippedAt: null,
        scrapReason: null,
      };
      state.runs.push(run);
      save();
      setStatus("");
      setMiss(missLine(prompt, state.project, state.currentJobId));
      viewingRunId = run.id;
    } catch (err) {
      setStatus("The model did not respond. Try Run again.");
    } finally {
      inFlight = false;
      render();
    }
  });

  el.ship.addEventListener("click", () => {
    const run = latestRun(state.currentJobId);
    if (!canShipCentre(run)) return;
    run.shipped = true;
    run.shippedAt = new Date().toISOString();
    save();
    render();
  });

  el.scrap.addEventListener("click", () => {
    const run = latestRun(state.currentJobId);
    if (!run) return;
    const reason = el.scrapReason.value.trim();
    if (!reason) {
      setStatus("Say why you are scrapping it.");
      return;
    }
    run.scrapReason = reason;
    const prefix = "Constraint from scrap: " + reason + "\n";
    const current = state.drafts[state.currentJobId] || "";
    if (!current.startsWith(prefix)) {
      state.drafts[state.currentJobId] = prefix + current;
    }
    el.scrapReason.value = "";
    save();
    setStatus("");
    render();
  });

  el.reset.addEventListener("click", () => {
    if (!window.confirm("Clear this project and the wall?")) return;
    localStorage.removeItem(STORE);
    state = emptyState();
    viewingPinId = null;
    compareOn = false;
    el.form.reset();
    render();
  });

  el.wallToggle.addEventListener("click", () => {
    el.wallPane.classList.toggle("open");
  });

  state = load();
  if (state.project && state.currentJobId === "job1" && !state.drafts.job1 && !state.runs.length) {
    state.drafts.job1 = VIBE;
  }
  render();
})();
