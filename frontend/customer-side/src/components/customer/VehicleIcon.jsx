import { Bike, CarFront } from 'lucide-react';
export function VehicleIcon({ type, size = 23 }) {
  const Icon = type === 'motorcycle' ? Bike : CarFront;
  return <Icon size={size} aria-hidden="true" />;
}
