import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/es';

// Configurar dayjs
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('es');

// Configurar timezone por defecto
const TIMEZONE = 'America/Lima';

const configuredDayjs = dayjs;
configuredDayjs.tz = dayjs.tz;
configuredDayjs.tz.setDefault(TIMEZONE);

export { configuredDayjs as dayjs };
export { TIMEZONE };
