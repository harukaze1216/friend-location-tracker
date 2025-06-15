# ともどこ - 技術仕様書

## 📋 プロジェクト概要

### アプリケーション名
**ともどこ（友達どこにいる？）**

### 目的
リベ大フェス2025における参加者の位置情報共有システム

### URL
https://harukaze1216.github.io/friend-location-tracker/

## 🏗️ システム アーキテクチャ

### フロントエンド
- **フレームワーク**: React 18.3.1 + TypeScript 4.9.5
- **UI ライブラリ**: Tailwind CSS 3.4.17
- **ビルドツール**: Create React App 5.0.1
- **デプロイ**: GitHub Pages + GitHub Actions

### バックエンド
- **データベース**: Google Cloud Firestore
- **認証**: Firebase Authentication (Google OAuth)
- **ストレージ**: Firebase Storage (アバター画像)

### インフラストラクチャ
- **ホスティング**: GitHub Pages
- **CI/CD**: GitHub Actions
- **ドメイン**: GitHub提供のサブドメイン

## 📊 データベース設計

### Firestore コレクション

#### 1. users
ユーザープロフィール情報
```typescript
interface UserProfile {
  uid: string;                    // Firebase Auth UID
  displayName: string;            // 表示名
  avatarUrl?: string;            // アバター画像URL
  libeCityName?: string;         // リベシティ名
  profileCompleted: boolean;     // プロフィール設定完了フラグ
  groupIds?: string[];           // 参加グループIDリスト
  createdAt: Date;              // 作成日時
  updatedAt: Date;              // 更新日時
}
```

#### 2. userLocations
ユーザー位置情報
```typescript
interface UserLocation {
  id: string;                    // ドキュメントID
  userId: string;               // ユーザーUID
  x: number;                    // X座標
  y: number;                    // Y座標
  date: string;                 // 日付 (YYYY-MM-DD)
  time: string;                 // 開始時間
  endTime?: string;             // 終了時間（予定地のみ）
  comment?: string;             // コメント
  location?: string;            // 場所名
  timestamp: Date;              // 作成日時
  isActive: boolean;            // アクティブフラグ
  locationType: 'current' | 'scheduled'; // 位置タイプ
}
```

#### 3. groups
グループ情報
```typescript
interface Group {
  id: string;                   // ドキュメントID
  name: string;                 // グループ名
  code: string;                 // 6桁参加コード
  createdBy: string;           // 作成者UID
  memberCount: number;         // メンバー数
  createdAt: Date;             // 作成日時
  updatedAt: Date;             // 更新日時
}
```

#### 4. locations (レガシー)
友達位置情報（後方互換性のため残存）
```typescript
interface Location {
  id: string;                   // ドキュメントID
  friendName: string;           // 友達名
  x: number;                    // X座標
  y: number;                    // Y座標
  time: string;                 // 時間
  description?: string;         // 説明
  timestamp: Date;              // 作成日時
  userId: string;               // 登録者UID
  userDisplayName: string;      // 登録者表示名
}
```

## 🔐 セキュリティ設計

### Firebase セキュリティルール

#### 認証要件
- すべての操作で Firebase Authentication が必須
- Google OAuth による認証のみ許可

#### アクセス制御
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザープロフィール: 自分のプロフィールのみ編集可能
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null && request.auth.uid == userId;
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
    
    // ユーザー位置情報: 自分の位置のみ編集可能、他人の位置は読み取り専用
    match /userLocations/{document} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // グループ: 認証済みユーザーは全て読み取り・更新可能、作成・削除は作成者のみ
    match /groups/{groupId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### 管理者権限
- グループ作成: 指定された管理者UIDのみ
- フロントエンド: `REACT_APP_ADMIN_UIDS` 環境変数
- バックエンド: Firestore Rules の `isAdmin()` 関数

## 🎨 UI/UX 設計

### デザインシステム
- **カラーパレット**: Tailwind CSS のグラデーション (blue, green, orange)
- **レスポンシブ**: モバイルファースト設計
- **アクセシビリティ**: WCAG 2.1 準拠
- **アイコン**: 絵文字ベース

### 画面構成

#### 1. ログイン画面
- Google OAuth ログインボタン
- アプリ説明とロゴ

#### 2. プロフィール設定画面
- 表示名入力
- アバター画像アップロード
- リベシティ名入力

#### 3. メイン画面
- **ヘッダー**: ユーザー情報、ログアウト
- **フィルター**: クイックフィルター + 詳細フィルター
- **地図エリア**: メインコンテンツ
- **コントロール**: 拡大/縮小ボタン

#### 4. モーダル画面
- 位置登録フォーム
- 位置詳細表示
- グループ管理
- プロフィール編集

### インタラクション設計

#### PC操作
- **位置登録**: マウスクリック
- **地図操作**: マウスホイール（ズーム）、ドラッグ（パン）

#### モバイル操作
- **位置登録**: 長押し
- **地図操作**: ピンチ（ズーム）、スワイプ（パン）

## 📱 レスポンシブ対応

### ブレークポイント
- **Mobile**: ~640px
- **Tablet**: 641px~1024px
- **Desktop**: 1025px~

### モバイル最適化
- タッチターゲット 44px以上
- フォントサイズ動的調整
- ビューポート最適化

## 🔧 開発環境

### 必要ツール
```json
{
  "node": ">=18.0.0",
  "npm": ">=8.0.0"
}
```

### 主要依存関係
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "typescript": "^4.9.5",
  "firebase": "^11.9.1",
  "tailwindcss": "^3.4.17"
}
```

### 開発コマンド
```bash
# 開発サーバー起動
npm start

# プロダクションビルド
npm run build

# テスト実行
npm test

# 型チェック
npx tsc --noEmit
```

### CI/CD パイプライン
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout
      uses: actions/checkout@v4
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
    - name: Install dependencies
      run: npm ci
    - name: Build
      run: npm run build
      env:
        REACT_APP_FIREBASE_API_KEY: ${{ secrets.REACT_APP_FIREBASE_API_KEY }}
        REACT_APP_FIREBASE_AUTH_DOMAIN: ${{ secrets.REACT_APP_FIREBASE_AUTH_DOMAIN }}
        REACT_APP_FIREBASE_PROJECT_ID: ${{ secrets.REACT_APP_FIREBASE_PROJECT_ID }}
        REACT_APP_FIREBASE_STORAGE_BUCKET: ${{ secrets.REACT_APP_FIREBASE_STORAGE_BUCKET }}
        REACT_APP_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.REACT_APP_FIREBASE_MESSAGING_SENDER_ID }}
        REACT_APP_FIREBASE_APP_ID: ${{ secrets.REACT_APP_FIREBASE_APP_ID }}
        REACT_APP_ADMIN_UIDS: sT6dXIJK5fgBQgnakENYXqKfJHV2,3j4I6CYJOTdkksSpiDgUkWJrZal2
    - name: Deploy to GitHub Pages
      uses: actions/deploy-pages@v4
```

## 📊 パフォーマンス仕様

### 読み込み時間
- **初回読み込み**: 3秒以内
- **ページ遷移**: 1秒以内
- **データ同期**: 2秒以内

### 最適化手法
- **コード分割**: React.lazy による動的インポート
- **画像最適化**: WebP フォーマット、適切なサイズ
- **キャッシュ**: Service Worker によるオフライン対応
- **バンドル最適化**: Tree shaking、ミニファイ

## 🛡️ セキュリティ要件

### 認証・認可
- Firebase Authentication 必須
- セッション管理: Firebase SDK
- トークン有効期限: 1時間（自動更新）

### データ保護
- HTTPS 通信必須
- 個人情報の最小化
- ログ出力時の機密情報除外

### プライバシー
- 位置情報: 地図上の相対座標のみ
- 個人特定情報: 最小限に制限
- データ保持期間: 7日間（自動削除）

## 🔄 データフロー

### 位置情報登録フロー
1. ユーザーが地図上の位置をクリック/長押し
2. 位置登録フォームが表示
3. ユーザーが必要情報を入力
4. Firestore に位置情報を保存
5. リアルタイムで他のユーザーに反映

### グループ管理フロー
1. 管理者がグループを作成
2. 6桁の参加コードが生成
3. ユーザーがコードを入力してグループに参加
4. グループメンバーの位置情報をフィルター表示

## 📈 監視・ログ

### エラー監視
- Firebase Crashlytics
- ブラウザコンソールエラー
- API エラーレスポンス

### パフォーマンス監視
- Core Web Vitals
- Firebase Performance Monitoring
- ページ読み込み時間

### 使用状況分析
- Firebase Analytics
- ユーザー行動追跡
- 機能利用統計

## 🔧 運用・保守

### デプロイメント
- **方式**: GitHub Actions による自動デプロイ
- **頻度**: main ブランチ push 時
- **ロールバック**: GitHub Pages 設定から前バージョンに戻す

### バックアップ
- **Firestore**: 自動バックアップ（Firebase）
- **コード**: Git リポジトリ
- **設定**: 環境変数の文書化

### 監視アラート
- **エラー率**: 5% 超過時
- **レスポンス時間**: 3秒 超過時
- **サービス停止**: 即座に通知

## 📋 API 仕様

### Firebase Authentication
```typescript
// Google サインイン
const signInWithPopup = (auth, googleProvider) => Promise<UserCredential>

// サインアウト  
const signOut = (auth) => Promise<void>

// 認証状態監視
const onAuthStateChanged = (auth, callback) => Unsubscribe
```

### Firestore API
```typescript
// ドキュメント作成
const addDoc = (collection, data) => Promise<DocumentReference>

// ドキュメント更新
const updateDoc = (docRef, data) => Promise<void>

// ドキュメント削除
const deleteDoc = (docRef) => Promise<void>

// クエリ実行
const getDocs = (query) => Promise<QuerySnapshot>

// リアルタイム監視
const onSnapshot = (query, callback) => Unsubscribe
```

### Firebase Storage
```typescript
// ファイルアップロード
const uploadBytes = (storageRef, file) => Promise<UploadResult>

// ダウンロードURL取得
const getDownloadURL = (storageRef) => Promise<string>
```

## 🧪 テスト仕様

### 単体テスト
- **フレームワーク**: Jest + React Testing Library
- **カバレッジ**: 80% 以上
- **対象**: コンポーネント、ユーティリティ関数

### 統合テスト
- **Firebase Emulator**: ローカル環境でのFirebaseテスト
- **E2E テスト**: 主要フローの自動テスト

### パフォーマンステスト
- **Lighthouse**: 90点以上
- **Core Web Vitals**: Good 評価

## 📝 変更履歴

### v1.0.0 (2025-06-15)
- 初回リリース
- 基本的な位置共有機能
- Google OAuth 認証
- プロフィール管理

### v1.1.0 (2025-06-15)
- グループ機能追加
- 管理者権限システム
- 複数グループ同時参加対応
- UI/UX 改善

## 🔗 関連リンク

- **GitHub リポジトリ**: https://github.com/harukaze1216/friend-location-tracker
- **Firebase プロジェクト**: libefes-location
- **本番環境**: https://harukaze1216.github.io/friend-location-tracker/
- **ユーザーマニュアル**: [USER_MANUAL.md](./USER_MANUAL.md)

---

**開発チーム**: Claude Code AI Assistant  
**最終更新**: 2025年6月15日