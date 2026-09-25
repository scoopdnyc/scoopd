#!/usr/bin/env python3
"""
DoorDash availability monitor for NSI restaurants.

Auth: DD_WEB_TOKEN env var (ddweb_token cookie value)
TLS:  curl_cffi Chrome impersonation bypasses Cloudflare TLS fingerprinting

Logic per restaurant:
  1. Call reservation_filters → parse unavailable_dates from date filter config
  2. Find dates in window NOT in unavailable_dates = available dates
  3. If none: log flag_reason=null, raw_value='no_inventory'
  4. If any: fetch time slots per date; apply dedup against seen file
  5. If dedup allows: log flag_reason='inventory_available'
     Else: log flag_reason='inventory_suppressed'

Dedup (/tmp/doordash-seen.json, keyed by "{slug}_{date}"):
  count=1 (first seen)       → notify, last_notified=None
  count=2                    → notify, last_notified=now
  count≥3, within 4h        → suppress
  count≥3, >4h since notify → notify, reset last_notified=now
  date disappears            → entry pruned from seen file

Writes one row to monitor_log per restaurant per run.
Outputs JSON summary to stdout.
"""
import json
import os
import sys
import urllib.request
from datetime import date, datetime, timedelta
from pathlib import Path

from curl_cffi import requests as cfr

DD_BASE = "https://www.doordash.com"
SEEN_PATH = Path("/tmp/doordash-seen.json")
NOTIFY_COOLDOWN_HOURS = 4

RESTAURANTS = [
    {
        "slug": "corner-store",
        "name": "Corner Store",
        "reservation_store_id": "28147fe3-96cf-4826-af76-e54872b4e248",
    },
    {
        "slug": "the-86",
        "name": "The Eighty Six",
        "reservation_store_id": "a0b42bce-c259-483a-bf70-1729bbc3d5e4",
    },
    {
        "slug": "oresh",
        "name": "Or'Esh",
        "reservation_store_id": "0128c310-5d6e-4cac-95a2-291a356f7dca",
    },
    {
        "slug": "cafe-charmant",
        "name": "Cafe Charmant",
        "reservation_store_id": "bf0b8e75-d475-402e-89f0-1a6fc310de28",
    },
    {
        "slug": "peoples",
        "name": "People's",
        "reservation_store_id": "1f68d49c-38d3-4919-8a89-aba76630b0c3",
    },
]


def today_et():
    now_utc = datetime.utcnow()
    month = now_utc.month
    offset = -4 if 4 <= month <= 10 else -5
    now_et = now_utc + timedelta(hours=offset)
    return now_et.date().isoformat()


def et_timestamp():
    now_utc = datetime.utcnow()
    month = now_utc.month
    offset = -4 if 4 <= month <= 10 else -5
    now_et = now_utc + timedelta(hours=offset)
    return now_et.strftime("[%Y-%m-%d %H:%M ET]")


def load_seen():
    try:
        with open(SEEN_PATH) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def save_seen(seen):
    with open(SEEN_PATH, "w") as f:
        json.dump(seen, f, indent=2)


def check_should_notify(seen, key, now_iso):
    """
    Mutates seen[key] in place. Returns True if this detection should trigger a notification.

    count=1 (first seen)       → notify, last_notified=None
    count=2                    → notify, last_notified=now
    count≥3, within 4h        → suppress
    count≥3, >4h since notify → notify, reset last_notified=now
    """
    now = datetime.fromisoformat(now_iso)

    if key not in seen:
        seen[key] = {"count": 1, "first_seen": now_iso, "last_notified": None}
        return True

    entry = seen[key]
    entry["count"] += 1

    if entry["count"] == 2:
        entry["last_notified"] = now_iso
        return True

    # count >= 3
    last = entry.get("last_notified")
    if not last:
        entry["last_notified"] = now_iso
        return True

    hours_since = (now - datetime.fromisoformat(last)).total_seconds() / 3600
    if hours_since >= NOTIFY_COOLDOWN_HOURS:
        entry["last_notified"] = now_iso
        return True

    return False


def get_reservation_filters(token, reservation_store_id, check_date, party_size="2"):
    r = cfr.get(
        f"{DD_BASE}/unified-gateway/reservation/v1/reservation_filters",
        params={
            "reservation.date": check_date,
            "reservation.time": "Anytime",
            "reservation.party_size": str(party_size),
            "reservation_store_id": reservation_store_id,
        },
        cookies={"ddweb_token": token},
        impersonate="chrome124",
        timeout=15,
    )
    r.raise_for_status()
    return r.json()


def parse_available_times(filters_data):
    """Return list of available time strings from reservation.time filter, or []."""
    time_filter = next(
        (f for f in filters_data.get("filters", []) if f.get("id") == "reservation.time"),
        None,
    )
    if not time_filter:
        return []
    config = time_filter.get("config", {})
    options = (
        config.get("options")
        or config.get("values")
        or config.get("times")
        or config.get("items")
        or []
    )
    times = []
    for opt in options:
        if isinstance(opt, dict):
            val = (
                opt.get("value")
                or opt.get("time")
                or opt.get("label")
                or opt.get("display_value")
            )
        elif isinstance(opt, str):
            val = opt
        else:
            val = None
        if val and val.lower() not in ("anytime", "any time", ""):
            times.append(val)
    return times


def parse_available_dates(filters_data, check_date):
    """Return list of available date strings (ISO) in the booking window."""
    date_filter = next(
        (f for f in filters_data.get("filters", []) if f.get("id") == "reservation.date"),
        None,
    )
    if not date_filter:
        return []

    config = date_filter.get("config", {})
    unavailable = set(config.get("unavailable_dates", []))
    disabled = set(config.get("disabled_dates", []))
    excluded = unavailable | disabled

    start_str = config.get("start_date", {}).get("value")
    end_str = config.get("end_date", {}).get("value")
    if not start_str or not end_str:
        return []

    start = date.fromisoformat(start_str)
    end = date.fromisoformat(end_str)
    today = date.fromisoformat(check_date)

    available = []
    d = max(start, today)
    while d <= end:
        if d.isoformat() not in excluded:
            available.append(d.isoformat())
        d += timedelta(days=1)
    return available


def write_monitor_log(supabase_url, service_role_key, row):
    """Insert a row into monitor_log via Supabase REST API."""
    url = f"{supabase_url}/rest/v1/monitor_log"
    body = json.dumps(row).encode()
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "apikey": service_role_key,
            "Authorization": f"Bearer {service_role_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        if resp.status not in (200, 201):
            raise RuntimeError(f"Supabase insert failed: {resp.status}")


def check_restaurant(token, restaurant, check_date, supabase_url, service_role_key, ts, seen, now_iso):
    slug = restaurant["slug"]
    name = restaurant["name"]
    store_id = restaurant["reservation_store_id"]

    try:
        filters_2 = get_reservation_filters(token, store_id, check_date, party_size="2")
        filters_4 = get_reservation_filters(token, store_id, check_date, party_size="4")
        dates_2 = set(parse_available_dates(filters_2, check_date))
        dates_4 = set(parse_available_dates(filters_4, check_date))
        all_dates = sorted(dates_2 | dates_4)
        found = len(all_dates) > 0

        if found:
            # Fetch time slots per date (cap at 7 to limit API calls)
            slots = []
            for d in all_dates[:7]:
                time_parties = {}  # {time_str: set_of_party_sizes}
                for party, date_set in [("2", dates_2), ("4", dates_4)]:
                    if d not in date_set:
                        continue
                    try:
                        tf = get_reservation_filters(token, store_id, d, party_size=party)
                        for t in parse_available_times(tf):
                            time_parties.setdefault(t, set()).add(party)
                    except Exception:
                        pass  # time fetch non-fatal — fall through to date-only
                if time_parties:
                    for t in sorted(time_parties):
                        parties = ",".join(sorted(time_parties[t]))
                        slots.append(f"{d} {t} (party={parties})")
                else:
                    if d in dates_2 and d in dates_4:
                        slots.append(f"{d} (party=2,4)")
                    elif d in dates_2:
                        slots.append(f"{d} (party=2)")
                    else:
                        slots.append(f"{d} (party=4)")

            raw_value = "dates=" + ", ".join(slots)

            # Dedup: notify only if any available date passes the cooldown check
            should_notify = any(
                check_should_notify(seen, f"{slug}_{d}", now_iso)
                for d in all_dates
            )
            flag_reason = "inventory_available" if should_notify else "inventory_suppressed"
        else:
            raw_value = "no_inventory"
            flag_reason = None
            should_notify = False

        write_monitor_log(supabase_url, service_role_key, {
            "restaurant_slug": slug,
            "source": "doordash_monitor",
            "field": "availability",
            "old_value": None,
            "new_value": raw_value,
            "raw_value": raw_value,
            "flag_reason": flag_reason,
        })

        print(f"{ts} [doordash] {name}: {raw_value} [{flag_reason}]", file=sys.stderr, flush=True)
        return {
            "slug": slug,
            "found": found,
            "should_notify": should_notify,
            "available_dates": len(all_dates),
            "seen_keys": {f"{slug}_{d}" for d in all_dates},
            "raw_value": raw_value,
        }

    except Exception as e:
        msg = f"error: {e}"
        is_auth_error = "401" in str(e)
        flag_reason = "auth_error" if is_auth_error else None
        print(f"{ts} [doordash] {name} FAILED: {e}", file=sys.stderr, flush=True)
        try:
            write_monitor_log(supabase_url, service_role_key, {
                "restaurant_slug": slug,
                "source": "doordash_monitor",
                "field": "availability",
                "old_value": None,
                "new_value": msg,
                "raw_value": msg,
                "flag_reason": flag_reason,
            })
        except Exception:
            pass
        return {"slug": slug, "found": False, "should_notify": False, "auth_error": is_auth_error, "error": str(e), "seen_keys": None}


def trigger_notify(cron_secret, ts):
    """POST to /api/notify-monitor to fire email alerts for unnotified rows."""
    try:
        req = urllib.request.Request(
            "https://scoopd.nyc/api/notify-monitor",
            data=b"{}",
            headers={
                "Authorization": f"Bearer {cron_secret}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = resp.read().decode()
            print(f"{ts} [doordash] notify-monitor: {body}", file=sys.stderr, flush=True)
    except Exception as e:
        print(f"{ts} [doordash] notify-monitor failed (non-fatal): {e}", file=sys.stderr, flush=True)


def main():
    token = os.environ.get("DD_WEB_TOKEN", "").strip()
    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").strip()
    service_role_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    cron_secret = os.environ.get("CRON_SECRET", "").strip()

    if not token:
        print(json.dumps({"error": "DD_WEB_TOKEN not set"}))
        sys.exit(1)
    if not supabase_url or not service_role_key:
        print(json.dumps({"error": "Supabase env vars not set"}))
        sys.exit(1)

    ts = et_timestamp()
    check_date = today_et()
    now_iso = datetime.utcnow().replace(microsecond=0).isoformat()

    seen = load_seen()
    current_keys = set()

    results = []
    for restaurant in RESTAURANTS:
        result = check_restaurant(token, restaurant, check_date, supabase_url, service_role_key, ts, seen, now_iso)
        results.append(result)
        if result.get("seen_keys") is not None:
            current_keys.update(result["seen_keys"])

    # Prune seen entries for dates no longer in inventory
    stale = [k for k in seen if k not in current_keys]
    for k in stale:
        del seen[k]
    save_seen(seen)

    summary = {"check_date": check_date, "run_time": ts, "results": results}
    print(json.dumps(summary))

    if cron_secret:
        has_notify = any(r.get("should_notify") for r in results)
        has_auth_error = any(r.get("auth_error") for r in results)
        if has_notify or has_auth_error:
            trigger_notify(cron_secret, ts)
        else:
            print(f"{ts} [doordash] nothing to notify -- skipping notify-monitor", file=sys.stderr, flush=True)
    else:
        print(f"{ts} [doordash] CRON_SECRET not set -- skipping notify-monitor", file=sys.stderr, flush=True)


if __name__ == "__main__":
    main()
