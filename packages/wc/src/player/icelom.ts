import * as Lib from "@udop/penpa-player-lib";
import { createPlayer } from "./createPlayer";

export const IcelomPlayer = createPlayer(Lib.Icelom)
export const Icelom2Player = createPlayer(Lib.Icelom2)