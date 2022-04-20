## Submission Instructions

Once you've finished the take home assignment, please zip your code in a .zip and email it to us. Please include any relevant instructions in this README for how to run the app.

Also, make sure to check the boxes in the rubric below before you submit the assignment

## Rubric
Your task is to build a collaborative Youtube player called “Youtube Watch Party” that lets users watch videos together by keeping each client’s youtube player in-sync with each other.

### Required Functionality
*The player must be **synced for all users at all times** no matter when they join the party*
- [ ] **Adding/switching** the video. Any “user” should be able to add, remove, or switch a youtube video to the watch party — which is just the main page of the website, i.e `localhost:3000`
- [ ] **Playing/pausing** the video. When someone pauses the video, it should pause for everyone. When someone plays the video, it should start playing for everyone.
- [ ] “**Seek”** in the video. When someone jumps to a certain time in the video it should jump to that time for everyone.
- [ ] **Late to the party**... Everything should stay synced even if a user joins the watch party late (e.g. the video is already playing)
- [ ] **Player controls.** All the player controls (e.g. play, pause, seek, and switching the video) should be intuitive and behave as expected. For play, pause & seek operations you can use the built-in YouTube controls or disable the YouTube controls and build your own UI (including a slider for the seek operation)
- [ ] **Visually appealing UI and intuitive UX**. Here’s a reference [Figma](https://www.figma.com/file/9gTAha5d0rIkwJb5k8wmFb/New-Features?node-id=2442%3A62758) to guide you, but feel free to take creative freedoms with the design.

### Bonus Functionality
- [ ] **Videos autoplay**. You’ll notice that browser security prevents videos from auto-playing under certain conditions. So if the video starts playing and I haven’t yet interacted with Nooks it may not autoplay. Can you can make a work-around and build intuitive UX to solve this issue?
- [ ] **Share sessions via URL**. How can you send someone a link to your watch party? Let’s identify sessions via URL so I can easily send a link to watch videos with my friends
- [ ] **Who’s watching**. Can we show an indication of who else is in the session? Maybe show a count of active users or maybe even names
