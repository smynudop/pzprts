<script lang="ts">
import PlayerBase from "../components/Player.svelte"
import { Mashu }from "../variety/mashu"
export let src: string = "";

const puzzle = new Mashu({
    type: "player"
})
</script>

<div>
    <PlayerBase puzzle={puzzle} src={src}></PlayerBase>
</div>


