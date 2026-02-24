import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScoreBar, ScoreBadge } from "@/components/ScoreBar";

describe("ScoreBar", () => {
  it("renders score/max display", () => {
    render(<ScoreBar score={7} max={10} />);
    expect(screen.getByText("7/10")).toBeDefined();
  });

  it("renders label when provided", () => {
    render(<ScoreBar score={7} max={10} label="Qualité" />);
    expect(screen.getByText("Qualité")).toBeDefined();
  });

  it("does not render label when not provided", () => {
    const { container } = render(<ScoreBar score={7} max={10} />);
    const labels = container.querySelectorAll(".w-48");
    expect(labels.length).toBe(0);
  });

  it("uses emerald color for scores >= 70%", () => {
    const { container } = render(<ScoreBar score={8} max={10} />);
    const bar = container.querySelector(".bg-emerald-500");
    expect(bar).not.toBeNull();
  });

  it("uses amber color for scores >= 40% and < 70%", () => {
    const { container } = render(<ScoreBar score={5} max={10} />);
    const bar = container.querySelector(".bg-amber-400");
    expect(bar).not.toBeNull();
  });

  it("uses rose color for scores < 40%", () => {
    const { container } = render(<ScoreBar score={2} max={10} />);
    const bar = container.querySelector(".bg-rose-400");
    expect(bar).not.toBeNull();
  });

  it("uses custom max value", () => {
    render(<ScoreBar score={80} max={100} />);
    expect(screen.getByText("80/100")).toBeDefined();
  });
});

describe("ScoreBadge", () => {
  it("renders score number", () => {
    render(<ScoreBadge score={75} />);
    expect(screen.getByText("75")).toBeDefined();
  });

  it("uses emerald styling for score >= 70", () => {
    const { container } = render(<ScoreBadge score={75} />);
    const badge = container.querySelector("span");
    expect(badge?.className).toContain("bg-emerald-100");
  });

  it("uses amber styling for score >= 40 and < 70", () => {
    const { container } = render(<ScoreBadge score={55} />);
    const badge = container.querySelector("span");
    expect(badge?.className).toContain("bg-amber-100");
  });

  it("uses rose styling for score < 40", () => {
    const { container } = render(<ScoreBadge score={25} />);
    const badge = container.querySelector("span");
    expect(badge?.className).toContain("bg-rose-100");
  });
});
