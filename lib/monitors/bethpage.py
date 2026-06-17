#!/usr/bin/env python3
"""
Bethpage Black tee time monitor.

Checks next 7 days for morning (before noon) tee times on Bethpage Black Course
via ForeUp booking API. Sends one email via Resend if any slots found.

Auth: FOREUP_TOKEN (Bearer token), FOREUP_SESSION (PHPSESSID cookie value)
Email: RESEND_API_KEY, NOTIFY_EMAIL

No Supabase logging. Outputs JSON summary to stdout.
"""
import json
import os
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timedelta
from pathlib import Path


NOTIFIED_PATH = Path.home() / "Library" / "Logs" / "bethpage-notified.json"


FOREUP_URL = "https://foreupsoftware.com/index.php/api/booking/times"
FOREUP_PARAMS_BASE = {
    "time": "all",
    "holes": "all",
    "players": "0",
    "booking_class": "50294",
    "schedule_id": "2431",
    "specials_only": "0",
    "api_key": "",
}
SCHEDULE_IDS = ["2517", "2431", "2433", "2539", "2538", "2434", "2432", "2435"]
TARGET_COURSE = "Bethpage Black Course"


def today_et():
    now_utc = datetime.utcnow()
    month = now_utc.month
    offset = -4 if 4 <= month <= 10 else -5
    now_et = now_utc + timedelta(hours=offset)
    return now_et.date()


def et_timestamp():
    now_utc = datetime.utcnow()
    month = now_utc.month
    offset = -4 if 4 <= month <= 10 else -5
    now_et = now_utc + timedelta(hours=offset)
    return now_et.strftime("[%Y-%m-%d %H:%M ET]")


def fetch_times(token, session, check_date_str):
    params = dict(FOREUP_PARAMS_BASE)
    params["date"] = check_date_str

    query_parts = urllib.parse.urlencode(params)
    for sid in SCHEDULE_IDS:
        query_parts += f"&schedule_ids%5B%5D={sid}"
    url = f"{FOREUP_URL}?{query_parts}"

    req = urllib.request.Request(url)
    req.add_header("x-authorization", f"Bearer {token}")
    req.add_header("Cookie", f"PHPSESSID={session}")
    req.add_header("x-requested-with", "XMLHttpRequest")
    req.add_header("Accept", "application/json")
    req.add_header("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")

    with urllib.request.urlopen(req, timeout=15) as resp:
        body = resp.read().decode("utf-8")
    return json.loads(body)


def filter_slots(times, check_date_str):
    """Return morning slots for Bethpage Black with available spots."""
    slots = []
    for t in times:
        if t.get("schedule_name") != TARGET_COURSE:
            continue
        if (t.get("available_spots") or 0) < 1:
            continue
        time_str = t.get("time", "")
        try:
            time_part = time_str.split(" ")[-1] if " " in time_str else time_str
            hour = int(time_part.split(":")[0])
        except (ValueError, IndexError):
            continue
        if hour >= 12:
            continue
        slots.append({
            "date": check_date_str,
            "time": time_str,
            "available_spots": t.get("available_spots"),
            "green_fee": t.get("green_fee"),
        })
    return slots


def slot_key(slot):
    time_part = slot["time"].split(" ")[-1] if " " in slot["time"] else slot["time"]
    return f"{slot['date']}|{time_part}"


def load_notified(today_iso):
    if not NOTIFIED_PATH.exists():
        return {}
    try:
        data = json.loads(NOTIFIED_PATH.read_text())
    except Exception:
        return {}
    return {k: v for k, v in data.items() if k.split("|")[0] >= today_iso}


def save_notified(notified):
    try:
        NOTIFIED_PATH.write_text(json.dumps(notified, indent=2))
    except Exception as e:
        print(f"[bethpage] warning: could not save notified cache: {e}", file=sys.stderr, flush=True)


def send_email(api_key, to_email, slots, ts):
    subject = f"Bethpage Black tee times available ({len(slots)} slot{'s' if len(slots) != 1 else ''})"

    lines = []
    for s in slots:
        fee = f"${s['green_fee']}" if s.get("green_fee") else "fee unknown"
        lines.append(f"  {s['date']}  {s['time']}  ({s['available_spots']} spot{'s' if s['available_spots'] != 1 else ''}, {fee})")

    body_text = f"Bethpage Black morning tee times found {ts}:\n\n" + "\n".join(lines) + "\n\nBook at https://foreupsoftware.com"

    body_html = (
        "<h2>Bethpage Black tee times available</h2>"
        "<p>Morning slots found " + ts + ":</p>"
        "<table style='border-collapse:collapse;font-family:monospace'>"
    )
    for s in slots:
        fee = f"${s['green_fee']}" if s.get("green_fee") else "fee unknown"
        body_html += (
            f"<tr><td style='padding:4px 12px'>{s['date']}</td>"
            f"<td style='padding:4px 12px'>{s['time']}</td>"
            f"<td style='padding:4px 12px'>{s['available_spots']} spot{'s' if s['available_spots'] != 1 else ''}</td>"
            f"<td style='padding:4px 12px'>{fee}</td></tr>"
        )
    body_html += "</table><p><a href='https://foreupsoftware.com'>Book now</a></p>"

    payload = json.dumps({
        "from": "Scoopd Monitor <monitor@scoopd.nyc>",
        "to": [to_email],
        "subject": subject,
        "text": body_text,
        "html": body_html,
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main():
    token = os.environ.get("FOREUP_TOKEN", "").strip()
    session = os.environ.get("FOREUP_SESSION", "").strip()
    resend_key = os.environ.get("RESEND_API_KEY", "").strip()
    notify_email = os.environ.get("NOTIFY_EMAIL", "").strip()

    if not token or not session:
        print(json.dumps({"error": "FOREUP_TOKEN and FOREUP_SESSION required"}))
        sys.exit(1)
    if not resend_key or not notify_email:
        print(json.dumps({"error": "RESEND_API_KEY and NOTIFY_EMAIL required"}))
        sys.exit(1)

    ts = et_timestamp()
    today = today_et()
    today_iso = today.isoformat()

    notified = load_notified(today_iso)

    all_slots = []
    errors = []

    for i in range(7):
        check_date = today + timedelta(days=i)
        check_date_str = check_date.strftime("%m-%d-%Y")
        try:
            times = fetch_times(token, session, check_date_str)
            slots = filter_slots(times, check_date.isoformat())
            all_slots.extend(slots)
            print(f"{ts} [bethpage] {check_date.isoformat()}: {len(times)} times, {len(slots)} matching", file=sys.stderr, flush=True)
        except Exception as e:
            print(f"{ts} [bethpage] {check_date.isoformat()} FAILED: {e}", file=sys.stderr, flush=True)
            errors.append({"date": check_date.isoformat(), "error": str(e)})

    new_slots = [s for s in all_slots if slot_key(s) not in notified]

    email_sent = False
    if not all_slots:
        print(f"{ts} [bethpage] no morning slots found -- no email sent", file=sys.stderr, flush=True)
    elif not new_slots:
        print(f"{ts} [bethpage] all slots already notified -- skipping", file=sys.stderr, flush=True)
    else:
        try:
            result = send_email(resend_key, notify_email, new_slots, ts)
            email_sent = True
            print(f"{ts} [bethpage] email sent: {result.get('id')}", file=sys.stderr, flush=True)
            now_iso = datetime.utcnow().isoformat()
            for s in new_slots:
                notified[slot_key(s)] = now_iso
            save_notified(notified)
        except Exception as e:
            print(f"{ts} [bethpage] email failed: {e}", file=sys.stderr, flush=True)
            errors.append({"email_error": str(e)})

    summary = {
        "run_time": ts,
        "dates_checked": 7,
        "slots_found": len(all_slots),
        "new_slots": len(new_slots),
        "email_sent": email_sent,
        "slots": all_slots,
        "errors": errors,
    }
    print(json.dumps(summary))


if __name__ == "__main__":
    main()
