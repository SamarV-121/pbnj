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
- **Reads** - Burn the paste after this many views, from 1 to 1,000,000 (leave empty for no limit). Only unlocked views by logged-out visitors count
- **Private** - Toggle to make the paste unlisted (won't appear on homepage)
- **Password** - Shown when Private is on. Viewers must enter it to open the paste (optional)
- **Image** - Add images from a file picker, or drag them onto the editor. See [Images](#images)
- **Save** - Click or press `Cmd/Ctrl + S` to save

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + S` | Save paste |
| `Cmd/Ctrl + Enter` | Save paste |

## Editing Pastes

When logged in, an Edit button appears on paste view pages. It opens the editor with the paste's code, filename, language, and privacy setting filled in. Saving updates the same paste, so its URL stays the same.

- **Expiry** - Starts on "keep", which leaves the current expiry unchanged. Pick a duration to restart the clock, or "never" to remove it
- **Reads** - Set when the paste is created. The read limit can't be changed when editing
- **Password** - Leave empty to keep the current password, type a new one to change it, or tick "Remove the current password" to clear it
- **Private** - Turning Private off also removes the paste's password and key
- **Images** - Listed under the editor. Click Remove to delete an image when you save. In Markdown notes, removing an image also removes its reference

## Images

Use the Image button on `/new` (or drag image files onto the editor) to add images to a note. Accepted types are PNG, JPEG, WebP, and GIF. Larger images are compressed to WebP and scaled down to 2048 px on the longest side. A note can have up to 20 images.

- **Markdown notes** (language set to MD) insert `![image](/i/ID)` at the cursor, so the image appears where you put it
- **Other notes** show their images below the code

Images follow the paste's privacy. A keyed or password-protected paste requires the same key or unlock to see its images. Images that aren't saved to a paste within 24 hours are deleted.

## Markdown Preview

On `/new`, set the language to MD and a **Preview** button appears. It shows the note rendered as Markdown beside the editor, and updates as you type, including inserted images. Click **Hide preview** to return to the full-width editor.

## Deleting Pastes

When logged in, a trash icon appears on paste view pages. Click it to delete the paste immediately.

The delete button appears in:
- Desktop: Rightmost button in the action bar
- Mobile: At the bottom of the dropdown menu

## Logout

Click Logout in the header to log out. This invalidates your session on the server and clears the session cookie.

## Private Pastes on Homepage

When logged in, the homepage has All, Public, and Private tabs. All is the default and shows every paste, with private ones marked with a "Private" label. Public and Private show only that kind of paste. When logged out, only public pastes are visible and the tabs are hidden.

## Deleting from the Homepage

When logged in, each paste card has a checkbox in its top-left corner. Tick the pastes you want to remove, then click Delete selected and confirm. Select all ticks every paste shown on the page, which is up to 20 at a time. Deleting removes the pastes and their images, then the page reloads. The checkboxes are hidden when logged out.

---
Next: Back to 01_welcome.md
