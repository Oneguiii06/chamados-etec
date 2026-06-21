const express = require("express");
const cors    = require("cors");
const path    = require("path");
const pool    = require("./database");

const app  = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ─────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────

app.post("/api/login", async (req, res) => {
  const { usuario, senha } = req.body;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM admins WHERE usuario = ? AND senha = ?",
      [usuario, senha]
    );
    if (rows.length > 0) {
      res.json({ sucesso: true });
    } else {
      res.status(401).json({ sucesso: false, mensagem: "Usuário ou senha inválidos." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ sucesso: false, mensagem: "Erro no servidor." });
  }
});

// ─────────────────────────────────────────
// ABRIR CHAMADO
// ─────────────────────────────────────────

app.post("/api/chamados", async (req, res) => {
  const { nome, turma, tipo, descricao } = req.body;
  if (!nome || !tipo || !descricao) {
    return res.status(400).json({ erro: "Campos obrigatórios faltando." });
  }
  const id   = Date.now();
  const data = new Date().toLocaleString("pt-BR");
  try {
    await pool.query(
      "INSERT INTO chamados (id, nome, turma, tipo, descricao, data, status) VALUES (?, ?, ?, ?, ?, ?, 'Aberto')",
      [id, nome, turma || "", tipo, descricao, data]
    );
    res.json({ sucesso: true, protocolo: id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao salvar chamado." });
  }
});

// ─────────────────────────────────────────
// LISTAR CHAMADOS
// ─────────────────────────────────────────

app.get("/api/chamados", async (req, res) => {
  const pesquisa = req.query.pesquisa?.toLowerCase() || "";
  try {
    let rows;
    if (pesquisa) {
      const like = `%${pesquisa}%`;
      [rows] = await pool.query(`
        SELECT * FROM chamados
        WHERE  LOWER(nome)      LIKE ?
            OR LOWER(turma)     LIKE ?
            OR LOWER(tipo)      LIKE ?
            OR CAST(id AS CHAR) LIKE ?
        ORDER BY id DESC
      `, [like, like, like, like]);
    } else {
      [rows] = await pool.query("SELECT * FROM chamados ORDER BY id DESC");
    }
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao buscar chamados." });
  }
});

// ─────────────────────────────────────────
// ALTERAR STATUS
// ─────────────────────────────────────────

app.patch("/api/chamados/:id/status", async (req, res) => {
  const { id }     = req.params;
  const { status } = req.body;
  const statusValidos = ["Aberto", "Em andamento", "Resolvido"];
  if (!statusValidos.includes(status)) {
    return res.status(400).json({ erro: "Status inválido." });
  }
  try {
    await pool.query("UPDATE chamados SET status = ? WHERE id = ?", [status, id]);
    res.json({ sucesso: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao atualizar status." });
  }
});

// ─────────────────────────────────────────
// EXCLUIR CHAMADO
// ─────────────────────────────────────────

app.delete("/api/chamados/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM chamados WHERE id = ?", [id]);
    res.json({ sucesso: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao excluir chamado." });
  }
});

// ─────────────────────────────────────────
// INICIAR SERVIDOR
// ─────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});
