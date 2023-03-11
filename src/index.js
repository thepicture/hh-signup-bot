const fs = require("node:fs");

const random = require("random-name");

const { chromium } = require("playwright-extra");

const stealth = require("puppeteer-extra-plugin-stealth")();

const { ProxyBuilder } = require("./services/ProxyBuilder");
const { Logger } = require("./services/Logger");
const { PhoneGenerator } = require("./services/PhoneGenerator");
const { CompanyGenerator } = require("./services/CompanyGenerator");

const { EMAILNATOR_BASE_URL, HH_BASE_URL } = require("./config/urls");
const { FETCH_TIMEOUT_MILLISECONDS } = require("./config/timeouts");

chromium.use(stealth);

let launchOptions;

const proxyBuilder = new ProxyBuilder();
if (proxyBuilder.canProxyBuild()) {
  launchOptions = proxyBuilder.buildProxy();
  Logger.log("using proxy");
} else {
  launchOptions = {};
  Logger.log("running with real ip");
}

chromium.launch(launchOptions).then(async (browser) => {
  const start = Date.now();

  Logger.log("starting...");

  const page = await browser.newPage();

  await page.route("**/*", (route) => {
    return ["stylesheet", "image", "media", "font"].some(
      (type) => route.request().resourceType() === type
    )
      ? route.abort()
      : route.continue();
  });

  await page.goto(`${EMAILNATOR_BASE_URL}/10minutemail`, {
    waitUntil: "domcontentloaded",
  });
  const email = await page.locator("input[readonly]").inputValue();

  if (!email) {
    Logger.log("email not found on the page, exiting");

    throw new Error("cannot find the email on the page");
  }

  Logger.log("opening the auth page...");

  await page.goto(`${HH_BASE_URL}/auth/employer`, {
    waitUntil: "domcontentloaded",
  });

  await page.waitForFunction(
    () =>
      !document.querySelector('[data-qa="employer-registration-submit"]')
        ?.disabled
  );
  Logger.log("submitting email...");
  await page.locator("#email").type(email);
  await page.locator('[data-qa="employer-registration-submit"]').click();
  Logger.log("submitted email");

  Logger.log("submitting name...");
  await page.locator("#firstName").type(random.first());
  await page.locator("#lastName").type(random.last());
  await page.locator('[data-qa="employer-registration-submit"]').click();
  Logger.log("submitted name");

  Logger.log("submitting phone...");
  await page.locator("#phoneFull").type(new PhoneGenerator().generate().number);
  await page.click('[data-qa="employer-registration-submit"]');
  Logger.log("submitted phone");

  Logger.log("submitting company name...");
  await page
    .locator("#companyName")
    .type(new CompanyGenerator().generate().content);
  await page
    .locator('[data-qa="employer-registration-submit"]')
    .click({ waitUntil: "domcontentloaded" });
  Logger.log("submitted company name");

  Logger.log("waiting 5 seconds before checking email...");
  await new Promise((resolve) =>
    setTimeout(resolve, FETCH_TIMEOUT_MILLISECONDS)
  );

  Logger.log("opening email...");
  await page.goto(`${EMAILNATOR_BASE_URL}/10minutemail`, {
    waitUntil: "domcontentloaded",
  });

  while (
    !(await page.evaluate(() => document.body.textContent))?.includes("hh.ru")
  ) {
    Logger.log("no email yet, waiting more seconds...");
    await page.locator('[name="reloadMail"]').click();
    await new Promise((resolve) =>
      setTimeout(resolve, FETCH_TIMEOUT_MILLISECONDS)
    );
  }

  Logger.log("found email, opening the credentials page...");
  const urlToLoginAndPassword = `${EMAILNATOR_BASE_URL}${await page
    .locator('[href^="/inbox/"]')
    .getAttribute("href")}`;

  await page.goto(urlToLoginAndPassword, { waitUntil: "domcontentloaded" });

  Logger.log("waiting before password can be fetched...");
  await page.waitForFunction(
    () => document.querySelectorAll("[data-qa=mail__text]").length > 0
  );

  const password = await page.evaluate(
    () => document.querySelectorAll(".header-4")[3].textContent
  );
  Logger.log("fetched password");

  const credentials = `${email}:${password}`;

  Logger.log(`credentials: ${credentials}`);

  try {
    const path = `credentials/${Date.now()}`;

    fs.writeFileSync(path, credentials, "utf-8");
    Logger.log(`saved credentials to ${path}`);
  } catch (error) {
    Logger.log(`cannot save credentials: ${error}`);
  }

  Logger.log("closing browser...");
  await browser.close();

  const end = Date.now();
  Logger.log(`execution took ${((end - start) / 1000).toFixed(2)}s`);
});
