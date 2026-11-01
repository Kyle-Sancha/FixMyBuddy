import { Bike, Car, LifeBuoy, Truck, Wrench } from 'lucide-react';

export const serviceOptions = [
  {
    id: 'mechanic',
    label: 'Request Mechanic',
    shortLabel: 'Mechanic',
    icon: Wrench,
    description: 'Get nearby help for flat tires, batteries, overheating, and engine trouble.',
  },
  {
    id: 'towing',
    label: 'Request Towing',
    shortLabel: 'Towing',
    icon: Truck,
    description: 'Find a tow provider when the vehicle cannot safely continue.',
  },
];

export const supportActions = [
  { id: 'motorcycle', label: 'Motorcycles', icon: Bike },
  { id: 'car', label: 'Cars', icon: Car },
  { id: 'support', label: 'Support', icon: LifeBuoy },
];

