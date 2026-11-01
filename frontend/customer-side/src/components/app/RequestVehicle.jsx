import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VehicleIcon } from '../customer/VehicleIcon';
export function RequestVehicle({ vehicle, service }) {
  return <Link className="customer-request-vehicle" to={`/vehicles?continue=${service}`}>
    <VehicleIcon type={vehicle.type} /><span><strong>{vehicle.make} {vehicle.model} · {vehicle.year}</strong><small>{[vehicle.color, vehicle.plateNumber || vehicle.plate].filter(Boolean).join(' · ')}</small></span><ChevronDown size={18} />
  </Link>;
}

