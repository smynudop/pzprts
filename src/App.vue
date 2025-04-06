<script setup lang="ts">
import { SlitherLink } from './variety/slither2'
import { postCanvasReady } from './puzzle/Puzzle'
import { onMounted, ref } from 'vue'

const editModes = ref<string[]>([])
const playModes = ref<string[]>([])
let puzzle: SlitherLink = null
onMounted(() => {
    puzzle = new SlitherLink(document.getElementById("puzzle") as any, {})

    puzzle.clear()
    puzzle.on("ready", postCanvasReady)
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

</script>

<template>
    <div class="editplay">
        <div @click="toggleEditPlay('edit')" :class="{ 'active': editplay == 'edit' }">edit</div>
        <div @click="toggleEditPlay('play')" :class="{ 'active': editplay == 'play' }">play</div>
    </div>
    <div class="mode" v-show="editplay == 'edit'">
        <div v-for="mode in editModes" @click="changeMode(mode)" :class="{ 'active': nowMode == mode }">{{ mode }}</div>
    </div>
    <div class="mode" v-show="editplay == 'play'">
        <div v-for="mode in playModes" @click="changeMode(mode)" :class="{ 'active': nowMode == mode }">{{ mode }}</div>
    </div>

    <div id="puzzle"></div>
</template>

<style scoped>
.editplay,
.mode {
    display: flex;
    flex-wrap: wrap;
}

.editplay>div,
.mode>div {
    flex-basis: 100px;
    border: 1px solid #ccc;
    padding: .25em;
    text-align: center;
}

.active {
    background-color: aquamarine;
}

#puzzle {
    width: 400px;
    height: 400px;
    border: 1px solid black;
}
</style>