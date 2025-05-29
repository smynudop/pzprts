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
|アホになり切れ| `aho.es.js` | `AhoPlayer` |
|美術館| `akari.es.js` | `AkariPlayer`, `LightupPlayer` |
|あみぼー| `amibo.es.js` | `AmiboPlayer` |
|ぐんたいあり| `armyants.es.js` | `ArmyantsPlayer` |
|アルコネ| `arukone.es.js` | `ArukonePlayer` |
|バッグ| `bag.es.js` | `BagPlayer` |
|バーンズ| `barns.es.js` | `BarnsPlayer` |
|ボーダーブロック| `bdblock.es.js` | `BdblockPlayer` |
|ぼんさん| `bonsan.es.js` | `BonsanPlayer` |
|ボサノワ| `bosanowa.es.js` | `BosanowaPlayer` |
|ボックス| `box.es.js` | `BoxPlayer` |
|ビルディングパズル| `building.es.js` | `BuildingPlayer`, `SkyscraperPlayer` |
|チョコバナナ| `cbanana.es.js` | `CbananaPlayer` |
|コンビブロック| `cbblock.es.js` | `CbblockPlayer` |
|チョコナ| `chocona.es.js` | `ChoconaPlayer` |
|コージュン| `cojun.es.js` | `CojunPlayer` |
|カントリーロード| `country.es.js` | `CountryPlayer` |
|createPlayer.es.js| `createPlayer.es.js` | `createPlayer` |
|クリーク| `creek.es.js` | `CreekPlayer` |
|ダブルチョコ| `dbchoco.es.js` | `DbChocoPlayer` |
|ドッスンフワリ| `dosufuwa.es.js` | `DosufuwaPlayer` |
|ABCプレース| `easyasabc.es.js` | `EasyAsAbcPlayer` |
|因子の部屋| `factors.es.js` | `FactorsPlayer` |
|フィルマット| `fillmat.es.js` | `FillmatPlayer` |
|フィルオミノ| `fillomino.es.js` | `FillominoPlayer` |
|ホタルビーム| `firefly.es.js` | `FireflyPlayer` |
|ファイブセルズ| `fivecells.es.js` | `FivecellsPlayer` |
|フォーセルズ| `fourcells.es.js` | `FourcellsPlayer` |
|碁石ひろい| `goishi.es.js` | `GoishiPlayer` |
|ごきげんななめ| `gokigen.es.js` | `GokigenPlayer` |
|はこいり○△□| `hakoiri.es.js` | `HakoiriPlayer` |
|はなれ組| `hanare.es.js` | `HanarePlayer` |
|橋をかけろ| `hashikake.es.js` | `HashikakePlayer` |
|へびいちご| `hebi.es.js` | `HebiPlayer` |
|ヘルゴルフ| `herugolf.es.js` | `HerugolfPlayer` |
|へやぼん| `heyabon.es.js` | `HeyabonPlayer` |
|へやわけ| `heyawake.es.js` | `HeyawakePlayer`, `AyeheyaPlayer` |
|ひとりにしてくれ| `hitori.es.js` | `HitoriPlayer` |
|アイスバーン| `icebarn.es.js` | `IcebarnPlayer` |
|アイスローム| `icelom.es.js` | `IcelomPlayer`, `Icelom2Player` |
|イチマガ| `ichimaga.es.js` | `IchimagaPlayer`, `IchimagamPlayer`, `IchimagaxPlayer` |
|縦横さん| `juosan.es.js` | `JuosanPlayer` |
|お家に帰ろう| `kaero.es.js` | `KaeroPlayer` |
|カックロ| `kakkuro.es.js` | `KakkuroPlayer` |
|カックル| `kakuru.es.js` | `KakuruPlayer` |
|かずのりのへや| `kazunori.es.js` | `KazunoriPlayer` |
|キンコンカン| `kinkonkan.es.js` | `KinkonkanPlayer` |
|交差は直角に限る| `kouchoku.es.js` | `KouchokuPlayer` |
|快刀乱麻| `kramma.es.js` | `KrammaPlayer` |
|新・快刀乱麻| `kramman.es.js` | `KrammanPlayer` |
|Kropki| `kropki.es.js` | `KropkiPlayer` |
|クロシュート| `kurochute.es.js` | `KurochutePlayer` |
|黒どこ(黒マスはどこだ)| `kurodoko.es.js` | `KurodokoPlayer` |
|クロット| `kurotto.es.js` | `KurottoPlayer` |
|クサビリンク| `kusabi.es.js` | `KusabiPlayer` |
|ＬＩＴＳ| `lits.es.js` | `LitsPlayer` |
|るっくえあ| `lookair.es.js` | `LookairPlayer` |
|環状線スペシャル| `loopsp.es.js` | `LoopspPlayer` |
|エルート| `loute.es.js` | `LoutePlayer` |
|マカロ| `makaro.es.js` | `MakaroPlayer` |
|ましゅ| `mashu.es.js` | `MashuPlayer` |
|メジリンク| `mejilink.es.js` | `MejilinkPlayer` |
|マイナリズム| `minarism.es.js` | `MinarismPlayer` |
|モチコロ| `mochikoro.es.js` | `MochikoroPlayer` |
|モチにょろ| `mochinyoro.es.js` | `MochinyoroPlayer` |
|月か太陽| `moonsun.es.js` | `MoonSunPlayer` |
|流れるループ| `nagare.es.js` | `NagarePlayer` |
|なげなわ| `nagenawa.es.js` | `NagenawaPlayer` |
|ナンロー| `nanro.es.js` | `NanroPlayer` |
|なわばり| `nawabari.es.js` | `NawabariPlayer` |
|ノンダンゴ| `nondango.es.js` | `NondangoPlayer` |
|のりのり| `norinori.es.js` | `NorinoriPlayer` |
|ナンバーリンク| `numlin.es.js` | `NumlinPlayer` |
|ぬりぼう| `nuribou.es.js` | `NuribouPlayer` |
|ぬりかべ| `nurikabe.es.js` | `NurikabePlayer` |
|ぬりめいず| `nurimaze.es.js` | `NurimazePlayer` |
|ぬりみさき| `nurimisaki.es.js` | `NurimisakiPlayer` |
|温泉めぐり| `onsen.es.js` | `OnsenPlayer` |
|ペイントエリア| `paintarea.es.js` | `PaintareaPlayer` |
|ペンシルズ| `pencils.es.js` | `PencilsPlayer` |
|パイプリンク| `pipelink.es.js` | `PipelinkPlayer` |
|帰ってきたパイプリンク| `pipelinkr.es.js` | `PipelinkrPlayer` |
|四角スライダー| `rectslider.es.js` | `RectsliderPlayer` |
|リフレクトリンク| `reflect.es.js` | `ReflectPlayer` |
|連番窓口| `renban.es.js` | `RenbanPlayer` |
|リングリング| `ringring.es.js` | `RingringPlayer` |
|波及効果| `ripple.es.js` | `RipplePlayer` |
|ろーま| `roma.es.js` | `RomaPlayer` |
|さしがね| `sashigane.es.js` | `SashiganePlayer` |
|さとがえり| `sato.es.js` | `SatoPlayer` |
|シャカシャカ| `shakashaka.es.js` | `ShakashakaPlayer` |
|四角に切れ| `shikaku.es.js` | `ShikakuPlayer` |
|島国| `shimaguni.es.js` | `ShimaguniPlayer` |
|修学旅行の夜| `shugaku.es.js` | `ShugakuPlayer` |
|ヤギとオオカミ| `shwolf.es.js` | `ShwolfPlayer` |
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
|たわむれんが| `tawa.es.js` | `TawaPlayer` |
|天体ショー| `tentaisho.es.js` | `TentaishoPlayer` |
|タイルペイント| `tilepaint.es.js` | `TilePaintPlayer` |
|遠い誓い| `toichika.es.js` | `ToichikaPlayer` |
|トリプレイス| `triplace.es.js` | `TriplacePlayer` |
|ウソワン| `usoone.es.js` | `UsoonePlayer` |
|ウソタタミ| `usotatami.es.js` | `UsotatamiPlayer` |
|ヴィウ| `view.es.js` | `ViewPlayer` |
|ごきげんななめ・輪切| `wagiri.es.js` | `WagiriPlayer` |
|ウォールロジック| `walllogic.es.js` | `WalllogicPlayer` |
|シロクロリンク| `wblink.es.js` | `WblinkPlayer` |
|やじさんかずさん| `yajikazu.es.js` | `YajikazuPlayer` |
|ヤジリン| `yajilin.es.js` | `YajilinPlayer`, `YajirinPlayer` |
|ヤジタタミ| `yajitatami.es.js` | `YajitatamiPlayer` |
|しろまるくろまる| `yinyang.es.js` | `YinyangPlayer` |
|よせなべ| `yosenabe.es.js` | `YosenabePlayer` |
<!-- EXPORTS_TABLE_END -->

## LICENSE
MIT