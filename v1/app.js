/* =========================================================
   CARDÁPIO MUSICAL — LILIAN E MARINHO
   V1 — JAVASCRIPT PRINCIPAL
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const listaMusicas = document.getElementById("lista-musicas");
    const campoBusca = document.getElementById("campo-busca");

    /*
     * Músicas temporárias apenas para testar a interface.
     * Depois substituiremos isso pelo Supabase.
     */
    const musicas = [
        {
            id: 1,
            musica: "Exemplo de música 01",
            artista: "Lilian e Marinho"
        },
        {
            id: 2,
            musica: "Exemplo de música 02",
            artista: "Lilian e Marinho"
        },
        {
            id: 3,
            musica: "Exemplo de música 03",
            artista: "Lilian e Marinho"
        }
    ];

    function mostrarMusicas(lista) {

        if (!listaMusicas) {
            return;
        }

        listaMusicas.innerHTML = "";

        if (lista.length === 0) {

            listaMusicas.innerHTML = `
                <div id="carregando-musicas">
                    Nenhuma música encontrada.
                </div>
            `;

            return;
        }

        lista.forEach((item) => {

            const botao = document.createElement("button");

            botao.type = "button";
            botao.className = "musica-item";

            botao.innerHTML = `
                <strong>${escaparHTML(item.musica)}</strong>
                <span>${escaparHTML(item.artista)}</span>
            `;

            botao.addEventListener("click", () => {
                selecionarMusica(item);
            });

            listaMusicas.appendChild(botao);
        });
    }


    function selecionarMusica(item) {

        alert(
            `Você escolheu:\n\n${item.musica}\n${item.artista}\n\n` +
            `A etapa "Gostou da apresentação?" será criada em seguida.`
        );
    }


    function escaparHTML(valor) {

        const div = document.createElement("div");

        div.textContent = valor ?? "";

        return div.innerHTML;
    }


    if (campoBusca) {

        campoBusca.addEventListener("input", () => {

            const termo = campoBusca.value
                .trim()
                .toLowerCase();

            const filtradas = musicas.filter((item) => {

                return (
                    item.musica.toLowerCase().includes(termo) ||
                    item.artista.toLowerCase().includes(termo)
                );

            });

            mostrarMusicas(filtradas);
        });
    }


    mostrarMusicas(musicas);

});