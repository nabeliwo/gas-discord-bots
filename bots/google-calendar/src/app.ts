import {
  initializeCalendar,
  onCalendarUpdate,
  setDiscordPostScheduleForGoogleCalendar,
  postEventStartNotificationToDiscord,
  postGoogleCalendarTodayEventsToDiscord,
} from './handler';

// Define functions to be executed from GAS in global
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let global: any;

global.initializeCalendar = initializeCalendar;
global.onCalendarUpdate = onCalendarUpdate;
global.setDiscordPostScheduleForGoogleCalendar = setDiscordPostScheduleForGoogleCalendar;
global.postEventStartNotificationToDiscord = postEventStartNotificationToDiscord;
global.postGoogleCalendarTodayEventsToDiscord = postGoogleCalendarTodayEventsToDiscord;
