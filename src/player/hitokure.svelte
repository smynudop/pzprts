<script lang="ts">
    import PlayerBase from "../components/Player.svelte"
    import { Hitokure }from "../variety/hitori"
    export let src: string = "";
    
    const puzzle = new Hitokure({
        type: "player"
    })
</script>
    
<div>
    <PlayerBase puzzle={puzzle} src={src}></PlayerBase>
</div>
        
        
        