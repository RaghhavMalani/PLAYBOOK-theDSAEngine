interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isStandalone(): boolean {
  return window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function initPwa(): void {
  if (typeof window === "undefined") return;

  let promptEvent: InstallPromptEvent | null = null;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "pwa-install";
  button.textContent = isStandalone() ? "offline ready" : "install app";
  button.hidden = !isStandalone();
  document.body.appendChild(button);

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    promptEvent = event as InstallPromptEvent;
    button.hidden = false;
  });
  window.addEventListener("appinstalled", () => {
    promptEvent = null;
    button.textContent = "offline ready";
    button.hidden = false;
    button.disabled = true;
  });
  button.onclick = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") button.hidden = true;
    promptEvent = null;
  };

  if (import.meta.env.PROD && "serviceWorker" in navigator && location.protocol !== "file:") {
    const serviceWorkerUrl = new URL(`${import.meta.env.BASE_URL}service-worker.js`, location.href);
    void navigator.serviceWorker.register(serviceWorkerUrl, { scope: import.meta.env.BASE_URL });
  }
}

