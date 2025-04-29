import { mount } from "svelte";
import type { IConfig, Puzzle } from "@udop/penpa-player-lib";
import PlayerBase from "../components/Player.svelte"
import * as Lib from "@udop/penpa-player-lib";

const createPlayer = (puzzleClass: new (info: IConfig) => Puzzle) => {
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