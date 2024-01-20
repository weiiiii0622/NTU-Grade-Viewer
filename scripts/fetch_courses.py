from dataclasses import dataclass
from datetime import datetime
from multiprocessing.pool import ThreadPool
import re
from threading import Lock
from typing import Callable, Optional, TypeVar
import bs4
import requests
from requests import Response
from tqdm import tqdm

DEPT = "https://if177.aca.ntu.edu.tw/regquery/Dept.aspx"


lock = Lock()


def extract_form_data(form: bs4.Tag | str):
    if type(form) == str:
        form = get_form(form)
    data = {}
    for e in form.select("input"):  # type: ignore
        data[e.attrs["name"]] = e.attrs["value"]
    return data


_cache: dict[tuple[str, frozenset], Response] = {}


def get_cache(url: str, data: dict[str, str]):
    key = (url, frozenset(data.items()))
    lock.acquire()
    res = _cache.get(key, None)
    lock.release()
    return res


def set_cache(url: str, data: dict[str, str], r: Response):
    key = (url, frozenset(data.items()))
    lock.acquire()
    _cache[key] = r
    lock.release()


def fetch(
    url: str,
    data: dict[str, str] = {},
) -> Response:
    if r := get_cache(url, data):
        # print("cache hit")
        return r

    headers = {
        "authority": "if177.aca.ntu.edu.tw",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
        "cache-control": "no-cache",
        "content-type": "application/x-www-form-urlencoded",
        "origin": "https://if177.aca.ntu.edu.tw",
        "pragma": "no-cache",
        "referer": "https://if177.aca.ntu.edu.tw/regquery/Dept.aspx",
        "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }

    r = requests.post(url, headers=headers, data=data)
    set_cache(url, data, r)
    return r


def get_form(text: str):
    return bs4.BeautifulSoup(text, "html.parser").select("form")[0]


MATCH = re.compile(r"共有\s(\d+)\s筆符合！")


class QueryResponse:
    _r: requests.Response
    soup: bs4.BeautifulSoup
    table: Optional[bs4.Tag] = None
    matches: int = 0

    def __init__(self, res: requests.Response) -> None:
        self._r = res
        if res.text.find("組態") != -1:
            raise Exception("Invalid response")
        if obj := MATCH.search(res.text):
            self.matches = int(obj.group(1))

        self.soup = bs4.BeautifulSoup(res.text, "html.parser")
        if self.soup.select("#MainContent_GridView1"):
            self.table = self.soup.select("#MainContent_GridView1")[0]

    @property
    def form_data(self):
        return extract_form_data(self.soup.select("form")[0])


def last_page(r: QueryResponse) -> bool:
    result = r.soup.select("#MainContent_lblResult")[0]
    is_last_page = bool(r.table) and str(r.table).find("下一頁") == -1
    no_result = False
    if obj := MATCH.search(result.text):
        no_result = obj.group(1) == "0"
    return no_result or is_last_page


# STRIPPED = re.compile(r"^\s*(.*)\s*$")
SPACES = re.compile(r"\s")


def is_page_menu(t: bs4.Tag):
    return t.find("table")


def get_datas(r: QueryResponse):
    if not r.table:
        return []
    rows: list[bs4.Tag] = r.table.find_all("tr", recursive=False)[1:]
    return [[SPACES.sub("", x.text) for x in row.select("td")] for row in rows if not is_page_menu(row)]  # type: ignore


def get_keys(r: QueryResponse):
    if not r.table:
        return []
    key_row: bs4.Tag = r.table.find("tr")  # type: ignore
    return [a.text for a in key_row.find_all("a")]


@dataclass
class Dept:
    college: str
    dept: str
    count: int


COLLEGES = ["1000", "2000", "3000", "4000", "5000", "6000", "7000", "8000", "9000", "A000", "B000"]

T = TypeVar("T")
K = TypeVar("K")


class Scraper:
    keys: list[str] = []
    datas: list[list[str]] = []

    depts: list[Dept] = []
    others_count: dict[str, str] = {}

    def query(
        self,
        url: str,
        chain: list[dict[str, str]],
        to_stop: Callable[[QueryResponse], bool] | None,
        get_keys: Callable[[QueryResponse], list[K]],
        get_data: Callable[[QueryResponse], list[T]],
    ) -> tuple[QueryResponse, list[K], list[T]]:
        #

        idx = 0
        keys: list[K] = []
        cur: QueryResponse | None = None
        form_data = {}
        datas: list[T] = []

        i = 0
        while True:
            i += 1
            if i > 100:
                raise Exception("max iteration exceeded")

            if cur and to_stop and to_stop(cur):
                break

            r = fetch(url, form_data)
            cur = QueryResponse(r)

            if not keys:
                keys = get_keys(cur)
            datas += get_data(cur)

            if to_stop is None and idx >= len(chain):
                break
            form_data = form_data | cur.form_data | chain[idx]

            idx += 1
            if to_stop is not None:
                idx = min(idx, len(chain) - 1)

        assert cur
        return cur, keys, datas

    def get_depts_from_college(self, college: str) -> list[str]:
        def get_data(r: QueryResponse):
            if not r.soup.select("#MainContent_ddDptcode"):
                return []
            select = r.soup.select("#MainContent_ddDptcode")[0]
            return [option.attrs["value"] for option in select.select("option")]

        r, _, data = self.query(
            DEPT,
            [
                {
                    "__EVENTTARGET": "ctl00$MainContent$ddCollege",
                    "ctl00$MainContent$ddCollege": college,
                }
            ],
            None,
            lambda r: [],
            get_data,
        )
        return data

    def scrape_dept(self, college: str, dept: str, pbar: tqdm | None = None):
        chain = [
            {
                "__EVENTTARGET": "ctl00$MainContent$ddCollege",
                "ctl00$MainContent$ddCollege": college,
            },
            {
                "__EVENTTARGET": "ctl00$MainContent$ddDptcode",
                "ctl00$MainContent$ddCollege": college,
                "ctl00$MainContent$ddDptcode": dept,
            },
            {
                "__EVENTTARGET": "ctl00$MainContent$GridView1",
                "__EVENTARGUMENT": "Page$Next",
                "ctl00$MainContent$ddCollege": college,
                "ctl00$MainContent$ddDptcode": dept,
            },
        ]

        r, keys, datas = self.query(DEPT, chain, last_page, get_keys, get_datas)
        # print(datas)
        # print(r.matches)
        assert r and len(datas) == r.matches, f"{college}, {dept}: {len(datas)}"

        if pbar:
            pbar.update(1)
        return keys, datas

    def scrape_college(self, college: str, pbar: tqdm | None = None):
        depts = self.get_depts_from_college(college)
        if pbar:
            pbar.set_description(f"Fetching {college}")
            pbar.total = len(depts)
        with ThreadPool(processes=20) as pool:
            results = pool.starmap_async(
                self.scrape_dept, [(college, dept, pbar) for dept in depts], None
            )
            results.wait(timeout=100)
            for (keys, datas), dept in zip(results.get(), depts):
                lock.acquire()
                self.append(keys, datas)
                self.depts.append(Dept(college, dept, len(datas)))
                lock.release()

    def scrape_colleges(self, colleges: list[str] = COLLEGES):
        # * v1: threading
        # threads: list[Thread] = []
        # for i, c in enumerate(colleges):
        #     t = Thread(target=self.scrape_college, args=(c, i))
        #     t.start()
        #     threads.append(t)
        # for t in threads:
        #     t.join()

        # * v2: ThreadPool
        pbars = [tqdm(total=100, position=i) for i, _ in enumerate(colleges)]
        args = list(zip(colleges, pbars))
        with ThreadPool(processes=20) as p:
            p.starmap_async(self.scrape_college, args).wait(timeout=200)
        for pbar in pbars:
            pbar.close()

        # * v3: procedural
        # for i, c in enumerate(colleges):
        #     self.scrape_college(c)

    def append(self, keys: list[str], datas: list[list[str]]):
        if not self.keys:
            self.keys = keys
        elif not keys:
            assert not datas
        elif self.keys != keys:
            raise Exception(f"Keys error:  is not the same as {self.keys}")

        self.datas += datas

    def dump_csv(self, out_name: str = "output"):
        with open(
            out_name + datetime.now().strftime("_%m%d") + ".csv", "+w", encoding="utf-8"
        ) as f:
            f.write(",".join(self.keys) + "\n")
            f.writelines([",".join(data) + "\n" for data in self.datas])

        with open(out_name + ".count.csv", "+w", encoding="utf-8") as f:
            f.write("\n".join(str(d) for d in self.depts))

    def count(self):
        return sum(d.count for d in self.depts)


s = Scraper()
s.scrape_colleges()
s.dump_csv("test")
# print(s.count())
