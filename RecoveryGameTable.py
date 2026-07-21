import time
import requests
import psycopg2


TARGET_APP_IDS = [
    730, 578080, 570, 431960, 1172470, 2868840, 3241660,
    271590, 2676230, 322170, 236390, 359550, 1808500,
    2507950, 2357570, 2767030, 252490, 381210, 1422450,
    230410, 3405690, 413150, 2807960, 553850, 1973530,
    3240220, 105600, 440, 3321460, 3041230, 227300,
    1086940, 438100, 550, 394360, 1203220, 1938090,
    1245620, 284160, 322330, 252950, 1091500, 3892270,
    3513350, 3472040, 250900, 3124540, 1174180, 4000,
    3105440, 1449850, 1222670, 2344520, 739630, 108600,
    289070, 1364780, 1281930, 221100, 1366800, 489830,
    1905180, 3419430, 1665460, 714010, 440900, 244210,
    291550, 4128580, 2300320, 3564740, 646570, 3764200,
    1551360, 3527290, 2622380, 2073850, 2073620, 1142710,
    261550, 294100, 2379780, 813780, 3551340, 3526710,
    594650, 960090, 251570, 629520, 892970, 1158310,
    1144200, 4025700, 3164500, 264710, 945360, 2694490,
]


DB_CONFIG = dict(
    host="100.75.133.23",
    port=5432,
    dbname="mydb",
    user="myuser",
    password="mypassword",
)


def fetch_detail(appid):
    url = "https://store.steampowered.com/api/appdetails"
    resp = requests.get(url, params={"appids": appid, "cc": "kr", "l": "korean"}, timeout=10)
    resp.raise_for_status()
    data = resp.json().get(str(appid))
    if not data or not data.get("success"):
        return None
    return data["data"]


def main():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    success, fail, no_match = 0, 0, 0

    for appid in TARGET_APP_IDS:
        try:
            detail = fetch_detail(appid)
        except Exception as e:
            print(f"[FAIL] game_id={appid} 요청 실패: {e}")
            fail += 1
            time.sleep(1)
            continue

        if detail is None:
            print(f"[FAIL] game_id={appid} 데이터 없음")
            fail += 1
            time.sleep(1)
            continue

        name = detail.get("name")
        header_image = detail.get("header_image")
        price_overview = detail.get("price_overview")
        is_free = detail.get("is_free", False)

        original_price = price_overview["initial"] // 100 if price_overview else None
        final_price = price_overview["final"] // 100 if price_overview else None
        discount_percent = price_overview["discount_percent"] if price_overview else 0

        cur.execute(
            """
            UPDATE game
            SET name = %s,
                header_image = %s,
                original_price = %s,
                final_price = %s,
                discount_percent = %s,
                is_free = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE game_id = %s
            """,
            (name, header_image, original_price, final_price,
             discount_percent, is_free, appid),
        )
        conn.commit()

        if cur.rowcount == 0:
            print(f"[NO MATCH] game_id={appid} game 테이블에 해당 row 없음")
            no_match += 1
        else:
            print(f"[OK] game_id={appid} name={name} (rowcount={cur.rowcount})")
            success += 1

        time.sleep(0.3)

    cur.close()
    conn.close()
    print(f"완료: 성공 {success}건, 매칭없음 {no_match}건, 실패 {fail}건")


if __name__ == "__main__":
    main()