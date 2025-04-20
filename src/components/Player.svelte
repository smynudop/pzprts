<script lang="ts">
  import { onMount } from "svelte";
  import type { Puzzle } from "../puzzle/Puzzle";
  import {inputModeText} from "../lang/ja"
  import { type InputMode } from "../puzzle/MouseInput";

  export let src: string;
  export let puzzle: Puzzle;

  let element: HTMLDivElement | null = null;

  let playModes: InputMode[] = [];
  let nowMode = "auto";
  let resultText = "";
  let complete = false;
  let err: string | null = null;

  onMount(() => {
    try{
      if(!src){
        throw new Error(`URLが指定されていません。`)
      }
      puzzle.readURL(src);
      puzzle.mount(element!);

      puzzle.setMode("play");
      puzzle.mouse.setInputMode("auto");

      puzzle.setCanvasSizeByCellSize(36);
      if (element) {
        element.style.maxWidth = `${puzzle.painter.canvasWidth}px`;
      }

      playModes = ["auto", ...puzzle.mouse.inputModes.play] as InputMode[];
      puzzle.redraw(true);
    } catch(e: any){
      err = e.toString()
    }

  });

  const changeMode = (newMode: string) => {
    if (nowMode === newMode) return;
    nowMode = newMode;
    if (puzzle) {
        puzzle.mouse.setInputMode(newMode);
    }
  };

  const check = () => {
    const result = puzzle.check(true);
    resultText = result.text;
    complete = result.complete;
  };
</script>

<div class="container">
  <div class="mode">
    {#each playModes as mode}
      <!-- svelte-ignore a11y-click-events-have-key-events a11y_no_static_element_interactions -->
      <div
        class="mode-item"
        class:active={nowMode === mode}
        on:click={() => changeMode(mode)}
      >
        {inputModeText[mode] ?? mode }
      </div>
    {/each}
  </div>

  <div id="puzzle" bind:this={element}></div>
  <div class="result" class:complete={complete}>
    {resultText}
  </div>
  <div class="tool">
    <button on:click={check}>Check</button>
  </div>
  {#if err != null}
    <div class="error">{err}</div>
  {/if}
</div>

<style>
  .container {
    max-width: 100%;
    margin: 0 auto;
  }

  .mode {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    margin: 0.5rem 0;
  }

  #puzzle {
    margin: 0 auto;
    max-width: 100%;
    /*border: 1px solid black;*/
    padding: 4px;
  }

  :global(#puzzle > div:focus){
    outline: none; /* デフォルトの枠を消す */
    box-shadow: 0 0 10px 5px rgba(0, 123, 255, 0.6); /* 青くぼやっと光る */
  }

  .mode > div {
    border: 1px solid #ccc;
    border-right-width: 0px;
    padding: 0.25em 0.5em;
    text-align: center;
    cursor: pointer;
    user-select: none;
  }

  :global(svg){
    display: block;
  }

  .mode-item:first-child {
    border-radius: 4px 0 0 4px;
  }

  .mode-item:last-child {
    border-radius: 0 4px 4px 0;
    border-right-width: 1px;
  }

  .active {
    background-color: aquamarine;
  }

  button {
    border: 1px solid #ccc;
    border-radius: 0.5em;
    padding: 1em;
    background-color: rgb(120, 214, 214);
    transition: all 0.3s;
    cursor: pointer;
  }

  button:hover {
    background-color: rgb(163, 228, 228);
  }

  .tool {
    padding: 0.5em 0;
    display: flex;
    justify-content: center;
  }

  .result {
    text-align: center;
  }
</style>
