import { Discord } from '@package/discord';
import {
  getAllCalendarEvents,
  getCalendarsWithEvents,
  getEvent,
  getStoredEventsWithUpdate,
  getUpdateEventStatus,
  initializeCalendarSyncToken,
} from './calendar';

const discord = new Discord(
  PropertiesService.getScriptProperties().getProperty('DISCORD_WEBHOOK_URL') ?? '',
);
const properties = PropertiesService.getScriptProperties();
const config = {
  eventIdsPropertyName: 'EVENT_IDS',
  postSchedule: {
    todayEvents: properties.getProperty('POST_TODAY_EVENTS_TIME') ?? '07:00',
    triggerBeforeMinutes: properties.getProperty('TRIGGER_BEFORE_MINUTES')
      ? Number(properties.getProperty('TRIGGER_BEFORE_MINUTES')) ?? 30
      : 30,
  },
};

// Function to initialize sync token for calendar. Execute manually at any time.
export function initializeCalendar() {
  initializeCalendarSyncToken();
}

// Function called when calendar is updated.
export function onCalendarUpdate(updateEvent: GoogleAppsScript.Events.CalendarEventUpdated) {
  const events = getStoredEventsWithUpdate(updateEvent.calendarId);

  if (events.length === 0) {
    return;
  }

  const embeds = events
    .map((e) => {
      if (!e.id) {
        return null;
      }

      const event = getEvent(e.id!);

      if (!event) {
        return null;
      }

      return {
        title: event.title,
        description: (event.description ? event.description + '\n' : '') + event.period,
        color: event.color,
        fields: [
          {
            name: '操作',
            value: getUpdateEventStatus(e),
          },
        ],
        footer: { text: event.calendarName },
      };
    })
    .filter((event): event is NonNullable<typeof event> => event !== null);

  discord.sendPost({
    content: ':bulb: 予定が更新されました :bulb:',
    embeds,
  });

  setDiscordPostScheduleForGoogleCalendar();
}

// Function to notify today's schedule.
export function postGoogleCalendarTodayEventsToDiscord() {
  const calendars = getCalendarsWithEvents(new Date());

  calendars.forEach((calendar) => {
    const eventLength = calendar.events.length;
    const content =
      eventLength > 0
        ? `本日の ${calendar.name} の予定は${eventLength}件です`
        : `本日の ${calendar.name} の予定はありません`;

    discord.sendPost({
      content: `:bulb: ${content} :bulb:`,
      embeds: calendar.events.map((event) => ({
        title: event.title,
        description: (event.description ? event.description + '\n' : '') + event.period,
        color: event.color,
      })),
    });
  });
}

// Function to notify just before the start time of the event.
export function postEventStartNotificationToDiscord() {
  const eventIds = (properties.getProperty(config.eventIdsPropertyName) ?? '').split(',');

  // Get the first one of the queued events.
  const event = getEvent(eventIds[0]);

  if (!event) {
    return;
  }

  discord.sendPost({
    content: `:information_source: ${config.postSchedule.triggerBeforeMinutes}分後に ${event.title} が始まります :dash:`,
    embeds: [
      {
        title: event.title,
        description: event.period,
        color: event.color,
        footer: { text: event.calendarName },
      },
    ],
  });

  // Delete head of queue.
  properties.setProperty(config.eventIdsPropertyName, eventIds.slice(1).join(','));
}

// Function to trigger postGoogleCalendarTodayEventsToDiscord and postEventStartNotificationToDiscord to fire at a specified time.
export function setDiscordPostScheduleForGoogleCalendar() {
  const today = new Date();
  const setTrigger = (functionName: string, time: Date) => {
    ScriptApp.newTrigger(functionName).timeBased().at(time).create();
  };

  // Delete past triggers.
  ScriptApp.getProjectTriggers().forEach((trigger) => {
    if (
      [
        postGoogleCalendarTodayEventsToDiscord.name,
        postEventStartNotificationToDiscord.name,
      ].includes(trigger.getHandlerFunction())
    ) {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Set triggers to notify you of today's events.
  const todayEventsTime = new Date(today.toDateString() + ' ' + config.postSchedule.todayEvents);
  if (todayEventsTime.getTime() > today.getTime()) {
    setTrigger(postGoogleCalendarTodayEventsToDiscord.name, todayEventsTime);
  }

  // Set trigger to notify just before event start time.
  const events = getAllCalendarEvents(today);
  const triggerEvents = events
    .map((event) => {
      const time = new Date(
        event.startTime.getTime() - config.postSchedule.triggerBeforeMinutes * 6e4,
      );

      // Excludes all-day events and past events.
      if (event.isAllDayEvent || !(time.getTime() > today.getTime())) {
        return null;
      }

      // Set trigger to notify just before event start time.
      setTrigger(postEventStartNotificationToDiscord.name, time);

      return {
        id: event.id,
        time: time.getTime(),
      };
    })
    .filter((event): event is NonNullable<typeof event> => event !== null);

  // Queue events in order of start time.
  properties.setProperty(
    config.eventIdsPropertyName,
    triggerEvents
      .sort((a, b) => Math.sign(a.time - b.time))
      .map((e) => e.id)
      .join(','),
  );
}
