#!/usr/bin/env python3
"""
DoorDash availability monitor for NSI restaurants.

Auth: DD_WEB_TOKEN env var (ddweb_token cookie value)
TLS:  curl_cffi Chrome impersonation bypasses Cloudflare TLS fingerprinting

Logic per restaurant:
  1. Call reservation_filters → parse unavailable_dates from date filter config
  2. Find dates in window NOT in unavailable_dates = available dates
  3. If none: log flag_reason=null, raw_value='no_inventory'
  4. If any: call merchant/details for today's live slot count
     (date param is ignored by the endpoint -- always returns today)
  5. Log flag_reason='inventory_available', raw_value='{N} dates available, {M} today slots'

Writes one row to monitor_log per restaurant per run.
Outputs JSON summary to stdout.
"""
import json
import os
import re
import sys
import urllib.request
from datetime import date, timedelta

from curl_cffi import requests as cfr

DD_BASE = "https://www.doordash.com"
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
]


def today_et():
    from datetime import datetime
    now_utc = datetime.utcnow()
    month = now_utc.month
    offset = -4 if 4 <= month <= 10 else -5
    now_et = now_utc + timedelta(hours=offset)
    return now_et.date().isoformat()


def et_timestamp():
    from datetime import datetime
    now_utc = datetime.utcnow()
    month = now_utc.month
    offset = -4 if 4 <= month <= 10 else -5
    now_et = now_utc + timedelta(hours=offset)
    return now_et.strftime("[%Y-%m-%d %H:%M ET]")


def get_reservation_filters(token, reservation_store_id, check_date):
    r = cfr.get(
        f"{DD_BASE}/unified-gateway/reservation/v1/reservation_filters",
        params={
            "reservation.date": check_date,
            "reservation.time": "Anytime",
            "reservation.party_size": "2",
            "reservation_store_id": reservation_store_id,
        },
        cookies={"ddweb_token": token},
        impersonate="chrome124",
        timeout=15,
    )
    r.raise_for_status()
    return r.json()


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


def get_today_slot_count(token, reservation_store_id):
    """Count reservation_timeslot buttons in merchant/details for today."""
    r = cfr.get(
        f"{DD_BASE}/unified-gateway/dine_out/v1/merchant/details",
        params={
            "business_id": "1337",
            "store_id": f"RESERVATION-{reservation_store_id}",
            "device_lat": "40.737111",
            "device_lng": "-73.998795",
            "source": "MERCHANT_DETAILS_SOURCE_UNSPECIFIED",
        },
        cookies={"ddweb_token": token},
        impersonate="chrome124",
        timeout=15,
    )
    r.raise_for_status()
    return r.text.count("reservation_timeslot")


def write_monitor_log(supabase_url, service_role_key, row):
    """Insert a row into monitor_log via Supabase REST API."""
    import urllib.request

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


def check_restaurant(token, restaurant, check_date, supabase_url, service_role_key, ts):
    slug = restaurant["slug"]
    name = restaurant["name"]
    store_id = restaurant["reservation_store_id"]

    try:
        filters_data = get_reservation_filters(token, store_id, check_date)
        available_dates = parse_available_dates(filters_data, check_date)
        found = len(available_dates) > 0

        if found:
            try:
                today_slots = get_today_slot_count(token, store_id)
            except Exception as e:
                today_slots = -1
                print(f"{ts} [doordash] {name} merchant/details failed: {e}", file=sys.stderr, flush=True)

            raw_value = f"{len(available_dates)} dates available, {today_slots} today slots"
            flag_reason = "inventory_available"
        else:
            raw_value = "no_inventory"
            flag_reason = None

        row = {
            "restaurant_slug": slug,
            "source": "doordash_monitor",
            "field": "availability",
            "old_value": None,
            "new_value": raw_value,
            "raw_value": raw_value,
            "flag_reason": flag_reason,
        }
        write_monitor_log(supabase_url, service_role_key, row)

        result = {
            "slug": slug,
            "found": found,
            "available_dates": len(available_dates),
            "today_slots": today_slots if found else 0,
            "raw_value": raw_value,
        }
        print(f"{ts} [doordash] {name}: {raw_value}", file=sys.stderr, flush=True)
        return result

    except Exception as e:
        msg = f"error: {e}"
        print(f"{ts} [doordash] {name} FAILED: {e}", file=sys.stderr, flush=True)
        try:
            write_monitor_log(supabase_url, service_role_key, {
                "restaurant_slug": slug,
                "source": "doordash_monitor",
                "field": "availability",
                "old_value": None,
                "new_value": msg,
                "raw_value": msg,
                "flag_reason": None,
            })
        except Exception:
            pass
        return {"slug": slug, "found": False, "error": str(e)}


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
    results = []
    for restaurant in RESTAURANTS:
        result = check_restaurant(token, restaurant, check_date, supabase_url, service_role_key, ts)
        results.append(result)

    summary = {"check_date": check_date, "run_time": ts, "results": results}
    print(json.dumps(summary))

    if cron_secret:
        if any(r.get("found") for r in results):
            trigger_notify(cron_secret, ts)
        else:
            print(f"{ts} [doordash] no inventory found -- skipping notify-monitor", file=sys.stderr, flush=True)
    else:
        print(f"{ts} [doordash] CRON_SECRET not set -- skipping notify-monitor", file=sys.stderr, flush=True)


if __name__ == "__main__":
    main()
