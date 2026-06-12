# Google Sheets / CSV データ運用

大学長距離データベースでは、Google Sheetsでデータを管理し、CSVを書き出して `data/*.ts` またはSupabaseを更新できます。

本番の通常更新は認証済みの `/admin/import` からSupabaseへ直接反映します。この文書のCSV手順は、初期投入・一括修正・障害時の手動運用として残しています。

この手順は、コードを直接編集せずに大会、レース、出場予定、結果、PBを更新するための運用メモです。

## 全体フロー

1. Google Sheetsでデータを更新する
2. 各タブをCSVで書き出す
3. `csv/` または `data/csv/` にCSVを配置する
4. `npm run import:csv` を実行する
5. エラーがなければ `data/*.ts` が生成される
6. `npx tsc --noEmit --ignoreDeprecations 6.0` を実行する
7. `npm run build` を実行する
8. 画面で追加・更新したページを確認する
9. Git commitする
10. Vercelへ反映する

Supabaseを正本として運用する場合は、[Supabase運用](supabase.md)も参照してください。

## CSVファイル名

`csv/` または `data/csv/` に以下のファイル名で置きます。

```text
universities.csv
athletes.csv
meets.csv
races.csv
entries.csv
results.csv
personal_bests.csv
status_master.csv
event_type_master.csv
```

必須CSVは以下です。

```text
universities.csv
athletes.csv
meets.csv
races.csv
entries.csv
results.csv
personal_bests.csv
```

`status_master.csv` と `event_type_master.csv` は任意ですが、置いておくとステータスや種目の許可値チェックに使えます。

## 入力順

新しいデータは次の順番で入力します。

1. `universities`
2. `athletes`
3. `meets`
4. `races`
5. `entries`
6. `results`
7. `personal_bests`

後続のデータが前のIDを参照するため、この順番にすると入力ミスを減らせます。

例:

- `athletes.university_id` は `universities.id` を参照する
- `races.meet_id` は `meets.meet_id` を参照する
- `entries.race_id` は `races.race_id` を参照する
- `results.athlete_id` は `athletes.id` を参照する
- `personal_bests.source_result_id` は `results.result_id` を参照する

## Importコマンド

通常運用では、プロジェクト直下の `csv/` または `data/csv/` を読み込みます。

```bash
npm run import:csv
```

テスト用にCSVディレクトリや出力先を指定することもできます。

```bash
npm run import:csv -- --csv-dir /path/to/csv --out-dir /path/to/output
```

`--csv-dir` はCSVを置いたディレクトリです。

`--out-dir` は生成先です。テスト時に指定すると、実際の `data/*.ts` を上書きせずに確認できます。

## Import前後の注意

- エラーがある場合、`data/*.ts` は生成しません
- 空欄は `null` として扱います
- 画面には `null` / `undefined` を表示しません
- CSVの日付は `YYYY-MM-DD` のまま保存します
- 表示側で `5/24(日)` のように変換します
- `DNS` / `DNF` / `DQ` は `result_status` に入れます
- PB結果は `results.is_pb = TRUE` にします
- PB更新時は `personal_bests` も更新します
- Google SheetsからCSV出力する際、カンマや改行を含むセルがある場合は列ズレが起きていないか確認します
- import前に `git status` を確認し、未コミットの重要な変更がない状態で実行します
- `results.is_pb = TRUE` にした場合は、必ず `personal_bests` も更新します
- import後は必ず `npx tsc --noEmit --ignoreDeprecations 6.0` と `npm run build` を実行します

## よくあるエラーと対処

### university_id が存在しない

`athletes`、`entries`、`results`、`personal_bests` の `university_id` が `universities.id` に存在しない状態です。

対処:

- `universities.csv` に大学が登録されているか確認する
- IDのスペル、ハイフン、余分な空白を確認する

### athlete_id が存在しない

`entries`、`results`、`personal_bests` の `athlete_id` が `athletes.id` に存在しない状態です。

対処:

- `athletes.csv` に選手が登録されているか確認する
- 同姓同名対策として、名前ではなくIDで参照しているか確認する

### race_id が存在しない

`entries` や `results` の `race_id` が `races.race_id` に存在しない状態です。

対処:

- `races.csv` にレースが登録されているか確認する
- `mens-10000m-3` などのID表記を統一する

### meet_id が存在しない

`races`、`entries`、`results` の `meet_id` が `meets.meet_id` に存在しない状態です。

対処:

- `meets.csv` に大会が登録されているか確認する
- レース側と結果側の `meet_id` が同じ大会を指しているか確認する

### source_result_id が存在しない

`personal_bests.source_result_id` が `results.result_id` に存在しない状態です。

対処:

- PBの元になった結果が `results.csv` に登録されているか確認する
- 手入力PBの場合は `source_type = manual` とし、`source_result_id` は空欄でもよい

### slug が重複している

URL用の `slug` が同じになっています。

対処:

- `universities.slug`、`athletes.slug`、`meets.slug`、`races.slug` を確認する
- 同名に近いデータは年度や種目を含めて区別する

### status が master にない

`status`、`entry_status`、`result_status` が許可値に含まれていません。

対処:

- `status_master.csv` を確認する
- MVPでは主に以下を使う

```text
scheduled
coming_soon
startlist_published
result_waiting
result_published
entered
listed
started
unconfirmed
finished
dns
dnf
dq
```

### distance が master にない

`distance` が許可値に含まれていません。

対処:

- `event_type_master.csv` を確認する
- MVPでは主に以下を使う

```text
1500m
5000m
10000m
ハーフ
```

### TRUE / FALSE の表記ミス

`has_upcoming`、`has_result`、`is_pb` は `TRUE` / `FALSE` で入力します。

対処:

- `TRUE` / `FALSE` の大文字表記に統一する
- 空欄は `FALSE` 扱いになるため、PBなど必要な行は必ず `TRUE` を入れる

### 日付形式が YYYY-MM-DD ではない

CSVでは `2026-05-24` の形式で保存します。

対処:

- Google Sheets側の表示形式を日付ではなくプレーンテキストにする
- `5/24(日)` はCSVに直接入れない

## 公開前チェック

Import後は必ず以下を実行します。

```bash
npx tsc --noEmit --ignoreDeprecations 6.0
npm run build
```

可能であれば、以下の画面も確認します。

- トップページ
- 大会一覧
- 結果一覧
- 大学一覧
- 選手一覧
- 検索
- 追加した大会詳細
- 追加したレース詳細
- 追加した結果詳細
- 追加した選手詳細

## ENOTEMPTY が出た場合

`npm run build` 中に `.next/server` の一時削除で `ENOTEMPTY` が出ることがあります。

まずは同じコマンドを再実行します。

```bash
npm run build
```

それでも出る場合は `.next` を削除してから再buildします。

```bash
rm -rf .next && npm run build
```

## MVPではやらないこと

以下はMVPでは未対応です。

- Google Sheets APIとのリアルタイム同期
- Google Sheets APIとのリアルタイム同期
- 公式結果の無確認な自動登録
- 自動OCR取り込み
- 公式サイトの自動スクレイピング
- 完全自動PB判定

## 実運用チェックリスト

```text
□ Google Sheetsを更新した
□ 各タブをCSV出力した
□ CSVファイル名が正しい
□ IDの重複がない
□ 参照先IDが存在する
□ PB結果は results.is_pb = TRUE にした
□ PB更新時は personal_bests も更新した
□ npm run import:csv が成功した
□ npx tsc --noEmit --ignoreDeprecations 6.0 が成功した
□ npm run build が成功した
□ 追加・更新したページを画面確認した
□ Git commitした
□ Vercel反映後の画面を確認した
```
