import { postTodaysWeatherToDiscord } from './handler';

// Define functions to be executed from GAS in global
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let global: any;

global.postTodaysWeatherToDiscord = postTodaysWeatherToDiscord;
