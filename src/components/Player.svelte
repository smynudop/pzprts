<script lang="ts">
  import { onMount } from "svelte";
  import type { Puzzle } from "../puzzle/Puzzle";

  export let src: string;
  export let puzzle: Puzzle;

  let element: HTMLDivElement | null = null;

  let playModes: string[] = [];
  let nowMode = "auto";
  let resultText = "";
  let complete = false;

  onMount(() => {
    puzzle.readURL(src);
    puzzle.mount(element!);

    puzzle.setMode("play");
    puzzle.mouse.setInputMode("auto");

    puzzle.setCanvasSizeByCellSize(36);
    if (element) {
      element.style.maxWidth = `${puzzle.painter.canvasWidth}px`;
    }

    playModes = ["auto", ...puzzle.mouse.inputModes.play];
    puzzle.redraw(true);
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
        {mode}
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
    border: 1px solid black;
    padding: 4px;
  }

  .mode > div {
    border: 1px solid #ccc;
    border-right-width: 0px;
    padding: 0.25em 0.5em;
    text-align: center;
    cursor: pointer;
    user-select: none;
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
