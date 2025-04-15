const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

function formatarData(data) {
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0"); // meses começam do 0
  const ano = data.getFullYear();
  const hora = String(data.getHours()).padStart(2, "0");
  const minuto = String(data.getMinutes()).padStart(2, "0");
  return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
}

const base64 = process.env.GOOGLE_CREDENTIALS_BASE64;
const credentialsPath = path.join(__dirname, "credentials.json");

fs.writeFileSync(credentialsPath, Buffer.from(base64, "base64"));

// Autenticação Google Sheets
const auth = new google.auth.GoogleAuth({
  keyFile: credentialsPath,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME;

router.post("/resultado", async (req, res) => {
  try {
    const { nome, email, telefone, A, C, O, I } = req.body;

    if (!nome || !email) {
      return res.status(400).json({ error: "Nome e e-mail são obrigatórios." });
    }

    // 1. Salva no banco
    const resultado = await prisma.resultado.create({
      data: {
        nome,
        email,
        telefone,
        perfilA: A || 0,
        perfilC: C || 0,
        perfilO: O || 0,
        perfilI: I || 0,
      },
    });

    // 2. Envia para o Google Sheets
    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: authClient });

    const novaLinha = [
      formatarData(new Date()), // Data de envio
      nome,
      email,
      telefone,
      A || 0,
      C || 0,
      O || 0,
      I || 0,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [novaLinha],
      },
    });

    res.status(201).json(resultado);
  } catch (error) {
    console.error("Erro ao salvar resultado:", error);
    res.status(500).json({ error: "Erro ao salvar resultado." });
  }
});

module.exports = router;
