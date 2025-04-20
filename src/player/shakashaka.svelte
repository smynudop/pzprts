<script lang="ts">
    import PlayerBase from "../components/Player.svelte"
    import { Shakashaka }from "../variety/shakashaka"
    export let src: string = "";
    
    const puzzle = new Shakashaka({
        type: "player"
    })
    </script>
    
    <div>
        <PlayerBase puzzle={puzzle} src={src}></PlayerBase>
    </div>
    
    
    