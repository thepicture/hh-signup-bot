const random = require("random-name");

const { chromium } = require("playwright-extra");

const { PhoneGenerator } = require("./services/PhoneGenerator");
const { CompanyGenerator } = require("./services/CompanyGenerator");
const { EMAILNATOR_BASE_URL, HH_BASE_URL } = require("./config/urls");
const { Logger } = require("./services/Logger");
const { FETCH_TIMEOUT_MILLISECONDS } = require("./config/timeouts");

const stealth = require("puppeteer-extra-plugin-stealth")();

chromium.use(stealth);

chromium.launch().then(async (browser) => {
  Logger.log("starting...");

  const page = await browser.newPage();

  await page.goto(`${EMAILNATOR_BASE_URL}/10minutemail`, {
    waitUntil: "domcontentloaded",
  });
  const email = await page.locator("input[readonly]").inputValue();

  if (!email) {
    Logger.log("no image on the page, exiting");

    throw new Error("cannot find the email on the page");
  }

  Logger.log("opening the auth page...");

  await page.goto(`${HH_BASE_URL}/auth/employer`, {
    waitUntil: "networkidle",
  });

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
    .click({ waitUntil: "networkidle" });
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

  Logger.log(`credentials: ${email}:${password}`);

  Logger.log("closing browser...");
  await browser.close();
});
