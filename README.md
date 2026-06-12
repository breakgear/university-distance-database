# 大学長距離データベース

Next.js + TypeScript + Tailwind CSSで作成した、男子大学長距離・男子大学駅伝向けの非公式データベースUIプロトタイプです。

大会、レース、結果、大学、選手、PB、出場予定を確認できるようにしています。

## 起動方法

```bash
npm install
npm run dev
```

ブラウザで以下を開きます。

```text
http://localhost:3000
```

## 本番URL

Vercelで公開中のURL：

```text
https://university-distance-database.vercel.app/
```

注意：

- ローカル開発は `http://localhost:3000`
- 本番確認は Vercel URL を使う

## 主なページ

| URL                                   | ページ      |
| ------------------------------------- | -------- |
| `/`                                   | トップページ   |
| `/meets`                              | 大会一覧ページ  |
| `/meets/kanto-10000m`                 | 大会詳細ページ  |
| `/races/mens-10000m-3`                | レース詳細ページ |
| `/results`                            | 結果一覧ページ  |
| `/results/kanto-10000m-mens-10000m-3` | 結果詳細ページ  |
| `/universities`                       | 大学一覧ページ  |
| `/universities/aoba`                  | 大学詳細ページ  |
| `/athletes`                           | 選手一覧ページ  |
| `/athletes/saeki`                     | 選手詳細ページ  |
| `/search`                             | 検索ページ    |

## データ構成

静的サンプルデータは `data` ディレクトリにあります。

MVP段階では、以下の7つのデータファイルを中心に管理します。

```text
data/universities.ts
data/athletes.ts
data/meets.ts
data/races.ts
data/entries.ts
data/results.ts
data/personalBests.ts
```

主な関係は以下です。

```text
大学 → 選手
大会 → レース
レース → 出場予定 entries
レース → 結果 results
選手 → PB personalBests
```

## CSV運用

Google Sheets / CSV から `data/*.ts` を生成する運用に対応しています。

CSV取り込みコマンド：

```bash
npm run import:csv
```

CSVファイルは、`csv/` または `data/csv/` に配置します。

詳しい手順は [docs/data-import.md](docs/data-import.md) を参照してください。

## Supabase運用

Supabaseをデータの正本として使い、取得したデータから `data/*.ts` を生成する段階移行に対応しています。

```bash
npm run db:push
npm run db:pull
```

セットアップと安全な運用手順は [docs/supabase.md](docs/supabase.md) を参照してください。

## 検証コマンド

型チェック：

```bash
npx tsc --noEmit --ignoreDeprecations 6.0
```

ビルド：

```bash
npm run build
```

## 現在の前提

* SupabaseへのCSV同期とSupabaseからの静的データ生成に対応
* Google Sheets APIとのリアルタイム同期は未実装
* 管理画面は未実装
* 公式サイトの自動スクレイピングは未実装
* MVPではGoogle Sheets / CSVまたはSupabaseから`data/*.ts`を生成する運用を想定
* 掲載データは非公式に整理したもの
* 正式な大会情報・記録は各大会公式サイトを確認する前提
* このプロジェクトは公開前のMVPであり、掲載データ・URL構成・運用方法は今後変更される可能性があります。
