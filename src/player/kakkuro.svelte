<script lang="ts">
import PlayerBase from "../components/Player.svelte"
import { Kakkuro }from "../variety/kakkuro"
export let src: string = "";

const puzzle = new Kakkuro({
    type: "player"
})
</script>

<div>
    <PlayerBase puzzle={puzzle} src={src}></PlayerBase>
</div>


