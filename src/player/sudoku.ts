import { Sudoku } from '../variety/sudoku';
import { createPlayer } from '../components/webComponent';

// Custom Element のコンストラクタに変換
export const SudokuPlayer = createPlayer(Sudoku)