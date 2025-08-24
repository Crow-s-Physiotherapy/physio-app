// Services exports
// These will be uncommented when services are created in later tasks
// export * from './supabase';
export {
  getAvailableTimeSlots as getAvailableTimeSlotsFromCalendar,
  getAppointments,
  EdgeFunctionError as CalendarEdgeFunctionError
} from './googleCalendar';

export {
  getAvailableTimeSlots,
  createAppointmentWithEdgeFunction,
  updateAppointmentWithEdgeFunction,
  cancelAppointmentWithEdgeFunction,
  getAppointmentsWithEdgeFunction,
  getUserAppointments
} from './appointmentService';

export {
  getAvailableTimeSlotsWithEdgeFunction,
  createAppointmentWithEdgeFunction as createAppointmentEdge,
  updateAppointmentWithEdgeFunction as updateAppointmentEdge,
  cancelAppointmentWithEdgeFunction as cancelAppointmentEdge,
  EdgeFunctionError
} from './appointmentEdgeService';
export * from './videoService';
// YouTube service removed - using static thumbnails in videoService instead
// export * from './stripe';
// export * from './email';
