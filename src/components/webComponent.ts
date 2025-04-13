import { defineCustomElement } from "vue";
import Player from "./Player.vue";
import type { Puzzle } from "../puzzle/Puzzle";

export const createPlayer = (PuzzleClass: new (option: any) => Puzzle, option?: any) => {
    return defineCustomElement({
        props: {
            src: String
        },
        setup(props) {
            option = option || {}
            option = {
                ...option,
                type: "player"
            }
            const puzzle = new PuzzleClass(option)
            return {
                puzzle,
                src: props.src
            }
        },
        template: `<player :puzzle="puzzle" :src="src"/> `,
        components: {
            Player
        }
    })
}