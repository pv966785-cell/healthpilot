export const generateRoomName = (id: string) => `room-${id}`;
export const getCallWindowStatus = (dateTime: string) => ({ canJoin: true });
export const getJitsiUrl = (room: string) => `https://meet.jit.si/${room}`;
export const getDirectionsUrl = (address: string) => `https://google.com/maps/search/${address}`;
