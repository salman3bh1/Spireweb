import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Leaderboards } from "./leaderboards";
import type { GuildData } from "./kit";

vi.mock("@/lib/leaderboards.functions", () => ({ getGlobalLeaderboards: vi.fn(async () => ({ creditTop: [{ id: "999999999999999999", name: "عضو عالمي", credits: 9000 }], streakTop: [], updatedAt: "2026-10-09" })) }));
afterEach(cleanup);
const data = { guild: { name: "سيرفر الاختبار" }, telemetryAt: "2026-10-09", activityTop: Array.from({ length: 100 }, (_, i) => ({ id: String(100000000000000000n + BigInt(i)), name: `عضو ${i + 1}`, xp: 100-i, level: 1 })), creditTop: [{ id: "888888888888888888", name: "عضو محلي", credits: 10 }], streakTop: [] } as unknown as GuildData;
function mount() {
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><Leaderboards data={data} guildId="123456789012345678" /></QueryClientProvider>);
}
describe("Leaderboard navigation", () => {
  it("paginates the top 100 and resets pagination on tab change", () => {
    mount();
    expect(screen.getByText("#1")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "الصفحة التالية" }));
    expect(screen.getByText("#21")).toBeInTheDocument();
    for (let i=0;i<3;i++) fireEvent.click(screen.getByRole("button", { name: "الصفحة التالية" }));
    expect(screen.getByText("#100")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "الصفحة التالية" })).toBeDisabled();
    fireEvent.click(screen.getByRole("tab", { name: "الأكثر كريدت" }));
    expect(screen.getByText("عضو محلي")).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
  });
  it("loads global credits separately and shows an empty streak state", async () => {
    mount();
    expect(screen.queryByRole("button", { name: "جميع السيرفرات" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "الأكثر كريدت" }));
    fireEvent.click(screen.getByRole("button", { name: "جميع السيرفرات" }));
    expect(await screen.findByText("عضو عالمي")).toBeInTheDocument();
    expect(screen.queryByText("عضو محلي")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "توب الستريك" }));
    expect(screen.getByText("لا توجد أسماء في هذا الترتيب بعد.")).toBeInTheDocument();
  });
});