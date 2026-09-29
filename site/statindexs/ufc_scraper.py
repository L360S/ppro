import time
from bs4 import BeautifulSoup
import pandas as pd
from playwright.sync_api import sync_playwright

BASE_URL = "https://www.ea.com"
HUB_URL = "https://www.ea.com/games/ufc/ufc-6/ufc-6-ratings-hub"
TOTAL_PAGES = 11  # Scrapes across all 11 pages


def scrape_ufc_ratings():
    all_fighters_data = []
    fighter_links = []

    with sync_playwright() as p:
        print("Launching browser...")
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            viewport={"width": 1400, "height": 900},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        )
        page = context.new_page()

        # Step 1: Initial load for Age Verification (only needed once)
        print("Navigating to Ratings Hub...")
        page.goto(HUB_URL, wait_until="domcontentloaded")

        print("\n" + "=" * 60)
        print(
            " ACTION REQUIRED: Please complete Age Verification in the browser!"
        )
        print(" Waiting 15 seconds for age gate/cookies...")
        print("=" * 60 + "\n")
        time.sleep(15)

        # Step 2: Loop through pages 1 to 11 to gather ALL fighter links
        for page_num in range(1, TOTAL_PAGES + 1):
            page_url = f"{HUB_URL}?page={page_num}"
            print(
                f"--- Extracting links from Page {page_num}/{TOTAL_PAGES} ---"
            )

            try:
                page.goto(page_url, wait_until="domcontentloaded")
                time.sleep(2.5)

                # Scroll down to ensure cards render
                for _ in range(4):
                    page.evaluate("window.scrollBy(0, 1000)")
                    time.sleep(0.8)

                # Collect links on current page
                card_elements = page.query_selector_all(
                    "div[class*='Card_card__']"
                )

                page_links_found = 0
                for card in card_elements:
                    link_elem = card.query_selector(
                        "a"
                    ) or card.evaluate_handle(
                        "node => node.closest('a')"
                    ).as_element()

                    if link_elem:
                        href = link_elem.get_attribute("href")
                        if href:
                            full_url = (
                                href
                                if href.startswith("http")
                                else BASE_URL + href
                            )
                            if full_url not in fighter_links:
                                fighter_links.append(full_url)
                                page_links_found += 1

                # Fallback link collector if cards aren't direct anchors
                if page_links_found == 0:
                    anchors = page.query_selector_all("a[href*='/ufc/']")
                    for a in anchors:
                        href = a.get_attribute("href")
                        if href and ("/ratings/" in href or "/fighter/" in href):
                            full_url = (
                                href
                                if href.startswith("http")
                                else BASE_URL + href
                            )
                            if (
                                full_url not in fighter_links
                                and full_url != HUB_URL
                            ):
                                fighter_links.append(full_url)
                                page_links_found += 1

                print(
                    f"Page {page_num}: Found {page_links_found} links. Total collected: {len(fighter_links)}"
                )

            except Exception as e:
                print(f"Error navigating page {page_num}: {e}")

        print(
            f"\nFinished Hub Scan. Total fighter profile links across all 11 pages: {len(fighter_links)}\n"
        )

        # Step 3: Visit every collected fighter page and scrape their stats
        for index, link in enumerate(fighter_links, start=1):
            print(f"[{index}/{len(fighter_links)}] Scraping stats: {link}")
            try:
                page.goto(link, wait_until="domcontentloaded", timeout=20000)
                time.sleep(2)  # Wait for stat meters to animate/populate

                soup = BeautifulSoup(page.content(), "html.parser")

                # Extract Fighter Name
                name_elem = soup.find("h1") or soup.find("h2")
                fighter_name = (
                    name_elem.text.strip()
                    if name_elem
                    else link.split("/")[-1].replace("-", " ").title()
                )

                fighter_dict = {
                    "Fighter Name": fighter_name,
                    "Profile URL": link,
                }

                target_stats = [
                    "CHIN",
                    "BODY STRENGTH",
                    "CARDIO",
                    "PUNCH SPEED",
                    "PUNCH POWER",
                    "KICK SPEED",
                    "KICK POWER",
                    "ACCURACY",
                    "TAKEDOWNS",
                    "GROUND STRIKING",
                    "SUBMISSION OFFENSE",
                    "HEALTH",
                    "STRIKING",
                    "GRAPPLING",
                ]

                lines = [
                    line.strip()
                    for line in soup.get_text(separator="\n").split("\n")
                    if line.strip()
                ]

                for i, line in enumerate(lines):
                    clean_line = line.upper()
                    if clean_line in target_stats:
                        if i + 1 < len(lines) and lines[i + 1].isdigit():
                            fighter_dict[clean_line] = int(lines[i + 1])
                        elif i - 1 >= 0 and lines[i - 1].isdigit():
                            fighter_dict[clean_line] = int(lines[i - 1])

                all_fighters_data.append(fighter_dict)

            except Exception as e:
                print(f"Skipped {link} due to error: {e}")

        browser.close()

    # Step 4: Export complete dataset to Excel
    if all_fighters_data:
        df = pd.DataFrame(all_fighters_data)
        output_filename = "ufc_all_fighters_stats.xlsx"
        df.to_excel(output_filename, index=False)
        print(
            f"\n SUCCESS! Scraped {len(df)} fighters across 11 pages."
        )
        print(f"Data saved to '{output_filename}'.")
    else:
        print("No fighter data was collected.")


if __name__ == "__main__":
    scrape_ufc_ratings()