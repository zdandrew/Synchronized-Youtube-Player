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

   This problem is focused on state management of a streaming control plane. I broke down the problem into the following steps:
    - How to capture user events (play, pause, seek, join).
    - After detecting events, what does the client need to do, and what should be communicated to the server.
    - Backend logic - how to manage each sessionId’s video state, what fields need to be stored/updated, should there be periodic synchronization?
    - How do clients listen and react to updates from the server.
    - Edge cases: notably dealing with initial start, late joins, buffers, etc.
  
   For event detection and handling, I heavily relied on React Player docs to inform my design decisions. I initially had the idea to capture user inputs, use websockets to send these actions to the server, the server will     update the video state, then broadcast the new video state to all sessions. Only upon receiving this broadcast do clients execute the action. Unfortunately, React Player does not support this, because events are emitted only after the action is already executed. I pivoted to executing user actions immediately in the client, then having the server broadcast updates to the other clients within the session.

    In my first prototype, I used a simple local in-memory cache in my server to store sessions and their corresponding video states. I worked on creating an Object class for video state, choosing fields such that the server is able to provide clients with the correct video information (playing/paused, video elapsed time) at all times. I then focused on implementing play/pause synchronization through websockets, and added in "Late to the party" and "Seek" as the core functionality was built.

    Lastly, I switched over from my in-memory cache to Redis to hold the video state Objects for each session Id. 
   


3. **How did you implement seeking to different times in the video? Are there any other approaches you considered and what are the tradeoffs between them?**

4. **How do new users know what time to join the watch party? Are there any other approaches you considered and what were the tradeoffs between them?**

5. **How do you guarantee that the time that a new user joins is accurate (i.e perfectly in sync with the other users in the session) and are there any edge cases where it isn’t? Think about cases that might occur with real production traffic.**

6. **Are there any other situations - i.e race conditions, edge cases - where one user can be out of sync with another? (Out of sync meaning that user A has the video playing or paused at some time, while user B has the video playing or paused at some other time.)**

7. **How would you productionize this application to a scale where it needs to be used reliably with 1M+ DAUs and 10k people connected to a single session? Think infrastructure changes, code changes & UX changes.**
