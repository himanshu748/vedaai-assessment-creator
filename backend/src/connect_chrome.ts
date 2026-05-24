import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';

async function run() {
  const sourceProfileDir = '/Users/himanshujha/Library/Application Support/Google/Chrome';
  const destProfileDir = '/Users/himanshujha/vedaai/temp_profile';

  console.log("Preparing copy of Chrome profile to avoid locking...");
  try {
    // Clean old temp profile
    if (fs.existsSync(destProfileDir)) {
      fs.rmSync(destProfileDir, { recursive: true, force: true });
    }
    
    fs.mkdirSync(destProfileDir, { recursive: true });
    fs.mkdirSync(path.join(destProfileDir, 'Default'), { recursive: true });
    fs.mkdirSync(path.join(destProfileDir, 'Default/Network'), { recursive: true });

    // Helper to copy files if they exist
    const copyIfExists = (src: string, dest: string) => {
      if (fs.existsSync(src)) {
        console.log(`Copying: ${src} -> ${dest}`);
        fs.copyFileSync(src, dest);
      } else {
        console.log(`Skipped (not found): ${src}`);
      }
    };

    // Copy Local State
    copyIfExists(
      path.join(sourceProfileDir, 'Local State'),
      path.join(destProfileDir, 'Local State')
    );

    // Copy Preferences
    copyIfExists(
      path.join(sourceProfileDir, 'Default/Preferences'),
      path.join(destProfileDir, 'Default/Preferences')
    );

    // Copy Cookies
    copyIfExists(
      path.join(sourceProfileDir, 'Default/Network/Cookies'),
      path.join(destProfileDir, 'Default/Network/Cookies')
    );
    copyIfExists(
      path.join(sourceProfileDir, 'Default/Cookies'),
      path.join(destProfileDir, 'Default/Cookies')
    );

    console.log("Profile copy prepared. Launching Playwright with copied profile context...");

    const context = await chromium.launchPersistentContext(destProfileDir, {
      headless: true,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await context.newPage();
    console.log("Navigating to Render deploy page...");
    
    await page.goto('https://dashboard.render.com/web/srv-d8970pn7f7vs73bs7vkg/deploys/dep-d8970pv7f7vs73bs7vr0?r=2026-05-24%4003%3A27%3A39%7E2026-05-24%4003%3A29%3A46');

    console.log("Waiting 10 seconds for page logs to render...");
    await page.waitForTimeout(10000);

    const currentUrl = page.url();
    console.log(`Loaded URL: ${currentUrl}`);

    if (currentUrl.includes('login')) {
      console.log("Warning: Still redirected to login page. Session could not be automatically copied.");
      
      const screenshotPath = path.join(__dirname, '../../render_login_screen.png');
      await page.screenshot({ path: screenshotPath });
      console.log(`Saved login screen screenshot to: ${screenshotPath}`);
    } else {
      console.log("Success! Authenticated session restored.");

      const screenshotPath = path.join(__dirname, '../../render_deploy_logs.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`Saved screenshot to: ${screenshotPath}`);

      const logs = await page.evaluate(() => {
        const logElements = Array.from(document.querySelectorAll('pre, code, .log-line, [class*="log"]'));
        if (logElements.length > 0) {
          return logElements.map(el => el.textContent).join('\n');
        }
        return document.body.innerText;
      });

      const logsPath = path.join(__dirname, '../../render_logs.txt');
      fs.writeFileSync(logsPath, logs);
      console.log(`Saved logs text to: ${logsPath}`);
      console.log("\n--- Render Deploy Page Text (Preview) ---");
      console.log(logs.slice(-2000));
    }

    await context.close();
    console.log("Done!");
  } catch (err) {
    console.error("Error executing with profile:", err);
  }
}

run();
