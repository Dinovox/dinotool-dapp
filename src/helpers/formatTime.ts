const formatTime = (seconds: number) => {
  const j = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (j > 0) {
    return `${j}j ${h}h`;
  } else if (h > 0) {
    return `${h}h ${m}m`;
  } else {
    return `${m}m ${s}s`;
  }
};
export default formatTime;
