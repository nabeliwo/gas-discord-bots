const config = {
  url: 'https://weather.tsukumijima.net/api/forecast/city',
  cityId: PropertiesService.getScriptProperties().getProperty('CITY_ID') ?? '',
};

type ChanceOfRain = {
  T00_06: string;
  T06_12: string;
  T12_18: string;
  T18_24: string;
};
type WeatherResponse = {
  title: string;
  forecasts: Array<{
    dateLabel: string;
    telop: string;
    temperature: {
      min: {
        celsius: string;
      };
      max: {
        celsius: string;
      };
    };
    chanceOfRain: ChanceOfRain;
  }>;
};

type Weather = {
  title: string;
  telop: string;
  temperature: {
    min: string;
    max: string;
  };
  chanceOfRain: ChanceOfRain;
};

function parseWeatherResponse(weather: WeatherResponse): Weather {
  const forecast = weather.forecasts.find((item) => item.dateLabel === '今日');

  if (!forecast) {
    throw new Error('Failed to get forecast');
  }

  return {
    title: weather.title,
    telop: forecast.telop,
    temperature: {
      min: forecast.temperature.min.celsius,
      max: forecast.temperature.max.celsius,
    },
    chanceOfRain: forecast.chanceOfRain,
  };
}

export function getTodaysWeather(): Weather {
  const response = UrlFetchApp.fetch(`${config.url}/${config.cityId}`, {
    method: 'get',
    contentType: 'application/json',
  });
  const json = JSON.parse(response.getContentText()) as WeatherResponse;

  return parseWeatherResponse(json);
}

export function formatTelopToEmoji(telop: string): string {
  const emojiMap: Record<string, string> = {
    晴: ':sunny:',
    曇: ':cloud:',
    雨: ':cloud_rain:',
    雪: ':snowman:',
  };

  return telop.replace(/[晴曇雨雪]/g, (matched) => ` ${emojiMap[matched]} `).trim();
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
