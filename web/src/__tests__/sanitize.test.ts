import { describe, it, expect } from "vitest";
import { escapeHtml, sanitizeUrl } from "@/lib/sanitize";

describe("escapeHtml", () => {
  it("escapes & to &amp;", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  it("escapes < to &lt;", () => {
    expect(escapeHtml("a < b")).toBe("a &lt; b");
  });

  it("escapes > to &gt;", () => {
    expect(escapeHtml("a > b")).toBe("a &gt; b");
  });

  it('escapes " to &quot;', () => {
    expect(escapeHtml('a "b" c')).toBe("a &quot;b&quot; c");
  });

  it("escapes ' to &#39;", () => {
    expect(escapeHtml("a 'b' c")).toBe("a &#39;b&#39; c");
  });

  it("handles strings with multiple special characters", () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
    );
  });

  it("returns empty string unchanged", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("leaves normal text unchanged", () => {
    expect(escapeHtml("Hello World 123")).toBe("Hello World 123");
  });
});

describe("sanitizeUrl", () => {
  it("blocks javascript: protocol", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBe("#");
  });

  it("blocks data: protocol", () => {
    expect(sanitizeUrl("data:text/html,<h1>XSS</h1>")).toBe("#");
  });

  it("blocks vbscript: protocol", () => {
    expect(sanitizeUrl("vbscript:MsgBox")).toBe("#");
  });

  it("is case-insensitive for protocol detection", () => {
    expect(sanitizeUrl("JavaScript:alert(1)")).toBe("#");
    expect(sanitizeUrl("JAVASCRIPT:alert(1)")).toBe("#");
    expect(sanitizeUrl("Data:text/html,x")).toBe("#");
    expect(sanitizeUrl("VBScript:x")).toBe("#");
  });

  it('returns "#" for dangerous URLs', () => {
    expect(sanitizeUrl("javascript:void(0)")).toBe("#");
  });

  it("trims whitespace from URLs", () => {
    expect(sanitizeUrl("  javascript:alert(1)  ")).toBe("#");
  });

  it("allows and HTML-escapes https:// URLs", () => {
    expect(sanitizeUrl("https://example.com?q=a&b=c")).toBe(
      "https://example.com?q=a&amp;b=c"
    );
  });

  it("allows http:// URLs", () => {
    expect(sanitizeUrl("http://example.com")).toBe("http://example.com");
  });
});
