# PDF.js 不具合トラブルシューティング

## 現在発生している問題

### 主な症状
- PDF読み込み時に以下のエラーが発生
  ```
  PDF Load Error: Ue {message: 'The API version "X.X.X" does not match the Worker version "Y.Y.Y"'}
  api.js:2994 Uncaught TypeError: Cannot read properties of null (reading 'sendWithPromise')
  ```

### 根本原因
1. **バージョン不一致**: react-pdfライブラリとpdfjs-distパッケージのバージョンが一致していない
2. **Worker設定問題**: PDF.js Workerの読み込みパスや設定が正しくない
3. **React 19互換性**: 新しいReactバージョンとPDFライブラリの互換性問題
4. **CI/CD環境の依存関係競合**: GitHub Actionsでのnpm ciが失敗

## 実施した対策の履歴

### 1. 初期設定 (最新版使用)
```json
"react-pdf": "^9.2.1",
"pdfjs-dist": "^4.8.69"
```

**問題**: バージョンマッチングエラー
- API version 4.8.69 vs Worker version 3.4.120

### 2. Worker URL修正 (複数回試行)

#### 試行A: CDN URLを最新版に更新
```javascript
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.js`;
```
**結果**: 依然としてバージョン不一致エラー

#### 試行B: 動的インポート使用
```javascript
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();
```
**結果**: Create React Appでimport.meta.url未対応

#### 試行C: PUBLIC_URLを使用
```javascript
pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.js`;
```
- node_modulesから正しいworkerファイルをpublicディレクトリにコピー
**結果**: 依然としてAPIエラー

### 3. パッケージダウングレード (安定版使用)
```json
"react-pdf": "7.7.3",
"pdfjs-dist": "3.11.174"
```

**理由**: 
- 実績のある安定したバージョン組み合わせ
- React 18以下での動作実績あり

**Worker設定**:
```javascript
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
```

### 4. CI/CD環境での依存関係修正

#### 問題
```
npm error ERESOLVE could not resolve
peerOptional @types/react@"^16.8.0 || ^17.0.0 || ^18.0.0" from react-pdf@7.7.3
Found: @types/react@19.1.8
```

#### 解決策: .npmrc設定
```
legacy-peer-deps=true
```

**効果**: 
- GitHub ActionsのCI/CDパイプラインが成功
- peer dependencyの競合を回避

## 現在の設定状況

### パッケージバージョン
```json
{
  "react": "^19.1.0",
  "react-pdf": "^7.7.3",
  "pdfjs-dist": "^3.11.174"
}
```

### Worker設定
```javascript
// MapViewer.tsx
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
```

### Document設定
```javascript
<Document
  options={{
    cMapUrl: `https://unpkg.com/pdfjs-dist@3.11.174/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/`,
  }}
>
```

### ビルド設定
- `.npmrc`: `legacy-peer-deps=true`
- GitHub Actions: npm ciでlegacy peer deps使用

## ✅ 最終解決策: React 18ダウングレード

### 実施内容 (2025-06-14)
```bash
# React 19 → React 18へダウングレード
npm uninstall react react-dom @types/react @types/react-dom
npm install react@^18.2.0 react-dom@^18.2.0 @types/react@^18.2.0 @types/react-dom@^18.2.0
rm .npmrc  # legacy-peer-deps不要に
```

### 新しい構成
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1", 
  "@types/react": "^18.3.23",
  "@types/react-dom": "^18.3.7",
  "react-pdf": "^7.7.3",
  "pdfjs-dist": "^3.11.174"
}
```

### 期待される効果
1. **peer dependency競合解消**: react-pdf@7.7.3とReact 18の完全互換性
2. **Worker初期化エラー解消**: React 18環境での安定したPDF.js動作
3. **CI/CD正常化**: .npmrc不要でnpm ciが成功
4. **ブラウザエラー解消**: sendWithPromise API エラーの根本解決

### 今後の対策
1. **短期**: React 18で安定運用、追加機能開発に集中
2. **中長期**: react-pdfのReact 19対応版リリース後に再アップグレード検討

### 監視ポイント
- ブラウザコンソールでのエラー
- PDF読み込み成功率
- 新しいreact-pdfバージョンのリリース状況

## 参考リンク
- [react-pdf GitHub Issues](https://github.com/wojtekmaj/react-pdf/issues)
- [PDF.js公式ドキュメント](https://mozilla.github.io/pdf.js/)
- [Create React App PDF.js設定](https://create-react-app.dev/docs/using-global-variables/)

## 注意事項
- `legacy-peer-deps=true`は一時的な回避策
- React 19環境では完全な互換性が保証されない
- 本番環境では追加のテストが必要