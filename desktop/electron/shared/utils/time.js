export const humanizeDuration = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years} año${years > 1 ? 's' : ''}`;
  if (weeks > 0) return `${weeks} semana${weeks > 1 ? 's' : ''}`;
  if (days > 0) return `${days} día${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hora${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
  
  return `${seconds} segundo${seconds > 1 ? 's' : ''}`;
};
