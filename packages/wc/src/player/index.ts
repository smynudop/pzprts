import { mount } from "svelte";
import type { IConfig, Puzzle } from "@udop/penpa-player-lib";
import PlayerBase from "../components/Player.svelte"
import { SlitherLink } from "@udop/penpa-player-lib";
import { Mashu } from "@udop/penpa-player-lib";
import { Sudoku } from "@udop/penpa-player-lib";
import { Kakkuro } from "@udop/penpa-player-lib";
import { Numberlink } from "@udop/penpa-player-lib";
import { Nurikabe } from "@udop/penpa-player-lib";
import { Hitokure } from "@udop/penpa-player-lib";
import { Shakashaka } from "@udop/penpa-player-lib";
import { Shikaku } from "@udop/penpa-player-lib";
import { Fillomino } from "@udop/penpa-player-lib";
import { Heyawake } from "@udop/penpa-player-lib";

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