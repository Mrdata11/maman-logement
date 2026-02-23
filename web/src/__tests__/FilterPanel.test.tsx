import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterPanel } from "@/components/FilterPanel";
import { DEFAULT_UI_FILTERS, UIFilterState } from "@/lib/types";

const defaultProps = {
  filters: { ...DEFAULT_UI_FILTERS },
  onChange: vi.fn(),
  onReset: vi.fn(),
  availableProvinces: [
    { value: "Brabant Wallon", count: 50 },
    { value: "Bruxelles-Capitale", count: 30 },
    { value: "Namur", count: 20 },
  ],
  availableListingTypes: [
    { value: "offre-location", count: 40 },
    { value: "offre-vente", count: 25 },
    { value: "creation-groupe", count: 15 },
  ],
  priceRange: { min: 100, max: 1700 },
};

describe("FilterPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all filter sections", () => {
    render(<FilterPanel {...defaultProps} />);

    expect(screen.getByText("Recherche")).toBeInTheDocument();
    expect(screen.getByText("Province / Région")).toBeInTheDocument();
    expect(screen.getByText("Type d'annonce")).toBeInTheDocument();
    expect(screen.getByText("Fourchette de prix")).toBeInTheDocument();
    expect(screen.getByText("Score minimum")).toBeInTheDocument();
  });

  it("renders province checkboxes with counts", () => {
    render(<FilterPanel {...defaultProps} />);

    expect(screen.getByText("Brabant Wallon")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("Bruxelles-Capitale")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("Namur")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("renders listing type checkboxes with French labels", () => {
    render(<FilterPanel {...defaultProps} />);

    // Uses LISTING_TYPE_LABELS to display French labels
    expect(screen.getByText("Location")).toBeInTheDocument();
    expect(screen.getByText("Vente")).toBeInTheDocument();
    expect(screen.getByText("Création de groupe")).toBeInTheDocument();
  });

  it("calls onChange when province checkbox is toggled", async () => {
    const onChange = vi.fn();
    render(<FilterPanel {...defaultProps} onChange={onChange} />);

    const brabantCheckbox = screen.getByText("Brabant Wallon")
      .closest("label")!
      .querySelector("input")!;

    await userEvent.click(brabantCheckbox);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        provinces: ["Brabant Wallon"],
      })
    );
  });

  it("removes province when already selected", async () => {
    const onChange = vi.fn();
    const filters: UIFilterState = {
      ...DEFAULT_UI_FILTERS,
      provinces: ["Brabant Wallon"],
    };
    render(<FilterPanel {...defaultProps} filters={filters} onChange={onChange} />);

    const brabantCheckbox = screen.getByText("Brabant Wallon")
      .closest("label")!
      .querySelector("input")!;

    await userEvent.click(brabantCheckbox);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        provinces: [],
      })
    );
  });

  it("calls onChange when listing type checkbox is toggled", async () => {
    const onChange = vi.fn();
    render(<FilterPanel {...defaultProps} onChange={onChange} />);

    const locationCheckbox = screen.getByText("Location")
      .closest("label")!
      .querySelector("input")!;

    await userEvent.click(locationCheckbox);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        listingTypes: ["offre-location"],
      })
    );
  });

  it("shows 'Toutes' reset link when provinces are selected", () => {
    const filters: UIFilterState = {
      ...DEFAULT_UI_FILTERS,
      provinces: ["Namur"],
    };
    render(<FilterPanel {...defaultProps} filters={filters} />);

    expect(screen.getByText("Toutes")).toBeInTheDocument();
  });

  it("hides 'Toutes' reset link when no provinces are selected", () => {
    render(<FilterPanel {...defaultProps} />);

    expect(screen.queryByText("Toutes")).not.toBeInTheDocument();
  });

  it("shows 'Tous' reset link when listing types are selected", () => {
    const filters: UIFilterState = {
      ...DEFAULT_UI_FILTERS,
      listingTypes: ["offre-location"],
    };
    render(<FilterPanel {...defaultProps} filters={filters} />);

    expect(screen.getByText("Tous")).toBeInTheDocument();
  });

  it("calls onChange when province reset is clicked", async () => {
    const onChange = vi.fn();
    const filters: UIFilterState = {
      ...DEFAULT_UI_FILTERS,
      provinces: ["Namur"],
    };
    render(<FilterPanel {...defaultProps} filters={filters} onChange={onChange} />);

    await userEvent.click(screen.getByText("Toutes"));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        provinces: [],
      })
    );
  });

  it("updates price min via number input", () => {
    const onChange = vi.fn();
    render(<FilterPanel {...defaultProps} onChange={onChange} />);

    const minInput = screen.getByPlaceholderText(/Min/);
    fireEvent.change(minInput, { target: { value: "300" } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ priceMin: 300 })
    );
  });

  it("updates price max via number input", () => {
    const onChange = vi.fn();
    render(<FilterPanel {...defaultProps} onChange={onChange} />);

    const maxInput = screen.getByPlaceholderText(/Max/);
    fireEvent.change(maxInput, { target: { value: "800" } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ priceMax: 800 })
    );
  });

  it("toggles includeNullPrice checkbox", async () => {
    const onChange = vi.fn();
    render(<FilterPanel {...defaultProps} onChange={onChange} />);

    const checkbox = screen.getByText("Inclure les annonces sans prix")
      .closest("label")!
      .querySelector("input")!;

    // Default is checked, click to uncheck
    await userEvent.click(checkbox);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        includeNullPrice: false,
      })
    );
  });

  it("toggles includeUnscored checkbox", async () => {
    const onChange = vi.fn();
    render(<FilterPanel {...defaultProps} onChange={onChange} />);

    const checkbox = screen.getByText("Inclure les annonces non évaluées")
      .closest("label")!
      .querySelector("input")!;

    await userEvent.click(checkbox);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        includeUnscored: false,
      })
    );
  });

  it("does not show reset button when no filters are active", () => {
    render(<FilterPanel {...defaultProps} />);

    expect(screen.queryByText("Réinitialiser les filtres")).not.toBeInTheDocument();
  });

  it("shows reset button when filters are active", () => {
    const filters: UIFilterState = {
      ...DEFAULT_UI_FILTERS,
      provinces: ["Namur"],
    };
    render(<FilterPanel {...defaultProps} filters={filters} />);

    expect(screen.getByText("Réinitialiser les filtres")).toBeInTheDocument();
  });

  it("calls onReset when reset button is clicked", async () => {
    const onReset = vi.fn();
    const filters: UIFilterState = {
      ...DEFAULT_UI_FILTERS,
      provinces: ["Namur"],
    };
    render(<FilterPanel {...defaultProps} filters={filters} onReset={onReset} />);

    await userEvent.click(screen.getByText("Réinitialiser les filtres"));

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("debounces text search input", async () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(<FilterPanel {...defaultProps} onChange={onChange} />);

    const searchInput = screen.getByPlaceholderText(
      "Rechercher dans les titres et descriptions..."
    );

    // Simulate typing character by character using fireEvent (userEvent doesn't work with fake timers)
    fireEvent.change(searchInput, { target: { value: "jardin" } });

    // onChange should not be called immediately
    expect(onChange).not.toHaveBeenCalled();

    // Advance timers past debounce period
    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        searchText: "jardin",
      })
    );

    vi.useRealTimers();
  });

  it("shows score minimum input", () => {
    render(<FilterPanel {...defaultProps} />);

    expect(screen.getByPlaceholderText("Score minimum (0-100)")).toBeInTheDocument();
  });

  it("updates score minimum", () => {
    const onChange = vi.fn();
    render(<FilterPanel {...defaultProps} onChange={onChange} />);

    const scoreInput = screen.getByPlaceholderText("Score minimum (0-100)");
    fireEvent.change(scoreInput, { target: { value: "40" } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ scoreMin: 40 })
    );
  });
});
