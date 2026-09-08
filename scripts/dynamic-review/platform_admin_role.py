"""DYNAMIC REVIEW — what the browser is actually served.

Static review proves the string is in the source file. That is not the same
claim: a build can tree-shake a constant, a bundler can drop a branch, and the
source would still read correctly. This checks the artifact a browser
downloads.

WHY NOT DRIVE THE PAGE LOGGED IN. /admin/* is gated by Next middleware running
server-side against a JWT cookie, so route interception in the browser cannot
fake a session -- a first attempt did exactly that and measured the LOGIN
page's bundle instead, reporting a confident false failure. Creating a real
admin account is a privilege operation and was correctly refused by the
sandbox. So this asserts on the shipped chunk plus a real page load.
"""
import asyncio, json, pathlib, re, sys
from playwright.async_api import async_playwright

WEB = pathlib.Path("/home/intelicore/cb-web-platform-admin")
BASE = "http://127.0.0.1:3002"
EXPECTED = ["SUPER_ADMIN", "ADMIN", "PLATFORM_ADMIN", "MODERATOR", "SUPPORT"]

def check_bundle():
    out, chunks = [], list((WEB / ".next/static/chunks").rglob("*.js"))
    page_chunks = [c for c in chunks if "admin-management" in str(c)]
    if not page_chunks:
        return [("FAIL", "no admin-management chunk was built")]
    blob = "\n".join(c.read_text(errors="ignore") for c in page_chunks)

    out.append(("PASS" if "PLATFORM_ADMIN" in blob else "FAIL",
                "the shipped admin-management chunk contains PLATFORM_ADMIN"))

    # The dropdown's option list must survive the build INTACT and in order.
    m = re.search(r'"SUPER_ADMIN","ADMIN","PLATFORM_ADMIN","MODERATOR","SUPPORT"', blob)
    out.append(("PASS" if m else "FAIL",
                "the full role option list survived bundling"))

    # And the platform-admin badge colour, so the row does not render grey.
    out.append(("PASS" if "teal" in blob else "FAIL",
                "the platform-admin badge colour shipped"))
    return out


async def check_live():
    out = []
    async with async_playwright() as pw:
        b = await pw.chromium.launch(headless=True)
        ctx = await b.new_context(viewport={"width": 1440, "height": 900})
        page = await ctx.new_page()
        errs = []
        page.on("pageerror", lambda e: errs.append(str(e)[:100]))
        r = await page.goto(f"{BASE}/admin/dashboard/admin-management",
                            wait_until="domcontentloaded", timeout=45000)
        await page.wait_for_timeout(2500)
        landed = page.url.replace(BASE, "")
        # Unauthenticated MUST bounce to login. If it renders the admin list
        # instead, page gating is broken and that is a far worse finding than
        # anything this review was looking for.
        out.append(("PASS" if "/admin/login" in landed else "FAIL",
                    f"unauthenticated access is refused (landed {landed})"))
        out.append(("PASS" if r and r.status < 500 else "FAIL",
                    f"server responded {r.status if r else '?'}"))
        out.append(("PASS" if not errs else "FAIL",
                    f"no uncaught javascript errors ({len(errs)})"))
        await b.close()
    return out


results = check_bundle() + asyncio.run(check_live())
print()
for status, msg in results:
    print(f"  {status}  {msg}")
fails = [m for s, m in results if s == "FAIL"]
print(f"\n  {len(results) - len(fails)}/{len(results)} checks passed")
sys.exit(1 if fails else 0)
