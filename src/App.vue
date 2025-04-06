<script setup lang="ts">
import { SlitherLink } from './variety/slither2'
import { postCanvasReady } from './puzzle/Puzzle'
import { onMounted, ref } from 'vue'

const editModes = ref<string[]>([])
const playModes = ref<string[]>([])
let puzzle: SlitherLink = null
onMounted(() => {
    puzzle = new SlitherLink(document.querySelector("#puzzle"))
    puzzle.mount(document.querySelector("#puzzle"))

    //puzzle.on("ready", postCanvasReady)
    postCanvasReady(puzzle)
    puzzle.setMode("edit")
    puzzle.mouse.setInputMode("auto")

    editModes.value = ["auto", ...puzzle.mouse.inputModes.edit]
    playModes.value = ["auto", ...puzzle.mouse.inputModes.play]
})

const editplay = ref<"edit" | "play">("edit")
const toggleEditPlay = (newMode: "edit" | "play") => {
    if (editplay.value == newMode) return;

    editplay.value = newMode
    if (puzzle) {
        puzzle.setMode(newMode)
        puzzle.mouse.setInputMode("auto")
    }
}

const nowMode = ref("auto")
const changeMode = (newMode: string) => {
    if (nowMode.value == newMode) return;

    if (puzzle) {
        nowMode.value = newMode
        puzzle.mouse.setInputMode(nowMode.value)
    }
}

const url = ref("")
const exportUrl = () => {
    url.value = puzzle.getURL(0)
}

const resultText = ref("")
const complete = ref(false)
const check = () => {
    const result = puzzle.check(true)
    resultText.value = result.text
    if (result.complete) {
        complete.value = true
    }
}

</script>

<template>
    <div class="container">
        <div class="editplay">
            <div @click="toggleEditPlay('edit')" class="editplay-item" :class="{ 'active': editplay == 'edit' }">edit
            </div>
            <div @click="toggleEditPlay('play')" class="editplay-item" :class="{ 'active': editplay == 'play' }">play
            </div>
        </div>
        <div class="mode" v-show="editplay == 'edit'">
            <div v-for="mode in editModes" @click="changeMode(mode)" class="mode-item"
                :class="{ 'active': nowMode == mode }">{{ mode }}
            </div>
        </div>
        <div class="mode" v-show="editplay == 'play'">
            <div v-for="mode in playModes" @click="changeMode(mode)" class="mode-item"
                :class="{ 'active': nowMode == mode }">{{ mode }}
            </div>
        </div>

        <div id="puzzle"></div>
        <div class="result" :class="{ 'complete': complete }">
            {{ resultText }}
        </div>
        <div class="tool">
            <button @click="check">Check</button>
        </div>
        <!-- <div>
            <button @click="exportUrl">url出力</button>
            <input type="text" v-model="url" />
        </div> -->
    </div>
</template>

<style scoped>
.container {
    width: 640px;
    max-width: 100%;
    margin: 0 auto;
}

.editplay,
.mode {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    margin: .5rem 0;
}





#puzzle {
    margin: 0 auto;
    width: 400px;
    height: 400px;
    max-width: 100%;
    border: 1px solid black;
    padding: 4px;
}

.editplay>div,
.mode>div {
    /*flex-basis: 100px;*/
    border: 1px solid #ccc;
    border-right-width: 0px;
    padding: .5em .5em;
    text-align: center;
    cursor: pointer;
    user-select: none;
}

.editplay-item {
    flex: 1;
}

.editplay-item:first-child {
    border-radius: 4px 0 0 4px;
}

.editplay-item:last-child {
    border-radius: 0 4px 4px 0;
    border-right-width: 1px;
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
    border-radius: .5em;
    padding: 1em;
    background-color: rgb(120, 214, 214);
    transition: all 0.3s;
    cursor: pointer;
}

button:hover {
    background-color: rgb(163, 228, 228);

}

.tool {
    display: flex;
    justify-content: center;
}

.result {
    text-align: center;
}
</style>

<style>
* {
    box-sizing: border-box;
}

:root {
    font-family: "Verdana", "BIZ UDPGothic", sans-serif;
}
</style>