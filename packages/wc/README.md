@udop/penpa-player
================

pzprv3形式のURLに対応する、ペンシルパズルを解くためのWeb Componentsです。

## Demo
[こちら](https://smynudop.github.io/pzprts/)


## 使い方
jsdelivrからmodule形式で読み込み、customElementsとして定義を行ってください。
srcにURLを指定してください。pzv.jp/puzz.linkの形式URLのみに対応しています。
カンペン・puzzlebox形式のURLへの対応はありません。

```html

<slitherlink-player src="/* your url */"/>

<script type="module"> 
import { SlitherlinkPlayer } from "https://cdn.jsdelivr.net/npm/@udop/penpa-player/dist/slither.es.js";
customElements.define('slitherlink-player', SlitherlinkPlayer);
</script>
```
## パズル種対応表
`index.es.js`からすべてのコンポーネントを使用できますが、バンドル方法の都合上パフォーマンスが悪く、トラフィック量が増えるため推奨しません。
可能なかぎり、各エントリファイルからimportを行ってください。

<!-- EXPORTS_TABLE_START -->

| パズル名 | ファイル | Export名 |
|---|---|---|
|akari.es.js| `akari.es.js` | `AkariPlayer`, `LightupPlayer` |
|ぐんたいあり| `armyants.es.js` | `ArmyantsPlayer`, `LightupPlayer` |
|バーンズ| `barns.es.js` | `BarnsPlayer` |
|チョコバナナ| `cbanana.es.js` | `CbananaPlayer` |
|チョコナ| `chocona.es.js` | `ChoconaPlayer` |
|カントリーロード| `country.es.js` | `CountryPlayer` |
|createPlayer.es.js| `createPlayer.es.js` | `createPlayer` |
|クリーク| `creek.es.js` | `CreekPlayer` |
|ダブルチョコ| `dbchoco.es.js` | `DbChocoPlayer` |
|ドッスンフワリ| `dosufuwa.es.js` | `DosufuwaPlayer` |
|フィルオミノ| `fillomino.es.js` | `FillominoPlayer` |
|ホタルビーム| `firefly.es.js` | `FireflyPlayer` |
|ファイブセルズ| `fivecells.es.js` | `FivecellsPlayer` |
|フォーセルズ| `fourcells.es.js` | `FourcellsPlayer` |
|橋をかけろ| `hashikake.es.js` | `HashikakePlayer` |
|へびいちご| `hebi.es.js` | `HebiPlayer` |
|ヘルゴルフ| `herugolf.es.js` | `HerugolfPlayer` |
|へやわけ| `heyawake.es.js` | `HeyawakePlayer`, `AyeheyaPlayer` |
|ひとりにしてくれ| `hitori.es.js` | `HitokurePlayer`, `HitoriPlayer` |
|アイスバーン| `icebarn.es.js` | `IcebarnPlayer` |
|アイスローム| `icelom.es.js` | `IcelomPlayer`, `Icelom2Player` |
|お家に帰ろう| `kaero.es.js` | `KaeroPlayer` |
|kakkuro.es.js| `kakkuro.es.js` | `KakkuroPlayer` |
|Kropki| `kropki.es.js` | `KropkiPlayer` |
|黒どこ(黒マスはどこだ)| `kurodoko.es.js` | `KurodokoPlayer` |
|クロット| `kurotto.es.js` | `KurottoPlayer` |
|ＬＩＴＳ| `lits.es.js` | `LitsPlayer` |
|ましゅ| `mashu.es.js` | `MashuPlayer` |
|マイナリズム| `minarism.es.js` | `MinarismPlayer` |
|モチコロ| `mochikoro.es.js` | `MochikoroPlayer` |
|モチにょろ| `mochinyoro.es.js` | `MochinyoroPlayer` |
|月か太陽| `moonsun.es.js` | `MoonSunPlayer` |
|流れるループ| `nagare.es.js` | `NagarePlayer` |
|なげなわ| `nagenawa.es.js` | `NagenawaPlayer` |
|なわばり| `nawabari.es.js` | `NawabariPlayer` |
|のりのり| `norinori.es.js` | `NorinoriPlayer` |
|ナンバーリンク| `numlin.es.js` | `NumberlinkPlayer`, `NumlinPlayer` |
|ぬりぼう| `nuribou.es.js` | `NuribouPlayer` |
|ぬりかべ| `nurikabe.es.js` | `NurikabePlayer` |
|ぬりめいず| `nurimaze.es.js` | `NurimazePlayer` |
|ぬりみさき| `nurimisaki.es.js` | `NurimisakiPlayer` |
|温泉めぐり| `onsen.es.js` | `OnsenPlayer` |
|ペンシルズ| `pencils.es.js` | `PencilsPlayer` |
|リフレクトリンク| `reflect.es.js` | `ReflectPlayer` |
|リングリング| `ringring.es.js` | `RingringPlayer` |
|波及効果| `ripple.es.js` | `RipplePlayer` |
|さしがね| `sashigane.es.js` | `SashiganePlayer` |
|シャカシャカ| `shakashaka.es.js` | `ShakashakaPlayer` |
|四角に切れ| `shikaku.es.js` | `ShikakuPlayer` |
|島国| `shimaguni.es.js` | `ShimaguniPlayer` |
|修学旅行の夜| `shugaku.es.js` | `ShugakuPlayer` |
|シンプルループ| `simpleloop.es.js` | `SimpleLoopPlayer` |
|スラローム| `slalom.es.js` | `SlalomPlayer` |
|スリザーリンク| `slither.es.js` | `SlitherlinkPlayer` |
|スターバトル| `starbattle.es.js` | `StarBattlePlayer` |
|ストストーン| `stostone.es.js` | `StostonePlayer` |
|数独| `sudoku.es.js` | `SudokuPlayer` |
|Tapa| `tapa.es.js` | `TapaPlayer` |
|たすくえあ| `tasquare.es.js` | `TasquarePlayer` |
|天体ショー| `tentaisho.es.js` | `TentaishoPlayer` |
|タイルペイント| `tilepaint.es.js` | `TilePaintPlayer` |
|遠い誓い| `toichika.es.js` | `ToichikaPlayer` |
|yajilin.es.js| `yajilin.es.js` | `YajilinPlayer`, `YajirinPlayer` |
|しろまるくろまる| `yinyang.es.js` | `YinyangPlayer` |
<!-- EXPORTS_TABLE_END -->

## LICENSE
MIT