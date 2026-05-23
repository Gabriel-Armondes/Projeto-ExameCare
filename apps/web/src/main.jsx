import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  FileUp,
  HeartPulse,
  LogOut,
  Mail,
  Palette,
  Plus,
  Save,
  Stethoscope,
  ShieldCheck,
  UserRound
} from "lucide-react";
import "./styles.css";

const today = new Date().toISOString().slice(0, 10);
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function isSoon(date) {
  if (!date) return false;
  const start = new Date(`${today}T00:00:00`);
  const end = new Date(`${date}T00:00:00`);
  const remainingDays = Math.ceil((end - start) / 86400000);
  return remainingDays >= 0 && remainingDays <= 7;
}

const seed = {
  user: {
    name: "Marina Almeida",
    email: "marina@examecare.com",
    phone: "(11) 99999-0000",
    city: "Sao Paulo",
    theme: "ocean",
    accentColor: "#176b5b",
    fontScale: 1,
    notificationChannel: "push",
    avatarUrl: ""
  },
  patients: [
    {
      id: "p1",
      name: "Dona Helena",
      birthDate: "1946-08-12",
      cpf: "000.000.000-00",
      allergies: "Dipirona",
      notes: "Prefere consultas pela manha.",
      photoUrl: "https://st2.depositphotos.com/1003556/5860/i/950/depositphotos_58600111-stock-photo-portrait-of-an-old-elderly.jpg"
    }
  ],
  exams: [
    {
      id: "e1",
      patientId: "p1",
      date: "2026-06-04",
      time: "09:30",
      type: "Hemograma completo",
      specialty: "Geriatria",
      location: "Laboratorio Central",
      status: "Agendado",
      notes: "Jejum de 8 horas.",
      resultTitle: "",
      resultNotes: ""
    }
  ],
  consultations: [
    {
      id: "c1",
      patientId: "p1",
      doctor: "Dra. Camila Rocha",
      specialty: "Cardiologia",
      date: "2026-06-12",
      time: "14:00",
      mode: "Presencial",
      location: "Clinica Vida",
      reason: "Retorno com exames",
      status: "Agendada",
      notes: ""
    }
  ]
};

function App() {
  const initialResetToken = new URLSearchParams(window.location.search).get("resetToken") || "";
  const [data, setData] = useState(() => JSON.parse(localStorage.getItem("examecare.react")) || seed);
  const [session, setSession] = useState(() => JSON.parse(localStorage.getItem("examecare.session")) || null);
  const [patientId, setPatientId] = useState(data.patients[0]?.id || "");
  const [tab, setTab] = useState("exames");
  const [modal, setModal] = useState(null);
  const [authMode, setAuthMode] = useState(initialResetToken ? "reset" : "login");
  const [authMessage, setAuthMessage] = useState("");
  const [resetToken] = useState(initialResetToken);

  const patient = data.patients.find((item) => item.id === patientId) || data.patients[0];
  const patientExams = data.exams.filter((exam) => exam.patientId === patient?.id);
  const patientConsultations = data.consultations.filter((consultation) => consultation.patientId === patient?.id);
  const themeClass = `theme-${data.user.theme}`;

  function persist(next) {
    setData(next);
    localStorage.setItem("examecare.react", JSON.stringify(next));
  }

  function saveSession(nextSession) {
    setSession(nextSession);
    if (nextSession) {
      localStorage.setItem("examecare.session", JSON.stringify(nextSession));
    } else {
      localStorage.removeItem("examecare.session");
    }
  }

  async function requestAuth(path, payload) {
    let response;
    try {
      response = await fetch(`${API_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch {
      throw new Error("Nao foi possivel conectar com a API. Confirme se npm run dev esta rodando e recarregue a pagina.");
    }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || "Nao foi possivel concluir a autenticacao.");
    return body;
  }

  async function requestApi(path, payload) {
    if (!session?.accessToken) throw new Error("Entre novamente para ativar notificacoes.");
    const response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`
      },
      body: JSON.stringify(payload)
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || "Nao foi possivel concluir a acao.");
    return body;
  }

  async function handleLogin(event) {
    event.preventDefault();
    setAuthMessage("");
    const form = Object.fromEntries(new FormData(event.currentTarget));

    try {
      const result = await requestAuth("/auth/login", form);
      saveSession({ accessToken: result.accessToken, user: result.user, source: "api" });
      persist({ ...data, user: { ...data.user, ...result.user } });
    } catch (error) {
      setAuthMessage(error.message);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setAuthMessage("");
    const form = Object.fromEntries(new FormData(event.currentTarget));

    if (form.password !== form.confirmPassword) {
      setAuthMessage("As senhas nao coincidem.");
      return;
    }

    try {
      const result = await requestAuth("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        consent: Boolean(form.consent)
      });
      saveSession({ accessToken: result.accessToken, user: result.user, source: "api" });
      persist({ ...data, user: { ...data.user, ...result.user } });
    } catch (error) {
      setAuthMessage(error.message);
    }
  }

  async function handleRecover(event) {
    event.preventDefault();
    setAuthMessage("");
    const form = Object.fromEntries(new FormData(event.currentTarget));

    try {
      const result = await requestAuth("/auth/forgot-password", form);
      setAuthMode("login");
      setAuthMessage(result.message);
    } catch (error) {
      setAuthMessage(error.message);
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault();
    setAuthMessage("");
    const form = Object.fromEntries(new FormData(event.currentTarget));

    if (form.password !== form.confirmPassword) {
      setAuthMessage("As senhas nao coincidem.");
      return;
    }

    try {
      const result = await requestAuth("/auth/reset-password", { token: form.token, password: form.password });
      window.history.replaceState({}, "", window.location.pathname);
      setAuthMode("login");
      setAuthMessage(result.message);
    } catch (error) {
      setAuthMessage(error.message);
    }
  }

  const stats = useMemo(() => {
    const selectedExams = data.exams.filter((exam) => exam.patientId === patient?.id);
    const selectedConsultations = data.consultations.filter((consultation) => consultation.patientId === patient?.id);
    const examAlerts = selectedExams.filter((exam) => exam.status === "Agendado" && isSoon(exam.date)).length;
    const consultationAlerts = selectedConsultations.filter((consultation) => consultation.status === "Agendada" && isSoon(consultation.date)).length;
    const resultAlerts = selectedExams.filter((exam) => exam.status === "Realizado" && !exam.resultTitle).length;

    return {
      scheduled: selectedExams.filter((exam) => exam.status === "Agendado").length,
      results: selectedExams.filter((exam) => exam.resultTitle).length,
      consultations: selectedConsultations.filter((consultation) => consultation.status === "Agendada").length,
      notifications: examAlerts + consultationAlerts + resultAlerts
    };
  }, [data, patient?.id]);

  function saveProfile(event) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget));
    persist({ ...data, user: { ...data.user, ...form, fontScale: Number(form.fontScale) } });
  }

  function savePatient(event) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget));
    const id = form.id || crypto.randomUUID();
    const nextPatient = { ...form, id };
    const exists = data.patients.some((item) => item.id === id);
    const patients = exists ? data.patients.map((item) => item.id === id ? nextPatient : item) : [...data.patients, nextPatient];
    persist({ ...data, patients });
    setPatientId(id);
    setModal(null);
  }

  function saveExam(event) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget));
    const id = form.id || crypto.randomUUID();
    const exam = { ...form, id, patientId: patient.id, status: form.status || "Agendado" };
    const exists = data.exams.some((item) => item.id === id);
    persist({ ...data, exams: exists ? data.exams.map((item) => item.id === id ? exam : item) : [...data.exams, exam] });
    setModal(null);
  }

  function saveConsultation(event) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget));
    const id = form.id || crypto.randomUUID();
    const consultation = { ...form, id, patientId: patient.id, status: form.status || "Agendada" };
    const exists = data.consultations.some((item) => item.id === id);
    persist({ ...data, consultations: exists ? data.consultations.map((item) => item.id === id ? consultation : item) : [...data.consultations, consultation] });
    setModal(null);
  }

  function updateExam(id, patch) {
    persist({ ...data, exams: data.exams.map((exam) => exam.id === id ? { ...exam, ...patch } : exam) });
  }

  async function enablePush() {
    const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !publicKey) {
      alert("Configure VITE_VAPID_PUBLIC_KEY para ativar push neste navegador.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const registration = await navigator.serviceWorker.register("/sw.js");
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });
    await requestApi("/notifications/subscribe", subscription.toJSON());
    localStorage.setItem("examecare.pushSubscription", JSON.stringify(subscription));
    await requestApi("/notifications/test", {});
    alert("Notificacoes ativadas neste navegador.");
  }

  function logout() {
    saveSession(null);
    setAuthMode("login");
  }

  if (!session) {
    return (
      <AuthScreen
        mode={authMode}
        message={authMessage}
        onModeChange={setAuthMode}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onRecover={handleRecover}
        onReset={handleResetPassword}
        resetToken={resetToken}
      />
    );
  }

  return (
    <div className={`app ${themeClass}`} style={{ "--accent": data.user.accentColor, fontSize: `${data.user.fontScale}rem` }}>
      <header className="topbar">
        <div className="brand"><HeartPulse size={28} /> ExameCare</div>
        <nav>
          <button className={tab === "exames" ? "active" : ""} onClick={() => setTab("exames")}><CalendarDays size={18} /> Exames</button>
          <button className={tab === "consultas" ? "active" : ""} onClick={() => setTab("consultas")}><Stethoscope size={18} /> Consultas</button>
          <button className={tab === "perfil" ? "active" : ""} onClick={() => setTab("perfil")}><UserRound size={18} /> Perfil</button>
        </nav>
        <button className="ghost" onClick={logout}><LogOut size={18} /> Sair</button>
      </header>

      <main>
        <section className="hero">
          <div>
            <span className="eyebrow">Cuidado familiar conectado</span>
            <h1>Exames, resultados e consultas sem perder nenhum detalhe.</h1>
            <p>Organize a rotina de saude dos idosos, receba lembretes push e acompanhe documentos importantes em um painel mais humano.</p>
          </div>
          <img src="https://portaldrauziovarella.nyc3.digitaloceanspaces.com/wp-content/uploads/2021/03/30230728/202103_drauzio_como-cuidar-de-parentes-idosos-dicas-para-cuidadores_1000x563_tena.jpg" alt="Profissional de saude acolhendo paciente idosa" />
        </section>

        <section className="stats">
          <Metric icon={<CalendarDays />} label="Exames agendados" value={stats.scheduled} />
          <Metric icon={<FileUp />} label="Resultados enviados" value={stats.results} />
          <Metric icon={<Stethoscope />} label="Consultas futuras" value={stats.consultations} />
          <Metric icon={<Bell />} label="Notificações" value={stats.notifications} />
        </section>

        <section className="workspace">
          <aside>
            <div className="panel-title">
              <h2>Idosos</h2>
              <button className="icon" onClick={() => setModal({ type: "patient" })}><Plus size={18} /></button>
            </div>
            {data.patients.map((item) => (
              <button key={item.id} className={`patient ${item.id === patient?.id ? "selected" : ""}`} onClick={() => setPatientId(item.id)}>
                <img src={item.photoUrl || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80"} alt="" />
                <span><strong>{item.name}</strong><small>{item.allergies || "Sem alergias registradas"}</small></span>
              </button>
            ))}
          </aside>

          <section className="panel">
            {tab === "exames" && <Exams exams={patientExams} onNew={() => setModal({ type: "exam" })} onUpdate={updateExam} />}
            {tab === "consultas" && <Consultations consultations={patientConsultations} onNew={() => setModal({ type: "consultation" })} />}
            {tab === "perfil" && <Profile user={data.user} onSubmit={saveProfile} onEnablePush={enablePush} />}
          </section>
        </section>
      </main>

      <footer>
        <strong>ExameCare</strong>
        <span>Privacidade, acolhimento e continuidade do cuidado.</span>
      </footer>

      {modal?.type === "patient" && <Modal title="Idoso" onClose={() => setModal(null)}><PatientForm onSubmit={savePatient} /></Modal>}
      {modal?.type === "exam" && <Modal title="Exame" onClose={() => setModal(null)}><ExamForm onSubmit={saveExam} /></Modal>}
      {modal?.type === "consultation" && <Modal title="Consulta" onClose={() => setModal(null)}><ConsultationForm onSubmit={saveConsultation} /></Modal>}
    </div>
  );
}

function AuthScreen({ mode, message, onModeChange, onLogin, onRegister, onRecover, onReset, resetToken }) {
  return (
    <div className="auth-page">
      <section className="auth-visual">
        <div className="brand"><HeartPulse size={30} /> ExameCare</div>
        <div>
          <span className="eyebrow">Area do familiar</span>
          <h1>Cuidado organizado desde o primeiro acesso.</h1>
          <p>Crie sua conta, aceite o consentimento LGPD e acompanhe exames, resultados, consultas e notificações em uma experiência única.</p>
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-tabs" role="tablist" aria-label="Acesso">
          <button className={mode === "login" ? "active" : ""} onClick={() => onModeChange("login")}>Entrar</button>
          <button className={mode === "register" ? "active" : ""} onClick={() => onModeChange("register")}>Cadastro</button>
          <button className={mode === "recover" ? "active" : ""} onClick={() => onModeChange("recover")}>Senha</button>
        </div>

        {message && <div className="auth-message">{message}</div>}
        {mode === "login" && <LoginForm onSubmit={onLogin} />}
        {mode === "register" && <RegisterForm onSubmit={onRegister} />}
        {mode === "recover" && <RecoverForm onSubmit={onRecover} />}
        {mode === "reset" && <ResetPasswordForm token={resetToken} onSubmit={onReset} />}
      </section>
    </div>
  );
}

function LoginForm({ onSubmit }) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <div>
        <Mail size={24} />
        <h2>Entrar no sistema</h2>
      <p className="muted">Use o e-mail e senha da conta criada no ExameCare.</p>
      </div>
      <label>E-mail<input name="email" type="email" autoComplete="email" required /></label>
      <label>Senha<input name="password" type="password" autoComplete="current-password" required /></label>
      <button>Entrar</button>
    </form>
  );
}

function RegisterForm({ onSubmit }) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <div>
        <ShieldCheck size={24} />
        <h2>Criar cadastro</h2>
        <p className="muted">A senha precisa ter pelo menos 8 caracteres.</p>
      </div>
      <label>Nome completo<input name="name" autoComplete="name" required /></label>
      <label>E-mail<input name="email" type="email" autoComplete="email" required /></label>
      <div className="auth-two-cols">
        <label>Senha<input name="password" type="password" autoComplete="new-password" minLength="8" required /></label>
        <label>Confirmar senha<input name="confirmPassword" type="password" autoComplete="new-password" minLength="8" required /></label>
      </div>
      <label className="check-row"><input name="consent" type="checkbox" required /> <span>Autorizo o tratamento dos dados conforme a LGPD para uso no ExameCare.</span></label>
      <button>Criar conta</button>
    </form>
  );
}

function RecoverForm({ onSubmit }) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <div>
        <Mail size={24} />
        <h2>Recuperar senha</h2>
        <p className="muted">Enviaremos um link de redefinição para o e-mail verificado.</p>
      </div>
      <label>E-mail<input name="email" type="email" required /></label>
      <button>Solicitar recuperação</button>
    </form>
  );
}

function ResetPasswordForm({ token, onSubmit }) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <div>
        <ShieldCheck size={24} />
        <h2>Nova senha</h2>
        <p className="muted">Digite uma nova senha com pelo menos 8 caracteres.</p>
      </div>
      <input name="token" type="hidden" defaultValue={token} required />
      <label>Nova senha<input name="password" type="password" autoComplete="new-password" minLength="8" required /></label>
      <label>Confirmar senha<input name="confirmPassword" type="password" autoComplete="new-password" minLength="8" required /></label>
      <button>Redefinir senha</button>
    </form>
  );
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function Metric({ icon, label, value }) {
  return <article className="metric">{icon}<span>{label}</span><strong>{value}</strong></article>;
}

function Exams({ exams, onNew, onUpdate }) {
  return (
    <>
      <div className="panel-title"><h2>Exames e resultados</h2><button onClick={onNew}><Plus size={18} /> Agendar exame</button></div>
      <div className="cards">
        {exams.map((exam) => (
          <article className="card" key={exam.id}>
            <div className="card-head"><h3>{exam.type}</h3><span>{exam.status}</span></div>
            <p>{exam.specialty} em {new Date(`${exam.date}T00:00:00`).toLocaleDateString("pt-BR")} as {exam.time || "--"}</p>
            <p className="muted">{exam.location} | {exam.notes}</p>
            <div className="result-box">
              <FileUp size={20} />
              <input aria-label="Nome do resultado" placeholder="Nome do resultado ou arquivo" value={exam.resultTitle || ""} onChange={(event) => onUpdate(exam.id, { resultTitle: event.target.value })} />
              <textarea placeholder="Resumo do resultado" value={exam.resultNotes || ""} onChange={(event) => onUpdate(exam.id, { resultNotes: event.target.value })} />
            </div>
            <div className="actions">
              <button onClick={() => onUpdate(exam.id, { status: "Realizado" })}><CheckCircle2 size={17} /> Realizado</button>
              <button className="danger" onClick={() => onUpdate(exam.id, { status: "Cancelado" })}>Cancelar</button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function Consultations({ consultations, onNew }) {
  return (
    <>
      <div className="panel-title"><h2>Consultas</h2><button onClick={onNew}><Plus size={18} /> Nova consulta</button></div>
      <div className="cards">
        {consultations.map((item) => (
          <article className="card" key={item.id}>
            <div className="card-head"><h3>{item.doctor}</h3><span>{item.status}</span></div>
            <p>{item.specialty} | {item.mode}</p>
            <p className="muted">{new Date(`${item.date}T00:00:00`).toLocaleDateString("pt-BR")} as {item.time || "--"} em {item.location}</p>
            <p>{item.reason}</p>
          </article>
        ))}
      </div>
    </>
  );
}

function Profile({ user, onSubmit, onEnablePush }) {
  return (
    <form className="profile-grid" onSubmit={onSubmit}>
      <div className="panel-title"><h2>Personalização do perfil</h2><button><Save size={18} /> Salvar</button></div>
      <label>Nome<input name="name" defaultValue={user.name} /></label>
      <label>E-mail<input name="email" defaultValue={user.email} /></label>
      <label>Telefone<input name="phone" defaultValue={user.phone} /></label>
      <label>Cidade<input name="city" defaultValue={user.city} /></label>
      <label>Foto do perfil<input name="avatarUrl" defaultValue={user.avatarUrl} placeholder="URL da imagem" /></label>
      <label>Tema<select name="theme" defaultValue={user.theme}><option value="light">Claro</option><option value="ocean">Oceano</option><option value="sunset">Solar</option><option value="high-contrast">Alto contraste</option></select></label>
      <label>Cor principal<input name="accentColor" type="color" defaultValue={user.accentColor} /></label>
      <label>Tamanho da fonte<input name="fontScale" type="range" min="0.9" max="1.2" step="0.05" defaultValue={user.fontScale} /></label>
      <label>Notificação<select name="notificationChannel" defaultValue={user.notificationChannel}><option value="push">Push</option><option value="email">E-mail</option><option value="sms">SMS</option><option value="whatsapp">WhatsApp</option></select></label>
      <button type="button" onClick={onEnablePush}><Bell size={18} /> Ativar notificações</button>
    </form>
  );
}

function Modal({ title, children, onClose }) {
  return <div className="backdrop"><div className="modal"><div className="panel-title"><h2>{title}</h2><button className="ghost" onClick={onClose}>Fechar</button></div>{children}</div></div>;
}

function PatientForm({ onSubmit }) {
  return <form className="form" onSubmit={onSubmit}><input name="id" type="hidden" /><label>Nome<input name="name" required /></label><label>Nascimento<input name="birthDate" type="date" required /></label><label>CPF<input name="cpf" /></label><label>Foto<input name="photoUrl" /></label><label>Alergias<input name="allergies" /></label><label>Observacoes<textarea name="notes" /></label><button>Salvar</button></form>;
}

function ExamForm({ onSubmit }) {
  return <form className="form" onSubmit={onSubmit}><label>Data<input name="date" min={today} type="date" required /></label><label>Horario<input name="time" type="time" /></label><label>Tipo<input name="type" required /></label><label>Especialidade<input name="specialty" required /></label><label>Local<input name="location" required /></label><label>Observacoes<textarea name="notes" /></label><button>Salvar</button></form>;
}

function ConsultationForm({ onSubmit }) {
  return <form className="form" onSubmit={onSubmit}><label>Medico<input name="doctor" required /></label><label>Especialidade<input name="specialty" required /></label><label>Data<input name="date" type="date" min={today} required /></label><label>Horario<input name="time" type="time" /></label><label>Tipo<select name="mode"><option>Presencial</option><option>Teleconsulta</option><option>Domiciliar</option></select></label><label>Local ou link<input name="location" required /></label><label>Motivo<textarea name="reason" /></label><button>Salvar</button></form>;
}

createRoot(document.getElementById("root")).render(<App />);
