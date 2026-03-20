import asyncio
from playwright import async_api

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:8081", wait_until="commit", timeout=10000)

        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass

        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass

        # Interact with the page elements to simulate user flow
        # -> Navigate to http://localhost:8081
        await page.goto("http://localhost:8081", wait_until="commit", timeout=10000)
        
        # -> Click the 'No account? Register' element to open the registration form.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=html/body/div[1]/div/div[2]/div/div/div/div/div/div/div/div/div[7]/div').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # -> Fill the username, email and password fields; click the 'agree to terms' checkbox; trigger the Cloudflare CAPTCHA checkbox.
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=html/body/div[1]/div/div[2]/div/div/div/div/div/div/div/div/input[1]').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('ososam')
        
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=html/body/div[1]/div/div[2]/div/div/div/div/div/div/div/div/input[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('ososam@gmail.com')
        
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=html/body/div[1]/div/div[2]/div/div/div/div/div/div/div/div/div[3]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Kenida@2025')
        
        # -> Click the 'I have read and agree...' checkbox (index 785), trigger the Cloudflare CAPTCHA (iframe index 611), then click REGISTER (index 547), and extract any confirmation/success message.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=html/body/div[1]/div/div[2]/div/div/div/div/div/div/div/div/div[5]/div[1]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=html/body/div[1]/div/div[2]/div/div/div/div/div/div/div/div/div[6]/div/div/iframe').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # -> Click the REGISTER button (index 547) to submit the registration form and then capture any confirmation or error message displayed.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=html/body/div[1]/div/div[2]/div/div/div/div/div/div/div/div/div[7]/div/div').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # --> Assertions to verify final state
        frame = context.pages[-1]
        # Assert that the registration success message and confirmation instructions are shown
        frame = context.pages[-1]
        # Wait for the main success headline to appear
        await frame.wait_for_selector("text=Registration Successful", timeout=5000)
        success_elem = frame.locator("text=Registration Successful").first
        assert await success_elem.is_visible(), "Expected 'Registration Successful' message to be visible"
        
        # Verify the detailed confirmation text is present
        await frame.wait_for_selector("text=Your account has been created", timeout=5000)
        detail_elem = frame.locator("text=Your account has been created").first
        detail_text = await detail_elem.inner_text()
        assert ("Please check your email" in detail_text) or ("confirm your registration" in detail_text), "Confirmation email instructions not found in success message"
        
        # Ensure an OK button is available to dismiss the confirmation
        ok_elem = frame.locator("text=OK").first
        assert await ok_elem.is_visible(), "OK button not visible on registration confirmation"
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    