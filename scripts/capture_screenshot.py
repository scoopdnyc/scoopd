from playwright.sync_api import sync_playwright
import sys
import os

def capture(url, output_path, viewport_width=1920, viewport_height=1080, wait_time=2000):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(
            viewport={'width': viewport_width, 'height': viewport_height},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        page = context.new_page()
        page.goto(url, wait_until='networkidle', timeout=30000)
        page.wait_for_timeout(wait_time)
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        page.screenshot(path=output_path, full_page=False)
        browser.close()
        print(f"Saved: {output_path}")

if __name__ == '__main__':
    url = sys.argv[1]
    output = sys.argv[2]
    w = int(sys.argv[3]) if len(sys.argv) > 3 else 1920
    h = int(sys.argv[4]) if len(sys.argv) > 4 else 1080
    capture(url, output, w, h)
