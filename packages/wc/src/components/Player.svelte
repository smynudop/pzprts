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
  let showDialog = false;

  let enableUndo = false;
  let enableRedo = false;

  const puzzleName = ja.puzzleName[puzzle.pid] || puzzle.pid;
  let trialLevel = 0;

  let use = 1;
  let showMenu = false;
  const toggleMenu = () => {
    showMenu = !showMenu;
  };

  let mounted = false
  onMount(() => {
    try {
      if (!src) {
        throw new Error(`URLが指定されていません。`);
      }
      puzzle.on("history", () => {
        enableUndo = puzzle.opemgr.enableUndo;
        enableRedo = puzzle.opemgr.enableRedo;
      });
      puzzle.on("trial", (puzzle: Puzzle, num: number) => {
        trialLevel = num;
      });
      puzzle.readURL(src);
      puzzle.mount(element!);

      puzzle.setMode("play");
      puzzle.mouse.setInputMode("auto");

      puzzle.on("resizeCanvas", (_, [width, number]: [number, number]) => {
        if (element) {
          element.style.maxWidth = `${width}px`;
        }
      });
      puzzle.setCanvasSizeByCellSize(36);

      playModes = ["auto", ...puzzle.mouse.inputModes.play] as InputMode[];
      use = puzzle.getConfig("use") || 1;

      puzzle.redraw(true);
      mounted = true
    } catch (e: any) {
      console.error(e);
      err = e.toString();
    }
  });

  const changeMode = (m: string) => {
    puzzle?.mouse.setInputMode(m);
  };

  const changeConfig = (type: string, value: any) => {
    puzzle?.setConfig(type, value);
  };

  const check = () => {
    const result = puzzle.check(true);
    resultText = result.text;
    complete = result.complete;

    showDialog = true;
  };

  const undo = () => puzzle.undo();
  const redo = () => puzzle.redo();
  const clear = async () => {
    const r = await confirm("クリアしてよろしいですか？");
    if (!r) return;

    puzzle.ansclear();
  };
  const clearsub = () => puzzle.subclear();

  const irowake = (e: Event) => {
    const target = e.target as HTMLInputElement;
    puzzle.setConfig("irowake", target.checked);
  };

  let confirmResolver: ((val: boolean) => void) | null = null;

  let confirming = false;
  const confirm = async (message: string) => {
    confirming = true;

    resultText = message;
    showDialog = true;
    const { promise, resolve } = Promise.withResolvers<boolean>();
    confirmResolver = resolve;
    const result = await promise;

    confirmResolver = null;
    confirming = false;
    showDialog = false;
    return result;
  };
  const dialog_ok = () => {
    if (!confirmResolver) return;

    confirmResolver(true);
  };
  const dialog_cancel = () => {
    if (!confirmResolver) return;

    confirmResolver(false);
  };
  const clickDialog = () => {
    if (confirming) return;
    showDialog = false;
  };

  const rotate = () => puzzle.board.operate("flipx");
  const enterTrial = () => puzzle.enterTrial();
  const acceptTrial = () => puzzle.acceptTrial();
  const rejectTrial = () => puzzle.rejectCurrentTrial();
  const rejectTrialAll = () => puzzle.rejectTrial();

  $: {
    changeMode(nowMode);
  }
  $: {
    if(mounted) changeConfig("use", use);
  }

  let fileInput: HTMLInputElement | null = null;
  const selectInputFile = () => {
    if (!fileInput) return;
    fileInput.value = ""; // Reset the file input to allow re-uploading the same file
    fileInput.click();
  }
  const inputFile = () => {
    const file = fileInput?.files?.[0];
    if (!file) {
      console.error("ファイルが選択されていません。");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      console.log(text)
      try {
        puzzle.readFile(text);
        puzzle.redraw(true);
        showMenu = false;
      } catch (error) {
        console.error("ファイルの読み込みに失敗しました:", error);
        err = "ファイルの読み込みに失敗しました。";
      }
    };
    reader.readAsText(file)
  }

  const outputFile = () => {
    const text = puzzle.getFileData();
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${puzzle.pid || "puzzle"}.txt`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  }

  const openOriginal = () => {
    window.open(src, "_blank");
  }
</script>

<div class="container">
  <h1>{puzzleName}</h1>
  <header>
  <div class="mode">
    <div>入力モード｜</div>
    {#each playModes as mode}
      <label class="mode-item">
        {ja.inputModeText[mode] ?? mode}
        <input type="radio" name="mode" bind:group={nowMode} value={mode} />
      </label>
    {/each}
  </div>
  <div class="options">
    {#if puzzle.validConfig("use")}
      <div>
        操作方法｜
        <label class="mode-item">
          左右ボタン
          <input type="radio" name="use" bind:group={use} value={1} />
        </label>
        <label class="mode-item">
          1ボタン
          <input type="radio" name="use" bind:group={use} value={2} />
        </label>
      </div>
    {/if}
    {#if puzzle.validConfig("irowake")}
      <div>
        <label
          ><input type="checkbox" on:change={irowake} />線の色分けをする</label
        >
      </div>
    {/if}
  </div>
  </header>


  <div id="puzzle" bind:this={element}></div>
  <div class="tool">
    <button on:click={check} class="check-button">チェック</button>
    <button on:click={undo} disabled={!enableUndo}>戻</button>
    <button on:click={redo} disabled={!enableRedo}>進</button>
    <button on:click={clear}>クリア</button>
    <button on:click={clearsub}>補助削除</button>
    <!-- <button on:click={rotate}>回</button> -->
  </div>
  <div class="tool">
    <button on:click={enterTrial}>仮置き開始</button>
    {#if trialLevel > 0}
      <button on:click={acceptTrial} class="check-button">仮置き確定</button>
      <button on:click={rejectTrial} class="delete-button">仮置き破棄</button>
    {/if}
    {#if trialLevel > 1}
      <button on:click={rejectTrialAll} class="delete-button"
        >全仮置き破棄</button
      >
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
  <button class="humberger_handle" on:click={toggleMenu} aria-label="humberger">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
    >
      <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
    </svg>
  </button>
  <div class="menu" class:hide={!showMenu}>
    <div class="menu-item-list">
      <button on:click={selectInputFile}>ファイル入力</button>
      <button on:click={outputFile}>ファイル出力</button>
      <button on:click={openOriginal}>元サイトで開く</button>
    </div>
  </div>
  <input bind:this={fileInput} type="file" accept=".txt" style="display: none;" on:change={inputFile} />
</div>

<style lang="scss">
  h1 {
    font-size: 150%;
    text-align: center;
    margin: 0 0.5em .5em;
    font-weight: normal;
  }
  .container {
    max-width: 100%;
    margin: 0 auto;
    position: relative;
    padding: .5em;
  }

  #puzzle {
    margin: 0 auto;
    max-width: 100%;
    /*border: 1px solid black;*/
    padding: 4px;
    box-sizing: content-box;
  }

  :global(*){
    box-sizing: border-box;
  }

  :global(#puzzle > div:focus) {
    outline: none; /* デフォルトの枠を消す */
    box-shadow: 0 0 10px 5px light-dark(rgba(0, 123, 255, 0.6), rgba(47, 224, 255, 0.6)); /* 青くぼやっと光る */
  }

  :global(svg) {
    display: block;
    font-family: var(--penpa-player-font-family, inherit);
  }

  header{
    background-color:  light-dark(rgba(175, 175, 175, 0.15), rgba(238, 238, 238, 0.15));
    max-width: 480px;
    margin: 0 auto;
    padding: .25em 0;
    border-radius: .25em;
    user-select: none;
  }

  .mode {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 2px;

    > div {
      user-select: none;
      /*padding: 2px;*/
    }
  }

  .mode-item {
    margin-right: 0.2em;
    cursor: pointer;

    input {
      display: none; /* ラジオボタンを非表示 */
    }
  }

  .mode-item:has(input:checked) {
    background-color: light-dark(#efefef, #5a5a5a);
    color: light-dark(maroon, rgb(255, 128, 128));
    font-weight: bold;
  }

  .options {
    text-align: center;
  }

  .tool button,
  .dialog button {
    border: 1px solid light-dark(#ccc, #666);
    border-radius: 3px;
    padding: 0.25em 0.5em;
    transition: all 0.2s;
    cursor: pointer;
    background: linear-gradient(to bottom, white, silver);
    color: black;
  }

  button.check-button {
    background: linear-gradient(to bottom, #5aa0f0, rgb(53, 56, 209));
    color: white;
  }

  button.delete-button {
    background: linear-gradient(to bottom, #ff8383, rgb(209, 53, 53));
    color: white;
  }

  button:hover {
    filter: brightness(1.1); /* 1.1 = 少し明るく */
  }

  .tool {
    margin: 0.5em 0;
    display: flex;
    gap: 0.5em;
    justify-content: center;
  }

  .dialog {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.35);
    padding: 0.25em;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    color: black;
  }

  .dialog .message {
    background-color: white;
    border-radius: 3px;
    padding: 0.5em;
  }

  .humberger_handle {
    position: absolute;
    top: 0.5em;
    right: 0.5em;
    cursor: pointer;
    z-index: 1000;
    background-color: transparent;
    border: 1px solid light-dark(#ccc, #666);
    padding: 0.25em;
    border-radius: .25em;
    box-shadow: 0 0 5px rgba(136, 136, 136, 0.4);
    fill: light-dark(#2c2c2c, #b1b1b1);
  }

  .menu{
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    top: 0;
    left: 0;
    display: flex;
    justify-content: flex-end;
  }

  .menu.hide{
    display: none;
  }

  .menu .menu-item-list{
    margin: 0;
    width: min(50%, 300px);
    height: 100%;
    background-color: rgba(255, 255, 255, 0.9);
    padding-left: 0;
    padding-top: 3em;
  }

  .menu .menu-item-list button{
    display:block;
    width: 100%;
    background-color: transparent;
    text-align: left;
    padding: 0.5em;
    border-width: 0;
    border-top: 1px solid #ccc;
    cursor: pointer;
    user-select: none;
    color: rgb(43, 43, 43);

    &:hover{
      background-color: #ccc;
      color: maroon;
      font-weight: bold;
    }
  }
  .menu .menu-item-list button:last-child{
    border-bottom: 1px solid #ccc;
  }
</style>
