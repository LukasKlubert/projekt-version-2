import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { AppStoreProvider } from "@/lib/app-store";
import { DayRing, StreakHeader } from "./StreakHeader";

// Vizuální regresní testy: hlídáme vykreslené třídy a geometrii SVG kroužků,
// aby se vzhled hlavičky nezměnil nechtěně při refaktoru.

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-16T10:00:00")); // neděle
});
afterAll(() => vi.useRealTimers());

describe("DayRing", () => {
  it("prázdný den má jen šedý podklad", () => {
    const html = renderToStaticMarkup(<DayRing short="Po" progress={0} isToday={false} />);
    expect(html).toMatchSnapshot();
    expect(html).toContain("stroke-gray-800");
    expect(html).not.toContain("stroke-emerald-500");
  });

  it("částečný den má tenký smaragdový oblouk", () => {
    const html = renderToStaticMarkup(<DayRing short="St" progress={0.6} isToday={false} />);
    expect(html).toMatchSnapshot();
    expect(html).toContain('stroke-width="2.5"');
    expect(html).toContain("stroke-emerald-500");
  });

  it("hotový den má silnější obrys a matnou výplň", () => {
    const html = renderToStaticMarkup(<DayRing short="Út" progress={1} isToday={false} />);
    expect(html).toMatchSnapshot();
    expect(html).toContain('stroke-width="4.5"');
    expect(html).toContain("fill-emerald-900/15");
  });

  it("dnešek má zvýrazněný text a tečku", () => {
    const html = renderToStaticMarkup(<DayRing short="Ne" progress={0} isToday />);
    expect(html).toMatchSnapshot();
    expect(html).toContain("text-foreground");
  });
});

describe("StreakHeader", () => {
  it("odpovídá uloženému vzhledu (série vlevo, kroužky uprostřed, kalendář vpravo)", () => {
    const html = renderToStaticMarkup(
      <AppStoreProvider>
        <StreakHeader />
      </AppStoreProvider>,
    );
    expect(html).toMatchSnapshot();
  });

  it("vykresluje všech sedm dní a tlačítko přehledu aktivity", () => {
    const html = renderToStaticMarkup(
      <AppStoreProvider>
        <StreakHeader />
      </AppStoreProvider>,
    );
    for (const short of ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"]) {
      expect(html).toContain(`>${short}<`);
    }
    expect(html).toContain('aria-label="Přehled aktivity"');
  });
});
