"""Grava os clipes de tela do vídeo (1920x1080) com a plataforma rodando.
Uso: analysis/process-mining/.venv/bin/python video/scripts/record_clips.py video/raw
"""
import asyncio, sys, shutil
from pathlib import Path
from playwright.async_api import async_playwright

OUT = Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
APP = "http://localhost:3000"
VIEW = {"width": 1920, "height": 1080}

async def login(pg):
    await pg.goto(f"{APP}/login")
    await pg.fill('input[type="email"]', "agrosmart-stream@demo.local")
    await pg.fill('input[type="password"]', "stream123")
    await pg.click('button[type="submit"]')
    await pg.wait_for_url("**/dashboard**", timeout=20000)

async def smooth_scroll(pg, total, steps=60, pause=40):
    for _ in range(steps):
        await pg.mouse.wheel(0, total / steps)
        await pg.wait_for_timeout(pause)

async def clip(browser, name, fn, storage=None):
    ctx = await browser.new_context(viewport=VIEW, device_scale_factor=1, record_video_dir=str(OUT / "tmp"),
                                    record_video_size=VIEW, storage_state=storage)
    pg = await ctx.new_page()
    await fn(pg)
    video = pg.video
    await ctx.close()
    src = await video.path()
    shutil.move(src, OUT / f"{name}.webm")
    print("ok", name, flush=True)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome")
        # sessão logada reaproveitada
        ctx = await b.new_context(viewport=VIEW); pg = await ctx.new_page(); await login(pg)
        state = await ctx.storage_state(); await ctx.close()

        async def kafka(pg):
            await pg.goto("http://localhost:8080/ui/clusters/agrosmart/all-topics/plant-classifications/messages?seekDirection=BACKWARD&seekType=LATEST")
            await pg.wait_for_timeout(3500)
            btn = pg.locator("table tbody tr td").first
            await btn.click(); await pg.wait_for_timeout(5000)
        await clip(b, "kafka", kafka)

        async def sino(pg):
            await pg.goto(f"{APP}/dashboard"); await pg.wait_for_timeout(2500)
            await pg.locator('button[aria-label*="otifica"]').first.click(); await pg.wait_for_timeout(4500)
        await clip(b, "sino", sino, state)

        async def analytics(pg):
            await pg.goto(f"{APP}/dashboard/analytics"); await pg.wait_for_timeout(3000)
            await smooth_scroll(pg, 900); await pg.wait_for_timeout(3500)
        await clip(b, "analytics", analytics, state)

        async def dashboard(pg):
            await pg.goto(f"{APP}/dashboard"); await pg.wait_for_timeout(2000)
            await pg.mouse.move(960, 560, steps=30); await pg.wait_for_timeout(3500)
        await clip(b, "upload", dashboard, state)

        async def monitor(pg):
            await pg.goto(f"{APP}/monitor"); await pg.wait_for_timeout(9000)
        await clip(b, "monitor", monitor, state)

        async def processo(pg):
            await pg.goto(f"{APP}/process"); await pg.wait_for_timeout(1500)
            await pg.get_by_role("tab", name="Cenário simulado").click(); await pg.wait_for_timeout(3500)
            await smooth_scroll(pg, 330, steps=30); await pg.wait_for_timeout(2500)
            await pg.get_by_role("button", name="Frequência").click(); await pg.wait_for_timeout(2500)
            await pg.get_by_role("button", name="Tempo").click(); await pg.wait_for_timeout(2500)
            await smooth_scroll(pg, 700, steps=40); await pg.wait_for_timeout(3000)
        await clip(b, "processo", processo, state)

        async def actions(pg):
            await pg.goto("https://github.com/gugow06/plantguard/actions/runs/45485760309", wait_until="networkidle")
            await pg.wait_for_timeout(5000)
        await clip(b, "actions", actions)
        await b.close()

asyncio.run(main())
