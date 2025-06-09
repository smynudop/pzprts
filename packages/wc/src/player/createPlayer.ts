import PlayerBase from "../components/Player.svelte"
import type { IConfig, Puzzle } from "@udop/penpa-player-lib";

//@ts-ignore
const BaseComponent = PlayerBase.element! as new () => HTMLElement
export const createPlayer = (puzzleClass: new (info: IConfig) => Puzzle): (new () => HTMLElement) => {
    return class extends BaseComponent {
        constructor() {
            super()
            //@ts-ignore
            this.puzzle = new puzzleClass({ type: "player" })
        }
    }
}