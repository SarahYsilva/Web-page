// Ano no rodapé
const ano = document.getElementById("ano");
if (ano) ano.textContent = new Date().getFullYear();

// Menu mobile
const botaoMenu = document.querySelector(".botao-menu");
const menu = document.getElementById("menu");
if (botaoMenu && menu) {
  botaoMenu.addEventListener("click", () => {
    const aberto = menu.classList.toggle("aberto");
    botaoMenu.setAttribute("aria-expanded", aberto);
  });
  menu.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", () => {
      menu.classList.remove("aberto");
      botaoMenu.setAttribute("aria-expanded", false);
    })
  );
}

// Validação do formulário de contato
const form = document.getElementById("form-contato");
if (form) {
  const mensagens = {
    nome: "Informe seu nome.",
    email: "Informe um e-mail válido, como nome@empresa.com.",
    mensagem: "Escreva uma mensagem com pelo menos 10 caracteres.",
  };

  const validar = (campo) => {
    const wrapper = campo.closest(".campo");
    const erro = wrapper.querySelector(".erro");
    const ok = campo.checkValidity();
    wrapper.classList.toggle("invalido", !ok);
    if (erro) erro.textContent = ok ? "" : mensagens[campo.name];
    return ok;
  };

  const obrigatorios = form.querySelectorAll("[required]");
  obrigatorios.forEach((c) => c.addEventListener("blur", () => validar(c)));

  form.addEventListener("submit", (e) => {
    let primeiroInvalido = null;
    obrigatorios.forEach((c) => {
      if (!validar(c) && !primeiroInvalido) primeiroInvalido = c;
    });
    if (primeiroInvalido) {
      e.preventDefault();
      primeiroInvalido.focus();
      return;
    }
    const botao = form.querySelector("button[type=submit]");
    botao.textContent = "Enviando…";
    botao.disabled = true;
  });
}
