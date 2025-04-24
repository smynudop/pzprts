<script lang="ts">
    import PlayerBase from "../components/Player.svelte"
    import { Heyawake }from "../variety/heyawake"
    export let src: string = "";
    
    const puzzle = new Heyawake({
        type: "player"
    })
    </script>
    
    <div>
        <PlayerBase puzzle={puzzle} src={src}></PlayerBase>
    </div>
        
        
        