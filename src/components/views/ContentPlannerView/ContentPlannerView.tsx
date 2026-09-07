"use client";

import { EventsView } from "@/components/views/EventsView/EventsView";

// Content Planner has been merged into Events — keep the route as an alias
// so existing links/bookmarks still work, opening Events on its Content tab.
export function ContentPlannerView() {
  return <EventsView initialTab="content" />;
}
