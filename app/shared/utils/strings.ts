export const prettyBytes = (num: number) => {
  const units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const neg = num < 0;
  if (neg) num = -num;
  if (num < 1) return (neg ? '-' : '') + num + ' B';
  const exponent = Math.min(
    Math.floor(Math.log(num) / Math.log(1000)),
    units.length - 1
  );
  const unit = units[exponent];
  num = Number((num / Math.pow(1000, exponent)).toFixed(2));
  return (neg ? '-' : '') + num + ' ' + unit;
};

export const translateGenres = (genres: string[]) => {
  if (!genres) return [];

  const translations = {
    Comedy: 'Comedia',
    Fantasy: 'Fantasía',
    Romance: 'Romance',
    'Slice of Life': 'Vida Cotidiana',
    Supernatural: 'Sobrenatural',
    Action: 'Acción',
    Adventure: 'Aventura',
    Drama: 'Drama',
    'Mahou Shoujo': 'Mahou Shoujo',
    Mystery: 'Misterio',
    Psychological: 'Psicológico',
    'Sci-Fi': 'Ciencia Ficción',
    Ecchi: 'Ecchi',
    Thriller: 'Suspenso',
    Horror: 'Terror',
    Mecha: 'Mecha',
    Sports: 'Deportes',
    Music: 'Música',
  };

  return genres.map((genre) => translations[genre] || genre);
};

const TIME_UNITS = [
  { key: 'segundo', limit: 60, divisor: 1 },
  { key: 'minuto', limit: 3600, divisor: 60 },
  { key: 'hora', limit: 86400, divisor: 3600 },
  { key: 'dia', limit: 2592000, divisor: 86400 }
];

export const timeAgo = (dateISO: string) => {
  const now = new Date().getTime();
  const date = new Date(dateISO).getTime();
  const seconds = Math.floor((now - date) / 1000);

  for (const { key, limit, divisor } of TIME_UNITS) {
    if (seconds < limit) {
      const quantity = Math.floor(seconds / divisor);
      return `Hace ${quantity} ${key}${quantity !== 1 ? 's' : ''}`;
    }
  }
  const { key, divisor } = TIME_UNITS[TIME_UNITS.length - 1];
  const quantity = Math.floor(seconds / divisor);
  return `Hace ${quantity} ${key}${quantity !== 1 ? 's' : ''}`;
};

export const videoFormatTime = (time: number) => {
  if (!time || isNaN(time)) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const normalize = (title: string) => title.toLowerCase().replace(/[^a-z0-9]/g, '');
