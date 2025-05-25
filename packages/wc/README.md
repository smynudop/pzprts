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
|美術館| `akari.es.js` | `AkariPlayer`, `LightupPlayer` |
|ぐんたいあり| `armyants.es.js` | `ArmyantsPlayer`, `LightupPlayer` |
|アルコネ| `arukone.es.js` | `ArukonePlayer` |
|バッグ| `bag.es.js` | `BagPlayer` |
|バーンズ| `barns.es.js` | `BarnsPlayer` |
|ボーダーブロック| `bdblock.es.js` | `BdblockPlayer` |
|ボックス| `box.es.js` | `BoxPlayer` |
|ビルディングパズル| `building.es.js` | `BuildingPlayer`, `SkyscraperPlayer` |
|チョコバナナ| `cbanana.es.js` | `CbananaPlayer` |
|チョコナ| `chocona.es.js` | `ChoconaPlayer` |
|カントリーロード| `country.es.js` | `CountryPlayer` |
|createPlayer.es.js| `createPlayer.es.js` | `createPlayer` |
|クリーク| `creek.es.js` | `CreekPlayer` |
|ダブルチョコ| `dbchoco.es.js` | `DbChocoPlayer` |
|ドッスンフワリ| `dosufuwa.es.js` | `DosufuwaPlayer` |
|ABCプレース| `easyasabc.es.js` | `EasyAsAbcPlayer` |
|因子の部屋| `factors.es.js` | `FactorsPlayer` |
|フィルオミノ| `fillomino.es.js` | `FillominoPlayer` |
|ホタルビーム| `firefly.es.js` | `FireflyPlayer` |
|ファイブセルズ| `fivecells.es.js` | `FivecellsPlayer` |
|フォーセルズ| `fourcells.es.js` | `FourcellsPlayer` |
|碁石ひろい| `goishi.es.js` | `GoishiPlayer` |
|ごきげんななめ| `gokigen.es.js` | `GokigenPlayer` |
|はこいり○△□| `hakoiri.es.js` | `HakoiriPlayer` |
|橋をかけろ| `hashikake.es.js` | `HashikakePlayer` |
|へびいちご| `hebi.es.js` | `HebiPlayer` |
|ヘルゴルフ| `herugolf.es.js` | `HerugolfPlayer` |
|へやわけ| `heyawake.es.js` | `HeyawakePlayer`, `AyeheyaPlayer` |
|ひとりにしてくれ| `hitori.es.js` | `HitoriPlayer` |
|アイスバーン| `icebarn.es.js` | `IcebarnPlayer` |
|アイスローム| `icelom.es.js` | `IcelomPlayer`, `Icelom2Player` |
|縦横さん| `juosan.es.js` | `JuosanPlayer` |
|お家に帰ろう| `kaero.es.js` | `KaeroPlayer` |
|カックロ| `kakkuro.es.js` | `KakkuroPlayer` |
|キンコンカン| `kinkonkan.es.js` | `KinkonkanPlayer` |
|Kropki| `kropki.es.js` | `KropkiPlayer` |
|黒どこ(黒マスはどこだ)| `kurodoko.es.js` | `KurodokoPlayer` |
|クロット| `kurotto.es.js` | `KurottoPlayer` |
|ＬＩＴＳ| `lits.es.js` | `LitsPlayer` |
|マカロ| `makaro.es.js` | `MakaroPlayer` |
|ましゅ| `mashu.es.js` | `MashuPlayer` |
|マイナリズム| `minarism.es.js` | `MinarismPlayer` |
|モチコロ| `mochikoro.es.js` | `MochikoroPlayer` |
|モチにょろ| `mochinyoro.es.js` | `MochinyoroPlayer` |
|月か太陽| `moonsun.es.js` | `MoonSunPlayer` |
|流れるループ| `nagare.es.js` | `NagarePlayer` |
|なげなわ| `nagenawa.es.js` | `NagenawaPlayer` |
|なわばり| `nawabari.es.js` | `NawabariPlayer` |
|のりのり| `norinori.es.js` | `NorinoriPlayer` |
|ナンバーリンク| `numlin.es.js` | `NumlinPlayer` |
|ぬりぼう| `nuribou.es.js` | `NuribouPlayer` |
|ぬりかべ| `nurikabe.es.js` | `NurikabePlayer` |
|ぬりめいず| `nurimaze.es.js` | `NurimazePlayer` |
|ぬりみさき| `nurimisaki.es.js` | `NurimisakiPlayer` |
|温泉めぐり| `onsen.es.js` | `OnsenPlayer` |
|ペンシルズ| `pencils.es.js` | `PencilsPlayer` |
|リフレクトリンク| `reflect.es.js` | `ReflectPlayer` |
|リングリング| `ringring.es.js` | `RingringPlayer` |
|波及効果| `ripple.es.js` | `RipplePlayer` |
|ろーま| `roma.es.js` | `RomaPlayer` |
|さしがね| `sashigane.es.js` | `SashiganePlayer` |
|シャカシャカ| `shakashaka.es.js` | `ShakashakaPlayer` |
|四角に切れ| `shikaku.es.js` | `ShikakuPlayer` |
|島国| `shimaguni.es.js` | `ShimaguniPlayer` |
|修学旅行の夜| `shugaku.es.js` | `ShugakuPlayer` |
|シンプルループ| `simpleloop.es.js` | `SimpleLoopPlayer` |
|スラローム| `slalom.es.js` | `SlalomPlayer` |
|スリザーリンク| `slither.es.js` | `SlitherPlayer` |
|スターバトル| `starbattle.es.js` | `StarBattlePlayer` |
|ストストーン| `stostone.es.js` | `StostonePlayer` |
|数独| `sudoku.es.js` | `SudokuPlayer` |
|数コロ| `sukoro.es.js` | `SukoroPlayer` |
|数コロ部屋| `sukororoom.es.js` | `SukoroRoomPlayer` |
|Tapa| `tapa.es.js` | `TapaPlayer` |
|たすくえあ| `tasquare.es.js` | `TasquarePlayer` |
|タタミバリ| `tatamibari.es.js` | `TatamibariPlayer` |
|タテボーヨコボー| `tateyoko.es.js` | `TateyokoPlayer` |
|天体ショー| `tentaisho.es.js` | `TentaishoPlayer` |
|タイルペイント| `tilepaint.es.js` | `TilePaintPlayer` |
|遠い誓い| `toichika.es.js` | `ToichikaPlayer` |
|ウソワン| `usoone.es.js` | `UsoonePlayer` |
|ヴィウ| `view.es.js` | `ViewPlayer` |
|ごきげんななめ・輪切| `wagiri.es.js` | `WagiriPlayer` |
|ウォールロジック| `walllogic.es.js` | `WalllogicPlayer` |
|シロクロリンク| `wblink.es.js` | `WblinkPlayer` |
|やじさんかずさん| `yajikazu.es.js` | `YajikazuPlayer` |
|ヤジリン| `yajilin.es.js` | `YajilinPlayer`, `YajirinPlayer` |
|しろまるくろまる| `yinyang.es.js` | `YinyangPlayer` |
|よせなべ| `yosenabe.es.js` | `YosenabePlayer` |
<!-- EXPORTS_TABLE_END -->

## LICENSE
MIT