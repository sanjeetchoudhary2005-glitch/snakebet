const cache: Record<string, HTMLAudioElement> = {};

export function playSound(name: "click" | "chip" | "win" | "lose") {
  if (typeof window === "undefined") return;
  if (localStorage.getItem("bv-sound") !== "on") return;
  if (!cache[name]) cache[name] = new Audio(`/sounds/${name}.mp3`);
  cache[name].currentTime = 0;
  cache[name].play().catch(() => {});
}

export function isSoundEnabled() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("bv-sound") === "on";
}

export function setSoundEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem("bv-sound", enabled ? "on" : "off");
}
