## Nooks Watch Party Project



### Instructions

To run the app, run "npm i" and then "npm start" for the frontend. 

Navigate into the "server" directory, run "npm i" and then "npm start" for the backend. 

Finally install Redis "brew install redis" on MacOS, and then "redis-server" to start.

### Completed Functionality

- [✅] **Creating a session**. Any user should be able to create a session to watch a given Youtube video.
- [✅] **Joining a session**. Any user should be able to join a session created by another user using the shareable session link.
- [✅] **Playing/pausing** the video. When a participant pauses the video, it should pause for everyone. When a participant plays the video, it should start playing for everyone.
- [✅] **“Seek”**. When someone jumps to a certain time in the video it should jump to that time for everyone. This works whether the video is playing or paused.
- [✅] **Late to the party**... Everything should stay synced even if a user joins the watch party late (e.g. the video is already playing)
- [✅] **Player controls.** All the player controls (e.g. play, pause, and seek) should be intuitive and behave as expected. For play, pause & seek operations, I used the built-in YouTube controls.

### Architecture Questions In Email
