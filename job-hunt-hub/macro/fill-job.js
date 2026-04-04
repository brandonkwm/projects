/**
 * For a single job page: discover form fields, fill from valueMap + resumePath, optionally submit.
 * Returns { outcome, unfilled_fields, intervention_reason } so the user knows why we stopped (e.g. CAPTCHA).
 */
import { matchField, buildValueMap } from "./fill-utils.js";

const DELAY_MS = 300;
const PAGE_TIMEOUT = 60000;
const SUBMIT_WAIT_MS = 5000;

/** Detect CAPTCHA (reCAPTCHA, hCaptcha, or common class/id patterns). */
async function detectCaptcha(page) {
  const selectors = [
    "iframe[src*='recaptcha']",
    "iframe[src*='hcaptcha']",
    "[class*='captcha']",
    "[id*='captcha']",
    ".g-recaptcha",
    "#g-recaptcha",
    "[data-sitekey]",
  ];
  for (const sel of selectors) {
    try {
      const el = await page.$(sel);
      if (el && (await el.isVisible())) return true;
    } catch (_) {}
  }
  return false;
}

/** Detect a login form (email + password, no application fields). */
async function detectLoginForm(page) {
  const emailLike = await page.$$('input[type="email"], input[name*="email"], input[id*="email"], input[type="text"]');
  const password = await page.$$('input[type="password"]');
  if (password.length === 0) return false;
  const hasEmail = emailLike.length > 0 || (await page.$('input[name*="login"], input[id*="login"]'));
  return !!hasEmail;
}

export async function fillJob(page, job, profile, questionAnswers, resumePath) {
  const valueMap = buildValueMap(profile, questionAnswers);
  const unfilled = [];
  let submitted = false;
  let intervention_reason = "unknown";

  await page.goto(job.job_url, { waitUntil: "domcontentloaded", timeout: PAGE_TIMEOUT });
  await page.waitForTimeout(2000);

  const hasCaptcha = await detectCaptcha(page);
  if (hasCaptcha) {
    return {
      outcome: "needs_intervention",
      unfilled_fields: ["CAPTCHA on page"],
      intervention_reason: "captcha",
    };
  }

  const isLoginPage = await detectLoginForm(page);
  if (isLoginPage) {
    const applicationFields = await page.$$("textarea, input[type='file'], select");
    const hasAppFields = applicationFields.length > 2;
    if (!hasAppFields) {
      return {
        outcome: "needs_intervention",
        unfilled_fields: ["Log in first in this browser"],
        intervention_reason: "login_required",
      };
    }
  }

  const inputs = await page.$$("input:not([type='hidden']):not([type='submit']):not([type='button']), select, textarea");
  const filled = new Set();

  for (const el of inputs) {
    try {
      const visible = await el.isVisible().catch(() => false);
      if (!visible) continue;

      const tag = await el.evaluate((e) => e.tagName.toLowerCase());
      const type = await el.evaluate((e) => (e.getAttribute("type") || "").toLowerCase());
      const name = await el.evaluate((e) => e.getAttribute("name") || "");
      const id = await el.evaluate((e) => e.getAttribute("id") || "");
      const placeholder = await el.evaluate((e) => e.getAttribute("placeholder") || "");
      const ariaLabel = await el.evaluate((e) => e.getAttribute("aria-label") || "");

      let label = ariaLabel;
      if (!label && id) {
        const labelEl = await page.$(`label[for="${id}"]`);
        if (labelEl) label = await labelEl.evaluate((e) => e.textContent || "");
      }
      if (!label) {
        const parent = await el.evaluateHandle((e) => e.closest("label") || e.closest("[data-label]") || e.parentElement);
        const text = await parent.evaluate((e) => e.textContent || e.getAttribute("data-label") || "");
        if (text) label = text.slice(0, 200);
      }

      const fieldLabel = [label, name, id, placeholder].find(Boolean) || "unknown";
      const matched = matchField(valueMap, label, name, id, placeholder, type);

      if (type === "file") {
        if (resumePath && (matched?.isFile || /resume|cv|upload|attachment/i.test(fieldLabel))) {
          await el.setInputFiles(resumePath).catch(() => unfilled.push(`file: ${fieldLabel}`));
          filled.add(fieldLabel);
        } else {
          unfilled.push(`file: ${fieldLabel}`);
        }
        continue;
      }

      if (matched && !matched.isFile) {
        const value = String(matched.value);
        if (tag === "select") {
          try {
            await el.selectOption({ value }).catch(() => el.selectOption({ label: value }));
          } catch {
            unfilled.push(fieldLabel);
          }
        } else {
          await el.fill(value, { timeout: 2000 }).catch(() => unfilled.push(fieldLabel));
        }
        filled.add(fieldLabel);
        await page.waitForTimeout(DELAY_MS);
      }
    } catch (_) {
      // skip this field
    }
  }

  const submitSelectors = [
    'input[type="submit"]',
    'button[type="submit"]',
    'input[value="Submit"]',
    'input[value="Apply"]',
    '[data-action="submit"]',
  ];

  for (const sel of submitSelectors) {
    try {
      const btn = await page.locator(sel).first();
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(SUBMIT_WAIT_MS);
        submitted = true;
        break;
      }
    } catch (_) {}
  }

  if (!submitted) {
    try {
      const submitBtn = page.getByRole("button", { name: /submit|apply/i });
      if (await submitBtn.first().isVisible()) {
        await submitBtn.first().click();
        await page.waitForTimeout(SUBMIT_WAIT_MS);
        submitted = true;
      }
    } catch (_) {}
  }

  return {
    outcome: submitted ? "submitted" : "needs_intervention",
    unfilled_fields: unfilled.length ? unfilled : submitted ? [] : ["could_not_submit"],
    intervention_reason: submitted ? undefined : (unfilled.length ? "unfilled_fields" : "submit_not_found"),
  };
}
