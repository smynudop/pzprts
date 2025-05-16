import { mount } from "svelte";
import type { IConfig, Puzzle } from "@udop/penpa-player-lib";
import PlayerBase from "../components/Player.svelte"
import * as Lib from "@udop/penpa-player-lib";
import { create } from "node:domain";

const createPlayer = (puzzleClass: new (info: IConfig) => Puzzle): (new () => HTMLElement) => {
    return class extends HTMLElement {
        constructor() {
            super()
            const shadow = this.attachShadow({ mode: "open" });
            const div = document.createElement("div")
            shadow.appendChild(div)
            mount(PlayerBase, {
                target: div,
                props: {
                    puzzle: new puzzleClass({ type: "player" }),
                    src: this.getAttribute("src") ?? ""
                }
            })
        }
    }
}

export const SlitherlinkPlayer = createPlayer(Lib.SlitherLink)
export const MashuPlayer = createPlayer(Lib.Mashu)
export const SudokuPlayer = createPlayer(Lib.Sudoku)
export const KakkuroPlayer = createPlayer(Lib.Kakkuro)
export const NumberlinkPlayer = createPlayer(Lib.Numberlink)
export const NurikabePlayer = createPlayer(Lib.Nurikabe)
export const HitokurePlayer = createPlayer(Lib.Hitokure)
export const ShakashakaPlayer = createPlayer(Lib.Shakashaka)
export const ShikakuPlayer = createPlayer(Lib.Shikaku)
export const FillominoPlayer = createPlayer(Lib.Fillomino)
export const HeyawakePlayer = createPlayer(Lib.Heyawake)
export const YajilinPlayer = createPlayer(Lib.Yajilin)
export const RipplePlayer = createPlayer(Lib.Ripple)
export const TentaishoPlayer = createPlayer(Lib.Tentaisho)
export const NorinoriPlayer = createPlayer(Lib.Norinori)
export const LitsPlayer = createPlayer(Lib.Lits)
export const AkariPlayer = createPlayer(Lib.Akari)
export const LightUpPlayer = createPlayer(Lib.LightUp)
export const TilePaintPlayer = createPlayer(Lib.TilePaint)
export const NurimazePlayer = createPlayer(Lib.Nurimaze)
export const SlalomPlayer = createPlayer(Lib.Slalom)
export const DoubleChocoPlayer = createPlayer(Lib.DoubleChoco)
export const PencilsPlayer = createPlayer(Lib.Pencils)
export const CbananaPlayer = createPlayer(Lib.Cbanana)
export const AyaheyaPlayer = createPlayer(Lib.Ayaheya)
export const NurimisakiPlayer = createPlayer(Lib.Nurimisaki)
export const KurottoPlayer = createPlayer(Lib.Kurotto)
export const SimpleLoopPlayer = createPlayer(Lib.SimpleLoop)
export const SashiganePlayer = createPlayer(Lib.Sashigane)
export const TapaPlayer = createPlayer(Lib.Tapa)
export const IcebarnPlayer = createPlayer(Lib.Icebarn)
export const IcelomPlayer = createPlayer(Lib.Icelom)
export const Icelom2Player = createPlayer(Lib.Icelom2)
export const FireflyPlayer = createPlayer(Lib.Firefly)

export const YinyangPlayer = createPlayer(Lib.Yinyang)