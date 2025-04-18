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

### Architecture Questions

After building the watch party app, we would like you to answer the following questions about design decisions and tradeoffs you made while building it. Please fill them out in the README along with your submission.

1. **How did you approach the problem? What did you choose to learn or work on first? Did any unexpected difficulties come up - if so, how did you resolve them?**

2. **How did you implement seeking to different times in the video? Are there any other approaches you considered and what are the tradeoffs between them?**

3. **How do new users know what time to join the watch party? Are there any other approaches you considered and what were the tradeoffs between them?**

4. **How do you guarantee that the time that a new user joins is accurate (i.e perfectly in sync with the other users in the session) and are there any edge cases where it isn’t? Think about cases that might occur with real production traffic.**

5. **Are there any other situations - i.e race conditions, edge cases - where one user can be out of sync with another? (Out of sync meaning that user A has the video playing or paused at some time, while user B has the video playing or paused at some other time.)**

6. **How would you productionize this application to a scale where it needs to be used reliably with 1M+ DAUs and 10k people connected to a single session? Think infrastructure changes, code changes & UX changes.**
