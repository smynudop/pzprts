import "./index.css"


const isProduction = process.env.NODE_ENV === 'production';
const scriptUrl = isProduction
    ? 'https://cdn.jsdelivr.net/npm/@udop/penpa-player/dist/index.umd.js'
    : './node_modules/@udop/penpa-player/dist/index.umd.js';

const script = document.createElement('script');
script.src = scriptUrl;
document.head.appendChild(script);
script.addEventListener("load", () => {
    customElements.define('slitherlink-player', PenpaPlayer.SlitherlinkPlayer);
    customElements.define("mashu-player", PenpaPlayer.MashuPlayer)
    customElements.define("sudoku-player", PenpaPlayer.SudokuPlayer)
    customElements.define("kakkuro-player", PenpaPlayer.KakkuroPlayer)
    customElements.define("numberlink-player", PenpaPlayer.NumberlinkPlayer)
    customElements.define("nurikabe-player", PenpaPlayer.NurikabePlayer)
    customElements.define("fillomino-player", PenpaPlayer.FillominoPlayer)
    customElements.define("hitokure-player", PenpaPlayer.HitokurePlayer)
    customElements.define("shakashaka-player", PenpaPlayer.ShakashakaPlayer)
    customElements.define("shikaku-player", PenpaPlayer.ShikakuPlayer)
    customElements.define("heyawake-player", PenpaPlayer.HeyawakePlayer)
    customElements.define("yajilin-player", PenpaPlayer.YajilinPlayer)
    customElements.define("ripple-player", PenpaPlayer.RipplePlayer)
    customElements.define("tentaisho-player", PenpaPlayer.TentaishoPlayer)
    customElements.define("norinori-player", PenpaPlayer.NorinoriPlayer)
    customElements.define("lits-player", PenpaPlayer.LitsPlayer)
    customElements.define("akari-player", PenpaPlayer.AkariPlayer)
    customElements.define("tilepaint-player", PenpaPlayer.TilePaintPlayer)
    customElements.define("nurimaze-player", PenpaPlayer.NurimazePlayer)
    customElements.define("slalom-player", PenpaPlayer.SlalomPlayer)
    customElements.define("dbchoco-player", PenpaPlayer.DoubleChocoPlayer)
    customElements.define("pencils-player", PenpaPlayer.PencilsPlayer)
    customElements.define("cbanana-player", PenpaPlayer.CbananaPlayer)
    customElements.define("ayaheya-player", PenpaPlayer.AyaheyaPlayer)
    customElements.define("nurimisaki-player", PenpaPlayer.NurimisakiPlayer)
    customElements.define("kurotto-player", PenpaPlayer.KurottoPlayer)
    customElements.define("simpleloop-player", PenpaPlayer.SimpleLoopPlayer)
    customElements.define("sashigane-player", PenpaPlayer.SashiganePlayer)
})




document.getElementById("filter-text")?.addEventListener("input", (e) => {
    const text = (e.target as HTMLInputElement).value.toUpperCase().trim()
    for (const puz of document.querySelectorAll(".container > *")) {
        const el = (puz as HTMLElement)
        el.style.display = el.tagName.includes(text) || text === "" ? "" : "none"
    }
})