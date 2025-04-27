import { mount } from "svelte";
import type { IConfig, Puzzle } from "../puzzle/Puzzle";
import PlayerBase from "../components/Player.svelte"
import { SlitherLink } from "../variety/slither";
import { Mashu } from "../variety/mashu";
import { Sudoku } from "../variety/sudoku";
import { Kakkuro } from "../variety/kakkuro";
import { Numberlink } from "../variety/numberlink";
import { Nurikabe } from "../variety/nurikabe";
import { Hitokure } from "../variety/hitori";
import { Shakashaka } from "../variety/shakashaka";
import { Shikaku } from "../variety/shikaku";
import { Fillomino } from "../variety/fillomino";
import { Heyawake } from "../variety/heyawake";

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

export const SlitherlinkPlayer = createPlayer(SlitherLink)
export const MashuPlayer = createPlayer(Mashu)
export const SudokuPlayer = createPlayer(Sudoku)
export const KakkuroPlayer = createPlayer(Kakkuro)
export const NumberlinkPlayer = createPlayer(Numberlink)
export const NurikabePlayer = createPlayer(Nurikabe)
export const HitokurePlayer = createPlayer(Hitokure)
export const ShakashakaPlayer = createPlayer(Shakashaka)
export const ShikakuPlayer = createPlayer(Shikaku)
export const FillominoPlayer = createPlayer(Fillomino)
export const HeyawakePlayer = createPlayer(Heyawake)