<script lang="ts">
import PlayerBase from "../components/Player.svelte"
import { Sudoku }from "../variety/sudoku"
export let src: string = "";

const puzzle = new Sudoku({
    type: "player"
})
</script>

<div>
    <PlayerBase puzzle={puzzle} src={src}></PlayerBase>
</div>


