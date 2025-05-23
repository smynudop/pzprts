<script lang="ts">
  import { onMount } from "svelte";
  import type { Puzzle } from "@udop/penpa-player-lib";
  import { ja } from "@udop/penpa-player-lib";
  import { type InputMode } from "@udop/penpa-player-lib";

  export let src: string;
  export let puzzle: Puzzle;

  let element: HTMLDivElement | null = null;

  let playModes: InputMode[] = [];
  let nowMode = "auto";
  let resultText = "";
  let complete = false;
  let err: string | null = null;
  let showDialog = false

  let enableUndo = false
  let enableRedo = false

  const puzzleName = ja.puzzleName[puzzle.pid] || puzzle.pid
  let trialLevel = 0;
  onMount(() => {
    try {
      if (!src) {
        throw new Error(`URLが指定されていません。`);
      }
      puzzle.on("history", () => {
        enableUndo = puzzle.opemgr.enableUndo
        enableRedo = puzzle.opemgr.enableRedo
      })
      puzzle.on("trial", (puzzle: Puzzle, num: number) => {
        trialLevel = num
      })
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
    } catch (e: any) {
      console.error(e);
      err = e.toString();
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

    showDialog = true
  };

  const undo = () => puzzle.undo()
  const redo = () => puzzle.redo()
  const clear = async () => {
    const r = await confirm("クリアしてよろしいですか？")
    if(!r) return;

    puzzle.ansclear()
  }
  const clearsub = () => puzzle.subclear()

  let confirmResolver: ((val: boolean) => void) | null = null
  
  let confirming = false
  const confirm = async (message: string) => {
    confirming = true

    resultText = message
    showDialog = true
    const { promise, resolve } = Promise.withResolvers<boolean>()
    confirmResolver = resolve
    const result = await promise

    confirmResolver = null
    confirming = false
    showDialog = false
    return result
  }
  const dialog_ok = () => {
    if(!confirmResolver) return;

    confirmResolver(true)
  }
  const dialog_cancel = () => {
    if(!confirmResolver) return;

    confirmResolver(false)
  }
  const clickDialog = () =>{
    if(confirming) return;
    showDialog = false
  }
  
  const rotate = () => puzzle.board.operate("turnr")
  const enterTrial = () => puzzle.enterTrial()
  const acceptTrial = () => puzzle.acceptTrial()
  const rejectTrial = () => puzzle.rejectCurrentTrial()
  const rejectTrialAll = () => puzzle.rejectTrial()

  
</script>

<div class="container">
  <h1>{puzzleName}</h1>
  <div class="mode">

    <div>
      入力モード｜
    </div>
    {#each playModes as mode}
      <!-- svelte-ignore a11y-click-events-have-key-events a11y_no_static_element_interactions -->
      <div
        class="mode-item"
        class:active={nowMode === mode}
        on:click={() => changeMode(mode)}
      >
        {ja.inputModeText[mode] ?? mode}
      </div>
    {/each}
  </div>

  <div id="puzzle" bind:this={element}></div>
  <div class="tool">
    <button on:click={check} class="check-button">チェック</button>
    <button on:click={undo} disabled={!enableUndo}>戻</button>
    <button on:click={redo} disabled={!enableRedo}>進</button>
    <button on:click={clear}>クリア</button>
    <button on:click={clearsub}>補助削除</button>
    <button on:click={rotate} >回</button>
  </div>
  <div class="tool">
      <button on:click={enterTrial}>仮置き開始</button>
    {#if trialLevel > 0}
      <button on:click={acceptTrial} class="check-button">仮置き確定</button>
      <button on:click={rejectTrial} class="delete-button">仮置き破棄</button>
    {/if}
    {#if trialLevel > 1}
      <button on:click={rejectTrialAll} class="delete-button">全仮置き破棄</button>
    {/if}
  </div>
  {#if err != null}
    <div class="error">{err}</div>
  {/if}
  {#if showDialog}
    <!-- svelte-ignore a11y-click-events-have-key-events a11y_no_static_element_interactions -->
    <div class="dialog" on:click={clickDialog}>
      <div class="message">
        {resultText}
        {#if confirming}
        <div>
          <button on:click={dialog_cancel}>キャンセル</button>
          <button on:click={dialog_ok}>OK</button>
        </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  h1{
    font-size: 150%;
    text-align: center;
    margin: .5em 0;
    font-weight: normal;
  }
  .container {
    max-width: 100%;
    margin: 0 auto;
    position: relative;
  }



  #puzzle {
    margin: 0 auto;
    max-width: 100%;
    /*border: 1px solid black;*/
    padding: 4px;
  }

  :global(#puzzle > div:focus) {
    outline: none; /* デフォルトの枠を消す */
    box-shadow: 0 0 10px 5px rgba(0, 123, 255, 0.6); /* 青くぼやっと光る */
  }

  :global(svg) {
    display: block;
  }

  .mode {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 2px;
  }

  .mode > div{
    user-select: none;
    padding: 2px;
  }

  .mode-item {
    cursor: pointer;
  }

  .active {
    background-color: #efefef;
    color: maroon;
    font-weight: bold;
  }

  button {
    border: 1px solid #ccc;
    border-radius: 0.5em;
    padding: .25em .5em;
    transition: all 0.2s;
    cursor: pointer;
    background: linear-gradient(to bottom, white, silver);
  }

  button.check-button{
    background:linear-gradient(to bottom, #83bdff, rgb(53, 56, 209)) ;
    color: white;
  }

  button.delete-button{
    background:linear-gradient(to bottom, #ff8383, rgb(209, 53, 53)) ;
    color: white;
  }

  button:hover{
    filter: brightness(1.1); /* 1.1 = 少し明るく */
  }

  .tool {
    padding: 0.5em 0;
    display: flex;
    gap: 0.5em;
    justify-content: center;
  }

  /*
  .result {
    text-align: center;
  }
  */

  .dialog{
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.35);
    padding: .25em;
    display: flex;
    align-items: flex-start;
    justify-content: center;
  }

  .dialog .message{
    background-color: white;
    border-radius: 3px;
    padding: .5em;

  }
</style>
