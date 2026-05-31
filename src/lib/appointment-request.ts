export type AppointmentRequestPayload = {
  bedrooms: number;
  bathrooms: number;
  preferredTime1: string;
  preferredTime2: string;
  preferredTime3: string;
};

export type AppointmentRequestValidation =
  | {
      ok: true;
      bedrooms: number;
      bathrooms: number;
      preferredTime1: string;
      preferredTime2: string;
      preferredTime3: string;
    }
  | {
      ok: false;
      error: string;
    };

export function validateAppointmentRequestPayload(payload: AppointmentRequestPayload): AppointmentRequestValidation {
  const bedrooms = Number(payload.bedrooms);
  const bathrooms = Number(payload.bathrooms);

  if (!Number.isInteger(bedrooms) || bedrooms < 1 || bedrooms > 5) {
    return { ok: false, error: "Bedrooms must be between 1 and 5." };
  }

  if (!Number.isFinite(bathrooms) || bathrooms < 1 || bathrooms > 6) {
    return { ok: false, error: "Bathrooms must be between 1 and 6." };
  }

  const preferredTime1 = toIsoDateTime(payload.preferredTime1);
  const preferredTime2 = toIsoDateTime(payload.preferredTime2);
  const preferredTime3 = toIsoDateTime(payload.preferredTime3);

  if (!preferredTime1 || !preferredTime2 || !preferredTime3) {
    return { ok: false, error: "Preferred times must be valid dates." };
  }

  return {
    ok: true,
    bedrooms,
    bathrooms,
    preferredTime1,
    preferredTime2,
    preferredTime3
  };
}

function toIsoDateTime(value: string) {
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}
