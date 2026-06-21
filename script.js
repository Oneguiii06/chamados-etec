// =========================
// CONFIGURACAO DA API
// =========================

const API = "https://chamados-etec-production.up.railway.app/api";

// =========================
// LOGIN ADMINISTRADOR
// =========================

async function fazerLogin() {
  const usuario = document.getElementById("usuario")?.value;
  const senha   = document.getElementById("senha")?.value;
  const erro    = document.getElementById("erroLogin");

  try {
    const resp = await fetch(`${API}/login`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ usuario, senha }),
    });

    const dados = await resp.json();

    if (dados.sucesso) {
      sessionStorage.setItem("adminLogado", "true");
      document.getElementById("loginAdmin").style.display = "none";
      document.getElementById("painelAdmin").style.display = "block";
      carregarChamados();
    } else {
      erro.innerText = dados.mensagem || "Usuário ou senha inválidos.";
    }
  } catch {
    erro.innerText = "Erro ao conectar com o servidor.";
  }
}

function logout() {
  sessionStorage.removeItem("adminLogado");
  location.reload();
}

// =========================
// ABRIR CHAMADO
// =========================

const formChamado = document.getElementById("formChamado");

if (formChamado) {
  formChamado.addEventListener("submit", async function (e) {
    e.preventDefault();

    const chamado = {
      nome:      document.getElementById("nome").value,
      turma:     document.getElementById("turma").value,
      tipo:      document.getElementById("tipo").value,
      descricao: document.getElementById("descricao").value,
    };

    try {
      const resp  = await fetch(`${API}/chamados`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(chamado),
      });

      const dados = await resp.json();

      if (dados.sucesso) {
        document.getElementById("mensagemSucesso").innerHTML = `
          ✅ Chamado aberto com sucesso!<br><br>
          <strong>Protocolo #${dados.protocolo}</strong>
        `;
        formChamado.reset();
      } else {
        alert("Erro ao abrir chamado: " + (dados.erro || "Tente novamente."));
      }
    } catch {
      alert("Erro ao conectar com o servidor.");
    }
  });
}

// =========================
// FILTROS
// =========================

let tipoAtivo   = "Todos";
let statusAtivo = "Todos";

function filtrarPorTipo(tipo, el) {
  tipoAtivo = tipo;
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  el.classList.add("active");
  carregarChamados();
}

function filtrarPorStatus(status, el) {
  statusAtivo = status;
  document.querySelectorAll(".card").forEach(c => c.classList.remove("active"));
  el.classList.add("active");
  carregarChamados();
}

// =========================
// ADMIN JA LOGADO?
// =========================

if (window.location.pathname.includes("admin.html")) {
  if (sessionStorage.getItem("adminLogado") === "true") {
    document.getElementById("loginAdmin").style.display = "none";
    document.getElementById("painelAdmin").style.display = "block";
    carregarChamados();
  }
}

// =========================
// CARREGAR CHAMADOS
// =========================

async function carregarChamados() {
  const lista = document.getElementById("listaChamados");
  if (!lista) return;

  const pesquisa = document.getElementById("pesquisa")?.value || "";

  try {
    const resp    = await fetch(`${API}/chamados?pesquisa=${encodeURIComponent(pesquisa)}`);
    const chamados = await resp.json();

    lista.innerHTML = "";

    let chamadosFiltrados = chamados;

    if (tipoAtivo !== "Todos") {
      chamadosFiltrados = chamadosFiltrados.filter(c => c.tipo === tipoAtivo);
    }

    if (statusAtivo !== "Todos") {
      chamadosFiltrados = chamadosFiltrados.filter(c => c.status === statusAtivo);
    }

    let abertos   = 0;
    let andamento = 0;
    let resolvidos = 0;

    chamadosFiltrados.forEach(chamado => {
      if (chamado.status === "Aberto")       abertos++;
      if (chamado.status === "Em andamento") andamento++;
      if (chamado.status === "Resolvido")    resolvidos++;

      let classeStatus = "";
      if (chamado.status === "Aberto")       classeStatus = "status-aberto";
      if (chamado.status === "Em andamento") classeStatus = "status-andamento";
      if (chamado.status === "Resolvido")    classeStatus = "status-resolvido";

      lista.innerHTML += `
        <div class="chamado ${classeStatus}">
          <h3>📌 Chamado #${chamado.id}</h3>
          <p><strong>Aluno:</strong> ${chamado.nome}</p>
          <p><strong>Turma:</strong> ${chamado.turma}</p>
          <p><strong>Tipo:</strong> ${chamado.tipo}</p>
          <p><strong>Descrição:</strong></p>
          <p>${chamado.descricao}</p>
          <p><strong>Data:</strong> ${chamado.data}</p>
          <p class="status ${classeStatus}">${chamado.status}</p>

          <select onchange="alterarStatus(${chamado.id}, this.value)">
            <option ${chamado.status === "Aberto"       ? "selected" : ""}>Aberto</option>
            <option ${chamado.status === "Em andamento" ? "selected" : ""}>Em andamento</option>
            <option ${chamado.status === "Resolvido"    ? "selected" : ""}>Resolvido</option>
          </select>

          <br><br>

          <button class="excluir" onclick="excluirChamado(${chamado.id})">
            Excluir Chamado
          </button>
        </div>
      `;
    });

    if (chamadosFiltrados.length === 0) {
      lista.innerHTML = "<p style='text-align:center;color:#888;padding:40px 0;'>Nenhum chamado encontrado com esses filtros.</p>";
    }

    document.getElementById("totalChamados").innerText = chamadosFiltrados.length;
    document.getElementById("abertos").innerText       = abertos;
    document.getElementById("andamento").innerText     = andamento;
    document.getElementById("resolvidos").innerText    = resolvidos;

  } catch {
    lista.innerHTML = "<p>Erro ao carregar chamados. Servidor offline?</p>";
  }
}

// =========================
// ALTERAR STATUS
// =========================

async function alterarStatus(id, novoStatus) {
  await fetch(`${API}/chamados/${id}/status`, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ status: novoStatus }),
  });

  carregarChamados();
}

// =========================
// EXCLUIR
// =========================

async function excluirChamado(id) {
  const confirmar = confirm("Deseja realmente excluir este chamado?");
  if (!confirmar) return;

  await fetch(`${API}/chamados/${id}`, { method: "DELETE" });

  carregarChamados();
}

// =========================
// PESQUISA
// =========================

const pesquisaInput = document.getElementById("pesquisa");

if (pesquisaInput) {
  pesquisaInput.addEventListener("keyup", carregarChamados);
}
