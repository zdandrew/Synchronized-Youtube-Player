### Instructions

To run the app simply "npm i" and then "npm start"

### Required Functionality

_The player must be **synced for all users at all times** no matter when they join the party_

- [ ] **Creating a session**. Any user should be able to create a session to watch a given Youtube video.
- [ ] **Joining a session**. Any user should be able to join a session created by another user using the shareable session link.
- [ ] **Playing/pausing** the video. When a participant pauses the video, it should pause for everyone. When a participant plays the video, it should start playing for everyone.
- [ ] **“Seek”**. When someone jumps to a certain time in the video it should jump to that time for everyone.
- [ ] **Late to the party**... Everything should stay synced even if a user joins the watch party late (e.g. the video is already playing)
- [ ] **Replay**... replaying a watch party should replay all the events that happened during the watch party, in the order and timeline that they happened. It should look exactly like a live recording of the watch party.
- [ ] **Player controls.** All the player controls (e.g. play, pause, and seek) should be intuitive and behave as expected. For play, pause & seek operations you can use the built-in YouTube controls or disable the YouTube controls and build your own UI (including a slider for the seek operation)

### Bonus Functionality

- [ ] **Session names and user names**. This makes it easier to know what the session is about and see who else is in the session!
- [ ] **Intuitive UX for the replay session**. Show some sort of notifications or a timeline that makes it easy to understand when participants played, paused, or seeked during the replayed session.
- [ ] **Intuitive UX for the watch session**. Show some sort of notifications or a timeline that makes it easy to understand when participants play, pause, or seek the currently playing video.
- [ ] **Other fun ideas**. Search for sessions by name, put a list of currently active watch party sessions on the home page and let you join them, create watch parties with playlists of Youtube videos instead of a single video ...
