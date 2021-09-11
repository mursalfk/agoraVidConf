// JS reference to the container where the remote feeds belong
let remoteContainer = document.getElementById("remote-container");

/**
 * @name addVideoContainer
 * @param uid - uid of the user
 * @description Helper function to add the video stream to "remote-container".
 */
function addVideoContainer(uid) {
    let streamDiv = document.createElement("div"); // Create a new div for every stream
    streamDiv.id = uid;                       // Assigning id to div
    streamDiv.style.transform = "rotateY(180deg)"; // Takes care of lateral inversion (mirror image)
    remoteContainer.appendChild(streamDiv);      // Add new div to container
}
/**
 * @name removeVideoContainer
 * @param uid - uid of the user
 * @description Helper function to remove the video stream from "remote-container".
 */
function removeVideoContainer(uid) {
    let remDiv = document.getElementById(uid);
    remDiv && remDiv.parentNode.removeChild(remDiv);
}



// Client Setup
// Defines a client for RTC
const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

const [localAudioTrack, localVideoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();


// Initialize the stop button
initStop(client, localAudioTrack, localVideoTrack);

// Play the local track
localVideoTrack.play('me');


function initStop(client, localAudioTrack, localVideoTrack) {
    const stopBtn = document.getElementById('stop');
    stopBtn.disabled = false; // Enable the stop button
    stopBtn.onclick = null; // Remove any previous event listener
    stopBtn.onclick = function () {
        client.unpublish(); // stops sending audio & video to agora
        localVideoTrack.stop(); // stops video track and removes the player from DOM
        localVideoTrack.close(); // Releases the resource
        localAudioTrack.stop();  // stops audio track
        localAudioTrack.close(); // Releases the resource
        client.remoteUsers.forEach(user => {
            if (user.hasVideo) {
                removeVideoContainer(user.uid) // Clean up DOM
            }
            client.unsubscribe(user); // unsubscribe from the user
        });
        client.removeAllListeners(); // Clean up the client object to avoid memory leaks
        stopBtn.disabled = true;
    }
}


// Set up event listeners for remote users publishing or unpublishing tracks
client.on("user-published", async (user, mediaType) => {
    await client.subscribe(user, mediaType); // subscribe when a user publishes
    if (mediaType === "video") {
        addVideoContainer(String(user.uid)) // uses helper method to add a container for the videoTrack
        user.videoTrack.play(String(user.uid));
    }
    if (mediaType === "audio") {
        user.audioTrack.play(); // audio does not need a DOM element
    }
});
client.on("user-unpublished", async (user, mediaType) => {
    if (mediaType === "video") {
        removeVideoContainer(user.uid) // removes the injected container
    }
});


// Joining a Channel
// Joins the channel with the token
const _uid = await client.join(appId, channelId, token, null); 


// Publish the local audio and video tracks
await client.publish([localAudioTrack, localVideoTrack]);


