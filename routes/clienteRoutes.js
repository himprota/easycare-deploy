// routes/clienteRoutes.js (focado em gerenciamento de dependentes do cliente)
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const ClienteModel = require('../models/clienteModel'); // Usado para obter o id_cliente do req.user

// Middleware para verificar se o usuário é um cliente
const ensureIsCliente = (req, res, next) => {
    if (req.user && req.user.tipoConta === 'cliente') {
        next();
    } else {
        res.status(403).json({ message: 'Acesso negado. Apenas clientes podem realizar esta ação.' });
    }
};

// Aplicar o authMiddleware e ensureIsCliente a todas as rotas de dependentes neste arquivo
router.use(authMiddleware, ensureIsCliente);

// Rota para adicionar um novo dependente para o cliente logado
router.post('/', async (req, res) => {
    const id_cliente = req.user.id; // ID do Cliente logado
    const { nome_completo, parentesco, data_nascimento, condicoes_saude, observacoes } = req.body;

    if (!nome_completo || !parentesco || !data_nascimento) {
        return res.status(400).json({ message: 'Nome, parentesco e data de nascimento são obrigatórios para o dependente.' });
    }

    try {
        const newDependent = await ClienteModel.create({ // Agora ClienteModel está definido
            id_cliente: id_cliente,
            nome_completo,
            parentesco,
            data_nascimento,
            condicoes_saude,
            observacoes
        });
        res.status(201).json({ message: 'Dependente adicionado com sucesso!', dependent: newDependent });
    } catch (error) {
        console.error('Erro ao adicionar dependente:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao adicionar dependente.' });
    }
});

// Rota para listar todos os dependentes do cliente logado
router.get('/', async (req, res) => {
    const id_cliente = req.user.id;
    try {
        const dependents = await ClienteModel.findByClienteId(id_cliente); // Usando ClienteModel
        res.status(200).json(dependents);
    } catch (error) {
        console.error('Erro ao listar dependentes:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao listar dependentes.' });
    }
});

// Rota para obter um dependente específico pelo ID, para o cliente logado
router.get('/:id_dependente', async (req, res) => {
    const id_cliente = req.user.id;
    const id_dependente_param = req.params.id_dependente;
    try {
        const dependent = await ClienteModel.findByIdAndClienteId(id_dependente_param, id_cliente); // Usando ClienteModel
        if (!dependent) {
            return res.status(404).json({ message: 'Dependente não encontrado ou não pertence a este cliente.' });
        }
        res.status(200).json(dependent);
    } catch (error) {
        console.error('Erro ao buscar dependente:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Rota para atualizar um dependente específico do cliente logado
router.put('/:id_dependente', async (req, res) => {
    const id_cliente = req.user.id;
    const id_dependente_param = req.params.id_dependente;
    const updates = req.body;

    delete updates.id_dependente;
    delete updates.id_cliente;

    try {
        const result = await ClienteModel.update(id_dependente_param, id_cliente, updates); // Usando ClienteModel
        if (result.changes === 0) {
            const existingDependent = await ClienteModel.findByIdAndClienteId(id_dependente_param, id_cliente);
            if (!existingDependent) {
                return res.status(404).json({ message: 'Dependente não encontrado.' });
            }
            return res.status(200).json({ message: 'Nenhum dado alterado (valores podem ser os mesmos).', dependent: existingDependent });
        }
        const updatedDependent = await ClienteModel.findByIdAndClienteId(id_dependente_param, id_cliente);
        res.status(200).json({ message: 'Dependente atualizado com sucesso!', dependent: updatedDependent });
    } catch (error) {
        console.error('Erro ao atualizar dependente:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar dependente.' });
    }
});

// Rota para excluir um dependente do cliente logado
router.delete('/:id_dependente', async (req, res) => {
    const id_cliente = req.user.id;
    const id_dependente_param = req.params.id_dependente;
    try {
        const result = await ClienteModel.delete(id_dependente_param, id_cliente); // Usando ClienteModel
        if (result.changes === 0) {
            return res.status(404).json({ message: 'Dependente não encontrado ou não pertence a este cliente.' });
        }
        res.status(200).json({ message: 'Dependente excluído com sucesso!' });
    } catch (error) {
        console.error('Erro ao excluir dependente:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao excluir dependente.' });
    }
});

// ROTA /match-candidates FOI REMOVIDA DESTE ARQUIVO

module.exports = router;