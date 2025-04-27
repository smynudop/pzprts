<script lang="ts">
import PlayerBase from "../components/Player.svelte"
import { Numberlink }from "../variety/numberlink"
export let src: string = "";

const puzzle = new Numberlink({
    type: "player"
})
</script>

<div>
    <PlayerBase puzzle={puzzle} src={src}></PlayerBase>
</div>


