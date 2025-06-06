import PlayerBase from "../components/Player.svelte"
import type { IConfig, Puzzle } from "@udop/penpa-player-lib";

const BaseComponent = PlayerBase.element!
export const createPlayer = (puzzleClass: new (info: IConfig) => Puzzle): (new () => HTMLElement) => {
    return class extends BaseComponent {
        constructor() {
            super()
            //@ts-ignore
            this.puzzle = new puzzleClass({ type: "player" })
        }
    }
}