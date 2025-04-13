<script setup lang="ts">
import type { Puzzle } from '../puzzle/Puzzle';
import { onMounted, ref, type Ref } from 'vue'

const playModes = ref<string[]>([])
const props = defineProps<{
    src: string,
    puzzle: Puzzle
}>()

const element = ref<HTMLDivElement>() as Ref<HTMLDivElement>
onMounted(() => {
    props.puzzle.readURL(props.src)

    props.puzzle.mount(element.value)

    props.puzzle.setMode("play")
    props.puzzle.mouse.setInputMode("auto")

    props.puzzle.setCanvasSizeByCellSize(36)
    element.value.style.maxWidth = `${props.puzzle.painter.canvasWidth}px`

    playModes.value = ["auto", ...props.puzzle.mouse.inputModes.play]

    props.puzzle.redraw(true)
})

const nowMode = ref("auto")
const changeMode = (newMode: string) => {
    if (nowMode.value === newMode) return;

    if (props.puzzle) {
        nowMode.value = newMode
        props.puzzle.mouse.setInputMode(nowMode.value)
    }
}

const resultText = ref("")
const complete = ref(false)
const check = () => {
    const result = props.puzzle.check(true)
    resultText.value = result.text
    if (result.complete) {
        complete.value = true
    }
}

</script>

<template>
    <div class="container">
        <div class="mode">
            <div v-for="mode in playModes" @click="changeMode(mode)" class="mode-item"
                :class="{ 'active': nowMode == mode }">{{ mode }}
            </div>
        </div>

        <div id="puzzle" ref="element"></div>
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
    max-width: 100%;
    border: 1px solid black;
    padding: 4px;
}

.editplay>div,
.mode>div {
    /*flex-basis: 100px;*/
    border: 1px solid #ccc;
    border-right-width: 0px;
    padding: .25em .5em;
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
    padding: .5em 0;
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

svg {
    display: block;
}
</style>