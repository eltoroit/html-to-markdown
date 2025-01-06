// Turndown (HTML to Markdown)
import TurndownService from "npm:turndown@7.2.0";

// Configure Turndown service
const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
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
    return "**" + content + "**";
  },
});

export function convert(htmlText) {
  // Remove everything between <head> tags
  htmlText = htmlText.replace(/<head>[\s\S]*?<\/head>/gi, "");

  // Convert to markdown
  let markdown = turndownService.turndown(htmlText);
  markdown = markdown.replace(/\\_/gi, "_");
  markdown = markdown.trim();

  return markdown;
}
