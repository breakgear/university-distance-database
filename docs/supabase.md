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

## 4. Vercel管理画面の設定

本番の `/admin/import` はSupabase Authによるログインを必須にします。

Supabase Dashboardの `Authentication > Users` で管理者ユーザーを作成し、Vercelに次の環境変数を設定します。

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_URL
SUPABASE_SECRET_KEY
ADMIN_EMAILS
ADMIN_IMPORT_STORAGE=supabase
SUPABASE_BUILD_SYNC=true
VERCEL_DEPLOY_HOOK_URL
```

`ADMIN_EMAILS` はログインを許可するメールアドレスです。複数の場合はカンマ区切りにします。

VercelのDeploy Hookは `Project Settings > Git > Deploy Hooks` でmainブランチ向けに作成します。URLはブラウザへ公開されない `VERCEL_DEPLOY_HOOK_URL` に設定してください。

## 5. 自動運用

本番管理画面では次の処理を自動で行います。

1. URL・コピペ・PDFのうち2種類以上を解析
2. 管理者が差分を確認
3. Supabaseの7テーブルへ更新
4. Vercel Deploy Hookを呼び出す
5. VercelビルドがSupabaseから最新データを取得
6. `data/*.ts` を生成して公開ページを再ビルド

通常のデータ投入では、ローカルCSVの編集、`db:push`、Git commitは不要です。

## 6. ローカルでの取得・検証

Supabaseの内容をローカルへ取得する場合は次を実行します。

```bash
npm run db:pull
npm run test:import
npx tsc --noEmit --ignoreDeprecations 6.0
npm run build
```

ローカル管理画面をSupabase保存モードで試す場合だけ、`.env.local` に `ADMIN_IMPORT_STORAGE=supabase` を設定します。確認なしで実データ反映ボタンを押さないでください。

## 7. 注意

- Supabase Dashboardで主キーや外部キーを手入力変更しない
- `athletes.university_id` などの参照先を先に登録する
- PB結果は `results.is_pb = true` と `personal_bests` の両方を更新する
- DNS / DNF / DQ は `results.result_status` に保存する
- 日付は `YYYY-MM-DD` で保存する
- Secret keyはVercelのクライアント環境変数に設定しない
- Deploy Hook URLもブラウザへ公開しない
- `ADMIN_EMAILS` に含まれないユーザーは管理画面を利用できない
- 公開スキーマのテーブルはRLSを無効化しない
