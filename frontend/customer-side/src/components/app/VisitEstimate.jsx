import { tr } from "../../i18n/translations";
import { validEstimate } from '../../utils/bookingValidation';
const money = value => new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
}).format(value);
export function VisitEstimate({
  estimate,
  service = 'mechanic'
}) {
  if (!validEstimate(estimate)) return <section className="provider-estimate"><h2>{tr("Visit estimate pending")}</h2><p>{tr("A current, itemized estimate is required before you can book.")}</p></section>;
  return <section className="provider-estimate"><h2>{tr("Itemized")} {service === 'repair' ? tr("repair") : service === 'towing' ? tr("towing") : tr("visit")} {tr("estimate")}</h2>
    <dl>{estimate.items.map((item, index) => <div key={`${item.label}-${index}`}><dt>{item.label}</dt><dd>{money(item.amount)}</dd></div>)}<div className="estimate-total"><dt>{tr("Estimated total")}</dt><dd>{money(estimate.total)}</dd></div></dl>
    <p>{service === 'repair' ? tr("Only these itemized repair charges are included. Further changes require your approval.") : service === 'towing' ? tr("Any additional charges need your approval before work starts.") : tr("Parts and repairs are not approved by this booking. Review and approve those costs separately after diagnosis.")}</p>
  </section>;
}
