var songs;
var currFolder;
var currentAudio = null;
var currentTrack = null;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
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
    currentAudio = new Audio(`/songs/${currFolder}/${track}`);
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
        document.querySelector(".circle").style.left =
            (currentAudio.currentTime / currentAudio.duration) * 100 + "%";
    });
};

async function getSongs(folder) {
    currFolder = folder;

    let infoResponse = await fetch(`/songs/${folder}/info.json`);
    let info = await infoResponse.json();
    songs = info.tracks;

    let songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";

    for (const song of songs) {
        songUL.innerHTML += `
        <li>
            <img src="img/music.svg" alt="music" class="invert">
            <div class="info">
                <div class="songName">${song.replaceAll("%20", " ")}</div>
                <div class="artistName">ME</div>
            </div>
            <div class="playNow">
                <img src="img/playButton.svg" alt="" class="playMusic">
            </div>
        </li>`;
    }

    Array.from(document.querySelectorAll(".songList li")).forEach(e => {
        e.addEventListener("click", () => {
            const trackName = e.querySelector(".songName").innerText.trim();
            playMusic(trackName);
        });
    });

    return songs;
}

async function displayAlbum() {
    let card = document.querySelector(".card");
    card.innerHTML = "";

    const artists = ["Mix", "Kishor Kumar", "Kailash Kher", "Honey Singh", "Diljit Dosanjh", "Arijit Singh", "A R Rahman"];

    for (const artist of artists) {
        let infoResponse = await fetch(`/songs/${artist}/info.json`);
        let info = await infoResponse.json();

        card.innerHTML += `
        <div data-folder="${artist}" class="cardBg relative cardContent">
            <div class="play">
                <img style="width: 40px; height: 40px;" src="img/playButton.svg" alt="play" class="playPause">
            </div>
            <img src="/songs/${artist}/${info.cover}" alt="${info.title}" class="rounded">
            <h3>${info.title}</h3>
            <p>${info.description}</p>
        </div>`;
    }

    // Add click listeners after rendering cards
    document.querySelectorAll(".cardContent").forEach(card => {
        card.addEventListener("click", async () => {
            const folder = card.getAttribute("data-folder");
            const loadedSongs = await getSongs(folder);
            if (loadedSongs.length > 0) {
                playMusic(loadedSongs[0], true);
            }
        });
    });
}

async function main() {
    await displayAlbum();

    songs = await getSongs("Mix");

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
        if (currentAudio) {
            currentAudio.currentTime = (currentAudio.duration * percent) / 100;
        }
    });

    next.addEventListener("click", () => {
        const currentIndex = songs.indexOf(currentTrack);
        if (currentIndex + 1 < songs.length) {
            playMusic(songs[currentIndex + 1]);
        }
    });

    previous.addEventListener("click", () => {
        const currentIndex = songs.indexOf(currentTrack);
        if (currentIndex - 1 >= 0) {
            playMusic(songs[currentIndex - 1]);
        }
    });

    const volumeSlider = document.querySelector("#volumeSlider");
    if (volumeSlider) {
        volumeSlider.addEventListener("input", (e) => {
            if (currentAudio) {
                currentAudio.volume = parseFloat(e.target.value);
            }
        });
    }
    document.querySelector(".hamBurger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-100%";
    });

    document.querySelector(".volume > img").addEventListener("click", e => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg");
            if (currentAudio) currentAudio.volume = 0;
        } else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg");
            if (currentAudio) currentAudio.volume = 0.5;
        }
    });

    if (songs.length > 0) {
        playMusic(songs[0], true);
    }
}

main();
