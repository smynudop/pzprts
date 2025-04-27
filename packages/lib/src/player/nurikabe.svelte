<script lang="ts">
import PlayerBase from "../components/Player.svelte"
import { Nurikabe }from "../variety/nurikabe"
export let src: string = "";

const puzzle = new Nurikabe({
    type: "player"
})
</script>

<div>
    <PlayerBase puzzle={puzzle} src={src}></PlayerBase>
</div>


