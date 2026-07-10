const ICLOUD_ROOT = "https://caldav.icloud.com/";

export type CalDavEvent = {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  etag?: string;
};

function basicAuth(appleId: string, appPassword: string) {
  return Buffer.from(`${appleId}:${appPassword}`).toString("base64");
}

function extractHref(xml: string, tag: string) {
  const pattern = new RegExp(`<(?:[A-Za-z]+:)?${tag}[^>]*>\\s*<(?:[A-Za-z]+:)?href[^>]*>([^<]+)</(?:[A-Za-z]+:)?href>`, "i");
  const match = xml.match(pattern);
  return match?.[1]?.trim() ?? null;
}

function extractHrefAfter(xml: string, marker: string) {
  const index = xml.indexOf(marker);
  if (index === -1) {
    return null;
  }
  const slice = xml.slice(index);
  const hrefMatch = slice.match(/<(?:[A-Za-z]+:)?href[^>]*>([^<]+)<\/(?:[A-Za-z]+:)?href>/i);
  return hrefMatch?.[1]?.trim() ?? null;
}

async function caldavRequest(
  url: string,
  method: string,
  auth: string,
  body?: string,
  depth = "0",
) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      Depth: depth,
      "Content-Type": "application/xml; charset=utf-8",
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`CalDAV ${method} failed (${response.status}): ${text.slice(0, 200)}`);
  }

  return response.text();
}

function formatCalDavUtc(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function parseIcsDate(value: string) {
  const cleaned = value.trim();
  const allDay = cleaned.length === 8;
  if (allDay) {
    const year = cleaned.slice(0, 4);
    const month = cleaned.slice(4, 6);
    const day = cleaned.slice(6, 8);
    const iso = `${year}-${month}-${day}T00:00:00.000Z`;
    return { iso, allDay: true };
  }

  const normalized = cleaned.replace(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/,
    "$1-$2-$3T$4:$5:$6Z",
  );
  return { iso: new Date(normalized).toISOString(), allDay: false };
}

function parseIcsEvents(ics: string): CalDavEvent[] {
  const blocks = ics.split("BEGIN:VEVENT").slice(1);
  const events: CalDavEvent[] = [];

  for (const block of blocks) {
    const lines = block.split(/\r?\n/);
    const fields = new Map<string, string>();

    for (const line of lines) {
      if (!line || line.startsWith("END:VEVENT")) {
        continue;
      }
      const [rawKey, ...rest] = line.split(":");
      if (!rawKey || !rest.length) {
        continue;
      }
      const key = rawKey.split(";")[0]?.toUpperCase();
      fields.set(key, rest.join(":"));
    }

    const uid = fields.get("UID");
    const summary = fields.get("SUMMARY");
    const dtstart = fields.get("DTSTART");
    const dtend = fields.get("DTEND") ?? fields.get("DTSTART");

    if (!uid || !summary || !dtstart || !dtend) {
      continue;
    }

    const start = parseIcsDate(dtstart);
    const end = parseIcsDate(dtend);

    events.push({
      uid,
      title: summary,
      description: fields.get("DESCRIPTION"),
      location: fields.get("LOCATION"),
      startsAt: start.iso,
      endsAt: end.iso,
      allDay: start.allDay,
    });
  }

  return events;
}

export async function discoverPrimaryCalendarUrl(appleId: string, appPassword: string) {
  const auth = basicAuth(appleId, appPassword);

  const principalXml = await caldavRequest(
    ICLOUD_ROOT,
    "PROPFIND",
    auth,
    `<?xml version="1.0" encoding="UTF-8"?>
<D:propfind xmlns:D="DAV:">
  <D:prop><D:current-user-principal /></D:prop>
</D:propfind>`,
    "0",
  );

  const principalHref = extractHref(principalXml, "current-user-principal");
  if (!principalHref) {
    throw new Error("Could not discover iCloud CalDAV principal.");
  }

  const principalUrl = new URL(principalHref, ICLOUD_ROOT).toString();
  const homeXml = await caldavRequest(
    principalUrl,
    "PROPFIND",
    auth,
    `<?xml version="1.0" encoding="UTF-8"?>
<D:propfind xmlns:D="DAV:" xmlns:CS="http://calendarserver.org/ns/" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop><C:calendar-home-set /></D:prop>
</D:propfind>`,
    "0",
  );

  const homeHref = extractHrefAfter(homeXml, "calendar-home-set");
  if (!homeHref) {
    throw new Error("Could not discover iCloud calendar home.");
  }

  const homeUrl = new URL(homeHref, ICLOUD_ROOT).toString();
  const calendarsXml = await caldavRequest(
    homeUrl,
    "PROPFIND",
    auth,
    `<?xml version="1.0" encoding="UTF-8"?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav" xmlns:CS="http://calendarserver.org/ns/">
  <D:prop>
    <D:displayname />
    <C:calendar-description />
    <D:resourcetype />
  </D:prop>
</D:propfind>`,
    "1",
  );

  const responseBlocks = calendarsXml.split("<D:response").slice(1);
  for (const block of responseBlocks) {
    if (!block.includes("calendar")) {
      continue;
    }
    const hrefMatch = block.match(/<D:href>([^<]+)<\/D:href>/i);
    if (!hrefMatch?.[1]) {
      continue;
    }
    const nameMatch = block.match(/<D:displayname>([^<]*)<\/D:displayname>/i);
    return {
      calendarUrl: new URL(hrefMatch[1], ICLOUD_ROOT).toString(),
      calendarName: nameMatch?.[1]?.trim() || "iCloud Calendar",
    };
  }

  throw new Error("No writable CalDAV calendar found on this iCloud account.");
}

export async function fetchCalDavEvents(
  appleId: string,
  appPassword: string,
  calendarUrl: string,
  rangeStart: Date,
  rangeEnd: Date,
) {
  const auth = basicAuth(appleId, appPassword);
  const body = `<?xml version="1.0" encoding="utf-8" ?>
<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:getetag />
    <C:calendar-data />
  </D:prop>
  <C:filter>
    <C:comp-filter name="VCALENDAR">
      <C:comp-filter name="VEVENT">
        <C:time-range start="${formatCalDavUtc(rangeStart)}" end="${formatCalDavUtc(rangeEnd)}" />
      </C:comp-filter>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>`;

  const xml = await caldavRequest(calendarUrl, "REPORT", auth, body, "1");
  const dataBlocks = xml.match(/<(?:C:)?calendar-data[^>]*>([\s\S]*?)<\/(?:C:)?calendar-data>/gi) ?? [];
  const events: CalDavEvent[] = [];

  for (const block of dataBlocks) {
    const ics = block
      .replace(/<(?:C:)?calendar-data[^>]*>/i, "")
      .replace(/<\/(?:C:)?calendar-data>/i, "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .trim();

    events.push(...parseIcsEvents(ics));
  }

  return events;
}

export async function verifyAppleCalDavConnection(appleId: string, appPassword: string) {
  return discoverPrimaryCalendarUrl(appleId, appPassword);
}