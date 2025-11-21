import nodemailer from "nodemailer";
import { WELCOME_EMAIL_TEMPLATE, NEWS_SUMMARY_EMAIL_TEMPLATE } from "@/lib/nodemailer/templates";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL!,
    pass: process.env.NODEMAILER_PASSWORD || process.env.NOEMAILER_PASSWORD,
  },
});

export const sendWelcomeEmail = async ({
  email,
  name,
  intro,
}: WelcomeEmailData) => {
  const htmlTemplate = WELCOME_EMAIL_TEMPLATE.replace("{{name}}", name).replace(
    "{{intro}}",
    intro
  );

  const mailOptions = {
    from: `"Signalist" <signalist@promail.com>`,
    to: email,
    subject: `Welcome to Signalist - your stock market toolkit is ready!`,
    text: "Thanks for joining Signalist",
    html: htmlTemplate,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Failed to send welcome email:", err);
    throw err;
  }
};


export const sendNewsSummaryEmail = async ({
  email,
  date,
  newsContent,
}: {
  email: string;
  date: string;
  newsContent: string;
}): Promise<void> => {
  // Sanitize AI output: remove code fences (``` or ```html) and stray backticks
  const stripCodeFences = (s: string) =>
    s.replace(/```(?:[a-zA-Z]+)?\s*/g, "").replace(/```/g, "").replace(/`/g, "").trim();

  const escapeHtml = (unsafe: string) =>
    unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");

  let cleaned = stripCodeFences(newsContent || "");

  // If the AI returned plain text (no HTML tags), convert newlines into paragraphs
  const hasHtmlTags = /<[^>]+>/.test(cleaned);
  let htmlContent: string;
  if (hasHtmlTags) {
    htmlContent = cleaned;
  } else {
    // Escape any HTML then convert double newlines to paragraphs and single newlines to <br>
    const escaped = escapeHtml(cleaned);
    const paragraphs = escaped
      .split(/\n\n+/)
      .map((p) => `<p>${p.replace(/\n/g, "<br />")}</p>`)
      .join("\n");
    htmlContent = paragraphs || "<p>No market news.</p>";
  }

  const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE.replace("{{date}}", date).replace(
    "{{newsContent}}",
    htmlContent
  );

  const textFallback = htmlContent.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

  const mailOptions = {
    from: `"Signalist News" <signalist@tradex.pro>`,
    to: email,
    subject: `📈 Market News Summary Today - ${date}`,
    text: textFallback || `Today's market news summary from Signalist`,
    html: htmlTemplate,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('Failed to send news summary email:', err);
    throw err;
  }
};

