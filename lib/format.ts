export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(value));
}

export function remainingText(endTime: string) {
  const ms = new Date(endTime).getTime() - Date.now();
  if (ms <= 0) return "已结束";
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}天 ${hours % 24}小时`;
  if (hours > 0) return `${hours}小时 ${minutes % 60}分`;
  return `${minutes}分`;
}
