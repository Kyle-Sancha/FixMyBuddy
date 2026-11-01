import { BatteryCharging, CircleDot, ThermometerSun, Fuel, KeyRound, Power, Truck, TriangleAlert, Wrench } from 'lucide-react';

export const mechanicIssues = [
  { title: 'Battery', description: 'Jump-start or replacement', icon: BatteryCharging },
  { title: 'Flat tire', description: 'Spare tire or tire repair', icon: CircleDot },
  { title: 'Overheating', description: 'Cooling system check', icon: ThermometerSun },
  { title: 'Fuel delivery', description: 'Get enough to get moving', icon: Fuel },
  { title: 'Lockout', description: 'Help getting back inside', icon: KeyRound },
  { title: 'Vehicle not starting', description: 'Starting system diagnosis', icon: Power },
  { title: 'Other', description: 'Tell us what needs attention', icon: Wrench },
];
export const towingIssues = [
  { title: 'Breakdown', description: 'Your vehicle cannot continue safely', icon: Wrench },
  { title: 'Accident', description: 'Transport after a collision', icon: TriangleAlert },
  { title: 'Vehicle transport', description: 'Move your vehicle to another location', icon: Truck },
];
export const issuesFor = (service) => service === 'towing' ? towingIssues : mechanicIssues;

