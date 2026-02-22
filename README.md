# Study OS Web (MVP)

PDF要約 + 大量暗記カード + Notion貼り付け補助の学習サイトです。

## できること

- PDFをアップロードして本文抽出
- 本文をAIで要約し、暗記カードを大量生成（10〜120目標）
- Notion本文を貼り付けて同様に生成
- 4段階評価（もう一度/難しい/普通/簡単）で復習間隔を更新
- カードはブラウザLocalStorageに保存

## セットアップ

```bash
npm install
npm run dev
```

`/Users/kentatakamatsu/Desktop/New project/.env.local`:

```env
OPENAI_API_KEY=sk-xxxxx
```

## デプロイ（Vercel）

1. GitHubにpush
2. VercelでImport Project
3. Environment Variablesに `OPENAI_API_KEY` を設定
4. Deploy

## 注意

- 最初は自分用MVPとして設計
- Notion OAuthは未実装（手動貼り付け運用）
