# Firestore セキュリティルール設定

## 手動設定方法

Firebase Console → Firestore Database → ルール タブで以下のルールを設定してください：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles - users can only manage their own profile
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null 
        && request.auth.uid == userId;
      allow delete: if request.auth != null 
        && request.auth.uid == userId;
    }
    
    // User locations - users can manage their own locations, read others
    match /userLocations/{document} {
      allow read: if request.auth != null;
      allow create: if request.auth != null 
        && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null 
        && request.auth.uid == resource.data.userId;
    }
    
    // Legacy locations (for friend locations)
    match /locations/{document} {
      allow read: if request.auth != null;
      allow create: if request.auth != null 
        && request.auth.uid == request.resource.data.userId;
      allow update: if request.auth != null 
        && request.auth.uid == resource.data.userId;
      allow delete: if request.auth != null 
        && request.auth.uid == resource.data.userId;
    }
  }
}
```

## ルールの説明

### users コレクション (ユーザープロフィール)
- **read**: 認証済みユーザーは全てのプロフィールを読み取り可能
- **create/update**: ユーザーは自分のプロフィールのみ作成・更新可能
- **delete**: ユーザーは自分のプロフィールのみ削除可能

### userLocations コレクション (ユーザー位置情報)
- **read**: 認証済みユーザーは全ての位置情報を読み取り可能
- **create**: ユーザーは自分の位置情報のみ作成可能
- **update/delete**: ユーザーは自分の位置情報のみ更新・削除可能

### locations コレクション (友達位置情報 - レガシー)
- **read**: 認証済みユーザーは全ての位置情報を読み取り可能
- **create/update/delete**: ユーザーは自分が作成した位置情報のみ管理可能

## Firebase Storage設定

アバター画像のアップロードのため、Firebase Storage も有効化してください：

1. Firebase Console → Storage → 開始
2. テストモードで開始
3. Security Rules を以下に設定：

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /avatars/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 設定手順

1. Firebase Console を開く: https://console.firebase.google.com/project/libefes-location/firestore
2. Firestore Database → ルール タブをクリック
3. 上記のFirestoreルールをコピー＆ペースト
4. 「公開」ボタンをクリック
5. Storage → ルール タブで Storage ルールも設定
6. 「公開」ボタンをクリック