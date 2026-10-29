import test from "node:test";
import assert from "node:assert/strict";
import nodemailer from "nodemailer";
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

test("sendApprovalEmail does not throw when sendMail rejects", async () => {
  const origHost = process.env.SMTP_HOST;
  const origCreate = nodemailer.createTransport;
  try {
    process.env.SMTP_HOST = "smtp.mailtrap.io";
    // @ts-expect-error: narrow override for test purposes
    nodemailer.createTransport = () => ({
      sendMail: async () => {
        throw new Error("ECONNREFUSED");
      },
    });
    await assert.doesNotReject(async () => {
      await sendApprovalEmail("test@example.com", "Test User");
    });
  } finally {
    nodemailer.createTransport = origCreate;
    if (origHost !== undefined) process.env.SMTP_HOST = origHost;
    else delete process.env.SMTP_HOST;
  }
});

test("sendRejectionEmail does not throw when sendMail rejects", async () => {
  const origHost = process.env.SMTP_HOST;
  const origCreate = nodemailer.createTransport;
  try {
    process.env.SMTP_HOST = "smtp.mailtrap.io";
    // @ts-expect-error: narrow override for test purposes
    nodemailer.createTransport = () => ({
      sendMail: async () => {
        throw new Error("ECONNREFUSED");
      },
    });
    await assert.doesNotReject(async () => {
      await sendRejectionEmail("test@example.com", "Test User", "Duplicate request");
    });
  } finally {
    nodemailer.createTransport = origCreate;
    if (origHost !== undefined) process.env.SMTP_HOST = origHost;
    else delete process.env.SMTP_HOST;
  }
});

