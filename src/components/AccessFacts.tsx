import type { BeachAccess } from "../types/access";

interface AccessFactsProps {
  access: BeachAccess;
}

function yesNo(value: boolean): string {
  return value ? "Yes" : "No";
}

export function AccessFacts({ access }: AccessFactsProps) {
  const parking =
    access.parkingSpots > 0
      ? `${access.parkingSpots} spaces`
      : access.parkingOptions || "No listed parking";
  const fee =
    access.parkingFee === true
      ? "Paid parking"
      : access.parkingFee === false
        ? "No listed parking fee"
        : "Fee unknown";

  return (
    <section className="facts-panel" aria-labelledby="facts-heading">
      <h3 id="facts-heading">Guest facts</h3>
      <div className="facts-grid">
        <div className="fact">
          <b>Parking</b>
          <span>{parking}</span>
          <small>{fee}</small>
        </div>
        <div className="fact">
          <b>Facilities</b>
          <span>{access.restroom ? "Restroom" : "No restroom listed"}</span>
          <small>{access.shower ? "Shower listed" : "No shower listed"}</small>
        </div>
        <div className="fact">
          <b>Accessibility</b>
          <span>ADA: {yesNo(access.handicapAccessible)}</span>
          <small>Mat: {yesNo(access.beachMat || access.mobiMat)}</small>
        </div>
        <div className="fact">
          <b>Source</b>
          <span>{access.source}</span>
          <small>{access.sourceDetail || "No extra source note"}</small>
        </div>
      </div>
    </section>
  );
}
