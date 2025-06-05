// Scripts/alterar-email.js

document.addEventListener("DOMContentLoaded", () => {
    const Utils = window.EasyCareProfileUtils;
    if (!Utils) {
        console.error("Fatal: EasyCareProfileUtils não encontrado. Verifique a ordem de inclusão dos scripts.");
        return;
    }

    // --- SELETORES DO DOM (Segurança da Conta: Alterar E-mail) ---
    const viewEmailTitularAtual = document.getElementById("viewEmailTitularAtual"); // Exibe o e-mail atual na seção de segurança

    const btnMostrarAlterarEmail = document.getElementById("btnMostrarAlterarEmail");
    const formAlterarEmail = document.getElementById("formAlterarEmail");

    // Elementos do Passo 1
    const alterarEmailPasso1 = document.getElementById("alterarEmailPasso1");
    const editNovoEmailTitular = document.getElementById("editNovoEmailTitular");
    const editConfirmarNovoEmailTitular = document.getElementById("editConfirmarNovoEmailTitular");
    const editSenhaParaEmailChange = document.getElementById("editSenhaParaEmailChange");
    const btnEnviarCodigoEmail = document.getElementById("btnEnviarCodigoEmail");
    const btnCancelarAlterarEmailPasso1 = document.getElementById("btnCancelarAlterarEmailPasso1");

    // Elementos do Passo 2
    const alterarEmailPasso2 = document.getElementById("alterarEmailPasso2");
    const editCodigoVerificacaoEmail = document.getElementById("editCodigoVerificacaoEmail");
    // O botão de submit do Passo 2 é o submit do próprio formAlterarEmail
    const btnCancelarAlterarEmailPasso2 = document.getElementById("btnCancelarAlterarEmailPasso2");

    // --- FUNÇÕES ---

    function populateViewEmailTitularAtual() {
        if (viewEmailTitularAtual && Utils.dadosPerfil) {
            viewEmailTitularAtual.textContent = Utils.dadosPerfil.email || "Não informado";
        }
    }

    function resetarFormularioAlterarEmail() {
        if (formAlterarEmail) formAlterarEmail.reset();
        Utils.dadosPerfil.codigoVerificacaoEmailPendente = null;
        Utils.dadosPerfil.novoEmailPendente = null;
        
        if (alterarEmailPasso1) alterarEmailPasso1.classList.remove('hidden-input');
        if (alterarEmailPasso2) alterarEmailPasso2.classList.add('hidden-input');
        if (formAlterarEmail) formAlterarEmail.classList.add('hidden-input');
        if (btnMostrarAlterarEmail) btnMostrarAlterarEmail.classList.remove('hidden-input');
    }

    // --- EVENT LISTENERS ---
    if (btnMostrarAlterarEmail) {
        btnMostrarAlterarEmail.addEventListener('click', () => {
            resetarFormularioAlterarEmail(); // Garante que o form está limpo
            if (formAlterarEmail) formAlterarEmail.classList.remove('hidden-input');
            if (alterarEmailPasso1) alterarEmailPasso1.classList.remove('hidden-input'); // Garante que o passo 1 é visível
            if (alterarEmailPasso2) alterarEmailPasso2.classList.add('hidden-input'); // Garante que o passo 2 está oculto
            btnMostrarAlterarEmail.classList.add('hidden-input');
            populateViewEmailTitularAtual(); // Atualiza e-mail atual ao mostrar
        });
    }

    if (btnCancelarAlterarEmailPasso1) {
        btnCancelarAlterarEmailPasso1.addEventListener('click', () => {
            resetarFormularioAlterarEmail();
        });
    }
    
    if (btnCancelarAlterarEmailPasso2) {
        btnCancelarAlterarEmailPasso2.addEventListener('click', () => {
            // Poderia voltar ao Passo 1, mas para simplificar, cancela tudo
            resetarFormularioAlterarEmail();
        });
    }

    if (btnEnviarCodigoEmail) {
        btnEnviarCodigoEmail.addEventListener('click', () => {
            if (!Utils.dadosPerfil) return;

            const novoEmail = editNovoEmailTitular.value.trim();
            const confirmarNovoEmail = editConfirmarNovoEmailTitular.value.trim();
            const senhaConfirmacao = editSenhaParaEmailChange.value;

            if (!novoEmail || !confirmarNovoEmail || !senhaConfirmacao) {
                alert("Por favor, preencha todos os campos para solicitar o código.");
                return;
            }
            if (!/^\S+@\S+\.\S+$/.test(novoEmail)) {
                alert("Por favor, insira um novo e-mail válido.");
                editNovoEmailTitular.focus();
                return;
            }
            if (novoEmail === Utils.dadosPerfil.email) {
                alert("O novo e-mail deve ser diferente do atual.");
                editNovoEmailTitular.focus();
                return;
            }
            if (novoEmail !== confirmarNovoEmail) {
                alert("Os novos e-mails não correspondem.");
                editConfirmarNovoEmailTitular.focus();
                return;
            }
            if (senhaConfirmacao !== Utils.dadosPerfil.senhaAtualMock) { // Usando mock de senha
                alert("Senha atual incorreta. Verifique sua senha.");
                editSenhaParaEmailChange.focus();
                return;
            }

            Utils.dadosPerfil.novoEmailPendente = novoEmail;
            Utils.dadosPerfil.codigoVerificacaoEmailPendente = Utils.gerarCodigoVerificacao();
            
            console.log(`SIMULAÇÃO (Alterar E-mail): Código de verificação para ${novoEmail}: ${Utils.dadosPerfil.codigoVerificacaoEmailPendente}`);
            alert(`SIMULAÇÃO: Um código de verificação foi "enviado" para ${novoEmail}.\n\nCódigo: ${Utils.dadosPerfil.codigoVerificacaoEmailPendente}\n\n(Em um sistema real, este código seria enviado por e-mail. Copie-o e cole no campo abaixo).`);

            if (alterarEmailPasso1) alterarEmailPasso1.classList.add('hidden-input');
            if (alterarEmailPasso2) alterarEmailPasso2.classList.remove('hidden-input');
            if (editCodigoVerificacaoEmail) editCodigoVerificacaoEmail.focus();
        });
    }

    if (formAlterarEmail) {
        formAlterarEmail.addEventListener('submit', (e) => { 
            e.preventDefault(); // O submit agora é para o Passo 2
            if (!Utils.dadosPerfil) return;

            const codigoInserido = editCodigoVerificacaoEmail.value.trim();

            if (!codigoInserido) {
                alert("Por favor, insira o código de verificação.");
                editCodigoVerificacaoEmail.focus();
                return;
            }

            if (codigoInserido.toUpperCase() === Utils.dadosPerfil.codigoVerificacaoEmailPendente && Utils.dadosPerfil.novoEmailPendente) {
                Utils.dadosPerfil.email = Utils.dadosPerfil.novoEmailPendente;
                
                Utils.salvarDadosNoLocalStorage(); // Salva todas as alterações em dadosPerfil
                
                alert("E-mail alterado com sucesso!");
                
                resetarFormularioAlterarEmail(); // Reseta e esconde o formulário
                populateViewEmailTitularAtual(); // Atualiza o <p id="viewEmailTitularAtual">

                // Notifica outros módulos para atualizarem suas visualizações do e-mail
                if (typeof Utils.refreshGeneralProfileView === 'function') {
                    Utils.refreshGeneralProfileView(); // Para atualizar o e-mail na seção de infos gerais
                }
                // Se o módulo de alterar senha também mostrar o e-mail, ele precisaria de um update.
                // Adicionaremos uma função para isso em alterar-senha.js se necessário.

            } else {
                alert("Código de verificação incorreto ou expirado. Tente novamente desde o início.");
                // Opcional: resetar apenas o passo 2 ou o form todo
                if (alterarEmailPasso2) alterarEmailPasso2.classList.add('hidden-input');
                if (alterarEmailPasso1) alterarEmailPasso1.classList.remove('hidden-input');
                if (editNovoEmailTitular) editNovoEmailTitular.focus(); // Foca no início
                 // Limpa o código pendente para forçar nova solicitação
                Utils.dadosPerfil.codigoVerificacaoEmailPendente = null;
                Utils.dadosPerfil.novoEmailPendente = null;
            }
        });
    }

    // --- INICIALIZAÇÃO ---
    // Garante que os elementos principais existem
    if (btnMostrarAlterarEmail && formAlterarEmail && alterarEmailPasso1 && alterarEmailPasso2) {
        resetarFormularioAlterarEmail(); // Estado inicial correto
        populateViewEmailTitularAtual(); // Popula o e-mail atual ao carregar a página
    } else {
        console.warn("Elementos do formulário de alterar e-mail não encontrados. Funcionalidades podem não operar.");
    }
    
    // Adiciona uma função ao Utils para que outros módulos possam atualizar esta view se necessário
    // (embora neste caso, o mais provável é este módulo chamar atualizações em outros)
    Utils.updateAlterarEmailView = populateViewEmailTitularAtual;
});