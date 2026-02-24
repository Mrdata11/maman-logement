import { describe, it, expect } from "vitest";
import { prioritizePhotos } from "@/lib/image-utils";

describe("prioritizePhotos", () => {
  it("returns empty array for empty input", () => {
    expect(prioritizePhotos([])).toEqual([]);
  });

  it("returns single-image array unchanged", () => {
    expect(prioritizePhotos(["https://img.com/photo.jpg"])).toEqual([
      "https://img.com/photo.jpg",
    ]);
  });

  it("moves flyer URLs to end", () => {
    const images = [
      "https://img.com/flyer-event.jpg",
      "https://img.com/garden.jpg",
      "https://img.com/kitchen.jpg",
    ];
    const result = prioritizePhotos(images);
    expect(result[0]).toBe("https://img.com/garden.jpg");
    expect(result[1]).toBe("https://img.com/kitchen.jpg");
    expect(result[2]).toBe("https://img.com/flyer-event.jpg");
  });

  it("moves affiche URLs to end", () => {
    const images = [
      "https://img.com/affiche-2024.jpg",
      "https://img.com/bedroom.jpg",
    ];
    const result = prioritizePhotos(images);
    expect(result[0]).toBe("https://img.com/bedroom.jpg");
    expect(result[1]).toBe("https://img.com/affiche-2024.jpg");
  });

  it("moves poster URLs to end", () => {
    const images = [
      "https://img.com/poster.jpg",
      "https://img.com/living.jpg",
    ];
    const result = prioritizePhotos(images);
    expect(result[0]).toBe("https://img.com/living.jpg");
    expect(result[1]).toBe("https://img.com/poster.jpg");
  });

  it("handles mixed photo and flyer URLs preserving relative order", () => {
    const images = [
      "https://img.com/flyer1.jpg",
      "https://img.com/photo-a.jpg",
      "https://img.com/conferencia.jpg",
      "https://img.com/photo-b.jpg",
    ];
    const result = prioritizePhotos(images);
    // Photos first, then flyers, each group in original order
    expect(result).toEqual([
      "https://img.com/photo-a.jpg",
      "https://img.com/photo-b.jpg",
      "https://img.com/flyer1.jpg",
      "https://img.com/conferencia.jpg",
    ]);
  });

  it("is case-insensitive for keywords", () => {
    const images = [
      "https://img.com/CONFERENCIA-event.jpg",
      "https://img.com/garden.jpg",
    ];
    const result = prioritizePhotos(images);
    expect(result[0]).toBe("https://img.com/garden.jpg");
    expect(result[1]).toBe("https://img.com/CONFERENCIA-event.jpg");
  });

  it("handles URLs where all are flyers", () => {
    const images = [
      "https://img.com/flyer1.jpg",
      "https://img.com/poster2.jpg",
    ];
    const result = prioritizePhotos(images);
    // All are flyers, photos empty, so result is all flyers in order
    expect(result).toEqual(images);
  });

  it("handles URLs with no matching keywords", () => {
    const images = [
      "https://img.com/garden.jpg",
      "https://img.com/pool.jpg",
    ];
    const result = prioritizePhotos(images);
    expect(result).toEqual(images);
  });
});
