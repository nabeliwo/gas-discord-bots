const config = {
  latitude: PropertiesService.getScriptProperties().getProperty('LATITUDE') ?? '35.856',
  longitude: PropertiesService.getScriptProperties().getProperty('LONGITUDE') ?? '139.903',
  locationName: PropertiesService.getScriptProperties().getProperty('LOCATION_NAME') ?? '流山市',
};

type ChanceOfRain = {
  T00_06: string;
  T06_12: string;
  T12_18: string;
  T18_24: string;
};

type Weather = {
  title: string;
  telop: string;
  temperature: {
    min: string | null;
    max: string | null;
  };
  chanceOfRain: ChanceOfRain;
};

type OpenMeteoResponse = {
  daily: {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weathercode: number[];
  };
  hourly: {
    time: string[];
    precipitation_probability: (number | null)[];
  };
};

function weatherCodeToTelop(code: number): string {
  if (code <= 1) return '晴れ';
  if (code === 2) return '晴れ時々曇り';
  if (code <= 48) return '曇り';
  if (code <= 67) return '雨';
  if (code <= 77) return '雪';
  if (code <= 82) return '雨';
  if (code <= 86) return '雪';
  return '雨';
}

function getPrecipitationByPeriod(times: string[], probs: (number | null)[]): ChanceOfRain {
  const todayStr = Utilities.formatDate(new Date(), 'JST', 'yyyy-MM-dd');

  const buckets: Record<string, number[]> = { '00': [], '06': [], '12': [], '18': [] };

  times.forEach((time, i) => {
    if (!time.startsWith(todayStr)) return;
    const hour = parseInt(time.slice(11, 13));
    const prob = probs[i];
    if (prob == null) return;
    if (hour < 6) buckets['00'].push(prob);
    else if (hour < 12) buckets['06'].push(prob);
    else if (hour < 18) buckets['12'].push(prob);
    else buckets['18'].push(prob);
  });

  const toText = (arr: number[]) => (arr.length > 0 ? Math.max(...arr) + '%' : '--%');

  return {
    T00_06: toText(buckets['00']),
    T06_12: toText(buckets['06']),
    T12_18: toText(buckets['12']),
    T18_24: toText(buckets['18']),
  };
}

export function getTodaysWeather(): Weather {
  const url = [
    'https://api.open-meteo.com/v1/forecast',
    `?latitude=${config.latitude}`,
    `&longitude=${config.longitude}`,
    '&daily=temperature_2m_max,temperature_2m_min,weathercode',
    '&hourly=precipitation_probability',
    '&timezone=Asia%2FTokyo',
    '&forecast_days=1',
  ].join('');

  const response = UrlFetchApp.fetch(url, { method: 'get', muteHttpExceptions: true });
  if (response.getResponseCode() === 429) {
    throw new Error('Open-Meteo API の1日のリクエスト上限を超えました。明日リセットされます。');
  }
  if (response.getResponseCode() !== 200) {
    throw new Error(`Open-Meteo API エラー: HTTP ${response.getResponseCode()}`);
  }
  const json = JSON.parse(response.getContentText()) as OpenMeteoResponse;

  const max = json.daily.temperature_2m_max[0];
  const min = json.daily.temperature_2m_min[0];

  return {
    title: `${config.locationName}の天気`,
    telop: weatherCodeToTelop(json.daily.weathercode[0]),
    temperature: {
      max: max != null ? Math.round(max).toString() : null,
      min: min != null ? Math.round(min).toString() : null,
    },
    chanceOfRain: getPrecipitationByPeriod(json.hourly.time, json.hourly.precipitation_probability),
  };
}

export function formatTelopToEmoji(telop: string): string {
  const emojiMap: Record<string, string> = {
    晴れ: ':sunny:',
    晴: ':sunny:',
    曇り: ':cloud:',
    曇: ':cloud:',
    雨: ':cloud_rain:',
    雪: ':snowman:',
  };

  const pattern = new RegExp(Object.keys(emojiMap).join('|'), 'g');
  return telop.replace(pattern, (matched) => ` ${emojiMap[matched]} `).trim();
}

export function formatChanceOfRainToText(chanceOfRain: ChanceOfRain): string {
  const array = [
    `0~6時: ${chanceOfRain.T00_06}`,
    `6~12時: ${chanceOfRain.T06_12}`,
    `12~18時: ${chanceOfRain.T12_18}`,
    `18~24時: ${chanceOfRain.T18_24}`,
  ];

  return array.join(' / ');
}
