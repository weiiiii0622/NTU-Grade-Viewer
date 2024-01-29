# NTU-Score-Viewer

A chrome plugin for the purpose of showing each course's score distribution on the site "台大課程網"

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