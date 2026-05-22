/** Full page navigation so the service worker can serve cached offline HTML. */
export function hardNavigate(href: string): void {
  window.location.assign(href);
}

export function shouldHardNavigateOffline(): boolean {
  return typeof navigator !== "undefined" && !navigator.onLine;
}
