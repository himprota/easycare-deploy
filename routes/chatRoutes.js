// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware'); // Certifique-se que o caminho está correto
const ChatModel = require('../models/chatModel'); // Você precisará criar este modelo

router.post('/initiate', authMiddleware, async (req, res) => {
    const { targetUserId } = req.body;
    const currentUserId = req.user.id; // Vem do token JWT decodificado
    const currentUserType = req.user.tipoConta; // Vem do token JWT decodificado

    if (!targetUserId) {
        return res.status(400).json({ message: 'ID do usuário alvo é obrigatório.' });
    }

    if (currentUserId === targetUserId) {
        return res.status(400).json({ message: 'Você não pode dar like em si mesmo.' });
    }

    try {
        // 1. Registrar o interesse do usuário atual pelo targetUserId
        // Isso pode ser uma entrada em uma tabela 'Likes' ou 'Interesses'
        await ChatModel.registerLike(currentUserId, targetUserId);

        // 2. Verificar se há um "match mútuo"
        // Ou seja, o targetUserId também deu like no currentUserId
        const isMutualMatch = await ChatModel.checkMutualLike(currentUserId, targetUserId);

        if (isMutualMatch) {
            // 3. Se for match mútuo: Criar ou Recuperar a Sala de Chat
            const chatRoomId = await ChatModel.findOrCreateChatRoom(currentUserId, targetUserId);
            return res.status(200).json({
                message: 'Match! Conversa iniciada.',
                chatRoomId: chatRoomId
            });
        } else {
            // 4. Se não for match mútuo: Apenas registrar o interesse
            return res.status(200).json({
                message: 'Interesse registrado! Você será notificado se houver um match.'
            });
        }
    } catch (error) {
        console.error('Erro ao iniciar/verificar chat:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao processar match.' });
    }
});

module.exports = router;