<script lang="ts">
import PlayerBase from "../components/Player.svelte"
import { SlitherLink }from "../variety/slither2"
export let src: string = "";

const puzzle = new SlitherLink({
    type: "player"
})
</script>

<div>
    <PlayerBase puzzle={puzzle} src={src}></PlayerBase>
</div>


