# Supabase運用

Supabaseをデータの正本にしつつ、公開ページは従来どおり静的な `data/*.ts` から生成します。

この段階構成により、既存URLと表示速度を維持したままデータ管理をSupabaseへ移せます。

## 1. プロジェクト作成

Supabaseで新しいプロジェクトを作成します。

作成後、SQL Editorで次のファイルを実行します。

```text
supabase/migrations/202606120001_initial_schema.sql
```

このSQLは以下を作成します。

- `universities`
- `athletes`
- `meets`
- `races`
- `entries`
- `results`
- `personal_bests`
- 外部キー、重複防止制約、インデックス
- 公開読み取り用RLSポリシー

公開ユーザーには読み取りのみを許可します。追加・更新にはSecret keyが必要です。

## 2. 環境変数

`.env.example` を参考に `.env.local` を作成します。

```bash
cp .env.example .env.local
```

SupabaseのConnect画面またはAPI Keys画面から値を取得します。

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_URL
SUPABASE_SECRET_KEY
```

`SUPABASE_SECRET_KEY` はブラウザへ公開せず、Gitにも追加しないでください。

## 3. 初回投入

現在の `csv/` をSupabaseへ同期します。

最初に整合性だけ確認できます。

```bash
npm run db:push -- --dry-run
```

問題がなければ実際に同期します。

```bash
npm run db:push
```

同期順は外部キーに合わせて次の順番です。

```text
universities
athletes
meets
races
entries
results
personal_bests
```

`athletes.next_race` はレース登録後に二段階目の更新として同期されます。

既存の主キーがある行は更新され、新しい行は追加されます。自動削除は行いません。

## 4. 通常運用

Supabaseでデータを更新した後、ローカルへ取得します。

```bash
npm run db:pull
```

このコマンドは次を実行します。

1. Supabaseから7テーブルを取得
2. `csv/*.csv` を更新
3. `npm run import:csv` と同じ処理で `data/*.ts` を再生成

その後に必ず検証します。

```bash
npm run test:import
npx tsc --noEmit --ignoreDeprecations 6.0
npm run build
```

画面確認後に生成された `data/*.ts` とコード変更をGitへコミットし、Vercelへ反映します。

## 5. 管理画面との関係

現在の `/admin/import` はローカル専用で、CSVへ安全に反映する仕組みを維持しています。

当面は次の運用にします。

1. `/admin/import` で公式結果を解析・照合
2. CSVへ反映
3. `npm run db:push` でSupabaseへ同期
4. 型チェック・ビルド・画面確認

管理画面からSupabaseへ直接保存する機能は、管理者認証を導入してから追加します。Secret keyをブラウザへ渡してはいけません。

## 6. 注意

- Supabase Dashboardで主キーや外部キーを手入力変更しない
- `athletes.university_id` などの参照先を先に登録する
- PB結果は `results.is_pb = true` と `personal_bests` の両方を更新する
- DNS / DNF / DQ は `results.result_status` に保存する
- 日付は `YYYY-MM-DD` で保存する
- Secret keyはVercelのクライアント環境変数に設定しない
- 公開スキーマのテーブルはRLSを無効化しない
