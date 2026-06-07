"""Tiny SQLite layer: preferences + the rolling 'recently used' track history
that powers anti-repeat. This is the cross-day memory the prototype couldn't have."""
import sqlite3
import datetime
import json

from .config import settings


def _conn():
    c = sqlite3.connect(settings.db_path)
    c.row_factory = sqlite3.Row
    return c


def init_db():
    with _conn() as c:
        c.execute("CREATE TABLE IF NOT EXISTS used_tracks (track_key TEXT, used_on TEXT)")
        c.execute("CREATE TABLE IF NOT EXISTS prefs (k TEXT PRIMARY KEY, v TEXT)")


def recent_used(days: int = 14) -> list[str]:
    """Track keys ('Artist — Title') used within the last `days`."""
    cutoff = (datetime.date.today() - datetime.timedelta(days=days)).isoformat()
    with _conn() as c:
        rows = c.execute(
            "SELECT DISTINCT track_key FROM used_tracks WHERE used_on >= ?", (cutoff,)
        ).fetchall()
    return [r["track_key"] for r in rows]


def add_used(keys: list[str]):
    today = datetime.date.today().isoformat()
    with _conn() as c:
        c.executemany(
            "INSERT INTO used_tracks (track_key, used_on) VALUES (?, ?)",
            [(k, today) for k in keys],
        )


def get_pref(k: str, default=None):
    with _conn() as c:
        row = c.execute("SELECT v FROM prefs WHERE k = ?", (k,)).fetchone()
    return json.loads(row["v"]) if row else default


def set_pref(k: str, v):
    with _conn() as c:
        c.execute(
            "INSERT INTO prefs (k, v) VALUES (?, ?) "
            "ON CONFLICT(k) DO UPDATE SET v = excluded.v",
            (k, json.dumps(v)),
        )
