# gas-discord-bots_weather

This is a bot that notifies discord of today's weather.  
Use this site's API as a source of information for weather.  
[天気予報 API（livedoor 天気互換）](https://weather.tsukumijima.net/)

## Specification

- Get the day's weather from the weather forecast API and notify discord
- Items displayed are weather, maximum temperature, minimum temperature, and probability of rain

## Get Started

First create a new script on GAS.  
Next, edit `.clasp.json` and enter the ID of your GAS script in `scriptId`.

```bash
pnpm install
pnpm clasp login
pnpm push
```

## What to do on GAS after pushing the script

- Prepare environment variables
  - DISCORD_WEBHOOK_URL
    - webhook url of the discord server to be notified
  - CITY_ID
    - The city id of the neighborhood in which you live
    - The city id can be found at the following link
      - [1次細分区定義表 - livedoor 天気情報](https://weather.tsukumijima.net/primary_area.xml)
    - For example, if "稚内" in "道北" is the closest to your location, it would be "011000"
- Set the trigger
  - postTodaysWeatherToDiscord
    - Time-driven / Day timer / As you like
