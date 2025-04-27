<script lang="ts">
import PlayerBase from "../components/Player.svelte"
import { Fillomino }from "../variety/fillomino"
export let src: string = "";

const puzzle = new Fillomino({
    type: "player"
})
</script>

<div>
    <PlayerBase puzzle={puzzle} src={src}></PlayerBase>
</div>
    
    
    