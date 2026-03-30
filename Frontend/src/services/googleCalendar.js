/**
 * Google Calendar Integration Service
 * 
 * Uses Google Identity Services (GIS) + Google Calendar API v3
 * to create, sync, and manage calendar events from the app.
 * 
 * Setup Required:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a project (or use existing)
 * 3. Enable "Google Calendar API"
 * 4. Create an OAuth 2.0 Client ID (Web application type)
 * 5. Add your domain(s) to Authorized JavaScript origins
 *    - http://localhost:5173 (for dev)
 *    - https://your-production-domain.com
 * 6. Set VITE_GOOGLE_CLIENT_ID in your .env file
 */

import moment from 'moment';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';
const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

// In-memory token storage (lost on page reload; could use localStorage)
let accessToken = null;
let tokenClient = null;
let isGsiLoaded = false;
let isGapiLoaded = false;

// ────────────────────────────────────────
// 1. Load Google Scripts
// ────────────────────────────────────────

/**
 * Loads the Google Identity Services (GIS) script and the GAPI script.
 * Returns a promise that resolves when both are loaded.
 */
export const loadGoogleScripts = () => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (isGsiLoaded && isGapiLoaded) {
      resolve();
      return;
    }

    let scriptsLoaded = 0;
    const checkDone = () => {
      scriptsLoaded++;
      if (scriptsLoaded === 2) resolve();
    };

    // Load GIS (Google Identity Services) for OAuth
    if (!document.getElementById('google-gsi-script')) {
      const gsiScript = document.createElement('script');
      gsiScript.id = 'google-gsi-script';
      gsiScript.src = 'https://accounts.google.com/gsi/client';
      gsiScript.async = true;
      gsiScript.defer = true;
      gsiScript.onload = () => {
        isGsiLoaded = true;
        checkDone();
      };
      gsiScript.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(gsiScript);
    } else {
      isGsiLoaded = true;
      checkDone();
    }

    // Load GAPI for Calendar API calls
    if (!document.getElementById('google-gapi-script')) {
      const gapiScript = document.createElement('script');
      gapiScript.id = 'google-gapi-script';
      gapiScript.src = 'https://apis.google.com/js/api.js';
      gapiScript.async = true;
      gapiScript.defer = true;
      gapiScript.onload = () => {
        isGapiLoaded = true;
        checkDone();
      };
      gapiScript.onerror = () => reject(new Error('Failed to load Google API client'));
      document.head.appendChild(gapiScript);
    } else {
      isGapiLoaded = true;
      checkDone();
    }
  });
};

// ────────────────────────────────────────
// 2. Initialize & Authenticate
// ────────────────────────────────────────

/**
 * Initializes the token client. Call this once after scripts are loaded.
 */
export const initGoogleCalendar = async () => {
  if (!GOOGLE_CLIENT_ID) {
    console.warn('[GoogleCalendar] No GOOGLE_CLIENT_ID configured. Set VITE_GOOGLE_CLIENT_ID in your .env file.');
    return false;
  }

  try {
    await loadGoogleScripts();

    // Check for stored token
    const storedToken = localStorage.getItem('gcal_access_token');
    const storedExpiry = localStorage.getItem('gcal_token_expiry');
    if (storedToken && storedExpiry && Date.now() < parseInt(storedExpiry)) {
      accessToken = storedToken;
    }

    return true;
  } catch (err) {
    console.error('[GoogleCalendar] Init failed:', err);
    return false;
  }
};

/**
 * Triggers the Google OAuth consent flow.
 * Returns a promise that resolves with the access token.
 */
export const signInToGoogle = () => {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_CLIENT_ID) {
      reject(new Error('Google Client ID not configured'));
      return;
    }

    if (accessToken) {
      resolve(accessToken);
      return;
    }

    try {
      // Use google.accounts.oauth2.initTokenClient
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse) => {
          if (tokenResponse.error) {
            reject(new Error(tokenResponse.error));
            return;
          }
          
          // Verify that the user gave permission to the Calendar scope
          if (!window.google.accounts.oauth2.hasGrantedAllScopes(tokenResponse, SCOPES)) {
            reject(new Error("Please check the box to allow calendar access on the Google sign-in screen."));
            return;
          }

          accessToken = tokenResponse.access_token;
          // Store with expiry (typically 1 hour)
          const expiresIn = tokenResponse.expires_in || 3600;
          localStorage.setItem('gcal_access_token', accessToken);
          localStorage.setItem('gcal_token_expiry', String(Date.now() + expiresIn * 1000));
          resolve(accessToken);
        },
      });

      // prompt: 'consent' forces the consent screen to ensure scopes are requested
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Signs out and revokes the token.
 */
export const signOutFromGoogle = () => {
  if (accessToken) {
    window.google.accounts.oauth2.revoke(accessToken, () => {
      console.log('[GoogleCalendar] Token revoked');
    });
  }
  accessToken = null;
  localStorage.removeItem('gcal_access_token');
  localStorage.removeItem('gcal_token_expiry');
};

/**
 * Check if currently authenticated with Google.
 */
export const isGoogleAuthenticated = () => {
  if (accessToken) return true;

  // Check localStorage
  const storedToken = localStorage.getItem('gcal_access_token');
  const storedExpiry = localStorage.getItem('gcal_token_expiry');
  if (storedToken && storedExpiry && Date.now() < parseInt(storedExpiry)) {
    accessToken = storedToken;
    return true;
  }
  return false;
};

// ────────────────────────────────────────
// 3. Calendar API Methods
// ────────────────────────────────────────

/**
 * Makes an authenticated fetch request to Google Calendar API.
 */
const gcalFetch = async (endpoint, options = {}) => {
  if (!accessToken) {
    throw new Error('Not authenticated with Google');
  }

  const response = await fetch(`${CALENDAR_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (response.status === 401) {
    // Token expired, clear it
    accessToken = null;
    localStorage.removeItem('gcal_access_token');
    localStorage.removeItem('gcal_token_expiry');
    throw new Error('Google token expired. Please sign in again.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("[Google API Error Response]:", errorData);
    
    // Check for API not enabled error
    if (errorData.error?.message?.includes('not enabled') || 
        errorData.error?.details?.[0]?.reason === 'SERVICE_DISABLED') {
      throw new Error("Google Calendar API is not enabled in your Google Cloud Console. You must enable it.");
    }

    throw new Error(errorData.error?.message || `Google API error: ${response.status}`);
  }

  return response.json();
};

/**
 * Creates a Google Calendar event for an appointment.
 * 
 * @param {Object} appointment - The appointment data
 * @param {string} appointment.patientName - Patient's full name
 * @param {string} appointment.date - Date in YYYY-MM-DD format
 * @param {string} appointment.time - Time in HH:MM format
/**
 * Creates a Google Calendar event for an appointment.
 * 
 * @param {Object} appointment - The appointment data
 * @param {string} appointment.patientName - Patient's full name
 * @param {string} appointment.date - Date in YYYY-MM-DD format
 * @param {string} appointment.time - Time in HH:MM format
 * @param {number} appointment.durationMinutes - Duration in minutes
 * @param {string} [appointment.description] - Optional description
 * @param {string} [appointment.location] - Optional location/clinic name
 * @param {Object} [appointment.reminders] - Custom reminders config
 * @returns {Object} The created Google Calendar event
 */
export const createCalendarEvent = async ({
  patientName,
  date,
  time,
  durationMinutes = 30,
  description = '',
  location = '',
  reminders = null,
}) => {
  // Ensure we have a token
  if (!accessToken) {
    await signInToGoogle();
  }

  // Construct precise ISO 8601 string with local timezone offset using moment
  // e.g., '2026-02-25T10:00:00+05:30'
  const startMoment = moment(`${date}T${time}:00`, 'YYYY-MM-DDTHH:mm:ss');
  const endMoment = startMoment.clone().add(durationMinutes, 'minutes');

  const event = {
    summary: `🦷 Dental Visit: ${patientName}`,
    description: description || `Clinical consultation with ${patientName}.\n\nScheduled via ProstoCalc — Intelligent Dental Practice Management.`,
    location: location,
    start: {
      dateTime: startMoment.format("YYYY-MM-DDTHH:mm:ssZ")
    },
    end: {
      dateTime: endMoment.format("YYYY-MM-DDTHH:mm:ssZ")
    },
    reminders: reminders || {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },  // 1 day before
        { method: 'popup', minutes: 60 },         // 1 hour before
        { method: 'popup', minutes: 15 },          // 15 minutes before
      ],
    },
    colorId: '7', // Peacock (teal-ish color)
    source: {
      title: 'ProstoCalc',
      url: window.location.origin,
    },
  };

  return await gcalFetch('/calendars/primary/events', {
    method: 'POST',
    body: JSON.stringify(event),
  });
};

/**
 * Creates a Google Calendar event for a schedule slot.
 */
export const createSlotEvent = async ({
  slotLabel,
  date,
  startTime,
  endTime,
  description = '',
  location = '',
}) => {
  if (!accessToken) {
    await signInToGoogle();
  }

  const startMoment = moment(`${date}T${startTime}`, 'YYYY-MM-DDTHH:mm:ss');
  const endMoment = moment(`${date}T${endTime}`, 'YYYY-MM-DDTHH:mm:ss');

  const event = {
    summary: `📋 ${slotLabel || 'Operatory Slot'}`,
    description: description || `Blocked time slot for clinical procedures.\n\nManaged via ProstoCalc.`,
    location: location,
    start: {
      dateTime: startMoment.format("YYYY-MM-DDTHH:mm:ssZ")
    },
    end: {
      dateTime: endMoment.format("YYYY-MM-DDTHH:mm:ssZ")
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 30 },
      ],
    },
    colorId: '2', // Sage (green-ish)
  };

  return await gcalFetch('/calendars/primary/events', {
    method: 'POST',
    body: JSON.stringify(event),
  });
};

/**
 * Syncs multiple appointments to Google Calendar.
 * Returns results for each sync attempt.
 */
export const syncAppointmentsToGoogle = async (appointments, clinicName = '') => {
  if (!accessToken) {
    await signInToGoogle();
  }

  const results = [];
  for (const apt of appointments) {
    try {
      const event = await createCalendarEvent({
        patientName: apt.patient_name,
        date: apt.scheduled_date || new Date().toISOString().split('T')[0],
        time: apt.scheduled_time?.slice(0, 5) || '09:00',
        durationMinutes: apt.duration_minutes || 30,
        description: `Visit Status: ${apt.visit_status || 'Scheduled'}\nCategory: ${apt.visit_category || 'General Consultation'}`,
        location: clinicName,
      });
      results.push({ success: true, appointmentId: apt.id, eventId: event.id, link: event.htmlLink });
    } catch (err) {
      results.push({ success: false, appointmentId: apt.id, error: err.message });
    }
  }
  return results;
};

/**
 * Gets the list of upcoming events from Google Calendar (for display/verification).
 */
export const getUpcomingEvents = async (maxResults = 10) => {
  if (!accessToken) {
    await signInToGoogle();
  }

  const now = new Date().toISOString();
  return await gcalFetch(`/calendars/primary/events?maxResults=${maxResults}&orderBy=startTime&singleEvents=true&timeMin=${now}`);
};

/**
 * Deletes an event from Google Calendar.
 */
export const deleteCalendarEvent = async (eventId) => {
  if (!accessToken) {
    await signInToGoogle();
  }

  const response = await fetch(`${CALENDAR_API_BASE}/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    throw new Error(`Failed to delete event: ${response.status}`);
  }

  return true;
};
