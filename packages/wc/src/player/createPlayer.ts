import PlayerBase from "../components/Player.svelte"
import type { IConfig, Puzzle } from "@udop/penpa-player-lib";
import { mount } from "svelte";
export const createPlayer = (puzzleClass: new (info: IConfig) => Puzzle): (new () => HTMLElement) => {
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