export function cleanPlate(value = '') {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

export function validateVehicle(vehicle, vehicles = [], editingId = null) {
  const errors = {};
  if (!['car', 'motorcycle'].includes(vehicle.type))
    errors.type = 'Choose a vehicle type.';
  if (!vehicle.make?.trim()) errors.make = 'Enter the vehicle brand.';
  if (!vehicle.model?.trim()) errors.model = 'Enter the model.';
  const year = Number(vehicle.year);
  if (
    !Number.isInteger(year) ||
    year < 1900 ||
    year > new Date().getFullYear() + 1
  )
    errors.year = 'Enter a valid model year.';
  if (!vehicle.color?.trim()) errors.color = 'Enter the vehicle color.';
  const plate = cleanPlate(vehicle.plate);
  if (plate && !/^[A-Z0-9 -]{2,15}$/.test(plate))
    errors.plate = 'Use 2 to 15 letters, numbers, spaces, or hyphens.';
  if (
    plate &&
    vehicles.some(
      (item) =>
        item.id !== editingId &&
        cleanPlate(item.plate).replace(/[ -]/g, '') ===
          plate.replace(/[ -]/g, ''),
    )
  )
    errors.plate = 'A vehicle with this plate is already saved.';
  return errors;
}

export function validateSchedule(value, now = Date.now()) {
  return !value || Number.isNaN(Date.parse(value)) || Date.parse(value) <= now
    ? 'Choose a date and time in the future.'
    : '';
}

export function localDateTime(date = new Date()) {
  const part = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}T${part(date.getHours())}:${part(date.getMinutes())}`;
}
