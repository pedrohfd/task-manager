document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "taskmanager.tasks";
  const THEME_STORAGE_KEY = "taskmanager.theme";

  const PRIORITY_LABELS = {
    baixa: "Baixa",
    media: "Média",
    alta: "Alta",
  };
  const PRIORITY_ORDER = { alta: 0, media: 1, baixa: 2 };

  const form = document.getElementById("task-form");
  const idInput = document.getElementById("task-id");
  const titleInput = document.getElementById("task-title");
  const categoryInput = document.getElementById("task-category");
  const priorityInput = document.getElementById("task-priority");
  const dueDateInput = document.getElementById("task-due-date");
  const submitBtn = document.getElementById("task-submit");
  const cancelEditBtn = document.getElementById("task-cancel-edit");
  const searchInput = document.getElementById("task-search");
  const filtersContainer = document.getElementById("task-filters");
  const taskList = document.getElementById("task-list");
  const emptyState = document.getElementById("empty-state");
  const themeToggleBtn = document.getElementById("theme-toggle");

  let tasks = loadTasks();
  let currentFilter = "todas";
  let currentSearch = "";

  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.error("Falha ao carregar tarefas do localStorage:", err);
      return [];
    }
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function getTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    themeToggleBtn.textContent = theme === "dark" ? "☀️" : "🌙";
  }

  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = savedTheme || (prefersDark ? "dark" : "light");
    themeToggleBtn.textContent = theme === "dark" ? "☀️" : "🌙";
    document.documentElement.setAttribute("data-theme", theme);
  }

  function generateId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function resetForm() {
    form.reset();
    idInput.value = "";
    priorityInput.value = "media";
    submitBtn.textContent = "Adicionar tarefa";
    cancelEditBtn.classList.add("hidden");
  }

  function addTask(data) {
    tasks.push({
      id: generateId(),
      title: data.title,
      category: data.category,
      priority: data.priority,
      dueDate: data.dueDate || null,
      done: false,
      createdAt: new Date().toISOString(),
    });
    saveTasks();
    render();
  }

  function editTask(id, data) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    task.title = data.title;
    task.category = data.category;
    task.priority = data.priority;
    task.dueDate = data.dueDate || null;
    saveTasks();
    render();
  }

  function toggleDone(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    task.done = !task.done;
    saveTasks();
    render();
  }

  function deleteTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    saveTasks();
    render();
  }

  function startEdit(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    idInput.value = task.id;
    titleInput.value = task.title;
    categoryInput.value = task.category || "";
    priorityInput.value = task.priority;
    dueDateInput.value = task.dueDate || "";
    submitBtn.textContent = "Salvar alterações";
    cancelEditBtn.classList.remove("hidden");
    titleInput.focus();
  }

  function getFilteredTasks() {
    return tasks
      .filter((task) => {
        if (currentFilter === "pendentes") return !task.done;
        if (currentFilter === "concluidas") return task.done;
        return true;
      })
      .filter((task) => {
        if (!currentSearch) return true;
        return task.title.toLowerCase().includes(currentSearch.toLowerCase());
      })
      .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  }

  function formatDate(isoDate) {
    if (!isoDate) return null;
    const [year, month, day] = isoDate.split("-");
    return `${day}/${month}/${year}`;
  }

  function createTaskElement(task) {
    const li = document.createElement("li");
    li.className = `task-item${task.done ? " done" : ""}`;
    li.dataset.id = task.id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = task.done;
    checkbox.setAttribute("aria-label", "Marcar tarefa como concluída");
    checkbox.addEventListener("change", () => toggleDone(task.id));

    const body = document.createElement("div");
    body.className = "task-body";

    const title = document.createElement("div");
    title.className = "task-title";
    title.textContent = task.title;
    body.appendChild(title);

    const meta = document.createElement("div");
    meta.className = "task-meta";

    const priorityBadge = document.createElement("span");
    priorityBadge.className = `badge badge-priority-${task.priority}`;
    priorityBadge.textContent = PRIORITY_LABELS[task.priority] || task.priority;
    meta.appendChild(priorityBadge);

    if (task.category) {
      const categoryBadge = document.createElement("span");
      categoryBadge.className = "badge";
      categoryBadge.textContent = task.category;
      meta.appendChild(categoryBadge);
    }

    if (task.dueDate) {
      const dueBadge = document.createElement("span");
      dueBadge.className = "badge";
      dueBadge.textContent = `Prazo: ${formatDate(task.dueDate)}`;
      meta.appendChild(dueBadge);
    }

    body.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "btn-edit";
    editBtn.textContent = "Editar";
    editBtn.addEventListener("click", () => startEdit(task.id));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn-delete";
    deleteBtn.textContent = "Excluir";
    deleteBtn.addEventListener("click", () => {
      if (confirm("Excluir esta tarefa?")) deleteTask(task.id);
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(body);
    li.appendChild(actions);

    return li;
  }

  function render() {
    const filtered = getFilteredTasks();
    taskList.innerHTML = "";
    filtered.forEach((task) => taskList.appendChild(createTaskElement(task)));
    emptyState.classList.toggle("hidden", filtered.length > 0);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = {
      title: titleInput.value.trim(),
      category: categoryInput.value.trim(),
      priority: priorityInput.value,
      dueDate: dueDateInput.value,
    };
    if (!data.title) return;

    const editingId = idInput.value;
    if (editingId) {
      editTask(editingId, data);
    } else {
      addTask(data);
    }
    resetForm();
  });

  cancelEditBtn.addEventListener("click", resetForm);

  searchInput.addEventListener("input", (event) => {
    currentSearch = event.target.value;
    render();
  });

  filtersContainer.addEventListener("click", (event) => {
    const btn = event.target.closest(".filter-btn");
    if (!btn) return;
    currentFilter = btn.dataset.filter;
    filtersContainer
      .querySelectorAll(".filter-btn")
      .forEach((b) => b.classList.toggle("active", b === btn));
    render();
  });

  themeToggleBtn.addEventListener("click", () => {
    applyTheme(getTheme() === "dark" ? "light" : "dark");
  });

  initTheme();
  render();
});
