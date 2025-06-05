// Scripts/navegacao-perfil.js

document.addEventListener("DOMContentLoaded", () => {
    // const Utils = window.EasyCareProfileUtils; // Descomente se precisar de algo do Utils aqui
    // if (!Utils) {
    //     console.error("Fatal: EasyCareProfileUtils não encontrado. Verifique a ordem de inclusão dos scripts.");
    //     return;
    // }

    const menuHamburguerPerfil = document.getElementById("menuHamburguerBtnPerfil");
    const navPerfil = document.getElementById("painel-navigation-cliente-perfil");
    const btnSairDesktopPaginaPerfil = document.getElementById("btnSairDesktopPerfil");
    const btnSairMobilePaginaPerfil = document.getElementById("btnSairMobilePerfil");

    if (menuHamburguerPerfil && navPerfil) {
        menuHamburguerPerfil.addEventListener("click", () => {
            const isMenuOpen = navPerfil.classList.toggle("menu-aberto");
            menuHamburguerPerfil.classList.toggle("aberto", isMenuOpen);
            menuHamburguerPerfil.setAttribute("aria-expanded", isMenuOpen.toString());
            // Opcional: impedir scroll do body quando menu aberto
            document.body.style.overflow = isMenuOpen ? "hidden" : ""; 
        });

        // Fechar menu ao clicar em um link (se for navegação na mesma página ou SPA)
        navPerfil.querySelectorAll("ul a").forEach(link => {
            link.addEventListener("click", () => { 
                if (navPerfil.classList.contains("menu-aberto")) {
                     navPerfil.classList.remove("menu-aberto");
                     menuHamburguerPerfil.classList.remove("aberto");
                     menuHamburguerPerfil.setAttribute("aria-expanded", "false");
                     document.body.style.overflow = ""; 
                }
            });
        });
    }

    function fazerLogout() {
        // Usar window.confirm para uma caixa de diálogo nativa
        if (window.confirm("Você realmente deseja sair da sua conta?")) {
            // Em um TCC, redirecionar para a página inicial é comum.
            // Em uma aplicação real, você invalidaria a sessão/token no backend também.
            window.location.href = "index.html"; // Certifique-se que "index.html" é o caminho correto para sua página de login/inicial
            // Se você estiver usando EasyCareProfileUtils.USER_DATA_KEY e quiser limpar ao sair:
            // if (Utils && Utils.USER_DATA_KEY) {
            //     localStorage.removeItem(Utils.USER_DATA_KEY);
            // }
        }
    }

    if (btnSairDesktopPaginaPerfil) {
        btnSairDesktopPaginaPerfil.addEventListener("click", fazerLogout);
    }
    if (btnSairMobilePaginaPerfil) {
        btnSairMobilePaginaPerfil.addEventListener("click", fazerLogout);
    }
});