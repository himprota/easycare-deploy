// models/chatModel.js (Exemplo - ajuste conforme seu schema de DB)
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class ChatModel {
    // Registra o "like" de um usuário em outro
    static async registerLike(likerId, likedId) {
        const sql = `
            INSERT OR REPLACE INTO Likes (liker_id, liked_id, created_at)
            VALUES (?, ?, CURRENT_TIMESTAMP);
        `;
        try {
            await db.run(sql, [likerId, likedId]);
            console.log(`Like registrado: ${likerId} liked ${likedId}`);
        } catch (error) {
            console.error('Erro ao registrar like:', error.message);
            throw new Error('Erro ao registrar like no DB.');
        }
    }

    // Verifica se houve um like mútuo
    static async checkMutualLike(user1Id, user2Id) {
        // Verifica se user1Id deu like em user2Id E user2Id deu like em user1Id
        const sql = `
            SELECT COUNT(*) AS count
            FROM Likes
            WHERE (liker_id = ? AND liked_id = ?) OR (liker_id = ? AND liked_id = ?);
        `;
        try {
            const result = await db.get(sql, [user1Id, user2Id, user2Id, user1Id]);
            // Se count for 2, significa que ambos deram like um no outro
            return result.count === 2;
        } catch (error) {
            console.error('Erro ao verificar like mútuo:', error.message);
            throw new Error('Erro ao verificar like mútuo no DB.');
        }
    }

    // Encontra uma sala de chat existente ou cria uma nova para o match
    static async findOrCreateChatRoom(user1Id, user2Id) {
        // A ordem dos IDs é importante para encontrar a mesma sala, independente de quem a criou primeiro
        const sortedIds = [user1Id, user2Id].sort();
        const uniquePairId = sortedIds[0] + '_' + sortedIds[1]; // Ex: "user1_user2"

        // Tenta encontrar uma sala existente
        let sql = `SELECT id_sala FROM ChatRooms WHERE user_pair_id = ?;`;
        try {
            let room = await db.get(sql, [uniquePairId]);

            if (room) {
                return room.id_sala; // Sala existente
            } else {
                // Criar nova sala
                const id_sala = uuidv4();
                sql = `
                    INSERT INTO ChatRooms (id_sala, user_pair_id, user1_id, user2_id, created_at)
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP);
                `;
                await db.run(sql, [id_sala, uniquePairId, sortedIds[0], sortedIds[1]]);
                console.log(`Nova sala de chat criada: ${id_sala}`);
                return id_sala;
            }
        } catch (error) {
            console.error('Erro ao encontrar ou criar sala de chat:', error.message);
            throw new Error('Erro no DB ao gerenciar sala de chat.');
        }
    }
}

module.exports = ChatModel;