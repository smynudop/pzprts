import Slitherlink from "./player/slitherlink.svelte"
import Mashu from "./player/mashu.svelte"
import Numberlink from "./player/numberlink.svelte"
import Sudoku from "./player/sudoku.svelte"
import Kakkuro from "./player/kakkuro.svelte"
import Nurikabe from "./player/nurikabe.svelte"
import Fillomino from "./player/fillomino.svelte"
//@ts-ignore
export const SlitherlinkPlayer = Slitherlink.element as new () => HTMLElement
//@ts-ignore
export const MashuPlayer = Mashu.element as new () => HTMLElement
//@ts-ignore
export const NumberlinkPlayer = Numberlink.element as new () => HTMLElement
//@ts-ignore
export const SudokuPlayer = Sudoku.element as new () => HTMLElement
//@ts-ignore
export const KakkuroPlayer = Kakkuro.element as new () => HTMLElement
//@ts-ignore
export const NurikabePlayer = Nurikabe.element as new () => HTMLElement
//@ts-ignore
export const FillominoPlayer = Fillomino.element as new () => HTMLElement