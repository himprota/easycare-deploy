// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();
console.log('JWT_SECRET no authMiddleware:', process.env.JWT_SECRET);

const authMiddleware = (req, res, next) => {
  // Obter o token do cabeçalho 'Authorization' (ex: "Bearer TOKEN_STRING")
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Acesso negado. Token não fornecido ou inválido.' });
  }

  const token = authHeader.split(' ')[1]; // Extrai o token da string "Bearer TOKEN_STRING"

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // Adiciona o payload decodificado (ex: { id: 'uuid-do-usuario' }) ao objeto req
    next(); // Passa para a próxima função na cadeia de middlewares/rotas
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado. Por favor, faça login novamente.' });
    }
    console.error('Erro na verificação do token:', error);
    res.status(401).json({ message: 'Token inválido.' });
  }
};

module.exports = authMiddleware;