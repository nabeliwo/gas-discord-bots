const config = {
  latitude: PropertiesService.getScriptProperties().getProperty('LATITUDE') ?? '35.856',
  longitude: PropertiesService.getScriptProperties().getProperty('LONGITUDE') ?? '139.903',
  locationName: PropertiesService.getScriptProperties().getProperty('LOCATION_NAME') ?? '流山市',
  apiKey: PropertiesService.getScriptProperties().getProperty('WEATHER_API_KEY') ?? '',
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

type WeatherApiResponse = {
  forecast: {
    forecastday: {
      day: {
        maxtemp_c: number;
        mintemp_c: number;
        condition: {
          code: number;
        };
      };
      hour: {
        time: string;
        chance_of_rain: number;
      }[];
    }[];
  };
};

function weatherCodeToTelop(code: number): string {
  if (code === 1000) return '晴れ';
  if (code === 1003) return '晴れ時々曇り';
  if (code === 1006 || code === 1009 || code === 1030 || code === 1135 || code === 1147) return '曇り';
  const snowCodes = [1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1255, 1258, 1261, 1264, 1279, 1282];
  if (snowCodes.includes(code)) return '雪';
  return '雨';
}

function getPrecipitationByPeriod(hours: { time: string; chance_of_rain: number }[]): ChanceOfRain {
  const buckets: Record<string, number[]> = { '00': [], '06': [], '12': [], '18': [] };

  hours.forEach(({ time, chance_of_rain }) => {
    const hour = parseInt(time.slice(11, 13));
    if (hour < 6) buckets['00'].push(chance_of_rain);
    else if (hour < 12) buckets['06'].push(chance_of_rain);
    else if (hour < 18) buckets['12'].push(chance_of_rain);
    else buckets['18'].push(chance_of_rain);
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
    'https://api.weatherapi.com/v1/forecast.json',
    `?key=${config.apiKey}`,
    `&q=${config.latitude},${config.longitude}`,
    '&days=1',
    '&aqi=no',
    '&alerts=no',
  ].join('');

  const response = UrlFetchApp.fetch(url, { method: 'get', muteHttpExceptions: true });
  if (response.getResponseCode() === 403) {
    throw new Error('WeatherAPI キーが無効です。スクリプトプロパティを確認してください。');
  }
  if (response.getResponseCode() !== 200) {
    throw new Error(`WeatherAPI エラー: HTTP ${response.getResponseCode()}`);
  }
  const json = JSON.parse(response.getContentText()) as WeatherApiResponse;

  const day = json.forecast.forecastday[0].day;
  const hours = json.forecast.forecastday[0].hour;

  return {
    title: `${config.locationName}の天気`,
    telop: weatherCodeToTelop(day.condition.code),
    temperature: {
      max: day.maxtemp_c != null ? Math.round(day.maxtemp_c).toString() : null,
      min: day.mintemp_c != null ? Math.round(day.mintemp_c).toString() : null,
    },
    chanceOfRain: getPrecipitationByPeriod(hours),
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
