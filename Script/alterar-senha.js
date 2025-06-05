// Scripts/alterar-senha.js

document.addEventListener("DOMContentLoaded", () => {
    const Utils = window.EasyCareProfileUtils;
    if (!Utils) {
        console.error("Fatal: EasyCareProfileUtils não encontrado. Verifique a ordem de inclusão dos scripts.");
        return;
    }

    // --- SELETORES DO DOM (Segurança da Conta: Alterar Senha - Simplificado) ---
    const btnMostrarAlterarSenha = document.getElementById("btnMostrarAlterarSenha");
    const formAlterarSenha = document.getElementById("formAlterarSenha");

    const editSenhaAtual = document.getElementById("editSenhaAtual");
    const editNovaSenha = document.getElementById("editNovaSenha");
    const editConfirmarNovaSenha = document.getElementById("editConfirmarNovaSenha");
    const btnCancelarAlterarSenha = document.getElementById("btnCancelarAlterarSenha");
    // O botão de submit é pego pelo evento de submit do formulário.

    // --- FUNÇÕES ---
    function resetarFormularioAlterarSenha() {
        if (formAlterarSenha) formAlterarSenha.reset();
        if (formAlterarSenha) formAlterarSenha.classList.add('hidden-input');
        if (btnMostrarAlterarSenha) btnMostrarAlterarSenha.classList.remove('hidden-input');
    }

    // --- EVENT LISTENERS ---
    if (btnMostrarAlterarSenha) {
        btnMostrarAlterarSenha.addEventListener('click', () => {
            if (formAlterarSenha) formAlterarSenha.reset(); // Limpa campos antes de mostrar
            if (formAlterarSenha) formAlterarSenha.classList.remove('hidden-input');
            btnMostrarAlterarSenha.classList.add('hidden-input');
            if (editSenhaAtual) editSenhaAtual.focus();
        });
    }

    if (btnCancelarAlterarSenha) {
        btnCancelarAlterarSenha.addEventListener('click', () => {
            resetarFormularioAlterarSenha();
        });
    }

    if (formAlterarSenha) {
        formAlterarSenha.addEventListener('submit', (e) => { 
            e.preventDefault();
            if (!Utils.dadosPerfil) return;

            const senhaAtualVal = editSenhaAtual.value;
            const novaSenhaVal = editNovaSenha.value;
            const confirmarNovaSenhaVal = editConfirmarNovaSenha.value;

            if (!senhaAtualVal || !novaSenhaVal || !confirmarNovaSenhaVal) {
                alert("Por favor, preencha todos los campos para alterar a senha.");
                return;
            }

            if (senhaAtualVal !== Utils.dadosPerfil.senhaAtualMock) {
                alert("Senha atual incorreta.");
                editSenhaAtual.focus();
                return;
            }

            if (novaSenhaVal.length < 6) {
                alert("A nova senha deve ter pelo menos 6 caracteres.");
                editNovaSenha.focus();
                return;
            }
            if (novaSenhaVal === Utils.dadosPerfil.senhaAtualMock) {
                alert("A nova senha deve ser diferente da senha atual.");
                editNovaSenha.focus();
                return;
            }
            if (novaSenhaVal !== confirmarNovaSenhaVal) {
                alert("A nova senha e a confirmação não correspondem.");
                editConfirmarNovaSenha.focus();
                return;
            }

            Utils.dadosPerfil.senhaAtualMock = novaSenhaVal; // Atualiza o mock da senha
            Utils.salvarDadosNoLocalStorage();
            
            alert("Senha alterada com sucesso!");
            resetarFormularioAlterarSenha();
        });
    }

    // --- INICIALIZAÇÃO ---
    if (btnMostrarAlterarSenha && formAlterarSenha) {
        resetarFormularioAlterarSenha(); // Garante estado inicial correto
    } else {
        console.warn("Elementos do formulário de alterar senha (simplificado) não encontrados. Funcionalidades podem não operar.");
    }
});