import { Discord } from '@package/discord';
import { formatChanceOfRainToText, formatTelopToEmoji, getTodaysWeather } from './weather';

const discord = new Discord(
  PropertiesService.getScriptProperties().getProperty('DISCORD_WEBHOOK_URL') ?? '',
);

export function postTodaysWeatherToDiscord() {
  const weather = getTodaysWeather();

  discord.sendPost({
    content: ':cloud: :rainbow: 今日の天気をお知らせします :rainbow: :cloud:',
    embeds: [
      {
        title: weather.title,
        color: '#0072ff',
        fields: [
          {
            name: '天気',
            value: formatTelopToEmoji(weather.telop),
          },
          {
            name: '最高気温',
            value: weather.temperature.max + '度',
          },
          {
            name: '最低気温',
            value: weather.temperature.min + '度',
          },
          {
            name: '降水確率',
            value: formatChanceOfRainToText(weather.chanceOfRain),
          },
        ],
      },
    ],
  });
}
