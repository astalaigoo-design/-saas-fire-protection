import {
  buildVisitProofSummary,
  formatOnSiteDuration,
  googleMapsCoordsUrl,
} from "@/lib/inspect/visit-proof";
import { formatDateTime } from "@/lib/dashboard/dates";

type VisitProofSummaryProps = {
  startedAt: Date | null;
  arrivedAt: Date | null;
  completedAt: Date | null;
  mileageMiles: number | null;
  arrivalLatitude: number | null;
  arrivalLongitude: number | null;
  submitLatitude: number | null;
  submitLongitude: number | null;
};

export function VisitProofSummary(props: VisitProofSummaryProps) {
  const proof = buildVisitProofSummary(props);
  const hasProof =
    proof.arrivedAt ||
    proof.startedAt ||
    proof.mileageMiles != null ||
    proof.hasArrivalGps ||
    proof.hasSubmitGps;

  if (!hasProof) return null;

  return (
    <section
      aria-labelledby="visit-proof-heading"
      className="mx-4 rounded-2xl border border-slate-700 bg-slate-900 p-5"
    >
      <h2 id="visit-proof-heading" className="text-base font-semibold text-white">
        Visit proof
      </h2>
      <dl className="mt-3 space-y-2 text-sm">
        {proof.arrivedAt ? (
          <div>
            <dt className="text-slate-500">Checked in on site</dt>
            <dd className="text-slate-200">{formatDateTime(proof.arrivedAt)}</dd>
          </div>
        ) : proof.startedAt ? (
          <div>
            <dt className="text-slate-500">Started</dt>
            <dd className="text-slate-200">{formatDateTime(proof.startedAt)}</dd>
          </div>
        ) : null}
        {proof.completedAt ? (
          <div>
            <dt className="text-slate-500">Submitted</dt>
            <dd className="text-slate-200">{formatDateTime(proof.completedAt)}</dd>
          </div>
        ) : null}
        {proof.onSiteMinutes != null ? (
          <div>
            <dt className="text-slate-500">Time on site</dt>
            <dd className="text-slate-200">{formatOnSiteDuration(proof.onSiteMinutes)}</dd>
          </div>
        ) : null}
        {proof.mileageMiles != null ? (
          <div>
            <dt className="text-slate-500">Mileage</dt>
            <dd className="text-slate-200">{proof.mileageMiles.toFixed(1)} mi</dd>
          </div>
        ) : null}
        {proof.hasArrivalGps && proof.arrivalLatitude != null && proof.arrivalLongitude != null ? (
          <div>
            <dt className="text-slate-500">Arrival GPS</dt>
            <dd>
              <a
                href={googleMapsCoordsUrl(proof.arrivalLatitude, proof.arrivalLongitude)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-amber-400 hover:text-amber-300"
              >
                View on map →
              </a>
            </dd>
          </div>
        ) : null}
        {proof.hasSubmitGps && proof.submitLatitude != null && proof.submitLongitude != null ? (
          <div>
            <dt className="text-slate-500">Submit GPS</dt>
            <dd>
              <a
                href={googleMapsCoordsUrl(proof.submitLatitude, proof.submitLongitude)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-amber-400 hover:text-amber-300"
              >
                View on map →
              </a>
            </dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
