# NTU-Score-Viewer

A chrome plugin for the purpose of showing each course's score distribution on the site "台大課程網"

## How to run

### App

```bash
$ pip install -r requirements.txt
$ python app/app.py
```

### Extension

```bash
$ cd extension
$ npm install  # or yarn or pnpm install
```

Then for development:

```bash
$ npm run watch  #
```

For production:

```bash
$ npm run build
```

Now the extension can be loaded from `extension/dist`.
