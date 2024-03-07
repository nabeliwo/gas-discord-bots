export type Calendar = {
  id: string;
  name: string;
  events: CalendarEvent[];
};

export type CalendarEvent = {
  id: string;
  title: string;
  description: string;
  startTime: GoogleAppsScript.Base.Date;
  period: string;
  isAllDayEvent: boolean;
  color: string;
  calendarName: string;
};

const properties = PropertiesService.getScriptProperties();
const config = {
  requiredCalendarIds: properties.getProperty('REQUIRED_CALENDAR_IDS') ?? '',
  nextSyncTokenPropertyName: 'NEXT_SYNC_TOKEN',
  getOption: {
    maxResults: 65536,
    showDeleted: true,
  },
};

function getAllCalendars(): GoogleAppsScript.Calendar.Calendar[] {
  const ownedCalendars = CalendarApp.getAllOwnedCalendars();
  const requiredCalendars = config.requiredCalendarIds
    .split(',')
    .map((id) => CalendarApp.getCalendarById(id.trim()));

  return [...ownedCalendars, ...requiredCalendars];
}

function parseEvent(
  event: GoogleAppsScript.Calendar.CalendarEvent,
  calendar: GoogleAppsScript.Calendar.Calendar,
): CalendarEvent {
  const isAllDayEvent = event.isAllDayEvent();
  const dateFormatString = isAllDayEvent ? 'YYYY/MM/dd' : 'YYYY/MM/dd HH:mm';
  const startAndEnd = isAllDayEvent
    ? [event.getAllDayStartDate(), new Date(event.getAllDayEndDate().getTime() - 1)]
    : [event.getStartTime(), event.getEndTime()];

  return {
    id: event.getId(),
    title: event.getTitle(),
    description: event.getDescription(),
    startTime: startAndEnd[0],
    period: Array.from(
      new Set(startAndEnd.map((date) => Utilities.formatDate(date, 'JST', dateFormatString))),
    ).join(' ~ '),
    isAllDayEvent,
    color: event.getColor() || calendar.getColor(),
    calendarName: calendar.getName(),
  };
}

export function initializeCalendarSyncToken() {
  const calendars = getAllCalendars();

  calendars.forEach((calendar) => {
    const id = calendar.getId();
    const eventsSchema = Calendar.Events?.list(id, {
      ...config.getOption,
      timeMin: new Date().toISOString(),
    });

    if (!eventsSchema) {
      throw new Error('Failed to get events');
    }

    if (!eventsSchema.nextSyncToken) {
      throw new Error('Failed to get nextSyncToken');
    }

    properties.setProperty(`${config.nextSyncTokenPropertyName}_${id}`, eventsSchema.nextSyncToken);
  });
}

export function getStoredEventsWithUpdate(
  calendarId: string,
): GoogleAppsScript.Calendar.Schema.Event[] {
  const eventsSchema = Calendar.Events?.list(calendarId, {
    ...config.getOption,
    syncToken: properties.getProperty(`${config.nextSyncTokenPropertyName}_${calendarId}`),
  });

  if (!eventsSchema || !eventsSchema.nextSyncToken) {
    return [];
  }

  properties.setProperty(
    `${config.nextSyncTokenPropertyName}_${calendarId}`,
    eventsSchema.nextSyncToken,
  );

  return eventsSchema.items ?? [];
}

export function getEvent(id: string): CalendarEvent | null {
  const calendars = getAllCalendars();
  let targetEvent: CalendarEvent | null = null;

  calendars.forEach((calendar) => {
    const event = calendar.getEventById(id);

    if (event) {
      targetEvent = parseEvent(event, calendar);
    }
  });

  return targetEvent;
}

export function getUpdateEventStatus(event: GoogleAppsScript.Calendar.Schema.Event) {
  if (!event.updated || !event.created || !event.status) {
    return '不明';
  }

  const statusMap: Record<string, string> = {
    confirmed: Date.parse(event.updated) - Date.parse(event.created) < 5e3 ? '追加' : '変更',
    tentative: '暫定',
    cancelled: '削除',
  };

  return statusMap[event.status] ?? '不明';
}

export function getCalendarsWithEvents(date: Date): Calendar[] {
  return getAllCalendars().map((calendar) => ({
    id: calendar.getId(),
    name: calendar.getName(),
    events: calendar.getEventsForDay(date).map((event) => parseEvent(event, calendar)),
  }));
}

export function getAllCalendarEvents(date: Date): CalendarEvent[] {
  const calendars = getCalendarsWithEvents(date);
  return calendars.flatMap((calendar) => calendar.events);
}
