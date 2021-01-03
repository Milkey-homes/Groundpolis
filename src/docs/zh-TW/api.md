# Misskey API

使用MisskeyAPI以開發Misskey客戶端、Misskey連接的網路服務平台及機器人等（以下簡稱 「應用程式」）。 此外，還有串流媒體API，讓使用者建立具有實時性的應用程式。

要開始使用API​​，你首先需要獲得一個存取權杖。 本說明文件將介紹獲得存取權杖的步驟，及解釋基本的API使用方法。

## 取得存取權杖
基本的に、APIはリクエストにはアクセストークンが必要となります。 APIにリクエストするのが自分自身なのか、不特定の利用者に使ってもらうアプリケーションなのかによって取得手順は異なります。

* 前者の場合: [「自分自身のアクセストークンを手動発行する」](#自分自身のアクセストークンを手動発行する)に進む
* 後者の場合: [「アプリケーション利用者にアクセストークンの発行をリクエストする」](#アプリケーション利用者にアクセストークンの発行をリクエストする)に進む

### 自分自身のアクセストークンを手動発行する
「設定 > API」で、自分のアクセストークンを発行できます。

[「APIの使い方」へ進む](#API使用方法)

### アプリケーション利用者にアクセストークンの発行をリクエストする
アプリケーション利用者のアクセストークンを取得するには、以下の手順で発行をリクエストします。

#### 步驟1

UUIDを生成する。以後これをセッションIDと呼びます。

> このセッションIDは毎回生成し、使いまわさないようにしてください。

#### 步驟2

`{_URL_}/miauth/{session}`をユーザーのブラウザで表示させる。`{session}`の部分は、セッションIDに置き換えてください。
> 例: `{_URL_}/miauth/c1f6d42b-468b-4fd2-8274-e58abdedef6f`

表示する際、URLにクエリパラメータとしていくつかのオプションを設定できます:
* `name` ... アプリケーション名
    * > 例: `MissDeck`
* `icon` ... アプリケーションのアイコン画像URL
    * > 例: `https://missdeck.example.com/icon.png`
* `callback` ... 認証が終わった後にリダイレクトするURL
    * > 例: `https://missdeck.example.com/callback`
    * リダイレクト時には、`session`というクエリパラメータでセッションIDが付きます
* `permission` ... アプリケーションが要求する権限
    * > 例: `write:notes,write:following,read:drive`
    * 要求する権限を`,`で区切って列挙します
    * どのような権限があるかは[APIリファレンス](/api-doc)で確認できます

#### 步驟3
ユーザーが発行を許可した後、`{_URL_}/api/miauth/{session}/check`にPOSTリクエストすると、レスポンスとしてアクセストークンを含むJSONが返ります。

レスポンスに含まれるプロパティ:
* `token` ... ユーザーのアクセストークン
* `user` ... ユーザーの情報

[「APIの使い方」へ進む](#API使用方法)

## API使用方法
**APIはすべてPOSTで、リクエスト/レスポンスともにJSON形式です。RESTではありません。** アクセストークンは、`i`というパラメータ名でリクエストに含めます。

* [API 參考](/api-doc)
* [串流媒體API](./stream)