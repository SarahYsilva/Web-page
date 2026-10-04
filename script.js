let reiniciarDigitacao = null;
const root = document.documentElement;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ---------- Preferências salvas ---------- */
const prefs = (() => { try { return JSON.parse(localStorage.getItem("sy-prefs") || "{}"); } catch { return {}; } })();
const salvar = () => { try { localStorage.setItem("sy-prefs", JSON.stringify(prefs)); } catch {} };

/* ---------- Ano e duração do emprego atual ---------- */
$("#ano").textContent = new Date().getFullYear();

function mesesDesde(aaaaMm) {
  const [a, m] = aaaaMm.split("-").map(Number);
  const hoje = new Date();
  return (hoje.getFullYear() - a) * 12 + (hoje.getMonth() + 1 - m) + 1;
}
function textoDuracao(meses, lang) {
  const a = Math.floor(meses / 12), m = meses % 12;
  const pt = { a: a === 1 ? "ano" : "anos", m: m === 1 ? "mês" : "meses", e: "e" };
  const en = { a: a === 1 ? "year" : "years", m: m === 1 ? "month" : "months", e: "and" };
  const t = lang === "en" ? en : pt;
  if (a && m) return `${a} ${t.a} ${t.e} ${m} ${t.m}`;
  if (a) return `${a} ${t.a}`;
  return `${m} ${t.m}`;
}
const durAtual = $("#duracao-atual");
const anosTI = $("#anos-ti");
function atualizarDuracoes(lang) {
  if (durAtual) durAtual.textContent = textoDuracao(mesesDesde(durAtual.dataset.inicio), lang);
  if (anosTI) anosTI.textContent = Math.floor(mesesDesde("2023-01") / 12) + "+";
}

/* ---------- Idioma PT / EN ---------- */
const btnIdioma = $("#btn-idioma");
const traduziveis = $$("[data-en]");
traduziveis.forEach((el) => (el.dataset.pt = el.innerHTML));

const frasesDigitadas = {
  pt: ["Analista de Requisitos", "Tester / QA", "Ponte entre cliente e dev"],
  en: ["Requirements Analyst", "Tester / QA", "Bridge between client and dev"],
};
let idioma = prefs.lang || "pt";

function aplicarIdioma(lang) {
  idioma = lang;
  traduziveis.forEach((el) => (el.innerHTML = lang === "en" ? el.dataset.en : el.dataset.pt));
  root.lang = lang === "en" ? "en" : "pt-BR";
  btnIdioma.textContent = lang === "en" ? "PT" : "EN";
  btnIdioma.setAttribute("aria-label", lang === "en" ? "Mudar para português" : "Switch to English");
  atualizarDuracoes(lang);
  if (typeof reiniciarDigitacao === "function") reiniciarDigitacao();
  prefs.lang = lang; salvar();
}
btnIdioma.addEventListener("click", () => aplicarIdioma(idioma === "pt" ? "en" : "pt"));
aplicarIdioma(idioma);

/* ---------- Efeito de digitação ---------- */
const alvo = $("#digitado");
const semMovimento = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (alvo) {
  if (semMovimento) {
    alvo.textContent = frasesDigitadas[idioma][0];
  } else {
    let i = 0, pos = 0, apagando = false;
    reiniciarDigitacao = () => { pos = 0; apagando = false; };
    const tick = () => {
      const frase = frasesDigitadas[idioma][i % 3];
      pos += apagando ? -1 : 1;
      alvo.textContent = frase.slice(0, pos);
      let espera = apagando ? 40 : 85;
      if (!apagando && pos === frase.length) { apagando = true; espera = 1800; }
      else if (apagando && pos === 0) { apagando = false; i++; espera = 400; }
      setTimeout(tick, espera);
    };
    tick();
  }
}

/* ---------- Menu mobile + link ativo ---------- */
const nav = $("#nav"), btnMenu = $(".btn-menu");
btnMenu.addEventListener("click", () => {
  const aberto = nav.classList.toggle("aberto");
  btnMenu.setAttribute("aria-expanded", aberto);
});
$$("a", nav).forEach((a) => a.addEventListener("click", () => {
  nav.classList.remove("aberto"); btnMenu.setAttribute("aria-expanded", false);
}));
const links = $$("a", nav);
const observador = new IntersectionObserver((entradas) => {
  entradas.forEach((e) => {
    if (e.isIntersecting) links.forEach((l) => l.classList.toggle("ativo", l.getAttribute("href") === "#" + e.target.id));
  });
}, { rootMargin: "-45% 0px -50% 0px" });
$$("main section[id]").forEach((s) => observador.observe(s));

/* ---------- Acessibilidade ---------- */
const painel = $("#a11y-painel"), btnA11y = $(".a11y-toggle");
btnA11y.addEventListener("click", () => {
  const aberto = painel.classList.toggle("aberto");
  btnA11y.setAttribute("aria-expanded", aberto);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && painel.classList.contains("aberto")) { painel.classList.remove("aberto"); btnA11y.setAttribute("aria-expanded", false); btnA11y.focus(); }
});

const marcar = () => {
  $$("[data-font]", painel).forEach((b) => b.setAttribute("aria-pressed", (root.dataset.font || "") === b.dataset.font));
  $$("[data-theme-btn]", painel).forEach((b) => b.setAttribute("aria-pressed", root.dataset.theme === b.dataset.themeBtn));
  $("#btn-contraste").setAttribute("aria-pressed", root.dataset.contrast === "high");
};
$$("[data-font]", painel).forEach((b) => b.addEventListener("click", () => {
  if (b.dataset.font) root.dataset.font = b.dataset.font; else delete root.dataset.font;
  prefs.font = b.dataset.font; salvar(); marcar();
}));
$$("[data-theme-btn]", painel).forEach((b) => b.addEventListener("click", () => {
  root.dataset.theme = b.dataset.themeBtn; prefs.theme = b.dataset.themeBtn; salvar(); marcar();
}));
$("#btn-contraste").addEventListener("click", () => {
  if (root.dataset.contrast === "high") { delete root.dataset.contrast; prefs.contrast = ""; }
  else { root.dataset.contrast = "high"; prefs.contrast = "high"; }
  salvar(); marcar();
});
marcar();

/* ---------- Copiar e-mail ---------- */
const toast = $("#toast");
const avisar = (msg) => {
  toast.textContent = msg; toast.classList.add("show");
  clearTimeout(avisar.t); avisar.t = setTimeout(() => toast.classList.remove("show"), 2200);
};
$$(".copiar").forEach((b) => b.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(b.dataset.copy);
    avisar(idioma === "en" ? "Email copied! 📋" : "E-mail copiado! 📋");
  } catch {
    location.href = "mailto:" + b.dataset.copy;
  }
}));

/* ---------- Formulário de contato ---------- */
const form = $("#form-contato");
const erros = {
  pt: { nome: "Informe seu nome.", email: "Informe um e-mail válido, como nome@empresa.com.", assunto: "Escolha um assunto.", mensagem: "Escreva uma mensagem com pelo menos 10 caracteres." },
  en: { nome: "Please enter your name.", email: "Enter a valid email, like name@company.com.", assunto: "Choose a subject.", mensagem: "Write a message with at least 10 characters." },
};
const obrigatorios = $$("[required]", form);
const validar = (c) => {
  const w = c.closest(".campo"), ok = c.checkValidity();
  w.classList.toggle("invalido", !ok);
  $(".erro", w).textContent = ok ? "" : erros[idioma][c.name];
  return ok;
};
obrigatorios.forEach((c) => c.addEventListener("blur", () => validar(c)));

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const sucesso = $(".sucesso", form), falha = $(".falha", form);
  sucesso.classList.remove("show"); falha.classList.remove("show");

  let primeiro = null;
  obrigatorios.forEach((c) => { if (!validar(c) && !primeiro) primeiro = c; });
  if (primeiro) { primeiro.focus(); return; }

  const btn = $("#btn-enviar"), textoOriginal = btn.innerHTML;
  btn.disabled = true; btn.textContent = idioma === "en" ? "Sending…" : "Enviando…";
  try {
    const resp = await fetch(form.action.replace("formsubmit.co/", "formsubmit.co/ajax/"), {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(form),
    });
    if (!resp.ok) throw new Error(resp.status);
    form.reset();
    sucesso.classList.add("show");
  } catch {
    falha.classList.add("show");
  } finally {
    btn.disabled = false; btn.innerHTML = textoOriginal;
  }
});
