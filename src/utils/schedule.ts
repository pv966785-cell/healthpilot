export interface ComputedSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export const generateDoctorSlots = (schedule: any, date: string) => [];
export const getNextAvailableSlot = (slots: ComputedSlot[]) => null;
export const formatDateToYYYYMMDD = (date: Date) => '';
export const formatTime12H = (time: string) => '';
