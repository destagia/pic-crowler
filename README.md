# pic crowler

フォト蔵かなんかのやつで画像拾ってきます

## Install Node.js

Nodeで動くので、Node.jsをインストールする必要があります。

```sh
$ brew install node
$ npm -v # v5.4.0
```

## Usage

```json
[
    {
        "keywords": ["犬 動物", "dog animal"],
        "class": "dog"
    },
    {
        "keywords": ["猫", "cat"],
        "class": "cat"
    },
    {
        "keywords": ["ライオン"],
        "class": "lion"
    }
]
```

こんな感じの設定ファイルをこのフォルダの直下に'config.json'という名前で置いてください。

```sh
node main.js
```

これで起動
