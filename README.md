# NTU-Score-Viewer

A chrome plugin for the purpose of showing each course's score distribution on the site "台大課程網". You can try it [here](https://chromewebstore.google.com/detail/ntu-%E9%81%B8%E8%AA%B2%E5%B0%8F%E5%B9%AB%E6%89%8B/kkjggklagkgnknbnlhlocodacknhfbci)

> [!WARNING]  
> This extension is not currently maintained.


## Update `.env`

### Prerequisite

Create `.github/token` and put your github personal access token in it.

### Running script

After updating `.env`, you should run `python scripts/update_env.py` to both update secrets stored in github repo and the `.env.sha256` in local. Then, you should immediately push `.env.sha256` to master.

## Important!!

If existing storage type is changed, then should clearStorage in next update.

## Possible Todos

-   Extend to NTU COOL
-   Add tests
-   Bug report `tabs.captureVisibleTab`
-   Add quick badge for course search items (e.g. '35% A+')
-   Send notification when new release arrived

### Github Actions

-   Check .env is not out-dated
-   Check storage definition is modified
-   Test (on `master`)
    -   Run test for extension/
    -   Run test for app/
    -   Run test for both together?
-   When `extension` branch is pushed, create release and update extension to web store
    -   Extract and validate version
    -   Auto-generated release body by `release/HISTORY.md`
    -   Build extension/dist/ and upload to web store (this requires futher manual update description & publish)

## How to run

### App

```bash
$ pip install -r requirements.txt
$ cd app
$ python app.py
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

### DB

Run server and db with `docker-compose up`.

Inside the container, the db is listening on `db:3306`; From your host machine, the db is on `localhost:3333`. Thus on host machine you can also connect to db with

```
$ mysqlsh
> \sql
> \c root@localhost:3333
```

If you don't want to run app with docker, just comment the `app` service and run `python app/app.py` as usual.

The data stored in MySQL is mounted on `./data/sql/mysql`, meaning that it is persistent.

#### `init.sql`

I have not figured out exactly how it works, but if you update it, then perhaps you have to run

```bash
sudo rm ./data/sql/mysql/* -rf
```

to make `init.sql` run.
