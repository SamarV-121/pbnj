# Web Interface

pbnj includes a web interface for creating and managing pastes directly from your browser.

## Authentication

The web interface uses secure session-based authentication:

- **Login**: Enter your `AUTH_KEY` to create a session
- **Sessions**: Stored server-side in D1, expire after 30 days
- **Cookies**: HttpOnly session cookie (can't be accessed by JavaScript)
- **Security**: Your auth key is never stored in the browser after login

This is more secure than storing credentials in localStorage, as the actual auth key is only used once during login.

### Header Buttons

The header button changes based on your login state:

| Button | State | Action |
|--------|-------|--------|
| Login | Logged out | Click to go to login page |
| New paste | Logged in | Click to create a new paste |
| Logout | Logged in | Click to log out |

## Login

1. Click Login in the header (or navigate to `/login`)
2. Enter your `AUTH_KEY`
3. Press Enter or click the arrow button

After logging in, you'll be redirected back to the page you came from.

## Creating Pastes

When logged in, click New paste in the header to create a new paste.

### New Paste Page

The `/new` page provides a simple editor with these options:

- **Filename** - Optional name for your paste (defaults to "snippet")
- **Language** - Select language for syntax highlighting (or leave as "auto")
- **Expiry** - Expire the paste after 10m, 1h, 1d, or 1w (or leave as "never")
- **Private** - Toggle to make the paste unlisted (won't appear on homepage)
- **Password** - Shown when Private is on. Viewers must enter it to open the paste (optional)
- **Save** - Click or press `Cmd/Ctrl + S` to save

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + S` | Save paste |
| `Cmd/Ctrl + Enter` | Save paste |

## Editing Pastes

When logged in, an Edit button appears on paste view pages. It opens the editor with the paste's code, filename, language, and privacy setting filled in. Saving updates the same paste, so its URL stays the same.

- **Expiry** - Starts on "keep", which leaves the current expiry unchanged. Pick a duration to restart the clock, or "never" to remove it
- **Password** - Leave empty to keep the current password, type a new one to change it, or tick "Remove the current password" to clear it
- **Private** - Turning Private off also removes the paste's password and key

## Deleting Pastes

When logged in, a trash icon appears on paste view pages. Click it to delete the paste immediately.

The delete button appears in:
- Desktop: Rightmost button in the action bar
- Mobile: At the bottom of the dropdown menu

## Logout

Click Logout in the header to log out. This invalidates your session on the server and clears the session cookie.

## Private Pastes on Homepage

When logged in, the homepage has All, Public, and Private tabs. All is the default and shows every paste, with private ones marked with a "Private" label. Public and Private show only that kind of paste. When logged out, only public pastes are visible and the tabs are hidden.

---
Next: Back to 01_welcome.md
