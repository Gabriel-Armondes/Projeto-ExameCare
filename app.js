const STORAGE_KEY = "examecare.state.v1";
const SESSION_KEY = "examecare.session.v1";
const EXAM_TYPES = [
  "Hemograma completo",
  "Glicemia",
  "Raio-X",
  "Ultrassonografia",
  "Eletrocardiograma",
  "Tomografia",
  "Ressonância magnética",
  "Urina tipo 1",
  "Colesterol e triglicerídeos"
];
const MEDICAL_SPECIALTIES = [
  "Clínica médica",
  "Cardiologia",
  "Geriatria",
  "Endocrinologia",
  "Neurologia",
  "Ortopedia",
  "Nefrologia",
  "Pneumologia",
  "Oftalmologia"
];

const initialState = {
  users: [],
  patients: [],
  exams: [],
  audit: []
};

let state = loadState();
let session = loadSession();
let ui = {
  authMode: "login",
  tab: "agenda",
  selectedPatientId: null,
  examFilter: "Agendado",
  modal: null,
  toast: ""
};

const app = document.querySelector("#app");

function loadState() {
  try {
    return { ...initialState, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
  } catch {
    return structuredClone(initialState);
  }
}

function loadSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null;
  } catch {
    return null;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function saveSession() {
  if (session) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

function uid(prefix) {
  return `${prefix}_${crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysUntil(date) {
  const start = new Date(`${todayISO()}T00:00:00`);
  const end = new Date(`${date}T00:00:00`);
  return Math.round((end - start) / 86400000);
}

function isFutureDate(date) {
  return date > todayISO();
}

function formatDate(date) {
  if (!date) return "-";
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");
}

function getCurrentUser() {
  return state.users.find((user) => user.id === session?.userId) || null;
}

function getPatients() {
  return state.patients
    .filter((patient) => patient.userId === session?.userId)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

function getSelectedPatient() {
  const patients = getPatients();
  if (!ui.selectedPatientId && patients.length) {
    ui.selectedPatientId = patients[0].id;
  }
  return patients.find((patient) => patient.id === ui.selectedPatientId) || null;
}

function getPatientExams(patientId) {
  return state.exams.filter((exam) => exam.userId === session?.userId && exam.patientId === patientId);
}

function audit(action, examId = null) {
  state.audit.push({
    id: uid("log"),
    userId: session?.userId,
    action,
    examId,
    createdAt: new Date().toISOString()
  });
}

function toast(message) {
  ui.toast = message;
  render();
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => {
    ui.toast = "";
    render();
  }, 3200);
}

function render() {
  document.body.classList.toggle("high-contrast", Boolean(getCurrentUser()?.highContrast));
  app.innerHTML = session && getCurrentUser() ? dashboardTemplate() : authTemplate();
  bindEvents();
}

function authTemplate() {
  return `
    <main class="auth-layout">
      <section class="brand-panel" aria-label="Apresentação do ExameCare">
        <div class="brand-name">ExameCare</div>
        <div>
          <h1>Cuidado médico organizado para quem cuida.</h1>
          <p>Cadastre idosos, agende exames, acompanhe o histórico e veja lembretes antes que a rotina aperte.</p>
        </div>
      </section>
      <section class="auth-panel">
        <div class="auth-card">
          <div class="auth-tabs" role="tablist" aria-label="Acesso">
            ${authTab("login", "Entrar")}
            ${authTab("register", "Cadastro")}
            ${authTab("recover", "Senha")}
          </div>
          <div style="height: 22px"></div>
          ${ui.authMode === "login" ? loginTemplate() : ""}
          ${ui.authMode === "register" ? registerTemplate() : ""}
          ${ui.authMode === "recover" ? recoverTemplate() : ""}
        </div>
      </section>
    </main>
    ${toastTemplate()}
  `;
}

function authTab(mode, label) {
  return `<button type="button" data-auth-mode="${mode}" class="${ui.authMode === mode ? "active" : ""}" role="tab">${label}</button>`;
}

function loginTemplate() {
  return `
    <form id="loginForm" class="form-grid">
      <div>
        <span class="eyebrow">Área do familiar</span>
        <h2>Entrar no ExameCare</h2>
        <p class="muted">Use sua conta para acessar os dados protegidos deste navegador.</p>
      </div>
      <div class="field">
        <label for="loginEmail">E-mail</label>
        <input id="loginEmail" name="email" type="email" autocomplete="email" required />
      </div>
      <div class="field">
        <label for="loginPassword">Senha</label>
        <input id="loginPassword" name="password" type="password" autocomplete="current-password" required />
      </div>
      <button class="primary-btn" type="submit">Entrar</button>
      <button class="link-btn" type="button" data-auth-mode="recover">Esqueci minha senha</button>
    </form>
  `;
}

function registerTemplate() {
  return `
    <form id="registerForm" class="form-grid">
      <div>
        <span class="eyebrow">Novo responsável</span>
        <h2>Criar conta</h2>
        <p class="muted">A senha precisa ter pelo menos 8 caracteres.</p>
      </div>
      <div class="field">
        <label for="registerName">Nome completo</label>
        <input id="registerName" name="name" required />
      </div>
      <div class="field">
        <label for="registerEmail">E-mail</label>
        <input id="registerEmail" name="email" type="email" autocomplete="email" required />
      </div>
      <div class="two-cols form-grid">
        <div class="field">
          <label for="registerPassword">Senha</label>
          <input id="registerPassword" name="password" type="password" autocomplete="new-password" required minlength="8" />
        </div>
        <div class="field">
          <label for="confirmPassword">Confirmar senha</label>
          <input id="confirmPassword" name="confirmPassword" type="password" autocomplete="new-password" required minlength="8" />
        </div>
      </div>
      <label class="checkbox-row">
        <input name="consent" type="checkbox" required />
        <span>Autorizo o armazenamento local dos dados de saúde cadastrados neste protótipo.</span>
      </label>
      <button class="primary-btn" type="submit">Criar conta</button>
    </form>
  `;
}

function recoverTemplate() {
  return `
    <form id="recoverForm" class="form-grid">
      <div>
        <span class="eyebrow">Recuperação</span>
        <h2>Redefinir senha</h2>
        <p class="muted">Neste MVP, a recuperação é simulada por mensagem neutra de segurança.</p>
      </div>
      <div class="field">
        <label for="recoverEmail">E-mail</label>
        <input id="recoverEmail" name="email" type="email" required />
      </div>
      <button class="primary-btn" type="submit">Solicitar recuperação</button>
    </form>
  `;
}

function dashboardTemplate() {
  const user = getCurrentUser();
  const patients = getPatients();
  const selectedPatient = getSelectedPatient();
  const reminders = getReminders();
  const stats = getStats();

  return `
    <div class="dashboard">
      <header class="topbar">
        <div class="topbar-inner">
          <div class="user-block">
            <div class="avatar" aria-hidden="true">${user.name.slice(0, 1).toUpperCase()}</div>
            <div>
              <strong>ExameCare</strong>
              <div class="muted">${escapeHTML(user.name)}</div>
            </div>
          </div>
          <div class="patient-actions">
            <button class="secondary-btn" type="button" id="contrastBtn">${user.highContrast ? "Contraste padrão" : "Alto contraste"}</button>
            <button class="ghost-btn" type="button" id="logoutBtn">Sair</button>
          </div>
        </div>
      </header>

      <main class="main">
        <section class="hero-strip">
          <div class="hero-copy">
            <span class="eyebrow">MVP familiar</span>
            <h1>Agenda e histórico de exames em um só lugar.</h1>
            <p class="muted">Selecione um idoso, registre exames futuros e mantenha o histórico confiável depois da realização.</p>
          </div>
          <div class="stats-grid" aria-label="Resumo">
            <div class="stat-card"><strong>${stats.patients}</strong><span class="muted">idosos</span></div>
            <div class="stat-card"><strong>${stats.upcoming}</strong><span class="muted">agendados</span></div>
            <div class="stat-card"><strong>${stats.done}</strong><span class="muted">realizados</span></div>
          </div>
        </section>

        ${reminders.length ? `<div class="notice"><strong>Lembretes:</strong> ${reminders.map(escapeHTML).join(" ")}</div>` : ""}

        <section class="content-grid">
          <aside class="panel">
            <div class="panel-header">
              <h2>Idosos</h2>
              <button class="icon-btn" type="button" id="addPatientBtn" title="Adicionar idoso">+</button>
            </div>
            <div class="patient-list">
              ${patients.length ? patients.map(patientCardTemplate).join("") : emptyTemplate("Cadastre o primeiro idoso para começar a agenda.")}
            </div>
          </aside>

          <section class="panel">
            ${selectedPatient ? patientWorkspaceTemplate(selectedPatient) : emptyTemplate("Nenhum idoso selecionado.")}
          </section>
        </section>
      </main>
    </div>
    ${modalTemplate()}
    ${toastTemplate()}
  `;
}

function patientCardTemplate(patient) {
  const exams = getPatientExams(patient.id);
  const active = patient.id === ui.selectedPatientId ? "active" : "";
  return `
    <button class="patient-card ${active}" type="button" data-select-patient="${patient.id}">
      <strong>${escapeHTML(patient.name)}</strong>
      <span class="muted">${formatDate(patient.birthDate)} · ${exams.length} exame(s)</span>
    </button>
  `;
}

function patientWorkspaceTemplate(patient) {
  const exams = getPatientExams(patient.id);
  const filtered = exams
    .filter((exam) => ui.examFilter === "Todos" || exam.status === ui.examFilter)
    .sort((a, b) => {
      const dir = ui.examFilter === "Realizado" ? -1 : 1;
      return a.date.localeCompare(b.date) * dir;
    });

  return `
    <div class="panel-header">
      <div>
        <h2>${escapeHTML(patient.name)}</h2>
        <p class="muted">Nascimento: ${formatDate(patient.birthDate)} ${patient.cpf ? `· CPF: ${escapeHTML(patient.cpf)}` : ""}</p>
      </div>
      <div class="patient-actions">
        <button class="secondary-btn" type="button" data-edit-patient="${patient.id}">Editar</button>
        <button class="danger-btn" type="button" data-delete-patient="${patient.id}">Excluir</button>
      </div>
    </div>

    <div class="tabs" role="tablist" aria-label="Visualização de exames">
      ${filterButton("Agendado", "Agenda")}
      ${filterButton("Realizado", "Histórico")}
      ${filterButton("Cancelado", "Cancelados")}
      ${filterButton("Todos", "Todos")}
    </div>

    <div class="toolbar">
      <p class="muted">${filtered.length} registro(s) encontrados</p>
      <button class="primary-btn" type="button" id="addExamBtn">Agendar exame</button>
    </div>

    <div class="exam-list">
      ${filtered.length ? filtered.map(examCardTemplate).join("") : emptyTemplate("Nenhum exame para esta visualização.")}
    </div>
  `;
}

function filterButton(filter, label) {
  return `<button type="button" data-filter="${filter}" class="${ui.examFilter === filter ? "active" : ""}" role="tab">${label}</button>`;
}

function examCardTemplate(exam) {
  const isEditable = exam.status === "Agendado" && isFutureDate(exam.date);
  const canCancel = exam.status === "Agendado" && isFutureDate(exam.date);
  const canComplete = exam.status === "Agendado";
  return `
    <article class="exam-card">
      <div class="exam-top">
        <div class="exam-title">
          <strong>${escapeHTML(exam.type)}</strong>
          <span class="muted">${escapeHTML(exam.specialty || "Especialidade não informada")}</span>
        </div>
        <span class="status ${exam.status.toLowerCase()}">${exam.status}</span>
      </div>
      <div class="meta-grid">
        <div class="meta-item"><span>Data</span>${formatDate(exam.date)}</div>
        <div class="meta-item"><span>Horário</span>${escapeHTML(exam.time || "Não informado")}</div>
        <div class="meta-item"><span>Local</span>${escapeHTML(exam.location)}</div>
        <div class="meta-item"><span>Observações</span>${escapeHTML(exam.notes || "Sem observações")}</div>
      </div>
      <div class="exam-actions">
        <button class="secondary-btn" type="button" data-edit-exam="${exam.id}" ${isEditable ? "" : "disabled"}>Editar</button>
        <button class="secondary-btn" type="button" data-complete-exam="${exam.id}" ${canComplete ? "" : "disabled"}>Realizado</button>
        <button class="danger-btn" type="button" data-cancel-exam="${exam.id}" ${canCancel ? "" : "disabled"}>Cancelar</button>
      </div>
      ${exam.status === "Agendado" && !isFutureDate(exam.date) ? `<p class="danger-text">Data vencida: confirme a realização para mover ao histórico.</p>` : ""}
    </article>
  `;
}

function emptyTemplate(message) {
  return `<div class="empty">${message}</div>`;
}

function modalTemplate() {
  if (!ui.modal) return "";
  const modal = ui.modal;
  const title = modal.type === "patient" ? (modal.id ? "Editar idoso" : "Adicionar idoso") : (modal.id ? "Editar exame" : "Agendar exame");

  return `
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="${title}">
      <div class="modal">
        <div class="modal-header">
          <h2>${title}</h2>
          <button class="icon-btn" type="button" id="closeModalBtn" title="Fechar">×</button>
        </div>
        ${modal.type === "patient" ? patientFormTemplate(modal) : examFormTemplate(modal)}
      </div>
    </div>
  `;
}

function patientFormTemplate(modal) {
  const patient = modal.id ? state.patients.find((item) => item.id === modal.id) : {};
  return `
    <form id="patientForm" class="form-grid">
      <input type="hidden" name="id" value="${patient?.id || ""}" />
      <div class="field">
        <label for="patientName">Nome completo</label>
        <input id="patientName" name="name" value="${escapeAttr(patient?.name || "")}" required />
      </div>
      <div class="two-cols form-grid">
        <div class="field">
          <label for="birthDate">Data de nascimento</label>
          <input id="birthDate" name="birthDate" type="date" value="${patient?.birthDate || ""}" required />
        </div>
        <div class="field">
          <label for="cpf">CPF</label>
          <input id="cpf" name="cpf" value="${escapeAttr(patient?.cpf || "")}" />
        </div>
      </div>
      <button class="primary-btn" type="submit">Salvar idoso</button>
    </form>
  `;
}

function examFormTemplate(modal) {
  const exam = modal.id ? state.exams.find((item) => item.id === modal.id) : {};
  return `
    <form id="examForm" class="form-grid">
      <input type="hidden" name="id" value="${exam?.id || ""}" />
      <div class="two-cols form-grid">
        <div class="field">
          <label for="examDate">Data do exame</label>
          <input id="examDate" name="date" type="date" min="${addDaysISO(1)}" value="${exam?.date || ""}" required />
        </div>
        <div class="field">
          <label for="examTime">Horário</label>
          <input id="examTime" name="time" type="time" value="${exam?.time || ""}" />
        </div>
      </div>
      <div class="two-cols form-grid">
        <div class="field">
          <label for="examType">Tipo de exame</label>
          <select id="examType" name="type" required>
            <option value="">Selecione</option>
            ${optionList(EXAM_TYPES, exam?.type)}
          </select>
        </div>
        <div class="field">
          <label for="examSpecialty">Especialidade médica</label>
          <select id="examSpecialty" name="specialty" required>
            <option value="">Selecione</option>
            ${optionList(MEDICAL_SPECIALTIES, exam?.specialty)}
          </select>
        </div>
      </div>
      <div class="field">
        <label for="examLocation">Local</label>
        <input id="examLocation" name="location" value="${escapeAttr(exam?.location || "")}" required />
      </div>
      <div class="field">
        <label for="examNotes">Observações</label>
        <textarea id="examNotes" name="notes">${escapeHTML(exam?.notes || "")}</textarea>
      </div>
      <button class="primary-btn" type="submit">Salvar exame</button>
    </form>
  `;
}

function toastTemplate() {
  return ui.toast ? `<div class="toast" role="status">${escapeHTML(ui.toast)}</div>` : "";
}

function getStats() {
  const patients = getPatients();
  const exams = state.exams.filter((exam) => exam.userId === session?.userId);
  return {
    patients: patients.length,
    upcoming: exams.filter((exam) => exam.status === "Agendado").length,
    done: exams.filter((exam) => exam.status === "Realizado").length
  };
}

function getReminders() {
  const exams = state.exams.filter((exam) => exam.userId === session?.userId && exam.status === "Agendado");
  return exams
    .map((exam) => ({ ...exam, remainingDays: daysUntil(exam.date) }))
    .filter((exam) => exam.remainingDays === 5 || exam.remainingDays === 1)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((exam) => {
      const patient = state.patients.find((item) => item.id === exam.patientId);
      const when = exam.remainingDays === 1 ? "amanhã" : "em 5 dias";
      return `Simulação de e-mail: ${exam.type} de ${patient?.name || "idoso"} é ${when}, em ${exam.location}.`;
    });
}

function bindEvents() {
  document.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      ui.authMode = button.dataset.authMode;
      render();
    });
  });

  document.querySelector("#registerForm")?.addEventListener("submit", handleRegister);
  document.querySelector("#loginForm")?.addEventListener("submit", handleLogin);
  document.querySelector("#recoverForm")?.addEventListener("submit", handleRecover);
  document.querySelector("#logoutBtn")?.addEventListener("click", handleLogout);
  document.querySelector("#contrastBtn")?.addEventListener("click", toggleContrast);

  document.querySelectorAll("[data-select-patient]").forEach((button) => {
    button.addEventListener("click", () => {
      ui.selectedPatientId = button.dataset.selectPatient;
      render();
    });
  });

  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      ui.examFilter = button.dataset.filter;
      render();
    });
  });

  document.querySelector("#addPatientBtn")?.addEventListener("click", () => openPatientModal());
  document.querySelectorAll("[data-edit-patient]").forEach((button) => {
    button.addEventListener("click", () => openPatientModal(button.dataset.editPatient));
  });
  document.querySelectorAll("[data-delete-patient]").forEach((button) => {
    button.addEventListener("click", () => deletePatient(button.dataset.deletePatient));
  });

  document.querySelector("#addExamBtn")?.addEventListener("click", () => openExamModal());
  document.querySelectorAll("[data-edit-exam]").forEach((button) => {
    button.addEventListener("click", () => openExamModal(button.dataset.editExam));
  });
  document.querySelectorAll("[data-cancel-exam]").forEach((button) => {
    button.addEventListener("click", () => cancelExam(button.dataset.cancelExam));
  });
  document.querySelectorAll("[data-complete-exam]").forEach((button) => {
    button.addEventListener("click", () => completeExam(button.dataset.completeExam));
  });

  document.querySelector("#closeModalBtn")?.addEventListener("click", closeModal);
  document.querySelector("#patientForm")?.addEventListener("submit", handlePatientSave);
  document.querySelector("#examForm")?.addEventListener("submit", handleExamSave);
}

function handleRegister(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const email = data.email.trim().toLowerCase();

  if (state.users.some((user) => user.email === email)) {
    toast("Este e-mail já está em uso.");
    return;
  }

  if (data.password.length < 8) {
    toast("A senha deve ter pelo menos 8 caracteres.");
    return;
  }

  if (data.password !== data.confirmPassword) {
    toast("As senhas não coincidem.");
    return;
  }

  const user = {
    id: uid("user"),
    name: data.name.trim(),
    email,
    password: data.password,
    consentAt: new Date().toISOString(),
    highContrast: false,
    failedLogins: 0,
    lockedUntil: null
  };

  state.users.push(user);
  session = { userId: user.id };
  saveState();
  saveSession();
  toast("Conta criada com sucesso.");
  render();
}

function handleLogin(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const email = data.email.trim().toLowerCase();
  const user = state.users.find((item) => item.email === email);

  if (user?.lockedUntil && Date.now() < user.lockedUntil) {
    toast("Acesso bloqueado temporariamente. Tente novamente em alguns minutos.");
    return;
  }

  if (!user || user.password !== data.password) {
    if (user) {
      user.failedLogins = (user.failedLogins || 0) + 1;
      if (user.failedLogins >= 5) {
        user.lockedUntil = Date.now() + 5 * 60 * 1000;
        user.failedLogins = 0;
      }
      saveState();
    }
    toast("E-mail ou senha inválidos.");
    return;
  }

  user.failedLogins = 0;
  user.lockedUntil = null;
  session = { userId: user.id };
  saveState();
  saveSession();
  toast("Login realizado.");
  render();
}

function handleRecover(event) {
  event.preventDefault();
  toast("Se o e-mail existir, enviaremos instruções de recuperação.");
  ui.authMode = "login";
  render();
}

function handleLogout() {
  session = null;
  ui.selectedPatientId = null;
  saveSession();
  render();
}

function toggleContrast() {
  const user = getCurrentUser();
  user.highContrast = !user.highContrast;
  saveState();
  render();
}

function openPatientModal(id = null) {
  ui.modal = { type: "patient", id };
  render();
}

function openExamModal(id = null) {
  const selectedPatient = getSelectedPatient();
  if (!selectedPatient) {
    toast("Cadastre um idoso antes de agendar exames.");
    return;
  }
  ui.modal = { type: "exam", id };
  render();
}

function closeModal() {
  ui.modal = null;
  render();
}

function handlePatientSave(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const id = data.id || uid("patient");
  const payload = {
    id,
    userId: session.userId,
    name: data.name.trim(),
    birthDate: data.birthDate,
    cpf: data.cpf.trim()
  };

  if (!payload.name || !payload.birthDate) {
    toast("Nome e data de nascimento são obrigatórios.");
    return;
  }

  const index = state.patients.findIndex((patient) => patient.id === id);
  if (index >= 0) {
    state.patients[index] = payload;
  } else {
    state.patients.push(payload);
  }

  ui.selectedPatientId = id;
  ui.modal = null;
  saveState();
  toast("Idoso salvo.");
  render();
}

function deletePatient(id) {
  const exams = state.exams.filter((exam) => exam.patientId === id);
  const message = exams.length
    ? "Excluir este idoso também removerá seus exames neste protótipo. Confirmar?"
    : "Excluir este idoso?";

  if (!window.confirm(message)) return;

  state.patients = state.patients.filter((patient) => patient.id !== id);
  state.exams = state.exams.filter((exam) => exam.patientId !== id);
  ui.selectedPatientId = getPatients()[0]?.id || null;
  saveState();
  toast("Idoso excluído.");
  render();
}

function handleExamSave(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const selectedPatient = getSelectedPatient();
  const id = data.id || uid("exam");
  const existing = state.exams.find((exam) => exam.id === id);

  if (existing && existing.status !== "Agendado") {
    toast("Exames realizados ou cancelados não podem ser editados.");
    return;
  }

  if (!data.date || !data.type || !data.specialty || !data.location.trim()) {
    toast("Data, tipo de exame, especialidade e local são obrigatórios.");
    return;
  }

  if (!isFutureDate(data.date)) {
    toast("A data do exame deve ser futura.");
    return;
  }

  const payload = {
    id,
    userId: session.userId,
    patientId: selectedPatient.id,
    date: data.date,
    time: data.time,
    type: data.type,
    specialty: data.specialty,
    location: data.location.trim(),
    notes: data.notes.trim(),
    status: "Agendado",
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const index = state.exams.findIndex((exam) => exam.id === id);
  if (index >= 0) {
    state.exams[index] = payload;
    audit("EXAM_UPDATED", id);
  } else {
    state.exams.push(payload);
    audit("EXAM_CREATED", id);
  }

  ui.modal = null;
  ui.examFilter = "Agendado";
  saveState();
  toast("Exame salvo.");
  render();
}

function cancelExam(id) {
  const exam = state.exams.find((item) => item.id === id);
  if (!exam || exam.status !== "Agendado" || !isFutureDate(exam.date)) {
    toast("Só é possível cancelar exames agendados com data futura.");
    return;
  }

  if (!window.confirm("Confirmar cancelamento do exame?")) return;
  exam.status = "Cancelado";
  exam.updatedAt = new Date().toISOString();
  audit("EXAM_CANCELLED", id);
  saveState();
  toast("Exame cancelado.");
  render();
}

function completeExam(id) {
  const exam = state.exams.find((item) => item.id === id);
  if (!exam || exam.status !== "Agendado") {
    toast("Este exame não pode ser marcado como realizado.");
    return;
  }

  if (!window.confirm("Confirmar realização do exame? Esta ação não pode ser desfeita.")) return;
  exam.status = "Realizado";
  exam.updatedAt = new Date().toISOString();
  audit("EXAM_COMPLETED", id);
  ui.examFilter = "Realizado";
  saveState();
  toast("Exame movido para o histórico.");
  render();
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHTML(value);
}

function optionList(options, selectedValue = "") {
  return options
    .map((option) => `<option value="${escapeAttr(option)}" ${option === selectedValue ? "selected" : ""}>${escapeHTML(option)}</option>`)
    .join("");
}

render();
