// Turndown (HTML to Markdown)
import TurndownService from "npm:turndown@7.2.0";

// Configure Turndown service
const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  emDelimiter: "_",
  strongDelimiter: "*",
});

// Remove head content
turndownService.remove(["style", "script"]);

// Remove images
turndownService.addRule("images", {
  filter: ["img"],
  replacement: function () {
    return "";
  },
});

// Configure Turndown to handle span with font-weight:bold
turndownService.addRule("boldSpan", {
  filter: function (node) {
    return node.nodeName === "SPAN" && node.style.fontWeight === "bold";
  },
  replacement: function (content) {
    return "*" + content + "*";
  },
});

// Convert links to Slack format
turndownService.addRule("slackLinks", {
  filter: function (node) {
    return node.nodeName === "A" && node.href;
  },
  replacement: function (content, anchor, config) {
    return `<${anchor.href}|${content}>`;
  },
});

export function convertHtmlToSlack(htmlText) {
  // Remove everything between <head> tags
  htmlText = htmlText.replace(/<head>[\s\S]*?<\/head>/gi, "");

  // Convert to markdown
  let markdown = turndownService.turndown(htmlText);

  // Clean Markdown
  markdown = markdown.replace(/\\_/gi, "_");
  markdown = markdown.trim();
  markdown = markdown.replace(/"/g, '"'); // Escape double quotes
  markdown = markdown.replace(/(\r\n|\n|\r)/g, "\n"); // New lines

  // Make Slack block
  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: markdown,
      },
    },
  ];

  return JSON.stringify(blocks);
}
