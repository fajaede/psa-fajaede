// fajaede is not VAT-registered: Belgian small-enterprise VAT exemption ("bijzondere vrijstellingsregeling
// kleine ondernemingen", art. 56bis Btw-Wetboek; not registered for OSS either). No VAT is charged on any
// sale and every invoice must carry this note (wording from the accountant). Pure: safe in client components.

export const EXEMPTION_NOTE = "Bijzondere vrijstellingsregeling van belastingplichtige kleine ondernemingen";

/** Annual turnover limit of the exemption (all channels together: psa, FajaedeSEO plugin, fajaede.eu). */
export const EXEMPTION_LIMIT_CENTS = 25_000_00;

/** True for invoices issued under the exemption (older invoices keep their VAT layout). */
export function isExemptInvoice(invoice: { treatment: string | null }): boolean {
  return invoice.treatment === "exempt";
}
