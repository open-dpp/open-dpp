import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(timezone);

export function getCurrentTimezone() {
  return dayjs.tz.guess();
}

export function getNowInCurrentTimezone() {
  return dayjs().toDate();
}
