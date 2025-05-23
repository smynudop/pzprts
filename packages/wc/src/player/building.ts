import * as Lib from "@udop/penpa-player-lib";
import { createPlayer } from "./createPlayer";

export const BuildingPlayer = createPlayer(Lib.Building)
export const SkyscraperPlayer = createPlayer(Lib.Building)