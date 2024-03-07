# gas-discord-bots_google-calendar

This is a bot that notifies Discord of Google Calendar schedules.

## Specification

- Notification of all schedules for the day at a specified time
- Notify just before an individual schedule (you can specify how many minutes before)
- Notification when schedules are added or updated

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
  - REQUIRED_CALENDAR_IDS
    - If you have calendars other than the main calendar in your Google Account that you want to be notified about in GAS, enter the IDs of those calendars.
    - Must be a calendar registered on Google Calendar
    - If there is more than one, they can be comma-separated
  - POST_TODAY_EVENTS_TIME
    - Enter a time to be notified of all schedules for the day
    - Default is "07:00"
  - TRIGGER_BEFORE_MINUTES
    - Enter how many minutes before the schedule start time you want to be notified
    - Default is "30"
- Set the trigger
  - setDiscordPostScheduleForGoogleCalendar
    - Time-driven / Day timer / Midnight to 1am
  - onCalendarUpdate
    - From calendar / Calendar updated
    - Create multiple triggers for the calendars you want to notify and enter them in the "Calendar owner email".
