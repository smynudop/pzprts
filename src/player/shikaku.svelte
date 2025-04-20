<script lang="ts">
    import PlayerBase from "../components/Player.svelte"
    import { Shikaku }from "../variety/shikaku"
    export let src: string = "";
    
    const puzzle = new Shikaku({
        type: "player"
    })
    </script>
    
    <div>
        <PlayerBase puzzle={puzzle} src={src}></PlayerBase>
    </div>
    
    
    