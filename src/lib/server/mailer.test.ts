import test from "node:test";
import assert from "node:assert/strict";
import {
  isSmtpConfigured,
  sendApprovalEmail,
  sendRejectionEmail,
} from "./mailer";

test("isSmtpConfigured returns false when SMTP_HOST is undefined", () => {
  const orig = process.env.SMTP_HOST;
  try {
    delete process.env.SMTP_HOST;
    assert.equal(isSmtpConfigured(), false);
  } finally {
    if (orig !== undefined) process.env.SMTP_HOST = orig;
  }
});

test("isSmtpConfigured returns true when SMTP_HOST is present", () => {
  const orig = process.env.SMTP_HOST;
  try {
    process.env.SMTP_HOST = "smtp.mailtrap.io";
    assert.equal(isSmtpConfigured(), true);
  } finally {
    if (orig !== undefined) process.env.SMTP_HOST = orig;
    else delete process.env.SMTP_HOST;
  }
});

test("sendApprovalEmail returns without error when SMTP is not configured", async () => {
  const orig = process.env.SMTP_HOST;
  try {
    delete process.env.SMTP_HOST;
    await assert.doesNotReject(async () => {
      await sendApprovalEmail("test@example.com", "Test User");
    });
  } finally {
    if (orig !== undefined) process.env.SMTP_HOST = orig;
  }
});

test("sendRejectionEmail returns without error when SMTP is not configured", async () => {
  const orig = process.env.SMTP_HOST;
  try {
    delete process.env.SMTP_HOST;
    await assert.doesNotReject(async () => {
      await sendRejectionEmail("test@example.com", "Test User", "Duplicate request");
    });
  } finally {
    if (orig !== undefined) process.env.SMTP_HOST = orig;
  }
});

test("sendRejectionEmail handles optional reason parameter", async () => {
  const orig = process.env.SMTP_HOST;
  try {
    delete process.env.SMTP_HOST;
    await assert.doesNotReject(async () => {
      await sendRejectionEmail("test@example.com", "Test User");
    });
  } finally {
    if (orig !== undefined) process.env.SMTP_HOST = orig;
  }
});

