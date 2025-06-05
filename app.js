// app.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config(); // Carrega as variáveis de ambiente do arquivo .env

// Log para verificar o carregamento da JWT_SECRET (apenas para depuração)
console.log('JWT_SECRET do .env (arquivo principal):', process.env.JWT_SECRET);

// Certifica-se de que o banco de dados é inicializado ao iniciar a aplicação.
// Isso executa a função connectDb e initializeDb de database.js.
require('./config/database');

// Carregamento e verificação das rotas
console.log('app.js: Tentando carregar authRoutes...');
const authRoutes = require('./routes/authRoutes');
console.log('app.js: authRoutes carregado:', typeof authRoutes === 'function' ? 'OK (é um Router)' : 'FALHA');

console.log('app.js: Tentando carregar chatRoutes...');
const chatRoutes = require('./routes/chatRoutes'); // Carrega o módulo de rotas de chat
console.log('app.js: chatRoutes carregado:', typeof chatRoutes === 'function' ? 'OK (é um Router)' : 'FALHA');

console.log('app.js: Tentando carregar cuidadorRoutes...');
const cuidadorRoutes = require('./routes/cuidadorRoutes');
console.log('app.js: cuidadorRoutes carregado:', typeof cuidadorRoutes === 'function' ? 'OK (é um Router)' : 'FALHA');

console.log('app.js: Tentando carregar clienteRoutes...');
const clienteRoutes = require('./routes/clienteRoutes');
console.log('app.js: clienteRoutes carregado:', typeof clienteRoutes === 'function' ? 'OK (é um Router)' : 'FALHA');

// Cria a instância do aplicativo Express
const app = express();
const PORT = process.env.PORT || 3000; // Define a porta do servidor, padrão 3000

// === MIDDLEWARES GERAIS E DE SEGURANÇA ===
app.use(cors()); // Habilita o CORS para permitir requisições de diferentes origens (frontend)
app.use(express.json()); // Habilita o parsing de JSON no corpo das requisições (para receber dados JSON)


// === DEFINIÇÃO DAS ROTAS DE API ===
// Rotas de API devem vir ANTES de servir arquivos estáticos para que as requisições API sejam interceptadas primeiro
app.use('/api/auth', authRoutes); // Rotas de autenticação (cadastro, login)
app.use('/api/chat', chatRoutes); // Conecta as rotas de chat (ex: /api/chat/initiate)
app.use('/api/user', cuidadorRoutes); // Rotas relacionadas a usuários/cuidadores (ex: /api/user/profile, /api/user/match-candidates)
app.use('/api/dependents', clienteRoutes); // Rotas relacionadas a clientes (se aplicável)

// Rota de teste inicial para verificar se a API está online
// Esta rota é para a raiz do seu backend, não do frontend.
app.get('/', (req, res) => {
  res.send('API EasyCare está funcionando!');
});

// === SERVIR ARQUIVOS ESTÁTICOS DO FRONTEND ===
// Esta é a parte que serve seus HTML, CSS, JS do frontend diretamente
// Deve vir DEPOIS das rotas de API para não interceptá-las.
app.use(express.static(path.join(__dirname, 'public'))); // Assumindo que seus arquivos frontend estão na pasta 'public'

// === ROTAS DE FRONTEND ESPECÍFICAS (PARA SPA OU URLs Limpas) ===
// Esta rota é para lidar com URLs de frontend que não correspondem a um arquivo estático direto
// (ex: /chat/algum-id-da-sala). Ela deve vir DEPOIS de express.static.
app.get('/chat/:chatRoomId', (req, res) => {
  // Envia o arquivo chat.html
  // Certifique-se de que 'public' é o nome correto da sua pasta de frontend.
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// === MIDDLEWARE DE TRATAMENTO DE ERROS ===
// Este middleware deve ser SEMPRE o ÚLTIMO, antes de app.listen(),
// para capturar quaisquer erros não tratados nas rotas e middlewares anteriores.
app.use((err, req, res, next) => {
  console.error('ERRO GLOBAL NÃO TRATADO:', err.stack); // Registra o erro no console do servidor
  res.status(500).json({ message: 'Erro interno do servidor.', error: err.message }); // Envia uma resposta de erro JSON
});


// === INICIAR O SERVIDOR ===
app.listen(PORT, () => {
  console.log(`Servidor Node.js rodando na porta ${PORT}`);
});