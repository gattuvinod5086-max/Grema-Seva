#!/usr/bin/env python3
"""Capture GramSeva UI screenshots for executive presentation."""

import subprocess
import sys
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "playwright", "-q"])
    subprocess.check_call([sys.executable, "-m", "playwright", "install", "chromium"])
    from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "presentation-screenshots"
BASE = "http://localhost:5173"

DEMO_USER = {
    "id": "USR-SCREENSHOT",
    "name": "R. Lakshmi",
    "role": "Sarpanch",
    "phone": "9876543210",
    "district": "Yadadri Bhuvanagiri",
    "mandal": "Yadagirigutta",
    "village": "Yadagirigutta Town",
    "ward": "4",
    "registeredAt": "2026-01-01T00:00:00.000Z",
}

VIEWS = [
    ("home", "01-home-mobile", "06-home-desktop"),
    ("report", "02-report-mobile", None),
    ("issues", "03-issues-mobile", None),
    ("emergency", "04-emergency-mobile", None),
    ("vikas", "05-vikas-mobile", None),
    ("official", None, "07-official-dashboard"),
    ("analytics", None, "08-analytics"),
    ("welfare", None, "09-welfare"),
    ("news", None, "10-news"),
]

SIDEBAR = {
    "home": "Home",
    "report": "Report Issue",
    "issues": "Village Logs",
    "emergency": "Emergency & Help",
    "vikas": "AI Assistant",
    "official": "Official Dashboard",
    "analytics": "Village Analytics",
    "welfare": "Welfare Hub",
    "news": "News & Announcements",
}


def seed(page):
    page.evaluate(
        """(user) => {
            localStorage.setItem('tg_grama_seva_users', JSON.stringify([user]));
            localStorage.setItem('tg_grama_seva_session', user.phone);
            localStorage.removeItem('tg_grama_seva_demo_seeded');
        }""",
        DEMO_USER,
    )


def nav_to(page, key: str):
    page.get_by_role("button", name=SIDEBAR[key]).first.click(timeout=15000)
    page.wait_for_timeout(1000)


def shot(page, name: str, selector="main"):
    path = OUT / f"{name}.png"
    page.locator(selector).first.screenshot(path=str(path))
    print(f"  ✓ {name}")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.set_viewport_size({"width": 1440, "height": 900})
        page.goto(f"{BASE}/app", wait_until="networkidle", timeout=60000)
        seed(page)
        page.reload(wait_until="networkidle")
        page.wait_for_timeout(1500)

        for key, mobile_name, desktop_name in VIEWS:
            nav_to(page, key)
            if desktop_name:
                shot(page, desktop_name)
            if mobile_name:
                page.set_viewport_size({"width": 390, "height": 844})
                page.wait_for_timeout(500)
                shot(page, mobile_name)
                page.set_viewport_size({"width": 1440, "height": 900})
                page.wait_for_timeout(300)

        login = browser.new_page()
        login.set_viewport_size({"width": 1440, "height": 900})
        login.goto(f"{BASE}/app", wait_until="networkidle")
        login.evaluate("localStorage.clear()")
        login.reload(wait_until="networkidle")
        login.wait_for_timeout(1200)
        shot(login, "11-login", "body")

        emerg = browser.new_page()
        emerg.set_viewport_size({"width": 390, "height": 844})
        emerg.goto(f"{BASE}/emergency", wait_until="networkidle")
        emerg.wait_for_timeout(1200)
        shot(emerg, "12-emergency-standalone", "body")

        browser.close()
    print(f"\nScreenshots saved to: {OUT}")


if __name__ == "__main__":
    main()
