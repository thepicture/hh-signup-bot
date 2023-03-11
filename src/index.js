const random = require("random-name");

const { chromium } = require("playwright-extra");

const { PhoneGenerator } = require("./services/PhoneGenerator");
const { CompanyGenerator } = require("./services/CompanyGenerator");
const { EMAILNATOR_BASE_URL, HH_BASE_URL } = require("./config/urls");

const stealth = require("puppeteer-extra-plugin-stealth")();

chromium.use(stealth);

chromium.launch().then(async (browser) => {
  const page = await browser.newPage();

  await page.goto(`${EMAILNATOR_BASE_URL}/10minutemail`, {
    waitUntil: "domcontentloaded",
  });
  const email = await page.locator("input[readonly]").inputValue();

  if (!email) {
    throw new Error("cannot find the email on the page");
  }

  await page.goto(`${HH_BASE_URL}/auth/employer`, {
    waitUntil: "networkidle",
  });

  await page.locator("#email").type(email);
  await page.locator('[data-qa="employer-registration-submit"]').click();

  await page.locator("#firstName").type(random.first());
  await page.locator("#lastName").type(random.last());

  await page.locator('[data-qa="employer-registration-submit"]').click();

  await page.locator("#phoneFull").type(new PhoneGenerator().generate().number);
  await page.click('[data-qa="employer-registration-submit"]');

  await page
    .locator("#companyName")
    .type(new CompanyGenerator().generate().content);

  await page
    .locator('[data-qa="employer-registration-submit"]')
    .click({ waitUntil: "networkidle" });

  await new Promise((resolve) => setTimeout(resolve, 5000));

  await page.goto(`${EMAILNATOR_BASE_URL}/10minutemail`, {
    waitUntil: "domcontentloaded",
  });

  while (
    !(await page.evaluate(() => document.body.textContent))?.includes("hh.ru")
  ) {
    console.log("waiting...");
    await page.locator('[name="reloadMail"]').click();
    await new Promise((resolve) => setTimeout(resolve, 3600));
  }

  const urlToLoginAndPassword = `${EMAILNATOR_BASE_URL}${await page
    .locator('[href^="/inbox/"]')
    .getAttribute("href")}`;

  await page.goto(urlToLoginAndPassword, { waitUntil: "domcontentloaded" });

  await page.waitForFunction(
    () => document.querySelectorAll("[data-qa=mail__text]").length > 0
  );

  const password = await page.evaluate(
    () => document.querySelectorAll(".header-4")[3].textContent
  );

  console.log(`credentials: ${email}:${password}`);

  await browser.close();
});
