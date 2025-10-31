import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

export function getCurrentTimezone() {
  return dayjs.tz.guess();
}

export function getNowInCurrentTimezone() {
  return dayjs().toDate();
}
