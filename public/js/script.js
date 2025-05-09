var songs;
var currFolder;
var currentAudio = null;
var currentTrack = null;

// Converts seconds to mm:ss
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

const play = document.getElementById("play");
const next = document.getElementById("next");
const previous = document.getElementById("previous");

const playMusic = (track, pause = false) => {
    if (track === currentTrack) {
        if (currentAudio.paused) {
            currentAudio.play();
            play.src = "img/pause.svg";
        } else {
            currentAudio.pause();
            play.src = "img/play.svg";
        }
        return;
    }

    if (currentAudio) {
        currentAudio.pause();
    }

    currentTrack = track;
    currentAudio = new Audio(`/spotify/${currFolder}/` + track);
    currentAudio.play();

    if (pause) {
        currentAudio.pause();
        play.src = "img/play.svg";
    } else {
        play.src = "img/pause.svg";
    }

    document.querySelector(".songInfo").innerHTML = decodeURI(track);
    document.querySelector(".songTime").innerHTML = "00:00/00:00";

    currentAudio.addEventListener("timeupdate", () => {
        document.querySelector(".songTime").innerHTML =
            `${secondsToMinutesSeconds(currentAudio.currentTime)} / ${secondsToMinutesSeconds(currentAudio.duration)}`;
        document.querySelector(".circle").style.left = (currentAudio.currentTime / currentAudio.duration) * 100 + "%";
    });
};

async function getSongs(folder) {
    currFolder = folder;

    // Fetch the album info to get the track list
    let infoResponse = await fetch(`/spotify/${folder}/info.json`);
    let info = await infoResponse.json();
    
    songs = info.tracks;  // The tracks are stored in the 'tracks' array of info.json

    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUL.innerHTML = ""; // Clear existing items

    // Loop through the tracks and create the list
    for (const song of songs) {
        songUL.innerHTML = songUL.innerHTML + `<li><img src="img/music.svg" alt="music" class="invert">
                            <div class="info">
                                <div class="songName">${song.replaceAll("%20", " ")}</div>
                                <div class="artistName">ME</div>
                            </div>
                            <div class="playNow">
                                <img src="img/playButton.svg" alt="" class="playMusic">
                            </div></li>`;
    }

    // Add event listeners for song click
    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            const trackName = e.querySelector(".info").firstElementChild.innerHTML.trim();
            playMusic(trackName);
        });
    });

    return songs;
}

async function displayAlbum() {
    let a = await fetch(`/spotify/songs/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let card = document.querySelector(".card");
    let anchors = div.getElementsByTagName("a");

    card.innerHTML = ""; // Clear existing cards

    // Loop through album folders and display album info from info.json
    for (const e of anchors) {
        if (e.href.includes("/songs")) {
            let folder = e.href.split("/").slice(-2)[0];
            let a = await fetch(`/spotify/songs/${folder}/info.json`);
            let info = await a.json();  // Fetch album info
            card.innerHTML = card.innerHTML + `
                <div data-folder="${folder}" class="cardBg relative cardContent">
                    <div class="play">
                        <img style="width: 40px; height: 40px;" src="img/playButton.svg" alt="play" class="playPause">
                    </div>
                    <img src="/spotify/songs/${folder}/${info.cover}" alt="${info.title}" class="rounded">
                    <h3>${info.title}</h3>
                    <p>${info.description}</p>
                </div>`;
        }
    }
}

async function main() {
    await displayAlbum(); // Call displayAlbum to populate album cards
    songs = await getSongs("songs/album1");
    console.log(songs);

    play.addEventListener("click", () => {
        if (currentAudio) {
            if (currentAudio.paused) {
                currentAudio.play();
                play.src = "img/pause.svg";
            } else {
                currentAudio.pause();
                play.src = "img/play.svg";
            }
        }
    });

    document.querySelector(".seekBar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentAudio.currentTime = (currentAudio.duration * percent) / 100;
    });

    document.querySelector(".hamBurger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-100%";
    });

    next.addEventListener("click", () => {
        let index = songs.indexOf(currentAudio.src.split("/").slice(-1)[0]);
        if (index + 1 < songs.length) {
            playMusic(songs[index + 1]);
        }
    });

    previous.addEventListener("click", () => {
        let index = songs.indexOf(currentAudio.src.split("/").slice(-1)[0]);
        if (index - 1 > 0) {
            playMusic(songs[index - 1]);
        }
    });

    const volumeSlider = document.querySelector("#volumeSlider");
    if (volumeSlider) {
        volumeSlider.addEventListener("input", (e) => {
            currentAudio.volume = parseFloat(e.target.value);
        });
    }

    Array.from(document.getElementsByClassName("cardContent")).forEach(e => {
        e.addEventListener("click", async item => {
            songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
        });
    });

    if (songs.length > 0) {
        playMusic(songs[0], true); // Load first song but keep it paused
    }
    
    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("img/volume.svg")) {
            e.target.src = e.target.src.replace("img/volume.svg", "img/mute.svg");
            currentAudio.volume = 0;
        } else {
            e.target.src = e.target.src.replace("img/mute.svg", "img/volume.svg");
            currentAudio.volume = 0.10;
        }
    });
}

main();
