import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Pagination } from "@/components/Pagination";

describe("Pagination", () => {
  const onPageChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when totalPages <= 1", () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={onPageChange} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders all page numbers when totalPages <= 7", () => {
    render(
      <Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />
    );
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(String(i))).toBeDefined();
    }
  });

  it("renders ellipsis for large page counts", () => {
    render(
      <Pagination currentPage={5} totalPages={20} onPageChange={onPageChange} />
    );
    const ellipses = screen.getAllByText("…");
    expect(ellipses.length).toBeGreaterThanOrEqual(1);
  });

  it("shows page 1 and last page always for large counts", () => {
    render(
      <Pagination currentPage={10} totalPages={20} onPageChange={onPageChange} />
    );
    expect(screen.getByText("1")).toBeDefined();
    expect(screen.getByText("20")).toBeDefined();
  });

  it("disables previous button on first page", () => {
    render(
      <Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />
    );
    const buttons = screen.getAllByRole("button");
    // First button is "Préc."
    expect(buttons[0].hasAttribute("disabled")).toBe(true);
  });

  it("disables next button on last page", () => {
    render(
      <Pagination currentPage={5} totalPages={5} onPageChange={onPageChange} />
    );
    const buttons = screen.getAllByRole("button");
    // Last button is "Suiv."
    expect(buttons[buttons.length - 1].hasAttribute("disabled")).toBe(true);
  });

  it("calls onPageChange with correct page on number click", () => {
    render(
      <Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />
    );
    fireEvent.click(screen.getByText("3"));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("calls onPageChange(currentPage - 1) on previous click", () => {
    render(
      <Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />
    );
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]); // Préc. button
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("calls onPageChange(currentPage + 1) on next click", () => {
    render(
      <Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />
    );
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[buttons.length - 1]); // Suiv. button
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it("shows pages around current page for large page counts", () => {
    render(
      <Pagination currentPage={10} totalPages={20} onPageChange={onPageChange} />
    );
    // Should show 9, 10, 11 around current
    expect(screen.getByText("9")).toBeDefined();
    expect(screen.getByText("10")).toBeDefined();
    expect(screen.getByText("11")).toBeDefined();
  });

  it("handles edge case: currentPage = 2 (no left ellipsis needed)", () => {
    render(
      <Pagination currentPage={2} totalPages={10} onPageChange={onPageChange} />
    );
    expect(screen.getByText("1")).toBeDefined();
    expect(screen.getByText("2")).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();
  });
});
